/* handler.js

- opens the correct spreadsheet link
- finds the correct worksheet
- locate the columns by exact header name (NOT BY INDEX)
- extract data as needed
- return a response string accordingly

- for >90% confidence, return the answer directly
- if less, reply "Did you mean:" and list top 3 intents as buttons

*/


function showDidYouMean(intents) { // run this if confidence is < 0.9

}

function checkPoStatus(entities) {
	const poNumber = entities.PO_NUMBER;
	return "The status of PO " + poNumber + " is: [status here]";
}