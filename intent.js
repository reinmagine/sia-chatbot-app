/* intent.js

- defines what the users may ask
- maps the user input to the correct handler function

entities:
- PO_NUMBER: string of 10 digit numbers with no characters or spaces "1234567890"

*/


const INTENTS = [

	/********** COMMSCHED SHEET */
	// queries that are answered by the COMMSCHED SHEET
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
	},
	{
		name: "check_po_gr_status", 
		phrases: [
			"PO X GR status",
			"GR status of PO X",
			"PO X GR bucketing",
			"GR bucketing of PO X",
			"what is the GR bucket of PO X",
			"is PO X fully GR'd",
			"is PO X already fully GRed",
			"check if PO X is fully GRed",
		],
		requiredEntities: ["PO_NUMBER"],
		handler: "checkPoGrStatus"
	},
	{
		name: "check_po_remaining_balance",
		phrases: [
			"PO X remaining balance",
			"remaining balance of PO X",
			"check PO X remaining balance",
			"how much remaining balance is left on PO X",
			"what is the remaining balance of PO X",
			"can you tell me the remaining balance of PO X",
			"are there any remaining balance on PO X",
			"are there any pending transactions for PO X",
		],
		requiredEntities: ["PO_NUMBER"],
		handler: "checkPoRemainingBalance"
	},
	{
		name: "check_po_latest_gr_date",
		phrases: [
			"PO X latest GR date",
			"latest GR date of PO X",
			"last GR date of PO X",
			"last GR for PO X",
			"when was the last GR posted for PO X",
		],
		requiredEntities: ["PO_NUMBER"],
		handler: "checkPoLatestGrDate"
	},
	{
		name: "check_po_total_value",
		phrases: [
			"PO X total value",
			"total value of PO X",
			"check PO X total value",
			"what is the total value of PO X",
			"can you tell me the total value of PO X",
			"what is the total po value vs actual gr value of PO X",
			"compare total po value and actual gr value of PO X",
			"PO X gr value total",
			"check PO X gr total value"
		],
		requiredEntities: ["PO_NUMBER"],
		handler: "checkPoTotalValue"
	},
	{
		name: "check_po_aging",
		phrases: [
			"What is the aging of PO X",
			"What is the age of PO X",
			"How old is PO X",
			"Check the aging of PO X",
			"Aging of PO X",
			"PO X aging",
		],
		requiredEntities: ["PO_NUMBER"],
		handler: "checkPoAging"
	},
	{
		name: "check_po_aging_exceeded",
		phrases: [
			"Has PO X exceeded the standard SLA",
			"Has PO X exceeded SLA",
			"Did PO X exceed the standard SLA",
			"Is PO X beyond the standard SLA",
			"Check if PO X exceeded the standard SLA",
		],
		requiredEntities: ["PO_NUMBER"],
		handler: "checkPoAging"
	},
	{
		name: "check_po_high_risk",
		phrases: [
			"Is PO X high risk",
			"Is PO X a high risk PO",
			"Is PO X legacy",
			"Is PO X a legacy PO",
			"Check if PO X is high risk",
		],
		requiredEntities: ["PO_NUMBER"],
		handler: "checkPoAging"
	},
	{
		name: "list_po_aging",
		intentKeywords: ["po", "purchase order"],
		conflictKeywords: ["project", "projects"],
		phrases: [
			"Which POs are aging X",
			"Which POs are aging beyond 24 months",
			"List all X POs",
			"List all POs X old",
			"List of all POs X old",
			"List all POs <6 months old",
			"List all POs 6-9 months old",
			"List all POs 9-12 months old",
			"List all POs 12-24 months old",
			"List all POs >24 months old",
			"List all high risk POs",
			"List all legacy POs",
			"Which POs are older than X",
			"Show me all POs older than X",
			"Which POs are beyond X",
			"List of all POs at least 1 year old",
		],
		requiredEntities: ["AGE_FILTER"],
		responseType: "list",
		handler: "listPoAging"
	},
	{
		name: "list_project_delayed_closure",
		intentKeywords: ["project", "projects"],
		conflictKeywords: ["po", "purchase order"],
		phrases: [
			"Which projects have delayed PO closure",
			"List all high risk projects",
			"Show me all projects aged >2 years",
			"List all delayed closure projects",
			"Which projects have delayed closure",
			"Show delayed PO closure projects",
			"List projects with POs older than 24 months",
			"Which projects have high risk POs",
			"Show me all high risk projects",
		],
		responseType: "list",
		handler: "listProjectDelayedClosure"
	},
	{
		name: "list_po_urgent_cleanup",
		intentKeywords: ["po", "purchase order"],
		conflictKeywords: ["project", "projects", "vendor", "vendors"],
		phrases: [
			"Which POs require urgent cleanup?",
			"List all POs requiring urgent cleanup",
			"Show me urgent cleanup POs",
			"Which POs need urgent cleanup",
			"List urgent cleanup POs",
			"Show POs for urgent cleanup",
		],
		responseType: "list",
		handler: "listPoUrgentCleanup"
	},
	{
		name: "list_po_vendor",
		phrases: [
			"List all POs from X",
			"Show me all POs from X",
			"List POs from X",
			"give me all POs from X",
			"which POs are from X",
			"all POs under X vendor"
		],
		requiredEntities: ["VENDOR"],
		responseType: "list",
		handler: "listPoVendor"
	},
	{
		name: "check_total_ungrd_vendor",
		phrases: [
			"What is the total unGR'd exposure for X",
			"What is the total unGR'd exposure for X?",
			"What is the total unGR'd exposure for {vendor}",
			"total ungrd exposure for X",
			"total unGR'd for X",
		],
		requiredEntities: ["VENDOR"],
		handler: "checkTotalUnGrdVendor"
	},
	{
		name: "list_total_ungrd_vendor",
		intentKeywords: ["vendor", "vendors"],
		conflictKeywords: ["po", "purchase order"],
		phrases: [
			"What is the total unGR'd exposure per vendor",
			"total unGR'd exposure per vendor",
			"show total unGR'd per vendor",
			"list total unGR'd per vendor"
		],
		responseType: "list",
		handler: "listTotalUnGrdVendor"
	},
	{
		name: "check_total_ungrd_division",
		phrases: [
			"What is the total unGR'd exposure for X",
			"What is the total unGR'd exposure for the X division",
			"total ungrd exposure for X division",
			"total unGR'd for X division",
		],
		requiredEntities: ["DIVISION"],
		handler: "checkTotalUnGrdDivision"
	},
	{
		name: "list_total_ungrd_division",
		intentKeywords: ["division", "divisions"],
		conflictKeywords: ["project", "projects", "po", "purchase order"],
		phrases: [
			"What is the total unGR'd exposure per division",
			"total unGR'd exposure per division",
			"show total unGR'd per division",
			"list total unGR'd per division"
		],
		responseType: "list",
		handler: "listTotalUnGrdDivision"
	},
	{
		name: "list_po_dormant",
		phrases: [
			"Which POs are dormant",
			"Are there POs that have no activity",
			"List all dormant POs",
			"Show me dormant POs",
			"List POs with no activity",
			"Which POs have no GR activity",
			"Show POs with no activity",
		],
		responseType: "list",
		handler: "listPoDormant"
	},
	{
		name: "list_po_vendor_remaining_balance",
		intentKeywords: ["po", "purchase order"],
		conflictKeywords: ["vendor", "vendors"],
		phrases: [
			"List all POs with highest remaining balance",
			"Which PO have the highest unGR'd balance",
			"show me the POs with highest unGRd balance",
			"List top POs with highest unGR'd balance",
			"Which POs have the highest remaining balance",
		],
		responseType: "list",
		handler: "listPoVendorRemainingBalance"
	},
	{
		name: "list_vendor_remaining_balance",
		intentKeywords: ["vendor", "vendors"],
		conflictKeywords: ["po", "purchase order"],
		phrases: [
			"show me top vendors by remaining balance",
			"list top vendors by remaining balance",
			"which vendors have the highest remaining balance",
			"top vendors by remaining balance",
			"list all vendors with the highest balances"
		],
		responseType: "list",
		handler: "listVendorRemainingBalance"
	},

	/********** GR TICKET SHEET */
	// queries that are answered by the GR TICKET SHEET

	{
		name: "check_gr_ticket_status",
		phrases: [
			"GR ticket for GR X",
			"GR ticket status for GR X",
			"what is the current status of the GR ticket X",
		],
		requiredEntities: ["GR_NUMBER"],
		handler: "checkGrTicketStatus"
	},

];