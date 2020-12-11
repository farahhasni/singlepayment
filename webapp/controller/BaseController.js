sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/library",
	"sap/m/MessageBox",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"sap/ui/core/message/ControlMessageProcessor",
	"sap/ui/core/message/Message",
	"sap/ui/core/ValueState"
], function (Controller, UIComponent, mobileLibrary, MessageBox, MessagePopover, MessagePopoverItem, ControlMessageProcessor, Message,
	ValueState) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return Controller.extend("ee.com.finance.FI-112.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function () {
			var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Convenience method for getting the message manager.
		 * @public
		 * @returns {sap.ui.core.message.MessageManager} The message manager object.
		 */
		getMessageManager: function () {
			var oMessageManager = sap.ui.getCore().getMessageManager();
			return oMessageManager;
		},

		/**
		 * Convenience method for getting the message processor.
		 * @public
		 * @returns {sap.ui.core.message.ControlMessageProcessor} The message manager object.
		 */
		getMessageProcessor: function () {
			var oMessageProcessor = new ControlMessageProcessor();
			return oMessageProcessor;
		},

		/**
		 * Convenience method for adding messages to message manager.
		 * @param {string} sMessageText Containing the message text.
		 * @param {string} sMessageType Containing the message type.
		 * @param {string} sDescriptionText Containing description of the message.
		 * @private
		 */
		addMessage: function (sMessageText, sMessageType, sDescriptionText) {
			if (!this.oMessageProcessor) {
				this.oMessageProcessor = new ControlMessageProcessor();
				this.getMessageManager().registerMessageProcessor(this.oMessageProcessor);
			}
			this.getMessageManager().addMessages(
				new Message({
					type: sMessageType,
					message: sMessageText,
					description: sDescriptionText,
					processor: this.oMessageProcessor
				}));
		},

		/**
		 * Convenience method for adding messages to message manager.
		 * @param {object} oMessage The message object.
		 * @param {object} oMessage.respondText The respond structure containing the messages.
		 * @param {string} sMessageBoxText The header text for message.
		 * @param {boolean} bIsBatch Indicator of batch request.
		 * @public
		 */
		addMessages: function (oMessage, sMessageBoxText, bIsBatch) {
			var oResponseText,
				aInnerError,
				sInnerError,
				aResponses;

			this.getModel().resetChanges();

			if (bIsBatch) {
				aResponses = oMessage;

				if (bIsBatch) {
					this.getOwnerComponent().preventDefaultErrorHandler();
				}

				if (!Array.isArray(aResponses)) {
					aResponses = [aResponses];
				}

				aResponses.forEach(function (oResponse) {
					oResponseText = JSON.parse(oResponse.response.responseText);
					aInnerError = oResponseText.error.innererror;

					if (!Array.isArray(aInnerError)) {
						aInnerError = [aInnerError];
					}
					sInnerError = (aInnerError.length === 1) ? sInnerError : oResponse.responseText.error.message.value;

					aInnerError.forEach(function (oInnerError) {
						sInnerError = oInnerError.message;
						this.addMessage(sMessageBoxText, ValueState.Error, sInnerError);
					}.bind(this));
				}.bind(this));
			} else {
				oResponseText = JSON.parse(oMessage.responseText);
				aInnerError = oResponseText.error.innererror;

				if (!Array.isArray(aInnerError)) {
					aInnerError = [aInnerError];
				}

				sInnerError = (aInnerError.length === 1) ? sInnerError : oResponseText.error.message.value;

				this.getOwnerComponent().preventDefaultErrorHandler();

				aInnerError.forEach(function (oInnerError) {
					sInnerError = oInnerError.message;
					this.addMessage(sMessageBoxText, ValueState.Error, sInnerError);
				}.bind(this));
			}
		},

		/**
		 * Convenience method for clearing messages in message manager.
		 * @private
		 */
		clearMessages: function () {
			this.getMessageManager().removeAllMessages();
		},

		/**
		 * Event handler for on press of message popover.
		 * @param {object} oEvent Containing the triggering event.
		 * @public
		 */
		onPressMessagePopover: function (oEvent) {
			var oMessagesButton = oEvent.getSource();
			if (!this.oMessagePopover) {
				this.oMessagePopover = new MessagePopover({
					items: {
						path: "messages>/",
						template: new MessagePopoverItem({
							type: "{messages>type}",
							title: "{messages>message}",
							subtitle: "{messages>description}"
						})
					}
				});
				oMessagesButton.addDependent(this.oMessagePopover);
			}
			this.oMessagePopover.toggle(oMessagesButton);
		},

		/**
		 * Adds a history entry in the FLP page history
		 * @public
		 * @param {object} oEntry An entry object to add to the hierachy array as expected from the ShellUIService.setHierarchy method
		 * @param {boolean} bReset If true resets the history before the new entry is added
		 */
		addHistoryEntry: (function () {
			var aHistoryEntries = [];

			return function (oEntry, bReset) {
				if (bReset) {
					aHistoryEntries = [];
				}

				var bInHistory = aHistoryEntries.some(function (oHistoryEntry) {
					return oHistoryEntry.intent === oEntry.intent;
				});

				if (!bInHistory) {
					aHistoryEntries.push(oEntry);
					this.getOwnerComponent().getService("ShellUIService").then(function (oService) {
						oService.setHierarchy(aHistoryEntries);
					});
				}
			};
		})()

	});

});