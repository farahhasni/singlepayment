sap.ui.define([
	"sap/ui/core/Control",
	"sap/m/UploadCollection"
], function (Control, UploadCollection) {
	"use strict";

	return UploadCollection.extend("ee.com.finance.FI-112.custom.UploadCollection", {
		metadata: {
			events: {
				fileDeleted: {
					parameters: {
						/**
						 * A unique Id of the attached document.
						 * This parameter is deprecated since 1.28.0. Use the <code>item</code> parameter instead.
						 * @deprecated Since 1.28.0. Use the <code>item</code> parameter instead.
						 */
						documentId: {
							type: "string"
						},
						/**
						 * An item to be deleted from the collection.
						 * Since version 1.28.0.
						 * @since 1.28.0
						 */
						item: {
							type: "sap.m.UploadCollectionItem"
						}
					}
				}
			}
		},
		// onPressFileDeleted: function () {
		// 	sap.m.MessageToast.show("File D");
		// },
		renderer: function (oRm, oControl) {
			sap.m.UploadCollectionRenderer.render(oRm, oControl);
		}
	});

	// UploadCollection.prototype._handleDelete = function(){
	// 					sap.m.MessageToast.show("File D");
	// };

	UploadCollection.prototype._onCloseMessageBoxDeleteItem = function(){
			sap.m.MessageToast.show("File D");
	};

});