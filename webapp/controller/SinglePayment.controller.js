sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/UploadCollectionItem",
	"sap/m/UploadCollection",
	"sap/ui/core/Fragment",
	"sap/m/ColumnListItem",
	"sap/ui/comp/smartfield/SmartField",
	"../util/FormValidator",
	"sap/m/ObjectStatus",
	"sap/m/MessageBox",
	"../util/xlsx"

], function (BaseController, JSONModel, formatter, Filter, FilterOperator, UploadCollectionItem, UploadCollection, Fragment,
	ColumnListItem,
	SmartField, FormValidator, ObjectStatus, MessageBox, xlsx) {
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
				isOneTimeVendorSelected: true,
				isAbnNumberMandatory: true,
				isPDFFile: true,
				isSubmitEnabled: false,
				BinaryFile: "",
				LineItemBalance: 0,
				CurrencyUnit: "",
				PrimaryIndicator: "",
				CreditDebit: "S"
			});
			this.getView().setModel(oViewModel, "wizardView");

			var oModel = new JSONModel([]);
			this.getView().setModel(oModel, "tableView");

			var generalInfoModel = new JSONModel([]);
			this.getView().setModel(generalInfoModel, "generalInfoView");

			this._aLineItems = [];
			this.getRouter().getRoute("singlePayment").attachPatternMatched(this._onObjectMatched, this);

			this._oFormValidator = new FormValidator(this.getResourceBundle());
			// var oUploadCollection = this.getView().byId('idUploadSupportingDocument');
			// oUploadCollection.setUploadUrl("/sap/opu/odata/sap/ZUI_FIN_VIMMANUALPAYMENT/Document");

			// this.oDataModel = new sap.ui.model.odata.ODataModel("https://s4spt.eeaus.com:44301/sap/opu/odata/sap/ZUI_FIN_VIMMANUALPAYMENT/");
			// global XLSX;
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
			// var oTable = this.byId("idLineItemsSmartTable").getTable(),
			// 	oAccountingModel = this.getView().getModel("tableView"),
			// 	aExistingEntries = oAccountingModel.getData();

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
					WbsElement: ""
				};

				this._createLineItem(oProperties);

				// var sItemNumber = (aExistingEntries.length + 1).toString();
				// var oEntry = this.getModel().createEntry("LineItem", {
				// 	properties: {
				// 		"BatchID": this._getUUID(),
				// 		"ItemNumber": "0",
				// 		"Description": "",
				// 		"Amount": 0.00,
				// 		"CreditDebit": this.getView().getModel("wizardView").getProperty("/CreditDebit"),
				// 		"TaxCode": "",
				// 		"CompanyCode": "",
				// 		"GlAccount": "",
				// 		"CostCenter": "",
				// 		"ProfitCenter": "",
				// 		"WbsElement": ""
				// 	} || {}
				// });
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
			}

			this._updateItemNumber();
		},

		_updateItemNumber: function () {
			var aLineItems = this.byId("idAccountingDataTable").getItems(),
				iItemNumber = 1;

			aLineItems.forEach(function (oLineItem) {
				var sPath = oLineItem.getBindingContextPath();

				this.getView().getModel().setProperty(sPath + "/ItemNumber", iItemNumber.toString());
				iItemNumber++;
			}.bind(this));
		},

		_createLineItem: function (oProperties) {
			var oTable = this.byId("idLineItemsSmartTable").getTable(),
				oAccountingModel = this.getView().getModel("tableView"),
				aExistingEntries = oAccountingModel.getData();
			var oEntry = this.getModel().createEntry("LineItem", {
				properties: oProperties
			} || {});

			var oColumnListItem = new ColumnListItem({
				cells: oTable.getColumns().map(function (oColumn) {

					if (oColumn.getCustomData()[0].getValue().columnKey === "ItemNumber") {
						return new SmartField({
							value: "{" + oColumn.getCustomData()[0].getValue().columnKey + "}",
							editable: false
						});
					} else if (oColumn.getCustomData()[0].getValue().columnKey === "Amount") {
						return new SmartField({
							value: "{" + oColumn.getCustomData()[0].getValue().columnKey + "}",
							change: [function (oEvent) {
								this._onChangeAmount(oEvent);
							}, this]
						});
					} else {
						return new SmartField({
							value: "{" + oColumn.getCustomData()[0].getValue().columnKey + "}"
								// change: [this._onChangeAmount,this]
						});
					}

				}.bind(this))
			});

			oColumnListItem.setBindingContext(oEntry);
			oTable.addItem(oColumnListItem);
			aExistingEntries.push(oColumnListItem.getBindingContext().getProperty());

		},
		_onChangeAmount: function (oEvent) {
			var aLineItems = this.byId("idAccountingDataTable").getItems(),
				iTotalAmount = 0,
				iGrossAmount = parseFloat(this.byId("idGrossAmount").getValue()),
				sCurrencyUnit = this.byId("idGrossAmount").getContent().getItems()[1].getValue();

			aLineItems.forEach(function (oLineItem) {
				var oExistedLineItem = oLineItem.getBindingContext().getObject();
				var sPath = oLineItem.getBindingContextPath();
				var oSelectedLineItem = oEvent.getSource().getBindingContext().getObject();

				if (oExistedLineItem.BatchID === oSelectedLineItem.BatchID) {
					this.getView().getModel().setProperty(sPath + "/Amount", oEvent.getParameters().newValue);
					iTotalAmount +=  parseFloat(this.getModel().getProperty(sPath + "/Amount"));
				} else {
					iTotalAmount += parseFloat(oExistedLineItem.Amount);
				}
			}.bind(this));

			this.getModel("wizardView").setProperty("/LineItemBalance", (iGrossAmount - iTotalAmount).toFixed(2));
			this.getModel("wizardView").setProperty("/CurrencyUnit", sCurrencyUnit);

			// sap.m.MessageToast.show(iTotalAmount);
		},
		onPressValidate: function () {
			var aLineItems = this.byId("idAccountingDataTable").getItems();
			var aDeferredGroup = this.getModel().getDeferredGroups().push("batchCreate");
			this.getModel().setDeferredGroups(aDeferredGroup);
			var mParameters = {
				groupId: "batchCreate"
			};
			if (this.getModel().hasPendingChanges()) {

				aLineItems.forEach(function (oLineItem) {
					var sPath = oLineItem.getBindingContextPath();
					var oData = this.getView().getModel().getProperty(sPath);
					this.getView().getModel().getProperty(sPath).ValidationFlag = "X"
					this.getModel().create('/LineItem', oData, mParameters);
				}.bind(this));
				// this._updateLineItems(this._aExistingEntries);
				// for (var i = 0; i < this._aExistingEntries.length; i++) {
				// 	this.getView().getModel("tableView").getData()[i].ValidationFlag = "X";
				// 	var oEntry = this.getView().getModel("tableView").getData()[i];

				// }
			}
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
						that._updateItemNumber();

					});
				};
				reader.onerror = function (ex) {
					sap.m.MessageToast.show(ex);
				};
				reader.readAsBinaryString(file);
			}
		},

		onDelete: function (oEvent) {
			var oLineItem = oEvent.getParameter("listItem").getBindingContext();

			this.getModel().deleteCreatedEntry(oLineItem);
			oEvent.getParameter("listItem").getBindingContextPath();
			oEvent.getSource().removeItem(oEvent.getParameter("listItem"));
			this._onChangeAmount(oEvent);
			this._updateItemNumber();

		},

		onCompleteGeneralInfo: function (oEvent) {
			this.getView().byId("idGeneralInformation").setNextStep("idAccountingData");
			// this.onPressAdd();
		},

		onPressFileDeleted: function (oEvent) {
			// this.deleteItemById(oEvent.getParameter("documentId"));
			// MessageToast.show("FileDeleted event triggered.");
		},

		onPressSetPrimary: function (oEvent) {
			var oSetPrimary = this.byId("idUploadSupportingDocument").getSelectedItem(),
				aDocuments = this.byId("idUploadSupportingDocument").getItems(),
				sFileName = this.byId("idUploadSupportingDocument").getSelectedItem().getProperty("fileName");

			this.getModel("wizardView").setProperty("/PrimaryIndicator", "");

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
					this.getModel("wizardView").setProperty("/PrimaryIndicator", "X");
				} else {
					MessageBox.error(this.getResourceBundle().getText("setPrimaryFileText"));
					oSetPrimary.setSelected(false);
				}

			}
		},

		onPressSubmit: function (oEvent) {
			var oUploadCollection = this.byId("idUploadSupportingDocument");
			var cFiles = oUploadCollection.getItems().length;

			oUploadCollection.upload();
			if (cFiles > 0) {

				for (var i = 0; i < cFiles; i++) {
					this.getModel().createEntry("/Document", {
						properties: {
							BatchID: this._getUUID(),
							"PrimaryIndicator": "",
							"FileContent": this.getModel("wizardView").getProperty("/BinaryFile"),
							"ArchiveDocID": "",
							"FileLength": 10278,
							"FilePath": "/Desktop"

						}
					});
				}
			}

			// this.onPressValidate();
			this.getModel().submitChanges({
				success: function () {
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
				}.bind(this)
			});

			// if (this._oFormValidator.validate(this.byId("idGeneralInfo"))) {
			// 	//TODO:Submit Changes
			// }
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
			var aLineItems = this.byId("idAccountingDataTable").getItems();

			if (oEvent.getParameters().value === true) {
				this.getView().getModel("wizardView").setProperty("/isEnabledCredit", true);
				this.getView().getModel("wizardView").setProperty("/CreditDebit", "H");
				if (aLineItems.length) {
					aLineItems.forEach(function (oLineItem) {
						var sPath = oLineItem.getBindingContextPath();
						this.getView().getModel().setProperty(sPath + "/CreditDebit", "H");
					}.bind(this));
				}
			} else {
				this.getView().getModel("wizardView").setProperty("/isEnabledCredit", false);
				this.getView().getModel("wizardView").setProperty("/CreditDebit", "S");
				if (aLineItems.length) {
					aLineItems.forEach(function (oLineItem) {
						var sPath = oLineItem.getBindingContextPath();
						this.getView().getModel().setProperty(sPath + "/CreditDebit", "S");
					}.bind(this));
				}
			}
		},

		onChange: function (oEvent) {
			var oUploadCollection = oEvent.getSource();
			// Header Token
			var oCustomerHeaderToken = new UploadCollectionItem();

			if (this.getModel("wizardView").getProperty("/isPDFFile")) {
				if (/([a-zA-Z0-9\s_\\.\-\(\):])+(.pdf)$/i.test(oEvent.getParameter("files")[0].name)) {
					this.getModel("wizardView").setProperty("/isPDFFile", false);
					oCustomerHeaderToken.setSelected(true);
					oCustomerHeaderToken.addStatus(this._oStatus);
				}
			}

			if (oUploadCollection.getItems().length) {
				this.getModel("wizardView").setProperty("/isSubmitEnabled", true);
			} else {
				this.getModel("wizardView").setProperty("/isSubmitEnabled", false);
			}

			var reader = new FileReader();
			var file = oEvent.getParameter("files")[0];

			reader.onload = function (e) {
				var data = e.target.result;
				var base64EncodedStr = btoa(unescape(encodeURIComponent(data)));
				// var sBase64 = btoa(data);
				this.getModel("wizardView").setProperty("/BinaryFile", base64EncodedStr);
			}.bind(this);

			reader.readAsBinaryString(file);

			// var cFiles = oUploadCollection.getItems().length;

			// if (cFiles > 0) {
			// 	for (var i = 0; i < cFiles; i++) {

			// 		this.getModel().metadataLoaded().then(function () {
			// 			this.getModel().createEntry("/Document", {
			// 				properties: {
			// 					BatchID: this._getUUID(),
			// 					"PrimaryIndicator": "",
			// 					"FileContent": this.getModel("wizardView").getProperty("/BinaryFile"),
			// 					"ArchiveDocID": "",
			// 					"FileLength": 10278,
			// 					"FilePath": "/Desktop"

			// 				}
			// 			});

			// 			// this._bindView(oEntry.getPath());
			// 		}.bind(this));

			// 	}
			// }

			// // var that = this;
			// var reader = new FileReader();

			// reader.onload = function (e) {
			// 	var raw = e.target.result;
			// };

			// reader.readAsBinaryString(file);

		},

		// handleExcelUpload: function (e) {
		// 	this._import(e.getParameter("files") && e.getParameter("files")[0]);

		// },

		// _import: function (file) {

		// 	if (file && window.FileReader) {

		// 		var reader = new FileReader();

		// 		var result = {},
		// 			data;

		// 		reader.onload = function (e) {
		// 			data = e.target.result;
		// 			var wb = XLSX.read(data, {
		// 				type: 'binary'
		// 			});
		// 			wb.SheetNames.forEach(function (sheetName) {
		// 				var roa = XLSX.utils.sheet_to_row_object_array(wb.Sheets[sheetName]);
		// 				if (roa.length > 0) {
		// 					result[sheetName] = roa;
		// 				}
		// 			});
		// 			return result;
		// 		}
		// reader.readAsBinaryString(file);

		// 	}

		// },

		onBeforeUploadStarts: function (oEvent) {
			var oUploadCollection = oEvent.getSource();
			// Header Token
			var oCustomerHeaderToken = new UploadCollectionParameter({
				name: "x-csrf-token",
				value: "securityTokenFromModel"
			});
			oUploadCollection.addHeaderParameter(oCustomerHeaderToken);

			var reader = new FileReader();
			var file = oEvent.getParameter("files")[0];

			//file.name
			//file.size
			// file.type

			reader.onload = function (e) {
				var data = e.target.result;
				var base64EncodedStr = btoa(unescape(encodeURIComponent(data)));
				// var sBase64 = btoa(data);
				this.getModel("wizardView").setProperty("/BinaryFile", base64EncodedStr);
			}.bind(this);

			reader.readAsBinaryString(file);
		},

		onUploadComplete: function (oEvent) {
			// var sUploadedFileName = oEvent.getParameter("files")[0].fileName;

			// var oUploadCollection = this.byId("UploadCollection");

			// for (var i = 0; i < oUploadCollection.getItems().length; i++) {
			// 	if (oUploadCollection.getItems()[i].getFileName() === sUploadedFileName) {
			// 		oUploadCollection.removeItem(oUploadCollection.getItems()[i]);
			// 		break;
			// 	}
			// }
		},

		// onBeforeUploadStarts: function (oEvent) {
		// 	var oDataModel = this.getOwnerComponent().getModel();
		// 	var sTokenForUpload = oDataModel.getSecurityToken();
		// 	var oFileUploader = this.byId("idUploadSupportingDocument");
		// 	var oHeaderParameter = new sap.m.UploadCollectionParameter({
		// 		name: "X-CSRF-Token",
		// 		value: sTokenForUpload
		// 	});
		// 	//Header parameter need to be removed then added.
		// 	oFileUploader.removeAllHeaderParameters();
		// 	oFileUploader.addHeaderParameter(oHeaderParameter);
		// var sUploadURL = oDataModel.sServiceUrl + "Document";
		// oFileUploader.setUploadUrl(sUploadURL);
		// var sHeaderParameterName = "Test";
		// if (!oEvent.getParameters().getHeaderParameter(sHeaderParameterName) ) {
		// 	var oHeaderParameter = new sap.m.UploadCollectionParameter({
		// 		name: sHeaderParameterName,
		// 		value: oEvent.getParameter("fileName")
		// 	});
		// 	oEvent.getParameters().addHeaderParameter(oHeaderParameter);
		// }
		// // var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
		// 	name: "slug",
		// 	value: oEvent.getParameter("fileName")
		// });
		// oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);

		//  var oModel = this.getView().getModel();

		// oModel.refreshSecurityToken();

		// var oHeaders = oModel.oHeaders;

		// var sToken = oHeaders['x-csrf-token'];

		// var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({

		//  	name: "x-csrf-token",

		//  	value: sToken

		//  });
		// oEvent.getParameters().addHeaderParameter(oCustomerHeaderToken);
		// },

		// onUploadComplete: function (oEvent) {
		// 	// this.getView().getModel().refresh();
		// 	var oUploadCollection = this.byId("idUploadSupportingDocument");
		// 	var oData = oUploadCollection.getModel().getData();

		// 	oData.items.unshift({
		// 		"BatchId": this._getUUID(),
		// 		"PrimaryIndicator": "",
		// 		"ArchiveDocID": "",
		// 		"FileLength": "",
		// 		"FilePath": ""
		// 	});
		// 	this.getView().getModel().refresh();
		// },

		// onChange: function (oEvent) {
		// 	var oUploadCollection = oEvent.getSource();
		// 	// Header Token
		// 	var oCustomerHeaderToken = new UploadCollectionParameter({
		// 		name: "x-csrf-token",
		// 		value: "securityTokenFromModel"
		// 	});
		// 	oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
		// },

		onActivateGeneralInfo: function (oEvent) {
			// sap.m.MessageToast.show("Hi");
			var oWizard = this.byId("idWizard");

			// this.getModel().metadataLoaded(true).then(
			// function(){
			// 	if (this._oFormValidator.validate(this.byId("idGeneralInfo"))) {
			// 	oWizard.validateStep(this.byId("idGeneralInformation"));
			// 	// this.getView().byId("idGeneralInformation").setShowNextButton(true);

			// } else {
			// 	oWizard.invalidateStep(this.byId("idGeneralInformation"));

			// }
			// }.bind(this),
			// function(){})

			if (this._oFormValidator.validate(this.byId("idGeneralInfo"))) {
				oWizard.validateStep(this.byId("idGeneralInformation"));
				// this.getView().byId("idGeneralInformation").setShowNextButton(true);

			} else {
				oWizard.invalidateStep(this.byId("idGeneralInformation"));

			}

		},

		// onComplete: function (oEvent) {
		// 	if (this._oFormValidator.validate(this.byId("idGeneralInfo"))) {
		// 		this.getView().byId("idGeneralInformation").setNextStep("idAccountingData");
		// 		this.getView().byId("idWizard").nextStep();

		// 	} else {
		// 		// this.getView().byId("idWizard").goToStep(this.byId("idGeneralInformation").getBindingContext().getObject());
		// 		this.getView().byId("idWizard").previousStep();
		// 	}

		// },

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