/*global QUnit*/

sap.ui.define([
	"sap/ui/test/opaQunit",
	"./pages/Worklist",
	"./pages/Browser",
	"./pages/Object",
	"./pages/App"
], function (opaTest) {
	"use strict";

	QUnit.module("Object");

	opaTest("Should remember the first item", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyFLPApp({
			intent
			: "Finance-display"
		});

		//Actions
		When.onTheWorklistPage.iRememberTableItemAtPosition(1);

		// Assertions
		Then.onTheWorklistPage.theTitleShouldDisplayTheTotalAmountOfItems();

		// Cleanup
		Then.iLeaveMyFLPApp();
	});

	opaTest("Should start the app with remembered item", function (Given, When, Then) {
		// Arrangements
		Given.iRestartTheAppWithTheRememberedItem({
			intent: "Finance-display",
			delay: 1000
		});

		// Assertions
		Then.onTheObjectPage.iShouldSeeTheRememberedObject().
			and.theObjectViewShouldContainOnlyFormattedUnitNumbers();
	});


	opaTest("Should open the share menu and display the share buttons", function (Given, When, Then) {
		// Actions
		When.onTheObjectPage.iPressOnTheShareButton();

		// Assertions
		Then.onTheObjectPage.iShouldSeeTheShareEmailButton();

		// Cleanup
		Then.iLeaveMyFLPApp();
	});

});
