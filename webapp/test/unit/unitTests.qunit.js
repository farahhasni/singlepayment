/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ee/com/finance/FI-112/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});