/*global QUnit*/

sap.ui.define([
	"sap/ui/test/opaQunit",
	"sap/ui/Device",
	"./pages/Worklist",
	"./pages/Browser",
	"./pages/Object",
	"./pages/App"
], function (opaTest, Device) {
	"use strict";

	var iDelay = (Device.browser.msie || Device.browser.edge) ? 1500 : 1000;

	QUnit.module("Navigation");

	opaTest("Should see the objects list", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyFLPApp({
			intent: "Finance-display"
		});

		// Assertions
		Then.onTheWorklistPage.iShouldSeeTheTable();
	});

	opaTest("Should react on hash change", function (Given, When, Then) {
		// Actions
		When.onTheWorklistPage.iRememberTableItemAtPosition(2);
		When.onTheBrowser.iChangeTheHashToTheRememberedItem();

		// Assertions
		Then.onTheObjectPage.iShouldSeeTheRememberedObject();
	});

	opaTest("Should go back to the TablePage", function (Given, When, Then) {
		// Actions
		When.onTheBrowser.iGoBack();

		// Assertions
		Then.onTheWorklistPage.iShouldSeeTheTable();
	});

	opaTest("Object Page shows the correct object Details", function (Given, When, Then) {
		// Actions
		When.onTheWorklistPage.iRememberTableItemAtPosition(1).
			and.iPressTableItemAtPosition(1);

		// Assertions
		Then.onTheObjectPage.iShouldSeeTheRememberedObject();
	});

	opaTest("Should be on the table page again when browser back is pressed", function (Given, When, Then) {
		// Actions
		When.onTheBrowser.iGoBack();

		// Assertions
		Then.onTheWorklistPage.iShouldSeeTheTable();
	});

	opaTest("Should be on the object page again when browser forwards is pressed", function (Given, When, Then) {
		// Actions
		When.onTheBrowser.iGoForward();

		// Assertions
		Then.onTheObjectPage.iShouldSeeTheRememberedObject();

		// Cleanup
		Then.iLeaveMyFLPApp();
	});

	opaTest("Start the App and simulate metadata error: MessageBox should be shown", function (Given, When, Then) {
		//Arrangement
		Given.iStartMyFLPApp({
			intent: "Finance-display",
			delay: iDelay,
			metadataError: true
		});

		//Assertions
		Then.onTheAppPage.iShouldSeeTheMessageBox();

		// Actions
		When.onTheAppPage.iCloseTheMessageBox();

		// Cleanup
		Then.iLeaveMyFLPApp();
	});

	opaTest("Start the App and simulate bad request error: MessageBox should be shown", function (Given, When, Then) {
		//Arrangement
		Given.iStartMyFLPApp({
			intent: "Finance-display",
			delay: iDelay,
			errorType: "serverError"
		});

		//Assertions
		Then.onTheAppPage.iShouldSeeTheMessageBox();

		// Actions
		When.onTheAppPage.iCloseTheMessageBox();

		// Cleanup
		Then.iLeaveMyFLPApp();
	});

});
