/* intent.js

- defines what the users may ask
- maps the user input to the correct handler function

entities:
- PO_NUMBER: string of 10 digit numbers with no characters or spaces "1234567890"

*/

const INTENTS = [
	{
	name: "check_po_status",
	phrases: [
		"PO X status",
		"status of PO X",
		"check PO X status",
		"check the status of PO X",
		"what is the status of PO X",
		"can you tell me the status of PO X",
		"what's the current status of PO X",
		"I want to know the status of PO X",
		"give me the status of PO X",
		"what's the update on PO X",
		"can you provide the status of PO X",
		"check if PO X is already closed",
		"is PO X already closed",
		"check if PO X is still open",
		"is PO X still open",
		"is the status of PO X open or closed",
	],
	requiredEntities: ["PO_NUMBER"],
	handler: "checkPoStatus"
	}
];