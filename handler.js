/* handler.js

- intent-facing data lookup functions
- only the functions directly called by intent routing live here

*/
function getCommschedNotFoundMessage_(poNumber) {
	return "Cannot find <b>PO " + poNumber + "</b> in latest COMMSCHED sheet.";
}

function getCommschedNoDataMessage_(poNumber) {
	return "No data found for <b>PO " + poNumber + "</b>.";
}

function checkPoStatus(entities) { // done
	const poNumber = String(entities.PO_NUMBER || "").trim();
	if (!poNumber) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const lookup = lookupCommschedPoRow_(poNumber, ["deliveryComplete"]);
	if (!lookup || !lookup.found) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const delivValue = String(lookup.values.deliveryComplete || "").trim().toUpperCase();

	if (delivValue === "YES") {
		return "<b>PO " + poNumber + "</b> is closed.";
	}
	if (delivValue === "NO") {
		return "<b>PO " + poNumber + "</b> is still open.";
	}

	return getCommschedNoDataMessage_(poNumber);
}

function checkPoGrStatus(entities) { // done
	const poNumber = String(entities.PO_NUMBER || "").trim();
	if (!poNumber) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const lookup = lookupCommschedPoRow_(poNumber, ["currency", "goodsReceiptAmount", "grBucket"]);
	if (!lookup || !lookup.found) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const currencyValue = String(lookup.values.currency || "").trim();
	const grAmountValue = String(lookup.values.goodsReceiptAmount || "").trim();
	const grValue = String(lookup.values.grBucket || "").trim().replace(/\s+/g, " ").toUpperCase();

	const bucketReplies = {
		"A. ZERO GR": "<b>PO " + poNumber + "</b> is not yet GR'd.",
		"B. 1-10% GRD": "<b>PO " + poNumber + "</b> has a GR'd value of " + currencyValue + " " + grAmountValue + " (1-10% GR'd).",
		"C. 11-30% GRD": "<b>PO " + poNumber + "</b> has a GR'd value of " + currencyValue + " " + grAmountValue + " (11-30% GR'd).",
		"D. 31-50% GRD": "<b>PO " + poNumber + "</b> has a GR'd value of " + currencyValue + " " + grAmountValue + " (31-50% GR'd).",
		"E. 51-70% GRD": "<b>PO " + poNumber + "</b> has a GR'd value of " + currencyValue + " " + grAmountValue + " (51-70% GR'd).",
		"F. 71-90% GRD": "<b>PO " + poNumber + "</b> has a GR'd value of " + currencyValue + " " + grAmountValue + " (71-90% GR'd).",
		"G. 91-99% GRD": "<b>PO " + poNumber + "</b> has a GR'd value of " + currencyValue + " " + grAmountValue + " (91-99% GR'd).",
		"H. FULLY GRD": "<b>PO " + poNumber + "</b> is fully GR'd.",
	};

	return bucketReplies[grValue] || getCommschedNoDataMessage_(poNumber);
}

function checkPoRemainingBalance(entities) { // done
	const poNumber = String(entities.PO_NUMBER || "").trim();
	if (!poNumber) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const lookup = lookupCommschedPoRow_(poNumber, ["currency", "remainingBalance"]);
	if (!lookup || !lookup.found) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const currencyValue = String(lookup.values.currency || "").trim();
	const remainingBalanceValue = String(lookup.values.remainingBalance || "").trim();

	if (!currencyValue || !remainingBalanceValue) {
		return getCommschedNoDataMessage_(poNumber);
	}

	return "<b>PO " + poNumber + "</b> has a remaining balance of " + currencyValue + " " + remainingBalanceValue + ".";
}

function checkPoLatestGrDate(entities) {
	const poNumber = entities.PO_NUMBER;
	return "The latest GR date of <b>PO " + poNumber + "</b> is: [date here]";
}
/****************** PO AGING ******************/

function checkPoAging(entities) {
	const poNumber = entities.PO_NUMBER;
	return "<b>PO " + poNumber + "</b> is [age here] days old";
}

function checkPoAgingExceeded(entities) {
	const poNumber = entities.PO_NUMBER;
	return "<b>PO " + poNumber + "</b> has exceeded standard SLA: [yes/no here]";
}

function checkPoAgingExceededList(entities) {
	return "Here are the POs that have exceeded the standard SLA: [list of POs here]";
}