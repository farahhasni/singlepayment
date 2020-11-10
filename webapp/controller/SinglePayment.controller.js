sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/UploadCollectionParameter",
	"sap/ui/core/Fragment",
	"sap/m/ColumnListItem",
	"sap/ui/comp/smartfield/SmartField"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, UploadCollectionParameter, Fragment, ColumnListItem,
	SmartField) {
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
				isEnabledAutoCalcTax: false,
				isEnabledCredit: false,
				isNameSelected: false,
				isOneTimeVendorSelected: true
			});
			this.getView().setModel(oViewModel, "wizardView");

			var oModel = new JSONModel([]);
			this.getView().setModel(oModel, "tableView");

			var generalInfoModel = new JSONModel([]);
			this.getView().setModel(generalInfoModel, "generalInfoView");

			this.getRouter().getRoute("singlePayment").attachPatternMatched(this._onObjectMatched, this);

			// this.oDataModel = new sap.ui.model.odata.ODataModel("https://s4spt.eeaus.com:44301/sap/opu/odata/sap/ZUI_FIN_VIMMANUALPAYMENT/");
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
				Fragment.load({
					name: "ee.com.finance.FI-112.view.fragment.OneTimeVendorDialog",
					controller: this
				}).then(function (oDialog) {
					this.getView().addDependent(oDialog);
					oDialog.open();
				}.bind(this));
			}
		},

		/**
		 * Event handler for the press event of clear button.
		 * Used to clear the currently opened dialog.
		 * @public
		 */
		onPressClear: function (oEvent) {
			// this.getModel().resetChanges();
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
			oEvent.getSource().getParent().close();
		},

		/**
		 * Event handler for the press event of cancel button for any dialog.
		 * Used to close the currently opened dialog.
		 * @param {object} oEvent The event object propagated by the press event of cancel button.
		 * @public
		 */
		onPressCancel: function (oEvent) {
			var oDialog = oEvent.getSource();
			oDialog.getParent().close();
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

		},

		/**
		 * Event handler for the press event of add button.
		 * Used to add 5 line items in the table.
		 * @public
		 */
		onPressAdd: function () {
			var oTable = this.byId("LineItemsSmartTable").getTable();
			var oAccountingModel = this.getView().getModel("tableView"),
				aExistingEntries = oAccountingModel.getData();

			for (var i = 0; i < 5; i++) {
				var oEntry = this.getModel().createEntry("LineItem", {
					properties: {
						"ItemNumber": "1",
						"Description": "",
						"Amount":  null,
						"CreditDebit": "",
						"TaxCode": "",
						"CompanyCode": "",
						"GlAccount": "",
						"CostCenter": "",
						"ProfitCenter": "",
						"WbsElement": ""
					} || {}
				});
				var oColumnListItem = new ColumnListItem({
					cells: oTable.getColumns().map(function (oColumn) {
						return new SmartField({
							value: "{" + oColumn.getCustomData()[0].getValue().columnKey + "}"
						});
					})
				});

				oColumnListItem.setBindingContext(oEntry);

				oTable.addItem(oColumnListItem);
				aExistingEntries.push(oColumnListItem.getBindingContext().getProperty());
			}

			// oColumnListItem.setData(aExistingEntries);
			// var oViewModel = this.getModel("wizardView");
			// 	// aToLineItems = this.getView().getBindingContext().getProperty("to_LineItem");

			// for (var i = 0; i < 5; i++) {
			// 	// this.getModel().metadataLoaded().then(function () {
			// 		var oEntry = this.getModel().createEntry("/LineItem", {
			// 			properties: {
			// 				// BatchID: this.getView().getBindingContext().getProperty("BatchId"),
			// 				// BatchID: this._getUUID(),
			// 				ItemNumber: i + 1
			// 			},
			// 			success: function (oData) {
			// 				oViewModel.setProperty("/busy", false);
			// 			}.bind(this),
			// 			error: function (oError) {
			// 				oViewModel.setProperty("/busy", false);
			// 				// MessageBox.error(JSON.parse(oError.responseText).error.message.value);
			// 			}
			// 		});

			// 		this._bindView(oEntry.getPath());
			// 		// aToLineItems.push(oEntry.getPath().substring(1));
			// 	// }.bind(this));

			// var oAccountingModel = this.getView().getModel("tableView"),
			// 	aExistingEntries = oAccountingModel.getData();

			// for (var i = 0; i < 5; i++) {
			// 	aExistingEntries.push({
			// 		Description: "",
			// 		Amount: "",
			// 		CreditDebit: "",
			// 		TaxCode: "",
			// 		CompanyCode: "",
			// 		GlAccount: "",
			// 		CostCenter: "",
			// 		ProfitCenter: "",
			// 		WbsElement: ""
			// 	});
			// }

			// oAccountingModel.setData(aExistingEntries);
		},

		onPressValidate: function (oEvent) {
			// var isValidate = {
			// 	"validation_flag": true
			// };
			for (var i=0 ; i<5 ; i++){
					this.getView().getModel("tableView").getData()[i].ValidationFlag = "X";
			var oEntry = this.getView().getModel("tableView").getData()[i];

			this.getModel().create('/LineItem', oEntry, null);
			}
		

		},

		onDelete: function (oEvent) {
			var sPath = oEvent.getParameter("listItem").getBindingContextPath().replace("/", "");
			var aAccountingModel = this.getView().getModel("tableView").getProperty("/");

			// aAccountingModel.splice(sPath, 1);

			// this.getModel("tableView").setData(aAccountingModel);
			// aAccountingModel.forEach(function(oAccountingModel){
			// 		this.getModel("tableView").setProperty("/", oAccountingModel);
			// }.bind(this));

			// aSelectedIndices.forEach(function (oSelectedIndex) {
			// 	aAccountingModel.splice(oSelectedIndex, 1);
			// 	this.getModel("tableView").setProperty("/", aAccountingModel);
			// }.bind(this));

			// this.byId("idAccountingDataTable").clearSelection();
		},

		onPressFileDeleted: function (oEvent) {
			// this.deleteItemById(oEvent.getParameter("documentId"));
			// MessageToast.show("FileDeleted event triggered.");
		},

		onUploadComplete: function (oEvent) {
			this.getView().getModel().refresh();
		},
		onSelectChange: function (oEvent) {
			var oUploadCollection = this.byId("UploadCollection");
			oUploadCollection.setShowSeparators(oEvent.getParameters().selectedItem.getProperty("key"));
		},
		onSelectAutoCalcTax: function (oEvent) {
			if (oEvent.getParameters().value === true) {
				this.getView().getModel("wizardView").setProperty("/isEnabledAutoCalcTax", true);
			} else {
				this.getView().getModel("wizardView").setProperty("/isEnabledAutoCalcTax", false);
			}
		},
		onSelectCredit: function (oEvent) {
			if (oEvent.getParameters().value === true) {
				this.getView().getModel("wizardView").setProperty("/isEnabledCredit", true);
			} else {
				this.getView().getModel("wizardView").setProperty("/isEnabledCredit", false);
			}
		},
		onSelectionChange: function (oEvent) {

		},
		onBeforeUploadStarts: function (oEvent) {
			var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
				name: "slug",
				value: oEvent.getParameter("fileName")
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
			var oModel = this.getView().getModel();

			oModel.refreshSecurityToken();
			var oHeaders = oModel.oHeaders;
			var sToken = oHeaders['x-csrf-token'];
			var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
				name: "x-csrf-token",
				value: sToken
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderToken);
			// Header Slug
			// var oCustomerHeaderSlug = new UploadCollectionParameter({
			// 	name: "slug",
			// 	value: oEvent.getParameter("fileName")
			// });
			// oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
			// MessageToast.show("BeforeUploadStarts event triggered.");
		},

		onPressSetPrimary: function (oEvent) {
			var oSetPrimary = this.byId("idUploadSupportingDocument").getSelectedItem();

			if (oSetPrimary) {
				var oStatus = sap.m.ObjectStatus({
					title: "Status",
					text: "Primary File"
				});

				oSetPrimary.addStatus(oStatus);
				// this.getModel("wizardView").setProperty("/Title","Status");
				// this.getModel("wizardView").setProperty("/Text","Primary File");
			}

			// if(!oSetPrimary){
			// 	this.getModel("wizardView").setProperty("/Title","");
			// 	this.getModel("wizardView").setProperty("/Text","");
			// }
		},

		onChange: function (oEvent) {
			var oUploadCollection = oEvent.getSource();
			// Header Token
			var oCustomerHeaderToken = new UploadCollectionParameter({
				name: "x-csrf-token",
				value: "securityTokenFromModel"
			});
			oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
		},

		onComplete: function (oEvent) {
			// var oWizardStep = oEvent.getSource();
			// oWizardStep.setVisible(false);
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
		}
	});
});