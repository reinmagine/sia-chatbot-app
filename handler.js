/* handler.js

- opens the correct spreadsheet link
- finds the correct worksheet
- locate the columns by exact header name (NOT BY INDEX)
- extract data as needed
- return a response string accordingly

- for >90% confidence, return the answer directly
- if less, reply "Did you mean:" and list top 3 intents as buttons

*/
function showDidYouMean(suggestions) { // run this if confidence is < 0.9
	const items = Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
	if (items.length === 0) {
		return "Sorry, I’m not sure I understood that.";
	}

	return {
		text: "Did you mean:",
		suggestions: items.map((item, index) => ({
			id: item.id || item.intent || String(index),
			label: item.label || item.matchedPhrase || "",
		})),
	};
}

function checkPoStatus(entities) {
	const poNumber = entities.PO_NUMBER;
	return "The status of PO " + poNumber + " is: [status here]";
}

function checkPoGrStatus(entities) {
	const poNumber = entities.PO_NUMBER;
	return "PO " + poNumber + " is fully Gr'd";
}

function checkPoRemainingBalance(entities) {
	const poNumber = entities.PO_NUMBER;
	return "The remaining balance of PO " + poNumber + " is: [balance here]";
}