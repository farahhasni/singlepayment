sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel"
], function(Object, JSONModel) {
	"use strict";
	
	var MessageHelper = Object.extend("ee.com.finance.FI-112.custom.MessageHelper");
	
	/**
	 * Constructor.
	 * @param {sap.ui.core.mvc.View} oView The view object the model is attached to.
	 * @public
	 * 
	 */
	MessageHelper = function(oView) {
		this._setView(oView);
		this.refresh();
	};
	
	/**
	 * Collect the message into message pool.
	 * @public
	 */
	MessageHelper.prototype.collectMessage = function() {
		if (!this._oMessageManager) {
			this._oMessageManager = sap.ui.getCore().getMessageManager();
		}
		
		if (!this._aMessages) {
			this._aMessages = [];
			
		}
		
		var aMessages = this._oMessageManager.getMessageModel().getProperty("/");
	
		for (var i = 0; i < aMessages.length; i++) {
			this._aMessages.push(aMessages[i]);
		}
		
		this._oView.getModel("message").setProperty("/", this._aMessages);
	};
	
	/**
	 * Clear the pool.
	 * @public
	 */
	MessageHelper.prototype.refresh = function() {
		this._oView.setModel(new JSONModel(), "message");
		this._aMessages = [];
	};
	
	/**
	 * Setter method for view object.
	 * @param {sap.ui.core.mvc.View} oView The view object the model is attached to.
	 * @private
	 */
	MessageHelper.prototype._setView = function(oView) {
		this._oView = oView;
	};
	
	return MessageHelper;
	
}, /* bExport= */ true);
