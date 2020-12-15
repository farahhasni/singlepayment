sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/UploadCollectionItem",
	"sap/m/UploadCollectionParameter",
	"sap/ui/core/Fragment",
	"sap/m/ColumnListItem",
	"sap/ui/comp/smartfield/SmartField",
	"../util/FormValidator",
	"sap/m/ObjectStatus",
	"sap/m/MessageBox",
	"sap/m/MessageStrip",
	"../util/xlsx"

], function (BaseController, JSONModel, formatter, Filter, FilterOperator, UploadCollectionItem, UploadCollectionParameter, Fragment,
	ColumnListItem,
	SmartField, FormValidator, ObjectStatus, MessageBox, MessageStrip, xlsx) {
	"use strict";

	return BaseController.extend("ee.com.finance.FI-112.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			var oViewModel = new JSONModel({
				Title: "",
				Text: "",
				isEnabledAutoCalcTax: true,
				isEnabledCredit: false,
				isNameSelected: false,
				isOneTimeVendorSelected: true,
				isAbnNumberMandatory: true,
				isPDFFile: true,
				isSubmitEnabled: false,
				BinaryFile: "",
				LineItemBalance: 0,
				CurrencyUnit: "",
				CreditDebit: "S",
				Path: ""
			});
			this.getView().setModel(oViewModel, "wizardView");

			var tableView = new JSONModel([]);
			this.getView().setModel(tableView, "tableView");

			var tableModel = new JSONModel([]);
			this.getView().setModel(tableModel, "tableModel");

			var documentView = new JSONModel([]);
			this.getView().setModel(documentView, "documentView");

			this._aLineItems = [];
			// this._aErrors = [];
			this.getRouter().getRoute("singlePayment").attachPatternMatched(this._onObjectMatched, this);

			this._oFormValidator = new FormValidator(this.getResourceBundle());

			this.getView().setModel(this.getMessageManager().getMessageModel(), "messages");
			this.getOwnerComponent().preventDefaultErrorHandler();
			
			// this.getOwnerComponent().getModel().setDeferredGroups(this.getOwnerComponent().getModel().getDeferredGroups().concat(["batchCreate", "batchCalculateTax"]));

			// this.byId("idUploadSupportingDocument").addEventDelegate({
			// 	fileDeleted: function (evt) {
			// 		return;
			// 	}
			// });
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when One Time Vendor button is pressed.
		 * This function will enable user to open the dialog.
		 * @public
		 */

		onPressOneTimeVendorDialog: function () {
			if (!this._oOneTimeVendorDialog) {
				this._oOneTimeVendorDialog = sap.ui.xmlfragment(this.getView().getId(),
					"ee.com.finance.FI-112.view.fragment.OneTimeVendorDialog", this);
				this.getView().addDependent(this._oOneTimeVendorDialog);
			}
			// if (!this._oOneTimeVendorDialog) {
			// 	Fragment.load({
			// 		id: this.getView().getId(),
			// 		name: "ee.com.finance.FI-112.view.fragment.OneTimeVendorDialog",
			// 		controller: this
			// 	}).then(function (oDialog) {
			// 		this.getView().addDependent(oDialog);
			this._oOneTimeVendorDialog.open();
			// 	}.bind(this));
			// }
		},

		/**
		 * Event handler for the press event of clear button.
		 * Used to clear the currently opened dialog.
		 * @public
		 */
		onPressClear: function (oEvent) {
			// this.getModel().resetChanges();
			// this._oFormValidator.clearValidation(this.byId("idOneTimeVendorDialog"));
			var sPath = oEvent.getSource().getBindingContext().sPath,
				aFields = ["Title", "Name", "Street", "PostCode", "City", "Country", "Email", "BankCountry", "BankName", "BankKey",
					"BankAccount", "Iban", "InstructionKey"
				];

			aFields.forEach(function (oField) {
				this.getView().getModel().setProperty(sPath + "/" + oField, "");
			}.bind(this));

			oEvent.getSource().getParent().close();
		},

		/**
		 * Event handler for the press event of confirm.
		 * Used to confirm the input of currently opened dialog.
		 * @param {object} oEvent The event object propagated by the press event of confirm button.
		 * @public
		 */
		onPressConfirm: function (oEvent) {
			if (this._oFormValidator.validate(this.getView().byId("idOneTimeVendorDialog"))) {
				oEvent.getSource().getParent().close();
			}
		},

		onPressCancelOneTimeVendor: function (oEvent) {
			var oDialog = oEvent.getSource();
			oDialog.getParent().close();
		},

		/**
		 * Event handler for the press event of cancel button for any dialog.
		 * Used to close the currently opened dialog.
		 * @param {object} oEvent The event object propagated by the press event of cancel button.
		 * @public
		 */
		onPressCancel: function (oEvent) {
			// var oDialog = oEvent.getSource();
			// oDialog.getParent().close();
			var sCancelTitle = this.getResourceBundle().getText("cancelTitle"),
				sConfirmationMessage = this.getResourceBundle().getText("cancelMessage");

			if (this.getModel().hasPendingChanges()) {
				MessageBox.warning(sConfirmationMessage, {
					title: sCancelTitle,
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					onClose: function (sAction) {
						if (sAction === MessageBox.Action.OK) {
							this._oFormValidator.clearValidation(this.getView());
							this.getModel().resetChanges();
							this.getModel().refresh();
							window.history.go(-1);
						}
					}.bind(this)
				});
			} else {
				// Remove any validation performed to clear the state of a control.
				this._oFormValidator.clearValidation(this.getView());
			}
			this.clearMessages();
		},

		onChangeGeneralInfo: function (oEvent) {
			var oViewModel = this.getModel("wizardView"),
				oContext = oEvent.getSource().getBindingContext();

			if (oContext.getProperty("SupplierNumber")) {
				oViewModel.setProperty("/isSupplierNameSelected", true);
				oViewModel.setProperty("/isNameSelected", false);
				oViewModel.setProperty("/isOneTimeVendorSelected", false);
				oViewModel.setProperty("/isAbnNumberMandatory", true);
			} else {
				oViewModel.setProperty("/isSupplierNameSelected", false);
				oViewModel.setProperty("/isNameSelected", true);
				oViewModel.setProperty("/isOneTimeVendorSelected", true);
				oViewModel.setProperty("/isAbnNumberMandatory", false);
				this.getView().getModel().setProperty(oContext.sPath + "/AbnNumber", "");
			}
			// this.onActivateGeneralInfo();
		},

		onSmartTableInitialise: function (oEvent) {
			var oTable = oEvent.getSource().getTable();
			var aColumns = oTable.getColumns();

			for (var i = 0; i < aColumns.length; i++) {
				var sPath = "tableView>" + aColumns[i].data("p13nData").columnKey;
				aColumns[i].getTemplate().bindValue(sPath);

				if (aColumns[i].data("p13nData").columnKey === "ItemNumber") {
					aColumns[i].getTemplate().setEditable(false);
					aColumns[i].setWidth("5rem");
				}

				if (aColumns[i].data("p13nData").columnKey === "Description") {
					aColumns[i].getTemplate().attachChange(this._onChangeDescription, this);
					aColumns[i].setWidth("30.6rem");
				}

				if (aColumns[i].data("p13nData").columnKey === "Amount") {
					aColumns[i].getTemplate().attachChange(this._onChangeAmount, this);
					aColumns[i].setWidth("8rem");
				}

				var oItemTemplate = new sap.ui.core.Item({
					key: "{CreditDebit}",
					text: "{Description}"
				});

				var oObject = new sap.m.ComboBox({
					selectedKey: "{tableView>CreditDebit}",
					items: {
						path: "/ZB_FIN_VH_CreditDebit", //***no curly brackets round a variable here***
						template: oItemTemplate,
						templateShareable: true
					},
					change: this._onChangeCreditDebit.bind(this)
				});
				if (aColumns[i].data("p13nData").columnKey === "CreditDebit") {
					aColumns[i].setTemplate(oObject.clone());
					aColumns[i].setWidth("7rem");
				}

				if (aColumns[i].data("p13nData").columnKey === "TaxCode") {
					aColumns[i].getTemplate().attachChange(this._onChangeTaxCode, this);
					aColumns[i].setWidth("8rem");
				}

				if (aColumns[i].data("p13nData").columnKey === "CompanyCode") {
					aColumns[i].getTemplate().attachChange(this._onChangCompanyCode, this);
					aColumns[i].setWidth("8rem");
				}

				if (aColumns[i].data("p13nData").columnKey === "GlAccount") {
					aColumns[i].getTemplate().attachChange(this._onChangeGlAccount, this);
					aColumns[i].setWidth("10rem");
				}

				if (aColumns[i].data("p13nData").columnKey === "CostCenter") {
					aColumns[i].getTemplate().attachChange(this._onChangeCostCenter, this);
					aColumns[i].setWidth("10rem");
				}

				if (aColumns[i].data("p13nData").columnKey === "ProfitCenter") {
					aColumns[i].getTemplate().attachChange(this._onChangeProfitCenter, this);
					aColumns[i].setWidth("8rem");
				}

				if (aColumns[i].data("p13nData").columnKey === "WbsElement") {
					aColumns[i].getTemplate().attachChange(this._onChangeWbsElement, this);
					aColumns[i].setWidth("15rem");
				}

			}

			oTable.bindRows("tableView>/");
		},

		_create5LineItems: function () {
			var oTable = this.byId("idLineItemsSmartTable").getTable();

			for (var i = 0; i < 5; i++) {
				var oProperties = {
					BatchID: this._getUUID(),
					ItemNumber: "0",
					Description: "",
					Amount: "0.00",
					CreditDebit: this.getView().getModel("wizardView").getProperty("/CreditDebit"),
					TaxCode: "",
					CompanyCode: "",
					GlAccount: "",
					CostCenter: "",
					ProfitCenter: "",
					WbsElement: "",
					CID: "None"
				};

				this._createLineItem(oProperties);

			}
			oTable.bindRows({
				path: "tableView>/"
			});

			this._updateItemNumber();
		},

		/**
		 * Event handler for the press event of add button.
		 * Used to add 5 line items in the table.
		 * @public
		 */
		onPressAdd: function () {
			this._create5LineItems();
		},

		_updateItemNumber: function () {
			var aLineItems = this.getModel("tableView").getData(),
				aModels = this.getModel("tableModel").getData(),
				iItemNumber = 1;

			aLineItems.forEach(function (oLineItem) {
				// var sPath = oLineItem.sPath;
				// this.getModel().setProperty(sPath +"/ItemNumber", iItemNumber.toString());
				// oLineItem.getProperty().ItemNumber = iItemNumber.toString();
				oLineItem.ItemNumber = iItemNumber.toString();
				iItemNumber++;
			}.bind(this));

			iItemNumber = 1;

			aModels.forEach(function (oModel) {
				var sPath = oModel.sPath;

				this.getModel().setProperty(sPath + "/ItemNumber", iItemNumber.toString());
				iItemNumber++;
			}.bind(this));
		},

		_createLineItem: function (oProperties) {
			var oTable = this.byId("idLineItemsSmartTable").getTable(),
				oAccountingModel = this.getView().getModel("tableView"),
				aExistingEntries = oAccountingModel.getData(),
				aExistingModel = this.getModel("tableModel").getData();
				
				if(typeof oProperties.Amount === "number"){
					oProperties.Amount.toFixed(2);
				}

			var oEntry = this.getModel().createEntry("LineItem", {
				properties: oProperties
			} || {});

			aExistingModel.push(oEntry);
			aExistingEntries.push(oEntry.getProperty());

			// var oColumnListItem = new ColumnListItem({
			// 	cells: oTable.getColumns().map(function (oColumn) {

			// 		if (oColumn.getCustomData()[0].getValue().columnKey === "ItemNumber") {
			// 			return new SmartField({
			// 				value: "{" + oColumn.getCustomData()[0].getValue().columnKey + "}",
			// 				editable: false
			// 			});
			// 		} else if (oColumn.getCustomData()[0].getValue().columnKey === "Amount") {
			// 			return new SmartField({
			// 				value: "{" + oColumn.getCustomData()[0].getValue().columnKey + "}",
			// 				change: [function (oEvent) {
			// 					this._onChangeAmount(oEvent);
			// 				}, this]
			// 			});
			// 		} else {
			// 			return new SmartField({
			// 				value: "{" + oColumn.getCustomData()[0].getValue().columnKey + "}"
			// 					// change: [this._onChangeAmount,this]
			// 			});
			// 		}

			// 	}.bind(this))
			// });

			// oColumnListItem.setBindingContext(oEntry);
			// oTable.addItem(oColumnListItem);
			// aExistingEntries.push(oColumnListItem.getBindingContext().getProperty());

		},

		onPressCalculateTax: function (oEvent) {
			var oAccountingModel = this.getView().getModel("tableView"),
				aExistingEntries = oAccountingModel.getData();
			var oTable = this.byId("idLineItemsSmartTable").getTable();
			var sPath = oEvent.getSource().getBindingContext().sPath
			var sGrossAmount = this.byId("idGrossAmount").getValue().replace(",", "");

			// var aDeferredGroup = this.getModel().getDeferredGroups().push("batchCalculateTax");
			// this.getModel().setDeferredGroups(aDeferredGroup);
			// var mParameters = {
			// 	changedSetId: "batchCalculateTax"
			// };

			this.getModel("wizardView").setProperty("/Path", sPath);

			// if (this.getModel().hasPendingChanges()) {
			aExistingEntries.forEach(function (oExistingEntry, iIndex , aArray) {
				oExistingEntry.HDRSupplierNumber = this.byId("idSupplierNumber").getValue();
				oExistingEntry.HDRCompanyCode = this.byId("idCompanyCode").getValue();
				oExistingEntry.HDRGrossAmount = sGrossAmount;
				oExistingEntry.CalcTaxAmount = "X";
				this.getModel().create('/LineItem', oExistingEntry, {
					// groupId: "batchCalculateTax",
					success: function (oData, response) {
						var oMessage = response.headers["sap-message"];
						if (oMessage) {
							this.clearMessages();
							var oMessageObject = JSON.parse(oMessage);
							var sTax = oMessageObject.message.split(":")[1];
							this.byId("idTaxAmount").setValue(sTax.split(",")[0].trim());
							// var sPath = this.getModel("wizardView").getProperty("/Path");

							// this.getModel().setProperty(sPath + "/TaxAmount", sTax.replace(",", ""));
							sap.m.MessageToast.show("Success!");
							// MessageToast.show(this.getResourceBundle().getText("successDeleteMessage"));
							// this.getModel("objectView").setProperty("/isObjectDeleted", true);
							// this.getModel().refresh();
							// this.onNavBack();
							oExistingEntry.CalcTaxAmount = "";
						}

					}.bind(this),
					error: function (oError) {
						this.getOwnerComponent().preventDefaultErrorHandler();
						oExistingEntry.CalcTaxAmount = "";
						oTable.unbindRows();
						oTable.bindRows({
							path: "tableView>/"
						});
						
						if (iIndex !== aArray.length - 1) {
							this.clearMessages();
						}
					}.bind(this)
				});
			}.bind(this));
		},

		_calculateLineItemBalance: function () {
			var oAccountingModel = this.getView().getModel("tableView"),
				aExistingEntries = oAccountingModel.getData(),
				iTotalAmount = 0,
				iGrossAmount = parseFloat(this.byId("idGrossAmount").getValue().replace(",", "")),
				sCurrencyUnit = this.byId("idGrossAmount").getContent().getItems()[1].getValue();

			if (isNaN(iGrossAmount)) {
				iGrossAmount = 0;
			}

			aExistingEntries.forEach(function (oExistingEntry) {
				iTotalAmount += parseFloat(oExistingEntry.Amount);
			}.bind(this));

			this.getModel("wizardView").bindProperty("/LineItemBalance").attachChange(this._onChangeStatus, this);

			this.getModel("wizardView").setProperty("/LineItemBalance", (iGrossAmount - iTotalAmount).toFixed(2));
			this.getModel("wizardView").setProperty("/CurrencyUnit", sCurrencyUnit);

			// (function (event) {
			// button.setEnabled(event.getSource().getValue().length < 10);
			// })
		},

		_onChangeStatus: function (oEvent) {
			var oMessageStripVbox = this.byId("idMessageStripVbox");

			if (this.getModel("wizardView").getProperty("/LineItemBalance") !== "0.00") {
				this.byId("idAccountingData").setValidated(false);
				this.byId("idStatus").setState("Error");
				oMessageStripVbox.setVisible(true);
				var oMessageStrip = sap.ui.getCore().byId("idMsgStrip");

				if (oMessageStrip) {
					oMessageStrip.setVisible(true);
				} else {
					oMessageStrip = new MessageStrip("idMsgStrip", {
						showCloseButton: true,
						showIcon: true,
						text: this.getResourceBundle().getText("errorBalanceMessage"),
						type: "Error"
					});

					oMessageStripVbox.addItem(oMessageStrip);
				}
			} else {
				this.byId("idAccountingData").setValidated(true);
				this.byId("idStatus").setState("None");
				oMessageStripVbox.setVisible(false);

			}
		},
		///////////CHANGE METHOD//////////////////////////////////////////////////////////

		_onChangeAmount: function (oEvent) {
			var sPath = oEvent.getSource().getBindingInfo("value").binding.oContext.sPath,
				sIndex = sPath.replace("/", ""),
				sItemPath = this.getModel("tableModel").getData()[sIndex].sPath;

			this.getModel().setProperty(sPath + "/Amount", oEvent.getParameters().newValue);
			// oAccountingModel = this.getView().getModel("tableView"),
			// aExistingEntries = oAccountingModel.getData();

			// var aLineItems = this.byId("idAccountingDataTable").getItems(),
			// iTotalAmount = 0,
			// iGrossAmount = parseFloat(this.byId("idGrossAmount").getValue()),
			// sCurrencyUnit = this.byId("idGrossAmount").getContent().getItems()[1].getValue();

			// aLineItems.forEach(function (oLineItem) {
			// 	var oExistedLineItem = oLineItem.getBindingContext().getObject();
			// 	var sPath = oLineItem.getBindingContextPath();
			// 	var oSelectedLineItem = oEvent.getSource().getBindingContext().getObject();

			// 	if (oExistedLineItem.BatchID === oSelectedLineItem.BatchID) {
			// 		this.getView().getModel().setProperty(sPath + "/Amount", oEvent.getParameters().newValue);
			// 		iTotalAmount += parseFloat(this.getModel().getProperty(sPath + "/Amount"));
			// 	} else {
			// 		iTotalAmount += parseFloat(oExistedLineItem.Amount);
			// 	}
			// }.bind(this));
			this._calculateLineItemBalance();

			// this.getModel("wizardView").setProperty("/LineItemBalance", (iGrossAmount - iTotalAmount).toFixed(2));
			// this.getModel("wizardView").setProperty("/CurrencyUnit", sCurrencyUnit);

			// sap.m.MessageToast.show(iTotalAmount);
		},

		_onChangeDescription: function (oEvent) {
			var sPath = oEvent.getSource().getBindingInfo("value").binding.oContext.sPath,
				sIndex = sPath.replace("/", ""),
				sItemPath = this.getModel("tableModel").getData()[sIndex].sPath;

			this.getModel().setProperty(sItemPath + "/Description", oEvent.getParameters().newValue);

		},
		_onChangeCreditDebit: function (oEvent) {
			var sPath = oEvent.getSource().getBindingInfo("selectedKey").binding.oContext.sPath,
				sIndex = sPath.replace("/", ""),
				sItemPath = this.getModel("tableModel").getData()[sIndex].sPath;

			this.getModel().setProperty(sItemPath + "/CreditDebit", oEvent.getSource().getSelectedItem().getKey());
		},
		_onChangeTaxCode: function (oEvent) {
			var sPath = oEvent.getSource().getBindingInfo("value").binding.oContext.sPath,
				sIndex = sPath.replace("/", ""),
				sItemPath = this.getModel("tableModel").getData()[sIndex].sPath;

			this.getModel().setProperty(sItemPath + "/Description", oEvent.getParameters().value);
		},
		_onChangeCompanyCode: function (oEvent) {
			var sPath = oEvent.getSource().getBindingInfo("value").binding.oContext.sPath,
				sIndex = sPath.replace("/", ""),
				sItemPath = this.getModel("tableModel").getData()[sIndex].sPath;

			this.getModel().setProperty(sItemPath + "/CompanyCode", oEvent.getParameters().value);
		},
		_onChangeGlAccount: function (oEvent) {
			var sPath = oEvent.getSource().getBindingInfo("value").binding.oContext.sPath,
				sIndex = sPath.replace("/", ""),
				sItemPath = this.getModel("tableModel").getData()[sIndex].sPath;

			this.getModel().setProperty(sItemPath + "/GlAccount", oEvent.getParameters().value);
		},
		_onChangeCostCenter: function (oEvent) {
			var sPath = oEvent.getSource().getBindingInfo("value").binding.oContext.sPath,
				sIndex = sPath.replace("/", ""),
				sItemPath = this.getModel("tableModel").getData()[sIndex].sPath;

			this.getModel().setProperty(sItemPath + "/CostCenter", oEvent.getParameters().value);
		},
		_onChangeProfitCenter: function (oEvent) {
			var sPath = oEvent.getSource().getBindingInfo("value").binding.oContext.sPath,
				sIndex = sPath.replace("/", ""),
				sItemPath = this.getModel("tableModel").getData()[sIndex].sPath;

			this.getModel().setProperty(sItemPath + "/ProfitCenter", oEvent.getParameters().value);
		},
		_onChangeWbsElement: function (oEvent) {
			var sPath = oEvent.getSource().getBindingInfo("value").binding.oContext.sPath,
				sIndex = sPath.replace("/", ""),
				sItemPath = this.getModel("tableModel").getData()[sIndex].sPath;

			this.getModel().setProperty(sItemPath + "/WbsElement", oEvent.getParameters().value);
		},
		onPressValidate: function () {
			var oAccountingModel = this.getView().getModel("tableView"),
				aExistingEntries = oAccountingModel.getData();
			var oTable = this.byId("idLineItemsSmartTable").getTable();
			var sGrossAmount = this.byId("idGrossAmount").getValue().replace(",", "");

			// var aDeferredGroup = this.getModel().getDeferredGroups().push("batchCreate");
			// this.getModel().setDeferredGroups(aDeferredGroup);
			// var mParameters = {
			// 	groupId: "batchCreate"
			// };

			aExistingEntries.forEach(function (oExistingEntry, iIndex, aArray) {
			// for (var i = 0; i < aExistingEntries.length; i++) {
				oExistingEntry.HDRSupplierNumber = this.byId("idSupplierNumber").getValue();
				oExistingEntry.HDRCompanyCode = this.byId("idCompanyCode").getValue();
				oExistingEntry.HDRGrossAmount = sGrossAmount;
				// this.getModel().create('/LineItem', oExistingEntry, mParameters);

				this.getModel().create('/LineItem', oExistingEntry, {
					// groupId: "batchCreate",
					success: function () {
						sap.m.MessageToast.show("Success!");
						aExistingEntries.forEach(function (oExistingEntry) {

							oExistingEntry.CID = "None"
							var rowSettingsTemplate = new sap.ui.table.RowSettings({
								highlight: "{tableView>CID}"
							});
							oTable.setRowSettingsTemplate(rowSettingsTemplate);

						}.bind(this));

					}.bind(this),
					error: function (oError) {
						this.getOwnerComponent().preventDefaultErrorHandler();
						if (iIndex == aArray.length - 1) {
							var oErrorResponse = JSON.parse(oError.responseText),
								oErrorMessage = "";
							this._aErrors = [];

							var aErrorDetails = oErrorResponse.error.innererror.errordetails;
							for (var i = 0; i < aErrorDetails.length; i++) {
								oErrorMessage = aErrorDetails[i].message;
								this._aErrors.push(oErrorMessage);
							}

							var aErrors = this._aErrors;

							for (var i = 0; i < aErrors.length; i++) {
								if (/(?<=\D)\d+/.test(aErrors[i])) {
									var sItemNumber = (/(?<=\D)\d+/.exec(aErrors[i])),
										sUpdateItemNumber = sItemNumber[0];

									aExistingEntries.forEach(function (oExistingEntry) {
										if (oExistingEntry.ItemNumber == sUpdateItemNumber) {
											oExistingEntry.CID = "Error"
											var rowSettingsTemplate = new sap.ui.table.RowSettings({
												highlight: "{tableView>CID}"
											});

											oTable.setRowSettingsTemplate(rowSettingsTemplate);
										}
									}.bind(this));
								}
							}
						} else {
							this.clearMessages();
						}

					}.bind(this)
				});
			// }

			}.bind(this));

			// this.getModel().submitChanges({
			// 	groupId: "batchCreate",
			// 	success: function () {
			// 		sap.m.MessageToast.show("Success!");
			// 		aExistingEntries.forEach(function (oExistingEntry) {

			// 			oExistingEntry.CID = "None"
			// 			var rowSettingsTemplate = new sap.ui.table.RowSettings({
			// 				highlight: "{tableView>CID}"
			// 			});
			// 			oTable.setRowSettingsTemplate(rowSettingsTemplate);

			// 		}.bind(this));

			// 	}.bind(this),
			// 	error: function (oError) {
			// 		this.getOwnerComponent().preventDefaultErrorHandler();

			// 		var oErrorResponse = JSON.parse(oError.responseText),
			// 			oErrorMessage = "";
			// 		this._aErrors = [];

			// 		var aErrorDetails = oErrorResponse.error.innererror.errordetails;
			// 		for (var i = 0; i < aErrorDetails.length; i++) {
			// 			oErrorMessage = aErrorDetails[i].message;
			// 			this._aErrors.push(oErrorMessage);
			// 		}

			// 		var aErrors = this._aErrors;

			// 		for (var i = 0; i < aErrors.length; i++) {
			// 			if (/(?<=\D)\d+/.test(aErrors[i])) {
			// 				var sItemNumber = (/(?<=\D)\d+/.exec(aErrors[i])),
			// 					sUpdateItemNumber = sItemNumber[0];

			// 				aExistingEntries.forEach(function (oExistingEntry) {
			// 					if (oExistingEntry.ItemNumber == sUpdateItemNumber) {
			// 						oExistingEntry.CID = "Error"
			// 						var rowSettingsTemplate = new sap.ui.table.RowSettings({
			// 							highlight: "{tableView>CID}"
			// 						});

			// 						oTable.setRowSettingsTemplate(rowSettingsTemplate);
			// 					}
			// 				}.bind(this));

			// 			}
			// 		}
			// 	}.bind(this)
			// });
			oTable.unbindRows();
			oTable.bindRows({
				path: "tableView>/"
			});
			// }.bind(this));

			// this.getModel().submitChanges({
			// 	groupId: "validate"
			// })

			// aLineItems.forEach(function (oLineItem) {
			// 	var sPath = oLineItem.getBindingContextPath();
			// 	var oData = this.getView().getModel().getProperty(sPath);
			// 	this.getView().getModel().getProperty(sPath).ValidationFlag = "X"
			// 	this.getModel().create('/LineItem', oData, mParameters);
			// }.bind(this));

			// this._updateLineItems(this._aExistingEntries);
			// for (var i = 0; i < this._aExistingEntries.length; i++) {
			// 	this.getView().getModel("tableView").getData()[i].ValidationFlag = "X";
			// 	var oEntry = this.getView().getModel("tableView").getData()[i];

			// }

			// }

		},

		onUpload: function (oEvent) {
			this._import(oEvent.getParameter("files") && oEvent.getParameter("files")[0]);
		},

		_import: function (file) {
			var oExcelData = {};
			var that = this;
			var oTable = this.byId("idLineItemsSmartTable").getTable(),
				oAccountingModel = this.getView().getModel("tableView"),
				aExistingEntries = oAccountingModel.getData();

			if (file && window.FileReader) {
				var reader = new FileReader();
				reader.onload = function (oEvent) {
					var data = oEvent.target.result;
					var workbook = XLSX.read(data, {
						type: 'binary'
					});
					workbook.SheetNames.forEach(function (sheetName) {
						oExcelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
							header: ["Description", "Amount", "CreditDebit", "TaxCode", "CompanyCode", "GlAccount", "CostCenter", "ProfitCenter",
								"WbsElement"
							]
						});

						oExcelData.forEach(function (oProperties) {
							oProperties.ItemNumber = "0";
							var oEntry = that._createLineItem(oProperties);
						});
						that._calculateLineItemBalance();
						oTable.bindRows({
							path: "tableView>/"
						});
						that._updateItemNumber();
					});
				};
				reader.onerror = function (ex) {
					sap.m.MessageToast.show(ex);
				};
				reader.readAsBinaryString(file);
			}
		},

		onPressDelete: function (oEvent) {
			var oTable = this.byId("idLineItemsSmartTable").getTable(),
				oAccountingModel = this.getView().getModel("tableView"),
				aExistingEntries = oAccountingModel.getData(),
				aExistingModel = this.getModel("tableModel").getData(),
				reverse = [].concat(oTable.getSelectedIndices()).reverse();

			MessageBox.warning(this.getResourceBundle().getText("deleteMessage"), {
				title: this.getResourceBundle().getText("confirmDeleteTitle"),
				actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.DELETE) {
						reverse.forEach(function (index) {
							this.getModel().deleteCreatedEntry(aExistingModel[index]);
							// this.getModel().remove(oTable.getContextByIndex(index).getPath());
							aExistingModel.splice(index, 1);
							aExistingEntries.splice(index, 1);
						}.bind(this));
						oAccountingModel.refresh(true);
						oTable.unbindRows();
						oTable.bindRows({
							path: "tableView>/"
						});
						this._updateItemNumber();
					}
				}.bind(this)
			});
		},

		onCompleteGeneralInfo: function (oEvent) {
			this.clearMessages();
			this.getView().byId("idGeneralInformation").setNextStep("idAccountingData");
			this._create5LineItems();
		},

		// onCompleteAccountingData: function (oEvent) {
		// 	this.getModel("wizardView").setProperty("/isSubmitEnabled", true);
		// },

		onPressSetPrimary: function (oEvent) {
			var oSetPrimary = this.byId("idUploadSupportingDocument").getSelectedItem(),
				aDocuments = this.byId("idUploadSupportingDocument").getItems(),
				sFileName = this.byId("idUploadSupportingDocument").getSelectedItem().getProperty("fileName");

			if (oSetPrimary) {

				aDocuments.forEach(function (oDocument) {
					oDocument.removeAllStatuses();
				}.bind(this));

				this._oStatus = new ObjectStatus({
					title: "Status",
					text: "Primary File"
				});

				if (/([a-zA-Z0-9\s_\\.\-\(\):])+(.pdf)$/i.test(sFileName)) {
					oSetPrimary.addStatus(this._oStatus);
					this.byId("idSubmitButton").setVisible(true);
				} else {
					MessageBox.error(this.getResourceBundle().getText("setPrimaryFileText"));
					oSetPrimary.setSelected(false);
				}

			}
		},

		_isPrimaryFile: function (aFiles) {
			var isSelected = false;

			for (var i = 0; i < aFiles.length; i++) {
				switch (aFiles[i].getStatuses().length) {
				case 1:
					return false;
				case 0:
					isSelected = true;
				}
			};
		},

		_setPrimaryFile: function (oFile) {
			if (oFile.getStatuses()[0] !== undefined) {
				return "X";
			} else {
				return "";
			}
		},

		onPressSubmit: function (oEvent) {
			// this.getModel().setDeferredGroups(this.getModel().getDeferredGroups().concat(["Changes"]));
				// this.getModel().setDeferredGroups(this.getModel().getDeferredGroups());
			var oAccountingModel = this.getView().getModel("tableView"),
				aExistingEntries = oAccountingModel.getData(),
				oTable = this.byId("idLineItemsSmartTable").getTable(),
				oUploadCollection = this.byId("idUploadSupportingDocument"),
				aFiles = oUploadCollection.getItems(),
				aDocuments = this.getModel("documentView").getData();

			// this.byId("idDynamicPage").setBusy(true);
			// if (isSelected) {
				if (aFiles.length) {
					aFiles.forEach(function (oFile) {
						aDocuments.forEach(function (oDocument) {
							// if (oFile.getFileName() === oDocument.FilePath) {
							var sPrimaryFile = this._setPrimaryFile(oFile);

							this.getModel().createEntry("/Document", {
								properties: {
									BatchID: oDocument.BatchID,
									"PrimaryIndicator": sPrimaryFile,
									"FileContent": oDocument.FileContent,
									"ArchiveDocID": "",
									"FileLength": oDocument.FileLength,
									"FilePath": oDocument.FilePath

								}
							});
							// }
						}.bind(this));

					}.bind(this));
				}
				if (this._oFormValidator.validate(this.byId("idGeneralInfo"))) {
					this.getModel().submitChanges({
						success: function (oData) {
							this.getOwnerComponent().preventDefaultErrorHandler();
							this.byId("idDynamicPage").setBusy(false);
							if (oData.__batchResponses[0].response.statusCode === "201") {
								MessageBox.confirm("Payment request created successfully", {
									title: this.getResourceBundle().getText("confirmTitle"),
									onClose: function (oAction) {
										if (oAction === MessageBox.Action.OK) {
											this.getModel().resetChanges();
											// this.getModel().refresh(true);
											this._createEntry();
											// this.getRouter().navTo("singlePayment", {
											// 	BatchId: this._getUUID()
											// }, true);
										}
									}.bind(this)
								});
							} else {
								this.getOwnerComponent().preventDefaultErrorHandler();
		
								var oErrorResponse = JSON.parse(oData.__batchResponses[0].response.body),
									oErrorMessage = "";
								this._aErrors = [];

				

								var aErrorDetails = oErrorResponse.error.innererror.errordetails;
								for (var i = 0; i < aErrorDetails.length; i++) {
									oErrorMessage = aErrorDetails[i].message;
									this._aErrors.push(oErrorMessage);
								}

								var aErrors = this._aErrors;
					
								for (var i = 0; i < aErrors.length; i++) {
									if (/(?<=\D)\d+/.test(aErrors[i])) {
										var sItemNumber = (/(?<=\D)\d+/.exec(aErrors[i])),
											sUpdateItemNumber = sItemNumber[0];

										aExistingEntries.forEach(function (oExistingEntry) {
											if (oExistingEntry.ItemNumber == sUpdateItemNumber) {
												oExistingEntry.CID = "Error"
												var rowSettingsTemplate = new sap.ui.table.RowSettings({
													highlight: "{tableView>CID}"
												});

												oTable.setRowSettingsTemplate(rowSettingsTemplate);
											}
										}.bind(this));

						

									}
								}

							}

						}.bind(this),
						error: function () {
							this.getOwnerComponent().preventDefaultErrorHandler();
						}.bind(this)
					});
					this.getOwnerComponent().preventDefaultErrorHandler();
				}

			// } else {
			// 	MessageBox.error(this.getResourceBundle().getText("setPrimaryFileText"));
			// }

		},

		onSelectChange: function (oEvent) {
			var oUploadCollection = this.byId("UploadCollection");
			oUploadCollection.setShowSeparators(oEvent.getParameters().selectedItem.getProperty("key"));
		},

		onSelectAutoCalcTax: function (oEvent) {
			if (oEvent.getParameters().value === true) {
				this.getView().getModel("wizardView").setProperty("/isEnabledAutoCalcTax", false);
			} else {
				this.getView().getModel("wizardView").setProperty("/isEnabledAutoCalcTax", true);
			}
		},

		onSelectCredit: function (oEvent) {
			// var aLineItems = this.byId("idAccountingDataTable").getItems();
			var sPath = oEvent.getSource().getBindingContext().sPath;
			var aLineItems = this.getModel("tableView").getData();
			var oTable = this.byId("idLineItemsSmartTable").getTable();

			if (oEvent.getParameters().value === true) {
				this.getModel("wizardView").setProperty("/isEnabledCredit", true);
				this.getModel("wizardView").setProperty("/CreditDebit", "H");
				if (aLineItems.length) {
					aLineItems.forEach(function (oLineItem) {
						// var sPath = oLineItem._metadata.deepPath
						// this.getView().getModel().setProperty(sPath + "/CreditDebit", "H");
						// oTable.getColumns()[3].getTemplate().setSelectedKey("H")
						oLineItem.CreditDebit = "H"
					}.bind(this));
					oTable.unbindRows();
					oTable.bindRows({
						path: "tableView>/"
					});
				}
			} else {
				this.getView().getModel("wizardView").setProperty("/isEnabledCredit", false);
				this.getView().getModel("wizardView").setProperty("/CreditDebit", "S");
				if (aLineItems.length) {
					aLineItems.forEach(function (oLineItem) {
						// var sPath = oLineItem._metadata.deepPath
						// this.getView().getModel().setProperty(sPath + "/CreditDebit", "S");
						// oTable.getColumns()[3].getTemplate().setSelectedKey("S")
						oLineItem.CreditDebit = "S"
					}.bind(this));

					oTable.unbindRows();
					oTable.bindRows({
						path: "tableView>/"
					});
				}
				this.getModel().setProperty(sPath + "/CmRefDat", null);
				this.getModel().setProperty(sPath + "/CmRefNo", "");
			}
		},

		onChange: function (oEvent) {
			var oUploadCollection = oEvent.getSource();
			var oCustomerHeaderToken = new UploadCollectionParameter({
				name: "x-csrf-token",
				value: "securityTokenFromModel"
			});
			oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

			var reader = new FileReader();
			var file = oEvent.getParameter("files")[0];
			reader.fileName = file.name
			reader.onload = function (e) {
				var data = e.target.result;
				var sBase64 = btoa(data);
				var oProperties = {
					BatchID: this._getUUID(),
					FilePath: e.target.fileName,
					FileContent: sBase64,
					FileLength: e.total,
				};
				var aDocuments = this.getModel("documentView").getData(),
					aItems = oUploadCollection.getItems();
				aDocuments.push(oProperties);

				aItems.forEach(function (oItem) {
					oItem.attachDeletePress(this._onDeletePress, this);
				}.bind(this));

				for (var i = 0, j = aDocuments.length - 1; i < aDocuments.length; i++, j--) {
					aItems[j].setDocumentId(aDocuments[i].BatchID);
				}

				// oUploadCollection.getItems()[0].attachDeletePress(this._onDeletePress, this);
				// 	oUploadCollection.getItems()[0].addEventDelegate({
				// 	fileDeleted: function (evt) {
				// 		return;
				// 	}
				// });
			}.bind(this);

			reader.readAsBinaryString(file);

			///////////////////////////////////////////////////////////////////////////////////////
			// var oUploadCollection = oEvent.getSource();
			// // Header Token
			// var oCustomerHeaderToken = new UploadCollectionParameter({
			// 	name: "x-csrf-token",
			// 	value: "securityTokenFromModel"
			// });
			// oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

		},

		_onDeletePress: function (oEvent) {
			var aDocuments = this.getModel("documentView").getData();
			var oUploadCollection = this.byId("idUploadSupportingDocument");
			var aItems = oUploadCollection.getItems();

			for (var i = 0, j = aDocuments.length - 1; i < aDocuments.length; i++, j--) {
				if (aDocuments[i].BatchID === oEvent.getSource().getDocumentId()) {
					aDocuments.splice(i, 1);
					oUploadCollection.removeItem(aItems[j]);
				}
			}
			var isSelected = this._isPrimaryFile(aItems);
			this.byId("idSubmitButton").setVisible(isSelected);
		},

		onBeforeUploadStarts: function (oEvent) {
			// Header Slug
			var oCustomerHeaderSlug = new UploadCollectionParameter({
				name: "slug",
				value: oEvent.getParameter("fileName")
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
			MessageToast.show("BeforeUploadStarts event triggered.");
		},

		onActivateGeneralInfo: function (oEvent) {
			var oWizard = this.byId("idWizard");

			// this.getModel().metadataLoaded().then(function () {
			if (this.getView().getElementBinding()) {
				if (this._oFormValidator.validate(this.byId("idGeneralInfo"))) {
					oWizard.validateStep(this.byId("idGeneralInformation"));
					// this.getView().byId("idGeneralInformation").setShowNextButton(true);
				} else {
					oWizard.invalidateStep(this.byId("idGeneralInformation"));
				}
			} else {
				oWizard.invalidateStep(this.byId("idGeneralInformation"));
			}

		},
		// /* =========================================================== */
		// /* internal methods                                            */
		// /* =========================================================== */

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @private
		 */
		_onObjectMatched: function () {
			var oViewModel = this.getModel("wizardView");

			this.getModel().metadataLoaded().then(function () {
				this._createEntry();
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath Path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			var oViewModel = this.getModel("wizardView");

			this.getView().bindElement({
				path: sObjectPath,
				parameters: {
					expand: "to_LineItem,to_Document"
				},
				events: {
					change: function () {
						if (!this.getView().getElementBinding().getBoundContext()) {
							this.getRouter().getTargets().display("objectNotFound");
							return;
						}

						oViewModel.setProperty("/busy", false);
					}.bind(this),
					dataRequested: function () {
						this.getModel().metadataLoaded().then(function () {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},
		_createEntry: function (oEvent) {
			var oViewModel = this.getModel("wizardView");
			var oEntry = this.getModel().createEntry("/GeneralInfo", {
				properties: {
					BatchID: this._getUUID()
				},
				success: function (oData) {
					oViewModel.setProperty("/busy", false);
				}.bind(this),
				error: function (oError) {
					oViewModel.setProperty("/busy", false);
					// MessageBox.error(JSON.parse(oError.responseText).error.message.value);
				}
			});

			this._bindView(oEntry.getPath());
		},
		_updateLineItems: function (oEvent) {
			// var oAccountingModel = this.getView().getModel("tableView");
			// aExistingEntries = oAccountingModel.getData(),
			this._aExistingEntries = [];

			// aExistingEntries.forEach(function (oExistingEntry) {
			this._aLineItems.forEach(function (oLineItem) {
				var oContext = this.getModel().getObject(oLineItem),
					oProperties = {
						"BatchID": this._getUUID(),
						"ItemNumber": (this._aExistingEntries.length + 1).toString(),
						"Description": oContext.Description,
						// "Amount": oContext.Amount.toFixed(2),
						"Amount": null,
						"CreditDebit": oContext.CreditDebit,
						"TaxCode": oContext.TaxCode,
						"CompanyCode": oContext.CompanyCode,
						"GlAccount": oContext.GlAccount,
						"CostCenter": oContext.CostCenter,
						"ProfitCenter": oContext.ProfitCenter,
						"WbsElement": oContext.WbsElement
					};
				this._aExistingEntries.push(oProperties);
			}.bind(this));
			// }.bind(this));

			this.getModel("tableView").setData(this._aExistingEntries);
		},

		_getUUID: function () {
			var uuid = "",
				i, random;

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;

				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += "-";
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random))
					.toString(16);
			}

			return uuid;
		}
	});
});