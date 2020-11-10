sap.ui.define([
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
	"sap/m/SearchField"
], function (ValueHelpDialog, SearchField) {
	"use strict";

	/**
	 * Constructor for a Custom Search Dialog.
	 *
	 * @param {string} [sId] Id for the new control, generated automatically if no id is given.
	 * @param {object} [mSettings] Initial settings for the new control.
	 *
	 * @class
	 * Extension of the standard <code>sap.ui.comp.valuehelpdialog.ValueHelpDialog</code> in order to provide.
	 * A control that mimic the look and feel of a Value Help Dialog but still act and serve as a regular Dialog control.
	 *
	 * @augments sap.ui.comp.valuehelpdialog.ValueHelpDialog
	 * @version 1.00.0
	 * @public
	 * @alias com.ee.ade.assetdesign.custom.SearchDialog
	 */
	var SearchDialog = ValueHelpDialog.extend("com.ee.ade.assetdesign.custom.MessageHelper", {
		metadata: {
			properties: {

				/**
				 * Flag to determine table is multi mode or single.
				 */
				tableMultiMode: {
					type: "boolean",
					group: "Custom",
					defaultValue: true
				}
			},
			aggregations: {

				/**
				 * Allows you to add a Table control.  This will replace the internally 
				 * handled Table control from ValueHelpDialog control.
				 */
				itemsTable: {
					type: "sap.ui.table.Table",
					multiple: false
				}
			}
		}
	});

	// =============================================================================
	// OVERRIDE SECTION
	// =============================================================================

	/**
	 * Processing before rendering the control.
	 * @public
	 * @override
	 */
	SearchDialog.prototype.onBeforeRendering = function () {
		ValueHelpDialog.prototype.onBeforeRendering.apply(this, arguments);

		if (!this._bIsExternalTableInitialized) {
			this.setTable(this.getItemsTable());

			if (this.getTableMultiMode()) {
				this._oTable.setEnableSelectAll(true);
			} else {
				this._oTable.setSelectionMode("Single");
			}
			
			this._oTokenizerGrid.setVisible(false);
			this._createBasicSearch();
			this._bIsExternalTableInitialized = true;
		}
	};

	// =============================================================================
	// PRIVATE SECTION
	// =============================================================================

	/**
	 * Handle internally the creation of Basic Search for FilterBar control.
	 * @private
	 */
	SearchDialog.prototype._createBasicSearch = function () {
		var oFilterBar = this.getFilterBar();

		if (oFilterBar) {
			oFilterBar.setBasicSearch(new SearchField({
				showSearchButton: false
			}));
		}
	};

	return SearchDialog;
});