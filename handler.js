/* handler.js

- intent-facing data lookup functions
- only the functions directly called by intent routing live here

*/
function checkPoStatus(entities) {
	const startedAt = Date.now();
	const poNumber = String(entities.PO_NUMBER || "").trim();
	if (!poNumber) {
		return "Cannot find PO " + poNumber + " in latest COMMSCHED sheet.";
	}

	const metaLookupStartedAt = Date.now();
	const meta = getCommschedLookupMeta_();
	console.log("[checkPoStatus] metadata lookup: " + (Date.now() - metaLookupStartedAt) + "ms");

	if (!meta) {
		return "Cannot find PO " + poNumber + " in latest COMMSCHED sheet.";
	}

	const workbookStartedAt = Date.now();
	const workbook = openSpreadsheetFromLink_(meta.sourceLink);
	const sheet = workbook.getSheetByName(meta.sheetName);
	console.log("[checkPoStatus] workbook open + sheet resolve: " + (Date.now() - workbookStartedAt) + "ms");

	if (!sheet) {
		return "Cannot find PO " + poNumber + " in latest COMMSCHED sheet.";
	}

	const lastRow = sheet.getLastRow();
	if (lastRow <= meta.headerRow) {
		return "Cannot find PO " + poNumber + " in latest COMMSCHED sheet.";
	}

	const rowLookupStartedAt = Date.now();
	const match = findPoRowInColumn_(sheet, meta.poColumn, meta.dataStartRow, lastRow, poNumber);
	console.log("[checkPoStatus] PO lookup: " + (Date.now() - rowLookupStartedAt) + "ms" + (match ? " via " + match.method : " (not found)"));

	if (!match) {
		console.log("[checkPoStatus] total: " + (Date.now() - startedAt) + "ms");
		return "Cannot find PO " + poNumber + " in latest COMMSCHED sheet.";
	}

	const delivReadStartedAt = Date.now();
	const delivValue = String(sheet.getRange(match.row, meta.delivColumn + 1).getDisplayValue() || "").trim().toUpperCase();
	console.log("[checkPoStatus] delivery read: " + (Date.now() - delivReadStartedAt) + "ms");
	console.log("[checkPoStatus] total: " + (Date.now() - startedAt) + "ms");

	if (delivValue === "YES") {
		return "PO " + poNumber + " is closed.";
	}
	if (delivValue === "NO") {
		return "PO " + poNumber + " is still open.";
	}

	return "No data found for PO " + poNumber + ".";
}

function checkPoGrStatus(entities) {
	const poNumber = entities.PO_NUMBER;
	return "PO " + poNumber + " is fully Gr'd";
}

function checkPoRemainingBalance(entities) {
	const poNumber = entities.PO_NUMBER;
	return "The remaining balance of PO " + poNumber + " is: [balance here]";
}

function checkPoLatestGrDate(entities) {
	const poNumber = entities.PO_NUMBER;
	return "The latest GR date of PO " + poNumber + " is: [date here]";
}
/****************** PO AGING ******************/

function checkPoAging(entities) {
	const poNumber = entities.PO_NUMBER;
	return "PO " + poNumber + " is [age here] days old";
}

function checkPoAgingExceeded(entities) {
	const poNumber = entities.PO_NUMBER;
	return "PO " + poNumber + " has exceeded standard SLA: [yes/no here]";
}

function checkPoAgingExceededList(entities) {
	return "Here are the POs that have exceeded the standard SLA: [list of POs here]";
}