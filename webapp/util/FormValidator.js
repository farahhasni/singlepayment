sap.ui.define([
	"sap/ui/core/Control",
	"sap/ui/layout/form/FormContainer",
	"sap/ui/layout/form/FormElement",
	"sap/ui/comp/smartfield/SmartField",
	"sap/ui/core/ValueState"
], function (Control, FormContainer, FormElement, SmartField, ValueState) {
	"use strict";

	/**
	 * Constructor for FormValidator.
	 *
	 * @class
	 * The class is use to validate form with input control including SmartField control.
	 *
	 * @version 1.0.0
	 * 
	 * @param {sap.base.i18n.ResourceBundle} oResourceBundle Resource bundle (i18n).
	 * @public
	 */
	var FormValidator = function (oResourceBundle) {
		this._isValid = true;
		this._isValidationPerformed = false;
		this._fnCustomFormValidator = null;
		this._oResourceBundle = oResourceBundle;
	};

	/* =========================================================== */
	/* public methods                                              */
	/* =========================================================== */

	/**
	 * Return if the validated form is valid.
	 * @returns {boolean} Valid.
	 * @public
	 */
	FormValidator.prototype.isValid = function () {
		return this._isValidationPerformed && this._isValid;
	};

	/**
	 * Validate the control.
	 * @param {sap.ui.core.Control} oControl UI5 Control.
	 * @returns {boolean} Valid.
	 * @public
	 */
	FormValidator.prototype.validate = function (oControl) {
		this._isValid = true;

		this._validate(oControl);

		if (this._fnCustomFormValidator && typeof this._fnCustomFormValidator === "function") {
			var bValid = this._fnCustomFormValidator();

			if (this._isValid) {
				this._isValid = bValid;
			}
		}

		return this.isValid();
	};

	/**
	 * Remove validation control. Used when cancelling the transaction.
	 * @param {sap.ui.core.Control} oControl UI5 Control.
	 * @public
	 */
	FormValidator.prototype.clearValidation = function (oControl) {
		this._isValid = true;

		this._clearValidation(oControl);
	};

	/**
	 * Hook to add custom control for form validation.
	 * @param {Function} fnCustomFormValidator Callback function.
	 * @public
	 */
	FormValidator.prototype.setCustomFormValidator = function (fnCustomFormValidator) {
		this._fnCustomFormValidator = fnCustomFormValidator;
	};

	/* =========================================================== */
	/* private methods                                             */
	/* =========================================================== */

	/**
	 * Get all aggregated controls and if it's falls under possible aggregations and
	 * properties, validate the control.
	 * @param {sap.ui.core.Control} oControl UI5 control.
	 * @private
	 */
	FormValidator.prototype._validate = function (oControl) {
		var aPossibleAggregations = ["items", "content", "form", "formContainers", "formElements", "fields", "sections", "subSections",
				"_grid", "cells", "_page", "groups", "groupElements", "elements"
			],
			aControlAggregation = null,
			bValidatedControl = false;

		// only validate controls and elements which have a 'visible' property
		// and are visible controls (invisible controls make no sense checking)
		if ((oControl instanceof Control || oControl instanceof FormContainer || oControl instanceof FormElement) && oControl.getVisible()) {
			if (oControl instanceof SmartField) {
				// check smartField control
				this._checkSmartControl(oControl);
				bValidatedControl = true;
			} else {
				// check control for any properties worth validating
				bValidatedControl = this._checkControl(oControl);
			}

			// if the control could not be validated, it may have aggregations
			if (!bValidatedControl) {
				aPossibleAggregations.forEach(function (oPossibleAggregation) {
					aControlAggregation = oControl.getAggregation(oPossibleAggregation);

					if (aControlAggregation) {
						if (Array.isArray(aControlAggregation)) {
							aControlAggregation.forEach(function (oControAggregation) {
								this._validate(oControAggregation);
							}.bind(this));
						} else {
							this._validate(aControlAggregation);
						}
					}
				}.bind(this));
			}
		}

		this._isValidationPerformed = true;
	};

	/**
	 * Validate smart control.
	 * @param {sap.ui.core.Control} oControl UI5 control.
	 * @private
	 */
	FormValidator.prototype._checkSmartControl = function (oControl) {
		var aValidateAnnotation = [
			"com.sap.vocabularies.Communication.v1.IsPhoneNumber",
			"com.sap.vocabularies.Communication.v1.IsEmailAddress",
			"Org.OData.Core.V1.IsURL"
		];

		if (oControl.getMandatory && oControl.getMandatory() && oControl.getEditable()) {
			if (!(oControl.getValue().trim() && oControl.getInnerControls()[0].getValue())) {
				this._isValid = false;
				oControl.setValueState(ValueState.Error);
				oControl.setValueStateText(this._getResourceBundle().getText("mandatoryFieldText"));
			} else {
				oControl.setValueState(ValueState.None);
			}
		}

		var oProperty = oControl.getDataProperty().property;

		for (var sProperty in oProperty) { // eslint-disable-line
			if (oProperty.hasOwnProperty(sProperty) && aValidateAnnotation.includes(sProperty)) {
				var bValid = this._checkRegExp(oControl, sProperty, oProperty[sProperty]);

				if (this._isValid && !bValid) {
					this._isValid = bValid;
				}
			}
		}
	};

	/**
	 * Validate control.
	 * @param {sap.ui.core.Control} oControl UI5 control.
	 * @returns {boolean} Validated control.
	 * @private
	 */
	FormValidator.prototype._checkControl = function (oControl) {
		var oControlBinding = null,
			aValidateProperties = ["value", "selectedKey"],
			bValidatedControl = false,
			oExternalValue, oInternalValue;

		aValidateProperties.forEach(function (oProperty) {
			if (oControl.getBinding(oProperty)
				// check if a data type exists (which may have validation constraints)
				&& oControl.getBinding(oProperty).getType()
			) {
				if (this._isEditable(oControl)) {
					try {
						oControlBinding = oControl.getBinding(oProperty);
						oExternalValue = oControl.getProperty(oProperty);
						oInternalValue = oControlBinding.getType().parseValue(oExternalValue, oControlBinding.sInternalType);
						oControlBinding.getType().validateValue(oInternalValue);
					} catch (oError) {
						this._isValid = false;
						oControl.setValueState(ValueState.Error);
						oControlBinding = oControl.getBinding(oProperty);
					}

					bValidatedControl = true;
				}
			} else if (oControl.getRequired && oControl.getRequired()) {
				if (!oControl.getValue || oControl.getValue() === "") {
					this._isValid = false;
					oControl.setValueState(ValueState.Error);
					oControl.setValueStateText(this._getResourceBundle().getText("mandatoryFieldText"));
				} else if (oControl.getAggregation("picker") && oControl.getProperty("selectedKey").length === 0) { // might be a select 
					this._isValid = false;
					oControl.setValueState(ValueState.Error);
					oControl.setValueStateText("mandatoryPickerText");
				} else {
					oControl.setValueState(ValueState.None);
				}
			}
		}.bind(this));

		return bValidatedControl;
	};

	/**
	 * Get control editable property.
	 * @param {sap.ui.core.Control} oControl UI5 control.
	 * @returns {boolean} Editable.
	 * @private
	 */
	FormValidator.prototype._isEditable = function (oControl) {
		var bEditable = false;

		try {
			bEditable = oControl.getProperty("editable");
		} catch (oError) {
			bEditable = true;
		}

		return bEditable;
	};

	/**
	 * Validate with regular expression on the given smart control annotation.
	 * @param {sap.ui.core.Control} oControl UI5 control.
	 * @param {string} sProperty Control property name.
	 * @param {object} oProperty Control property.
	 * @returns {boolean} Valid.
	 * @private
	 */
	FormValidator.prototype._checkRegExp = function (oControl, sProperty, oProperty) {
		var bValid = true,
			aValidExpression = [{
				property: "com.sap.vocabularies.Communication.v1.IsPhoneNumber",
				expression: /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/,
				message: this._getResourceBundle().getText("invalidPhoneFormatText")
			}, {
				property: "com.sap.vocabularies.Communication.v1.IsEmailAddress",
				expression: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-za-zA-Z]{2,4}$/,
				message: this._getResourceBundle().getText("invalidEmailFormatText")
			}, {
				property: "Org.OData.Core.V1.IsURL",
				expression: /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/,
				message: this._getResourceBundle().getText("invalidUrlFormatText")
			}];

		aValidExpression.forEach(function (oExpression) {
			if (oControl.getValue() && sProperty === oExpression.property && !!oProperty.Bool) {
				if (!oExpression.expression.test(oControl.getValue())) {
					oControl.setValueState(ValueState.Error);
					oControl.setValueStateText(oExpression.message);
					bValid = false;
				} else {
					oControl.setValueState(ValueState.None);
				}
			}
		});

		return bValid;
	};

	/**
	 * Get resource bundle (i18n).
	 * @returns {sap.base.i18n.ResourceBundle} Resource bundle (i18n).
	 * @private
	 */
	FormValidator.prototype._getResourceBundle = function () {
		return this._oResourceBundle;
	};

	/**
	 * Get all aggregated controls and if it's falls under possible aggregations and
	 * properties, then clear validation.
	 * @param {sap.ui.core.Control} oControl UI5 control.
	 * @private
	 */
	FormValidator.prototype._clearValidation = function (oControl) {
		var aPossibleAggregations = ["items", "content", "form", "formContainers", "formElements", "fields", "sections", "subSections",
				"_grid", "cells", "_page", "groups", "groupElements", "elements"
			],
			aControlAggregation = null,
			bValidatedControl = false;

		// only validate controls and elements which have a 'visible' property
		// and are visible controls (invisible controls make no sense checking)
		if ((oControl instanceof Control || oControl instanceof FormContainer || oControl instanceof FormElement) && oControl.getVisible()) {
			// remove validation in smartField control
			if (oControl.getValueState && oControl.getValueState() !== ValueState.None) {
				oControl.setValueState(ValueState.None);
				bValidatedControl = true;
			}
			// if the control could not be invalidated, it may have aggregations
			if (!bValidatedControl) {
				aPossibleAggregations.forEach(function (oPossibleAggregation) {
					aControlAggregation = oControl.getAggregation(oPossibleAggregation);

					if (aControlAggregation) {
						if (Array.isArray(aControlAggregation)) {
							aControlAggregation.forEach(function (oControAggregation) {
								this._clearValidation(oControAggregation);
							}.bind(this));
						} else {
							this._clearValidation(aControlAggregation);
						}
					}
				}.bind(this));
			}
		}
	};

	return FormValidator;

});