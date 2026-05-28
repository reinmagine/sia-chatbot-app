/* handler.js

- intent-facing data lookup functions
- only the functions directly called by intent routing live here
- ex: checkPoStatus, checkPoGrStatus, checkPoRemainingBalance, checkPoLatestGrDate, checkPoTotalValue, checkPoAging, listPoAging, listPoDormant

*/
function checkPoStatus(entities, parsed, context) { // done
	const poNumber = String(entities.PO_NUMBER || "").trim();
	if (!poNumber) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const lookup = lookupCommschedPoRow_(poNumber, ["deliveryComplete"], context);
	if (lookup && lookup.accessDenied) {
		return lookup.message || getCommschedDivisionDeniedMessage_(poNumber);
	}
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

function checkPoGrStatus(entities, parsed, context) { // done
	const poNumber = String(entities.PO_NUMBER || "").trim();
	if (!poNumber) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const lookup = lookupCommschedPoRow_(poNumber, ["currency", "goodsReceiptAmount", "grBucket"], context);
	if (lookup && lookup.accessDenied) {
		return lookup.message || getCommschedDivisionDeniedMessage_(poNumber);
	}
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

function checkPoRemainingBalance(entities, parsed, context) { // done
	const poNumber = String(entities.PO_NUMBER || "").trim();
	if (!poNumber) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const lookup = lookupCommschedPoRow_(poNumber, ["currency", "remainingBalance"], context);
	if (lookup && lookup.accessDenied) {
		return lookup.message || getCommschedDivisionDeniedMessage_(poNumber);
	}
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

function checkPoTotalValue(entities, parsed, context) { // done
	const poNumber = String(entities.PO_NUMBER || "").trim();
	if (!poNumber) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const lookup = lookupCommschedPoRow_(poNumber, ["currency", "poAmount", "goodsReceiptAmount"], context);
	if (lookup && lookup.accessDenied) {
		return lookup.message || getCommschedDivisionDeniedMessage_(poNumber);
	}
	if (!lookup || !lookup.found) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const currencyValue = String(lookup.values.currency || "").trim();
	const poAmountValue = String(lookup.values.poAmount || "").trim();
	const grAmountValue = String(lookup.values.goodsReceiptAmount || "").trim();

	if (!currencyValue || !poAmountValue || !grAmountValue) {
		return getCommschedNoDataMessage_(poNumber);
	}

	return "<b>PO " + poNumber + "</b> has a total value of " + currencyValue + " " + poAmountValue + " and GR value of " + currencyValue + " " + grAmountValue + ".";
}

function checkPoLatestGrDate(entities, parsed, context) {
	const poNumber = String(entities.PO_NUMBER || "").trim();
	if (!poNumber) {
		return "Cannot find PO X. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.";
	}

	const lookup = lookupCommschedPoRow_(poNumber, ["latestGrDate"], context);
	if (lookup && lookup.accessDenied) {
		return lookup.message || getCommschedDivisionDeniedMessage_(poNumber);
	}
	if (!lookup || !lookup.found) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const latestGrDateRaw = lookup.values ? lookup.values.latestGrDate : "";
	const latestGrDateValue = String(latestGrDateRaw || "").trim();
	if (!latestGrDateValue) {
		return "<b>PO " + poNumber + "</b> is not yet GR'd.";
	}

	const parsedDate = parseDateValue_(latestGrDateRaw);
	const formattedDate = parsedDate
		? Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), "MMM d, yyyy")
		: latestGrDateValue;

	return "The last GR for <b>PO " + poNumber + "</b> was posted on " + formattedDate + ".";
}

function checkPoAging(entities, parsed, context) {
	const poNumber = String(entities.PO_NUMBER || "").trim();
	if (!poNumber) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const lookup = lookupCommschedPoRow_(poNumber, ["poSla"], context);
	if (lookup && lookup.accessDenied) {
		return lookup.message || getCommschedDivisionDeniedMessage_(poNumber);
	}
	if (!lookup || !lookup.found) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const poSlaValue = lookup.values ? lookup.values.poSla : "";
	if (!poSlaValue) {
		return getCommschedNoDataMessage_(poNumber);
	}

	const bucketInfo = getPoSlaBucketInfo_(poSlaValue);
	if (!bucketInfo) {
		return getCommschedNoDataMessage_(poNumber);
	}

	const intentName = parsed && parsed.intent ? String(parsed.intent).trim() : "check_po_aging";
	return buildPoAgingReply_(poNumber, bucketInfo, intentName);
}

function listPoAging(entities, parsed, context) {
	const rawAgeFilter = String(entities.AGE_FILTER || "").trim();
	const allowedBuckets = resolvePoSlaBucketCellsForFilter_(rawAgeFilter);
	if (!allowedBuckets || allowedBuckets.length === 0) {
		const prompt = getMissingEntityMessage("AGE_FILTER");
		const response = (typeof prompt === "object" && prompt) ? Object.assign({}, prompt) : { text: String(prompt || "") };
		response.pendingIntent = {
			intent: parsed && parsed.intent ? parsed.intent : "list_po_aging",
			missingEntity: "AGE_FILTER",
			phrase: "List all POs X old",
		};
		return response;
	}

	const dataset = getCommschedRows_( ["poNumber", "poSla"], context);
	if (!dataset || !dataset.rows) {
		return "Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.";
	}

	const matches = [];
	for (let i = 0; i < dataset.rows.length; i += 1) {
		const row = dataset.rows[i] || {};
		const poNumber = String(row.values && row.values.poNumber ? row.values.poNumber : "").trim();
		const poSlaValue = String(row.values && row.values.poSla ? row.values.poSla : "").trim();
		const bucketInfo = getPoSlaBucketInfo_(poSlaValue);
		if (!poNumber || !bucketInfo) {
			continue;
		}

		if (allowedBuckets.indexOf(bucketInfo.cellValue) === -1) {
			continue;
		}

		matches.push({
			poNumber: poNumber,
			poSla: bucketInfo.cellValue,
			rank: bucketInfo.rank,
		});
	}

	if (matches.length === 0) {
		return "No matching POs found.";
	}

	matches.sort(function(a, b) {
		if (a.rank !== b.rank) {
			return a.rank - b.rank;
		}

		return String(a.poNumber || "").localeCompare(String(b.poNumber || ""));
	});

	const headers = ["PO Number", "PO SLA"];
	const csvRows = matches.map(function(match) {
		return [match.poNumber, match.poSla];
	});
	const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
	return buildTableResponse_(headers, csvRows, {
		includeCsvDownload: true,
		csvFilename: "sia-response-" + timestamp + ".csv",
	});
}

function listProjectDelayedClosure(entities, parsed, context) {
	const dataset = getCommschedRows_(["project", "poNumber", "poSla", "latestGrDate"], context);
	if (!dataset || !dataset.rows) {
		return "Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.";
	}

	const selectedByProject = {};

	for (let i = 0; i < dataset.rows.length; i += 1) {
		const row = dataset.rows[i] || {};
		const projectName = String(row.values && row.values.project ? row.values.project : "").trim();
		const poNumber = String(row.values && row.values.poNumber ? row.values.poNumber : "").trim();
		const poSlaValue = String(row.values && row.values.poSla ? row.values.poSla : "").trim();
		if (!projectName || !poNumber || !poSlaValue) {
			continue;
		}

		const bucketInfo = getPoSlaBucketInfo_(poSlaValue);
		if (!bucketInfo || bucketInfo.cellValue !== "e. >24 months") {
			continue;
		}

		const latestGrDateRaw = row.rawValues && Object.prototype.hasOwnProperty.call(row.rawValues, "latestGrDate")
			? row.rawValues.latestGrDate
			: "";
		const parsedLatestGrDate = parseDateValue_(latestGrDateRaw);
		const existing = selectedByProject[projectName];
		if (!existing) {
			selectedByProject[projectName] = {
				project: projectName,
				poNumber: poNumber,
				latestGrDate: parsedLatestGrDate,
				latestGrDateValue: String(row.values && row.values.latestGrDate ? row.values.latestGrDate : "").trim(),
				rowNumber: row.rowNumber || 0,
			};
			continue;
		}

		const existingHasDate = existing.latestGrDate instanceof Date && !isNaN(existing.latestGrDate.getTime());
		const candidateHasDate = parsedLatestGrDate instanceof Date && !isNaN(parsedLatestGrDate.getTime());

		let shouldReplace = false;
		if (!existingHasDate && candidateHasDate) {
			shouldReplace = true;
		} else if (existingHasDate && candidateHasDate) {
			const existingTime = existing.latestGrDate.getTime();
			const candidateTime = parsedLatestGrDate.getTime();
			if (candidateTime < existingTime) {
				shouldReplace = true;
			} else if (candidateTime === existingTime) {
				const existingPo = String(existing.poNumber || "").trim();
				shouldReplace = String(poNumber).localeCompare(existingPo) < 0;
			}
		} else if (!existingHasDate && !candidateHasDate) {
			const existingRowNumber = Number(existing.rowNumber || 0);
			const candidateRowNumber = Number(row.rowNumber || 0);
			if (candidateRowNumber < existingRowNumber) {
				shouldReplace = true;
			}
		}

		if (shouldReplace) {
			selectedByProject[projectName] = {
				project: projectName,
				poNumber: poNumber,
				latestGrDate: parsedLatestGrDate,
				latestGrDateValue: String(row.values && row.values.latestGrDate ? row.values.latestGrDate : "").trim(),
				rowNumber: row.rowNumber || 0,
			};
		}
	}

	const matches = Object.keys(selectedByProject).map(function(projectName) {
		const item = selectedByProject[projectName];
		return {
			project: item.project,
			poNumber: item.poNumber,
			latestGrDate: item.latestGrDate instanceof Date && !isNaN(item.latestGrDate.getTime())
				? item.latestGrDate
				: null,
			latestGrDateValue: item.latestGrDateValue || "",
			rowNumber: item.rowNumber || 0,
		};
	});

	if (matches.length === 0) {
		return "No delayed closure projects found.";
	}

	matches.sort(function(a, b) {
		const aHasDate = a.latestGrDate instanceof Date && !isNaN(a.latestGrDate.getTime());
		const bHasDate = b.latestGrDate instanceof Date && !isNaN(b.latestGrDate.getTime());
		if (aHasDate && bHasDate) {
			const diff = a.latestGrDate.getTime() - b.latestGrDate.getTime();
			if (diff !== 0) {
				return diff;
			}
		}
		if (aHasDate !== bHasDate) {
			return aHasDate ? -1 : 1;
		}
		const projectCompare = String(a.project || "").localeCompare(String(b.project || ""));
		if (projectCompare !== 0) {
			return projectCompare;
		}
		return String(a.poNumber || "").localeCompare(String(b.poNumber || ""));
	});

	function formatLatestGrDate(value, fallback) {
		if (value instanceof Date && !isNaN(value.getTime())) {
			return Utilities.formatDate(value, Session.getScriptTimeZone(), "MMM d, yyyy");
		}
		return String(fallback || "").trim();
	}

	const headers = ["Project", "PO Number", "Latest GR Date"];
	const csvRows = matches.map(function(match) {
		return [
			match.project,
			match.poNumber,
			formatLatestGrDate(match.latestGrDate, match.latestGrDateValue),
		];
	});
	const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
	return buildTableResponse_(headers, csvRows, {
		includeCsvDownload: true,
		csvFilename: "sia-project-delayed-closure-" + timestamp + ".csv",
	});
}

function listPoUrgentCleanup(entities, parsed, context) {
	const dataset = getCommschedRows_(["vendor", "poNumber", "poSla", "deliveryComplete"], context);
	if (!dataset || !dataset.rows) {
		return "Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.";
	}

	const matches = [];
	for (let i = 0; i < dataset.rows.length; i += 1) {
		const row = dataset.rows[i] || {};
		const vendorName = String(row.values && row.values.vendor ? row.values.vendor : "").trim();
		const poNumber = String(row.values && row.values.poNumber ? row.values.poNumber : "").trim();
		const poSlaValue = String(row.values && row.values.poSla ? row.values.poSla : "").trim();
		const deliveryCompleteValue = String(row.values && row.values.deliveryComplete ? row.values.deliveryComplete : "").trim().toUpperCase();

		if (!vendorName || !poNumber || !poSlaValue) {
			continue;
		}

		const bucketInfo = getPoSlaBucketInfo_(poSlaValue);
		if (!bucketInfo || bucketInfo.cellValue !== "e. >24 months") {
			continue;
		}

		if (deliveryCompleteValue !== "NO") {
			continue;
		}

		matches.push({
			vendor: vendorName,
			poNumber: poNumber,
		});
	}

	if (matches.length === 0) {
		return "No urgent cleanup POs found.";
	}

	matches.sort(function(a, b) {
		const vendorCompare = String(a.vendor || "").localeCompare(String(b.vendor || ""));
		if (vendorCompare !== 0) {
			return vendorCompare;
		}

		return String(a.poNumber || "").localeCompare(String(b.poNumber || ""));
	});

	const headers = ["Vendor", "PO Number"];
	const csvRows = matches.map(function(match) {
		return [match.vendor, match.poNumber];
	});
	const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
	const tableText = buildTableResponse_(headers, csvRows, {
		includeCsvDownload: false,
	});

	return {
		text: tableText,
		download: {
			filename: "sia-urgent-cleanup-po-response-" + timestamp + ".csv",
			content: buildCsvContent_(headers, csvRows),
			mimeType: "text/csv",
		},
	};
}

function listPoVendor(entities, parsed, context) {
	const rawVendor = String(entities.VENDOR || "").trim();
	if (!rawVendor) {
		return getMissingEntityMessage("VENDOR");
	}

	const dataset = getCommschedRows_(["poNumber", "vendor"], context);
	if (!dataset || !dataset.rows) {
		return "Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.";
	}

	// Collect unique vendor names
	const vendorSet = {};
	for (let i = 0; i < dataset.rows.length; i += 1) {
		const row = dataset.rows[i] || {};
		const vendorName = String(row.values && row.values.vendor ? row.values.vendor : "").trim();
		if (vendorName) vendorSet[vendorName] = true;
	}

	const vendorList = Object.keys(vendorSet);
	const queryNorm = normalizeText(rawVendor || "");

	// score vendor candidates using shared helper
	const scoredItems = buildTopTextMatches_(queryNorm, vendorList, 3);
	const scored = scoredItems.map(function(it) { return { vendor: it.value, score: it.score }; });

	const top = scored.slice(0, 3);
	if (top.length === 0) return "No matching vendors found.";

	// If best candidate is a high-confidence match, list its POs directly
	if (top[0].score >= 0.9) {
		const chosen = top[0].vendor;
		const matches = [];
		for (let i = 0; i < dataset.rows.length; i += 1) {
			const row = dataset.rows[i] || {};
			const poNumber = String(row.values && row.values.poNumber ? row.values.poNumber : "").trim();
			const vendorName = String(row.values && row.values.vendor ? row.values.vendor : "").trim();
			if (!poNumber) continue;
			if (vendorName === chosen) {
				matches.push({poNumber: poNumber, vendor: vendorName});
			}
		}

		if (matches.length === 0) return "No matching POs found.";

		const headers = ["PO Number", "Vendor"];
		const csvRows = matches.map(function(m) { return [m.poNumber, m.vendor]; });
		const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
		return buildTableResponse_(headers, csvRows, {
			includeCsvDownload: true,
			csvFilename: "sia-response-" + timestamp + ".csv",
		});
	}

	// Otherwise present top candidates using full-query suggestion labels
	const suggestions = top.map(function(t) { return { id: t.vendor, label: buildFullQueryLabel('list_po_vendor', t.vendor) }; });
	return showDidYouMean(suggestions);
}

function listPoDormant(entities, parsed, context) {
	const dataset = getCommschedRows_(["vendor", "poNumber", "goodsReceiptAmount"], context);
	if (!dataset || !dataset.rows) {
		return "Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.";
	}

	const matches = [];
	for (let i = 0; i < dataset.rows.length; i += 1) {
		const row = dataset.rows[i] || {};
		const vendorName = String(row.values && row.values.vendor ? row.values.vendor : "").trim();
		const poNumber = String(row.values && row.values.poNumber ? row.values.poNumber : "").trim();
		const goodsReceiptValue = String(row.values && row.values.goodsReceiptAmount ? row.values.goodsReceiptAmount : "").trim();

		if (!vendorName || !poNumber) {
			continue;
		}

		if (!goodsReceiptValue) {
			matches.push({ vendor: vendorName, poNumber: poNumber });
			continue;
		}

		const parsedAmount = parseDisplayAmount_(goodsReceiptValue);
		if (!isNaN(parsedAmount) && parsedAmount === 0) {
			matches.push({ vendor: vendorName, poNumber: poNumber });
		}
	}

	if (matches.length === 0) {
		return "No dormant POs found.";
	}

	matches.sort(function(a, b) {
		const vendorCompare = String(a.vendor || "").localeCompare(String(b.vendor || ""));
		if (vendorCompare !== 0) {
			return vendorCompare;
		}

		return String(a.poNumber || "").localeCompare(String(b.poNumber || ""));
	});

	const headers = ["Vendor", "PO Number"];
	const csvRows = matches.map(function(match) {
		return [match.vendor, match.poNumber];
	});
	const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
	return buildTableResponse_(headers, csvRows, {
		includeCsvDownload: true,
		csvFilename: "sia-dormant-po-response-" + timestamp + ".csv",
	});
}

function listPoVendorRemainingBalance(entities, parsed, context) {
	const dataset = getCommschedRows_( ["poNumber", "vendor", "ungrdUsd"], context);
	if (!dataset || !dataset.rows) {
		return "Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.";
	}

	const rows = [];
	for (let i = 0; i < dataset.rows.length; i += 1) {
		const row = dataset.rows[i] || {};
		const poNumber = String(row.values && row.values.poNumber ? row.values.poNumber : "").trim();
		const vendorName = String(row.values && row.values.vendor ? row.values.vendor : "").trim();
		const balanceRaw = String(row.values && row.values.ungrdUsd ? row.values.ungrdUsd : "").trim();
		if (!poNumber || !balanceRaw) continue;
		const numeric = parseDisplayAmount_(balanceRaw);
		if (isNaN(numeric)) continue;
		rows.push({ poNumber: poNumber, vendor: vendorName, balance: numeric });
	}

	if (rows.length === 0) return "No matching POs found.";

	rows.sort(function(a,b){ return b.balance - a.balance; });
	const top10 = rows.slice(0, 10);

	const lines = [
		"| PO Number | Vendor | Remaining Balance |",
		"| --- | --- | ---: |",
	];
	for (let i = 0; i < top10.length; i += 1) {
		const r = top10[i];
		lines.push("| " + r.poNumber + " | " + r.vendor + " | USD " + formatMoney_(r.balance) + " |");
	}

	return lines.join("\n");
}

function listVendorRemainingBalance(entities, parsed, context) {
	const dataset = getCommschedRows_( ["vendor", "ungrdUsd"], context);
	if (!dataset || !dataset.rows) {
		return "Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.";
	}

	const vendorTotals = {};
	for (let i = 0; i < dataset.rows.length; i += 1) {
		const row = dataset.rows[i] || {};
		const vendorName = String(row.values && row.values.vendor ? row.values.vendor : "").trim();
		const balanceRaw = String(row.values && row.values.ungrdUsd ? row.values.ungrdUsd : "").trim();
		if (!vendorName || !balanceRaw) {
			continue;
		}

		const numeric = parseDisplayAmount_(balanceRaw);
		if (isNaN(numeric)) {
			continue;
		}

		vendorTotals[vendorName] = (vendorTotals[vendorName] || 0) + numeric;
	}

	const totals = Object.keys(vendorTotals).map(function(vendor) {
		return { vendor: vendor, balance: vendorTotals[vendor] };
	});

	if (totals.length === 0) {
		return "No matching vendors found.";
	}

	totals.sort(function(a, b) {
		return b.balance - a.balance;
	});

	const top10 = totals.slice(0, 10);
	const lines = [
		"| Vendor | Remaining Balance |",
		"| --- | ---: |",
	];

	for (let i = 0; i < top10.length; i += 1) {
		const item = top10[i];
		lines.push("| " + item.vendor + " | USD " + formatMoney_(item.balance) + " |");
	}

	return lines.join("\n");
}

// --- New aggregation / lookup handlers requested by user ---
function checkTotalPoAmountVendor(entities, parsed, context) {
	const rawVendor = String(entities.VENDOR || '').trim();
	if (!rawVendor) return getMissingEntityMessage('VENDOR');

	const dataset = getCommschedRows_(['vendor','currency','poAmount','poAmountUsdK'], context);
	if (!dataset || !dataset.rows) return 'Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.';

	// Collect unique vendor names
	const vendorSet = {};
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const vendorName = String(row.values && row.values.vendor ? row.values.vendor : '').trim();
		if (vendorName) vendorSet[vendorName] = true;
	}
	const vendorList = Object.keys(vendorSet);
	const queryNorm = normalizeText(rawVendor || '');
	const scoredItems = buildTopTextMatches_(queryNorm, vendorList, 3);
	const scored = scoredItems.map(function(it){ return { vendor: it.value, score: it.score }; });
	if (scored.length === 0) return 'No matching vendors found.';

	const top = scored.slice(0,3);
	if (top[0].score < 0.9) {
		const suggestions = top.map(function(t){ return { id: t.vendor, label: buildFullQueryLabel('check_total_po_amount_vendor', t.vendor), entityType: 'vendor' }; });
		return showDidYouMean(suggestions);
	}

	const chosen = top[0].vendor;
	const totalsByCurrency = {};
	let totalRows = 0;
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const vendorName = String(row.values && row.values.vendor ? row.values.vendor : '').trim();
		if (!vendorName || vendorName !== chosen) continue;
		const currency = String(row.values && row.values.currency ? row.values.currency : '').trim() || '';
		const rawAmt = row.values && row.values.poAmountUsdK !== undefined ? row.values.poAmountUsdK : (row.values && row.values.poAmount !== undefined ? row.values.poAmount : '');
		const num = parseDisplayAmount_(rawAmt);
		if (isNaN(num)) continue;
		totalsByCurrency[currency] = totalsByCurrency[currency] || { total: 0, rows: 0 };
		totalsByCurrency[currency].total += num;
		totalsByCurrency[currency].rows += 1;
		totalRows += 1;
	}

	if (totalRows === 0) return 'No matching POs found.';

	const parts = Object.keys(totalsByCurrency).map(function(curr){
		const info = totalsByCurrency[curr];
		return (curr ? curr + ' ' : '') + formatMoney_(info.total);
	});
	const formattedTotals = parts.join(', ');
	return 'Vendor <b>' + chosen + '</b> has a total PO amount of ' + formattedTotals + '.';
}

function checkDownpaymentVendorOrPo(entities, parsed, context) {
	const rawVendor = String(entities.VENDOR || '').trim();
	const poNumber = String(entities.PO_NUMBER || '').trim();

	// If PO number provided, prefer direct lookup
	if (poNumber) {
		const lookup = lookupCommschedPoRow_(poNumber, ['downpaymentDp','currency'], context);
		if (lookup && lookup.accessDenied) return lookup.message || getCommschedDivisionDeniedMessage_(poNumber);
		if (!lookup || !lookup.found) return getCommschedNotFoundMessage_(poNumber);
		const rawDp = lookup.values ? (lookup.values.downpaymentDp || '') : '';
		if (!rawDp) return getGrTicketNoDataMessage_(poNumber);
		const num = parseDisplayAmount_(rawDp);
		const currency = String(lookup.values && lookup.values.currency ? lookup.values.currency : '').trim() || 'USD';
		if (isNaN(num)) return 'No downpayment data available for PO ' + poNumber + '.';
		return 'Downpayment release for <b>PO ' + poNumber + '</b>: ' + (currency ? currency + ' ' : '') + formatMoney_(num) + ' (Downpayment (DP) in USD as of May 23 [BQ]).';
	}

	if (!rawVendor) return getMissingEntityMessage('VENDOR');

	const dataset = getCommschedRows_(['vendor','currency','downpaymentDp'], context);
	if (!dataset || !dataset.rows) return 'Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.';

	const vendorSet = {};
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const vendorName = String(row.values && row.values.vendor ? row.values.vendor : '').trim();
		if (vendorName) vendorSet[vendorName] = true;
	}
	const vendorList = Object.keys(vendorSet);
	const queryNorm = normalizeText(rawVendor || '');
	const scoredItems = buildTopTextMatches_(queryNorm, vendorList, 3);
	const scored = scoredItems.map(function(it){ return { vendor: it.value, score: it.score }; });
	if (scored.length === 0) return 'No matching vendors found.';

	const top = scored.slice(0,3);
	if (top[0].score < 0.9) {
		const suggestions = top.map(function(t){ return { id: t.vendor, label: buildFullQueryLabel('check_downpayment_vendor_or_po', t.vendor), entityType: 'vendor' }; });
		return showDidYouMean(suggestions);
	}

	const chosen = top[0].vendor;
	const totalsByCurrency = {};
	let totalRows = 0;
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const vendorName = String(row.values && row.values.vendor ? row.values.vendor : '').trim();
		if (!vendorName || vendorName !== chosen) continue;
		const currency = String(row.values && row.values.currency ? row.values.currency : '').trim() || 'USD';
		const rawAmt = row.values && row.values.downpaymentDp !== undefined ? row.values.downpaymentDp : '';
		const num = parseDisplayAmount_(rawAmt);
		if (isNaN(num)) continue;
		totalsByCurrency[currency] = totalsByCurrency[currency] || { total: 0, rows: 0 };
		totalsByCurrency[currency].total += num;
		totalsByCurrency[currency].rows += 1;
		totalRows += 1;
	}

	if (totalRows === 0) return 'No downpayment records found for vendor.';
	const parts = Object.keys(totalsByCurrency).map(function(curr){
		const info = totalsByCurrency[curr];
		return (curr ? curr + ' ' : '') + formatMoney_(info.total);
	});
	const formattedTotals = parts.join(', ');
	return 'Downpayment release for <b>' + chosen + '</b>: ' + formattedTotals + ' (Downpayment (DP) in USD as of May 23 [BQ]).';
}

function listPoValueByDivision(entities, parsed, context) {
	const rawDivision = String(entities.DIVISION || '').trim();
	const dataset = getCommschedRows_(['division','currency','poAmount','poAmountUsdK'], context);
	if (!dataset || !dataset.rows) return 'Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.';

	const groupMap = {};
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const divisionRaw = String(row.values && row.values.division ? row.values.division : '').trim();
		if (!divisionRaw) continue;
		const resolved = resolveCanonicalDivision_(divisionRaw);
		if (!resolved.matched) continue;
		if (rawDivision) {
			const want = resolveCanonicalDivision_(rawDivision || '');
			if (!want.matched || want.canonicalDivision !== resolved.canonicalDivision) continue;
		}
		const division = resolved.canonicalDivision;
		const currency = String(row.values && row.values.currency ? row.values.currency : '').trim() || '';
		const rawAmt = row.values && row.values.poAmountUsdK !== undefined ? row.values.poAmountUsdK : (row.values && row.values.poAmount !== undefined ? row.values.poAmount : '');
		const num = parseDisplayAmount_(rawAmt);
		if (isNaN(num)) continue;
		const key = division + '||' + currency;
		groupMap[key] = groupMap[key] || { division: division, currency: currency, total: 0, rows: 0 };
		groupMap[key].total += num;
		groupMap[key].rows += 1;
	}

	const entries = Object.keys(groupMap).map(function(k){ return groupMap[k]; });
	if (entries.length === 0) return 'No matching divisions found.';
	entries.sort(function(a,b){ return b.total - a.total; });
	const rows = entries.map(function(v){ return [v.division, (v.currency ? v.currency + ' ' : '') + formatMoney_(v.total), formatCount_(v.rows)]; });
	const headers = ['Division','Total PO Amount','PO Count'];
	const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
	return buildTableResponse_(headers, rows, { includeCsvDownload: true, csvFilename: 'sia-po-value-by-division-' + timestamp + '.csv' });
}

function listPosByProject(entities, parsed, context) {
	const rawProject = String(entities.PROJECT || '').trim();
	if (!rawProject) return getMissingEntityMessage('PROJECT');
	const dataset = getCommschedRows_(['project','poNumber','vendor','poAmount','poAmountUsdK'], context);
	if (!dataset || !dataset.rows) return 'Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.';

	// Collect unique project names
	const projectSet = {};
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const projectName = String(row.values && row.values.project ? row.values.project : '').trim();
		if (projectName) projectSet[projectName] = true;
	}
	const projectList = Object.keys(projectSet);
	const queryNorm = normalizeText(rawProject || '');
	const scoredItems = buildTopTextMatches_(queryNorm, projectList, 3);
	const scored = scoredItems.map(function(it){ return { project: it.value, score: it.score }; });
	if (scored.length === 0) return 'No matching projects found.';
	if (scored[0].score < 0.9) {
		const suggestions = scored.slice(0,3).map(function(t){ return { id: t.project, label: buildFullQueryLabel('list_pos_by_project', t.project), entityType: 'project' }; });
		return showDidYouMean(suggestions);
	}

	const chosen = scored[0].project;
	const matches = [];
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const projectName = String(row.values && row.values.project ? row.values.project : '').trim();
		if (!projectName || projectName !== chosen) continue;
		const poNumber = String(row.values && row.values.poNumber ? row.values.poNumber : '').trim();
		const vendor = String(row.values && row.values.vendor ? row.values.vendor : '').trim();
		const rawAmt = row.values && row.values.poAmountUsdK !== undefined ? row.values.poAmountUsdK : (row.values && row.values.poAmount !== undefined ? row.values.poAmount : '');
		matches.push([poNumber, vendor, (rawAmt || '')]);
	}
	if (matches.length === 0) return 'No matching POs found for project.';
	const headers = ['PO Number','Vendor','PO Amount'];
	const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
	return buildTableResponse_(headers, matches, { includeCsvDownload: true, csvFilename: 'sia-pos-by-project-' + timestamp + '.csv' });
}

function listProjectsByDivision(entities, parsed, context) {
	const rawDivision = String(entities.DIVISION || '').trim();
	if (!rawDivision) return getMissingEntityMessage('DIVISION');
	const resolved = resolveCanonicalDivision_(rawDivision || '');
	if (!resolved.matched) {
		const candidates = CANONICAL_DIVISIONS_.map(function(d){ return { id: d, score: scoreDivisionSimilarity_(rawDivision, d) }; });
		candidates.sort(function(a,b){ return b.score - a.score; });
		const top = candidates.slice(0,3).map(function(c){ return { id: c.id, label: buildFullQueryLabel('list_projects_by_division', c.id), entityType: 'division' }; });
		return showDidYouMean(top);
	}

	const dataset = getCommschedRows_(['division','project'], context);
	if (!dataset || !dataset.rows) return 'Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.';
	const projects = {};
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const rowDivision = String(row.values && row.values.division ? row.values.division : '').trim();
		if (!rowDivision) continue;
		const r = resolveCanonicalDivision_(rowDivision);
		if (!r.matched || r.canonicalDivision !== resolved.canonicalDivision) continue;
		const project = String(row.values && row.values.project ? row.values.project : '').trim();
		if (project) projects[project] = true;
	}
	const list = Object.keys(projects).sort();
	if (list.length === 0) return 'No projects found for division ' + resolved.canonicalDivision + '.';
	const rows = list.map(function(p){ return [p]; });
	const headers = ['Project'];
	return buildTableResponse_(headers, rows, { includeCsvDownload: false });
}

function listActivePosForProponent(entities, parsed, context) {
	const rawName = String(entities.VENDOR || entities.PROPONENT || '').trim();
	if (!rawName) return getMissingEntityMessage('VENDOR');
	const dataset = getCommschedRows_(['vendor','proponent','poNumber','poAmount','deliveryComplete'], context);
	if (!dataset || !dataset.rows) return 'Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.';

	// Build candidate list from both vendor and proponent columns
	const names = {};
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const v = String(row.values && row.values.vendor ? row.values.vendor : '').trim();
		const p = String(row.values && row.values.proponent ? row.values.proponent : '').trim();
		if (v) names[v] = true;
		if (p) names[p] = true;
	}
	const nameList = Object.keys(names);
	const queryNorm = normalizeText(rawName || '');
	const scoredItems = buildTopTextMatches_(queryNorm, nameList, 3);
	const scored = scoredItems.map(function(it){ return { name: it.value, score: it.score }; });
	if (scored.length === 0) return 'No matching proponent/vendor found.';
	if (scored[0].score < 0.9) {
		const suggestions = scored.slice(0,3).map(function(t){ return { id: t.name, label: buildFullQueryLabel('list_active_pos_for_proponent', t.name), entityType: 'vendor' }; });
		return showDidYouMean(suggestions);
	}

	const chosen = scored[0].name;
	const matches = [];
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const vendor = String(row.values && row.values.vendor ? row.values.vendor : '').trim();
		const proponent = String(row.values && row.values.proponent ? row.values.proponent : '').trim();
		const poNumber = String(row.values && row.values.poNumber ? row.values.poNumber : '').trim();
		const deliveryCompleteValue = String(row.values && row.values.deliveryComplete ? row.values.deliveryComplete : '').trim().toUpperCase();
		const rawAmt = row.values && row.values.poAmountUsdK !== undefined ? row.values.poAmountUsdK : (row.values && row.values.poAmount !== undefined ? row.values.poAmount : '');
		if (!poNumber) continue;
		if (vendor !== chosen && proponent !== chosen) continue;
		if (deliveryCompleteValue === 'YES') continue; // only active/open
		matches.push([poNumber, vendor || proponent, rawAmt || '']);
	}
	if (matches.length === 0) return 'No active POs found for ' + chosen + '.';
	const headers = ['PO Number','Vendor/Proponent','PO Amount'];
	const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
	return buildTableResponse_(headers, matches, { includeCsvDownload: true, csvFilename: 'sia-active-pos-' + timestamp + '.csv' });
}

function listServicesPosByDivisionAndType(entities, parsed, context) {
	const rawDivision = String(entities.DIVISION || '').trim();
	if (!rawDivision) return getMissingEntityMessage('DIVISION');
	const resolved = resolveCanonicalDivision_(rawDivision || '');
	if (!resolved.matched) {
		const candidates = CANONICAL_DIVISIONS_.map(function(d){ return { id: d, score: scoreDivisionSimilarity_(rawDivision, d) }; });
		candidates.sort(function(a,b){ return b.score - a.score; });
		const top = candidates.slice(0,3).map(function(c){ return { id: c.id, label: buildFullQueryLabel('list_services_pos_by_division_and_type', c.id), entityType: 'division' }; });
		return showDidYouMean(top);
	}

	const dataset = getCommschedRows_(['division','poType','poNumber','poAmount','poAmountUsdK'], context);
	if (!dataset || !dataset.rows) return 'Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.';
	const matches = [];
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const rowDivision = String(row.values && row.values.division ? row.values.division : '').trim();
		if (!rowDivision) continue;
		const r = resolveCanonicalDivision_(rowDivision);
		if (!r.matched || r.canonicalDivision !== resolved.canonicalDivision) continue;
		const poType = String(row.values && row.values.poType ? row.values.poType : '').trim().toLowerCase();
		if (!poType || poType.indexOf('service') === -1) continue;
		const poNumber = String(row.values && row.values.poNumber ? row.values.poNumber : '').trim();
		const rawAmt = row.values && row.values.poAmountUsdK !== undefined ? row.values.poAmountUsdK : (row.values && row.values.poAmount !== undefined ? row.values.poAmount : '');
		matches.push([poNumber, row.values && row.values.poType ? row.values.poType : '', rawAmt || '']);
	}
	if (matches.length === 0) return 'No service POs found for ' + resolved.canonicalDivision + '.';
	const headers = ['PO Number','PO Type','PO Amount'];
	const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
	return buildTableResponse_(headers, matches, { includeCsvDownload: true, csvFilename: 'sia-services-pos-' + timestamp + '.csv' });
}

// Helper: extract date-like fragments and convert to Date objects (best-effort)
function extractDatesFromText_(text) {
	const raw = String(text || "").trim();
	if (!raw) return [];
	const candidates = [];
	// Numeric dates like MM/DD or MM/DD/YYYY or M-D-YYYY
	const numericRe = /(\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b)/g;
	let m;
	while ((m = numericRe.exec(raw)) !== null) {
		candidates.push(m[1]);
	}

	// Month name + day, e.g. May 9 or May 9, 2026
	const monthRe = /(\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\.)?\s+\d{1,2}(?:,\s*\d{4})?\b)/ig;
	while ((m = monthRe.exec(raw)) !== null) {
		candidates.push(m[1]);
	}

	const dates = [];
	for (let i = 0; i < candidates.length; i++) {
		let txt = candidates[i];
		// If numeric and no year, append current year
		if (/^\d{1,2}[\/\-]\d{1,2}$/.test(txt)) {
			const now = new Date();
			txt = txt + '/' + now.getFullYear();
		}
		const parsed = parseDateValue_(txt);
		if (parsed) dates.push(parsed);
	}
	return dates;
}

function checkPoYear(entities, parsed, context) {
	const poNumber = String(entities.PO_NUMBER || '').trim();
	if (!poNumber) return getMissingEntityMessage('PO_NUMBER');
	const lookup = lookupCommschedPoRow_(poNumber, ['poDate'], context);
	if (lookup && lookup.accessDenied) return lookup.message || getCommschedDivisionDeniedMessage_(poNumber);
	if (!lookup || !lookup.found) return getCommschedNotFoundMessage_(poNumber);
	const raw = lookup.values && lookup.values.poDate ? lookup.values.poDate : '';
	if (!raw) return 'No PO date found for <b>PO ' + poNumber + '</b>.';
	const dt = parseDateValue_(raw);
	let year = null;
	if (dt) {
		year = Utilities.formatDate(dt, Session.getScriptTimeZone(), 'yyyy');
	} else {
		const m = String(raw).match(/(\d{4})/);
		if (m) year = m[1];
	}
	if (!year) return 'Could not determine PO year for <b>PO ' + poNumber + '</b>.';
	return '<b>PO ' + poNumber + '</b> was created in ' + year + '.';
}

function listPosWithGrMovementBetween(entities, parsed, context) {
	const rawText = parsed && parsed.rawText ? String(parsed.rawText) : '';
	const dates = extractDatesFromText_(rawText);
	if (!dates || dates.length < 2) {
		return getMissingEntityMessage('DATE');
	}
	// Use first two dates
	const d1 = dates[0];
	const d2 = dates[1];
	const from = d1 <= d2 ? d1 : d2;
	const to = d2 >= d1 ? d2 : d1;

	const dataset = getCommschedRows_(['poNumber','latestGrDate'], context);
	if (!dataset || !dataset.rows) return 'Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.';
	const matches = [];
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const po = String(row.values && row.values.poNumber ? row.values.poNumber : '').trim();
		const grRaw = row.values && row.values.latestGrDate ? row.values.latestGrDate : '';
		const grDate = parseDateValue_(grRaw);
		if (!po || !grDate) continue;
		if (grDate >= from && grDate <= to) {
			const fmt = Utilities.formatDate(grDate, Session.getScriptTimeZone(), 'MMM d, yyyy');
			matches.push([po, fmt]);
		}
	}
	if (matches.length === 0) return 'No POs with GR movement found in the specified range.';
	const headers = ['PO Number','Latest GR Date'];
	const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
	return buildTableResponse_(headers, matches, { includeCsvDownload: true, csvFilename: 'sia-pos-gr-movement-' + timestamp + '.csv' });
}

function listPosStagnantGr(entities, parsed, context) {
	// default threshold days 30
	let days = 30;
	if (entities && entities.DAYS) {
		const n = parseInt(String(entities.DAYS || ''), 10);
		if (!isNaN(n) && n > 0) days = n;
	}
	const now = new Date();
	const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

	const dataset = getCommschedRows_(['poNumber','latestGrDate'], context);
	if (!dataset || !dataset.rows) return 'Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.';
	const matches = [];
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const po = String(row.values && row.values.poNumber ? row.values.poNumber : '').trim();
		const grRaw = row.values && row.values.latestGrDate ? row.values.latestGrDate : '';
		const grDate = parseDateValue_(grRaw);
		if (!po) continue;
		if (!grDate) {
			// No GR movement
			matches.push([po, 'No GR movement', 'N/A']);
			continue;
		}
		if (grDate < cutoff) {
			const daysAgo = Math.floor((now.getTime() - grDate.getTime()) / (24*60*60*1000));
			const fmt = Utilities.formatDate(grDate, Session.getScriptTimeZone(), 'MMM d, yyyy');
			matches.push([po, fmt, String(daysAgo)]);
		}
	}
	if (matches.length === 0) return 'No POs found with stagnant GR for more than ' + days + ' days.';
	const headers = ['PO Number','Latest GR Date','Days Since GR'];
	return buildTableResponse_(headers, matches, { includeCsvDownload: false });
}

/* New handlers requested: PO fully GR check, open POs by vendor, tagged/not-for-closure lists, low GR% listing */
function checkPoFullyGrd(entities, parsed, context) {
	const poNumber = String(entities.PO_NUMBER || "").trim();
	if (!poNumber) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const lookup = lookupCommschedPoRow_(poNumber, ["ungrdUsd", "remainingBalance", "grBucket", "goodsReceiptAmount", "poAmount"], context);
	if (lookup && lookup.accessDenied) {
		return lookup.message || getCommschedDivisionDeniedMessage_(poNumber);
	}
	if (!lookup || !lookup.found) {
		return getCommschedNotFoundMessage_(poNumber);
	}

	const ungrdRaw = lookup.values && (lookup.values.ungrdUsd || lookup.values.remainingBalance) ? (lookup.values.ungrdUsd || lookup.values.remainingBalance) : "";
	const ungrdNum = parseDisplayAmount_(ungrdRaw);
	if (!isNaN(ungrdNum)) {
		if (Number(ungrdNum) === 0) {
			return "YES — <b>PO " + poNumber + "</b> is fully GR'd.";
		}
		return "NO — <b>PO " + poNumber + "</b> is not yet fully GR'd.";
	}

	const grBucket = String(lookup.values && lookup.values.grBucket ? lookup.values.grBucket : "").trim().toUpperCase();
	if (grBucket.indexOf("H. FULLY GRD") !== -1 || grBucket.indexOf("FULL") !== -1) {
		return "YES — <b>PO " + poNumber + "</b> is fully GR'd.";
	}
	if (grBucket) {
		return "NO — <b>PO " + poNumber + "</b> is not yet fully GR'd.";
	}

	return getCommschedNoDataMessage_(poNumber);
}

function listOpenPosForVendor(entities, parsed, context) {
	const rawVendor = String(entities.VENDOR || "").trim();
	if (!rawVendor) return getMissingEntityMessage("VENDOR");

	const dataset = getCommschedRows_( ["vendor", "poNumber", "deliveryComplete", "remainingBalance", "ungrdUsd"], context);
	if (!dataset || !dataset.rows) {
		return "Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.";
	}

	const vendorSet = {};
	for (let i = 0; i < dataset.rows.length; i += 1) {
		const row = dataset.rows[i] || {};
		const vendorName = String(row.values && row.values.vendor ? row.values.vendor : "").trim();
		if (vendorName) vendorSet[vendorName] = true;
	}

	const vendorList = Object.keys(vendorSet);
	const queryNorm = normalizeText(rawVendor || "");
	const scoredItems = buildTopTextMatches_(queryNorm, vendorList, 3);
	const scored = scoredItems.map(function(it) { return { vendor: it.value, score: it.score }; });
	const top = scored.slice(0, 3);
	if (top.length === 0) return "No matching vendors found.";

	if (top[0].score >= 0.9) {
		const chosen = top[0].vendor;
		const matches = [];
		for (let i = 0; i < dataset.rows.length; i += 1) {
			const row = dataset.rows[i] || {};
			const vendorName = String(row.values && row.values.vendor ? row.values.vendor : "").trim();
			const poNumber = String(row.values && row.values.poNumber ? row.values.poNumber : "").trim();
			const deliveryCompleteValue = String(row.values && row.values.deliveryComplete ? row.values.deliveryComplete : "").trim().toUpperCase();
			const remainingBalanceValue = String(row.values && row.values.remainingBalance ? row.values.remainingBalance : "").trim();
			if (!poNumber || vendorName !== chosen) continue;
			// Open if deliveryComplete !== 'YES' (treat blank as open)
			if (deliveryCompleteValue === "YES") continue;
			matches.push([poNumber, vendorName, deliveryCompleteValue || "", remainingBalanceValue || ""]);
		}

		if (matches.length === 0) return "No matching open POs found.";

		const headers = ["PO Number", "Vendor", "Delivery Complete", "Remaining Balance"];
		const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
		return buildTableResponse_(headers, matches, { includeCsvDownload: true, csvFilename: "sia-open-pos-" + timestamp + ".csv" });
	}

	const suggestions = top.map(function(t) { return { id: t.vendor, label: buildFullQueryLabel('list_open_pos_for_vendor', t.vendor) }; });
	return showDidYouMean(suggestions);
}

function listPoTaggedForClosure(entities, parsed, context) {
	// Short general response per user request: no table/CSV output
	return "POs with PO date 2023 and earlier (older than ~2.5 years) are tagged for closure.";
}

function listPoNotForClosure(entities, parsed, context) {
	// Short general response per user request: no table/CSV output
	return "POs from 2024 onwards are not considered for closure this year.";
}

function listPoLowGrPercent(entities, parsed, context) {
	const dataset = getCommschedRows_( ["poNumber", "poDate", "vendor", "poAmount", "goodsReceiptAmount", "grBucket"], context);
	if (!dataset || !dataset.rows) {
		return "Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.";
	}

	const yearFilter = entities.YEAR ? parseInt(String(entities.YEAR || "").trim(), 10) : null;
	// Allow a PERCENT entity to override the default threshold (default: 30%)
	const percentFilterRaw = entities.PERCENT ? String(entities.PERCENT || "").trim() : "";
	let percentThreshold = 30;
	if (percentFilterRaw) {
		const p = parseInt(percentFilterRaw, 10);
		if (!isNaN(p)) percentThreshold = p;
	}
	const matches = [];

	for (let i = 0; i < dataset.rows.length; i += 1) {
		const row = dataset.rows[i] || {};
		const poNumber = String(row.values && row.values.poNumber ? row.values.poNumber : "").trim();
		if (!poNumber) continue;

		// Year filter
		let year = null;
		const rawPoDate = row.rawValues && Object.prototype.hasOwnProperty.call(row.rawValues, 'poDate') ? row.rawValues.poDate : (row.values && row.values.poDate ? row.values.poDate : "");
		const parsedDate = parseDateValue_(rawPoDate);
		if (parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
			year = parsedDate.getFullYear();
		} else {
			const display = String(row.values && row.values.poDate ? row.values.poDate : "");
			const m = display.match(/\b(19|20)\d{2}\b/);
			if (m) year = parseInt(m[0], 10);
		}
		if (yearFilter && year !== null && year !== yearFilter) continue;

		const poAmountRaw = row.values && row.values.poAmount ? row.values.poAmount : "";
		const grAmountRaw = row.values && row.values.goodsReceiptAmount ? row.values.goodsReceiptAmount : "";
		const poAmt = parseDisplayAmount_(poAmountRaw);
		const grAmt = parseDisplayAmount_(grAmountRaw);

		let included = false;
		let percent = null;
		if (!isNaN(poAmt) && !isNaN(grAmt) && Number(poAmt) > 0) {
			percent = (Number(grAmt) / Number(poAmt)) * 100;
			if (percent <= percentThreshold) included = true;
		} else {
			const grBucket = String(row.values && row.values.grBucket ? row.values.grBucket : "").trim().toUpperCase();
			if (grBucket === "A. ZERO GR" || grBucket === "B. 1-10% GRD" || grBucket === "C. 11-30% GRD") {
				included = true;
			}
		}

		if (included) {
			const vendorName = String(row.values && row.values.vendor ? row.values.vendor : "").trim();
			const displayDate = String(row.values && row.values.poDate ? row.values.poDate : "");
			const percentStr = percent !== null && !isNaN(percent) ? (Math.round(percent * 10) / 10) + "%" : String(row.values && row.values.grBucket ? row.values.grBucket : "");
			const poAmtDisplay = String(row.values && row.values.poAmount ? row.values.poAmount : "");
			const grAmtDisplay = String(row.values && row.values.goodsReceiptAmount ? row.values.goodsReceiptAmount : "");
			const grBucketDisplay = String(row.values && row.values.grBucket ? row.values.grBucket : "");
			matches.push([poNumber, vendorName, displayDate, percentStr, poAmtDisplay, grAmtDisplay, grBucketDisplay]);
		}
	}

	if (matches.length === 0) return "No matching POs found.";

	const headers = ["PO Number", "Vendor", "PO Date", "GR%", "PO Amount", "GR Amount", "GR Bucket"];
	const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
	return buildTableResponse_(headers, matches, { includeCsvDownload: true, csvFilename: "sia-low-gr-percent-" + percentThreshold + "-" + (yearFilter || "all") + "-" + timestamp + ".csv" });
}

/* Helpers for unGR'd aggregation provided by helper.js (parseDisplayAmount_, formatMoney_, formatCount_) */

function checkTotalUnGrdVendor(entities, parsed, context) {
	const rawVendor = String(entities.VENDOR || '').trim();
	if (!rawVendor) return getMissingEntityMessage('VENDOR');

	const dataset = getCommschedRows_(['vendor','currency','remainingBalance'], context);
	if (!dataset || !dataset.rows) return 'Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.';

	// Collect unique vendor names
	const vendorSet = {};
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const vendorName = String(row.values && row.values.vendor ? row.values.vendor : '').trim();
		if (vendorName) vendorSet[vendorName] = true;
	}
	const vendorList = Object.keys(vendorSet);
	const queryNorm = normalizeText(rawVendor || '');

	// score vendor candidates using shared helper
	const scoredItems = buildTopTextMatches_(queryNorm, vendorList, 3);
	const scored = scoredItems.map(function(it){ return { vendor: it.value, score: it.score }; });
	if (scored.length === 0) return 'No matching vendors found.';

	const top = scored.slice(0,3);
	if (top[0].score < 0.9) {
		const suggestions = top.map(function(t){ return { id: t.vendor, label: buildFullQueryLabel('check_total_ungrd_vendor', t.vendor), entityType: 'vendor' }; });
		return showDidYouMean(suggestions);
	}

	const chosen = top[0].vendor;
	const totalsByCurrency = {};
	let totalPos = 0;
	let totalRows = 0;

	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const vendorName = String(row.values && row.values.vendor ? row.values.vendor : '').trim();
		if (!vendorName || vendorName !== chosen) continue;
		const currency = String(row.values && row.values.currency ? row.values.currency : '').trim() || '';
		const rawAmt = row.values && row.values.remainingBalance !== undefined ? row.values.remainingBalance : '';
		const num = parseDisplayAmount_(rawAmt);
		if (isNaN(num)) continue;
		totalsByCurrency[currency] = totalsByCurrency[currency] || { total: 0, posCount: 0, rows: 0 };
		totalsByCurrency[currency].total += num;
		totalsByCurrency[currency].rows += 1;
		if (num > 0) totalsByCurrency[currency].posCount += 1;
		totalRows += 1;
		if (num > 0) totalPos += 1;
	}

	if (totalRows === 0) return 'No matching POs found.';

	const currencyParts = Object.keys(totalsByCurrency).map(function(curr){
		const info = totalsByCurrency[curr];
		return (curr ? curr + ' ' : '') + formatMoney_(info.total);
	});

	const formattedTotals = currencyParts.join(', ');
	return 'Vendor <b>' + chosen + '</b> has a total unGR\'d value of ' + formattedTotals + ' from ' + formatCount_(totalPos) + ' to be GR\'d POs (out of ' + formatCount_(totalRows) + ').';
}

function listTotalUnGrdVendor(entities, parsed, context) {
	const dataset = getCommschedRows_(['vendor','currency','remainingBalance'], context);
	if (!dataset || !dataset.rows) return 'Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.';

	const vendorCurrencyMap = {};
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const vendor = String(row.values && row.values.vendor ? row.values.vendor : '').trim();
		if (!vendor) continue;
		const currency = String(row.values && row.values.currency ? row.values.currency : '').trim() || '';
		const rawAmt = row.values && row.values.remainingBalance !== undefined ? row.values.remainingBalance : '';
		const num = parseDisplayAmount_(rawAmt);
		if (isNaN(num)) continue;
		const key = vendor + '||' + currency;
		vendorCurrencyMap[key] = vendorCurrencyMap[key] || { vendor: vendor, currency: currency, total: 0, posCount: 0, rows: 0 };
		vendorCurrencyMap[key].total += num;
		vendorCurrencyMap[key].rows += 1;
		if (num > 0) vendorCurrencyMap[key].posCount += 1;
	}

	const entries = Object.keys(vendorCurrencyMap).map(function(k){
		return vendorCurrencyMap[k];
	});

	if (entries.length === 0) return 'No matching vendors found.';

	// sort by total desc (numeric)
	entries.sort(function(a,b){ return b.total - a.total; });

	const rows = entries.map(function(v) {
		const formattedTotal = (v.currency ? v.currency + ' ' : '') + formatMoney_(v.total);
		return [v.vendor, formattedTotal, formatCount_(v.posCount), formatCount_(v.rows)];
	});

	const headers = ['Vendor','Total unGR\'d','Remaining POs','Total POs'];
	const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
	return buildTableResponse_(headers, rows, { includeCsvDownload: true, csvFilename: 'sia-ungrd-vendor-' + timestamp + '.csv' });
}

function checkTotalUnGrdDivision(entities, parsed, context) {
	const rawDivision = String(entities.DIVISION || '').trim();
	if (!rawDivision) return getMissingEntityMessage('DIVISION');

	const resolved = resolveCanonicalDivision_(rawDivision || '');
	if (!resolved.matched) {
		// suggest top canonical divisions by similarity
		const candidates = CANONICAL_DIVISIONS_.map(function(d){ return { id: d, score: scoreDivisionSimilarity_(rawDivision, d) }; });
		candidates.sort(function(a,b){ return b.score - a.score; });
		const top = candidates.slice(0,3).map(function(c){ return { id: c.id, label: buildFullQueryLabel('check_total_ungrd_division', c.id), entityType: 'division' }; });
		return showDidYouMean(top);
	}

	const dataset = getCommschedRows_(['division','currency','remainingBalance'], context);
	if (!dataset || !dataset.rows) return 'Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.';

	const totalsByCurrency = {};
	let totalPos = 0;
	let totalRows = 0;

	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const rowDivision = String(row.values && row.values.division ? row.values.division : '').trim();
		if (!rowDivision) continue;
		const resolvedRow = resolveCanonicalDivision_(rowDivision);
		if (!resolvedRow.matched || resolvedRow.canonicalDivision !== resolved.canonicalDivision) continue;
		const currency = String(row.values && row.values.currency ? row.values.currency : '').trim() || '';
		const rawAmt = row.values && row.values.remainingBalance !== undefined ? row.values.remainingBalance : '';
		const num = parseDisplayAmount_(rawAmt);
		if (isNaN(num)) continue;
		totalsByCurrency[currency] = totalsByCurrency[currency] || { total: 0, posCount: 0, rows: 0 };
		totalsByCurrency[currency].total += num;
		totalsByCurrency[currency].rows += 1;
		if (num > 0) totalsByCurrency[currency].posCount += 1;
		totalRows += 1;
		if (num > 0) totalPos += 1;
	}

	if (totalRows === 0) return 'No matching POs found.';

	const currencyParts = Object.keys(totalsByCurrency).map(function(curr){
		const info = totalsByCurrency[curr];
		return (curr ? curr + ' ' : '') + formatMoney_(info.total);
	});
	const formattedTotals = currencyParts.join(', ');
	return 'Division <b>' + resolved.canonicalDivision + '</b> has a total unGR\'d value of ' + formattedTotals + ' from ' + formatCount_(totalPos) + ' to be GR\'d POs (out of ' + formatCount_(totalRows) + ').';
}

function listTotalUnGrdDivision(entities, parsed, context) {
	const dataset = getCommschedRows_(['division','currency','remainingBalance'], context);
	if (!dataset || !dataset.rows) return 'Cannot find the latest monitoring sheet. Please contact the admin team at ntg-bmsocapexsettlement@globe.com.ph for further assistance.';

	const groupMap = {};
	for (let i=0;i<dataset.rows.length;i++){
		const row = dataset.rows[i] || {};
		const divisionRaw = String(row.values && row.values.division ? row.values.division : '').trim();
		if (!divisionRaw) continue;
		const resolved = resolveCanonicalDivision_(divisionRaw);
		if (!resolved.matched) continue;
		const division = resolved.canonicalDivision;
		const currency = String(row.values && row.values.currency ? row.values.currency : '').trim() || '';
		const rawAmt = row.values && row.values.remainingBalance !== undefined ? row.values.remainingBalance : '';
		const num = parseDisplayAmount_(rawAmt);
		if (isNaN(num)) continue;
		const key = division + '||' + currency;
		groupMap[key] = groupMap[key] || { division: division, currency: currency, total: 0, posCount: 0, rows: 0 };
		groupMap[key].total += num;
		groupMap[key].rows += 1;
		if (num > 0) groupMap[key].posCount += 1;
	}

	const entries = Object.keys(groupMap).map(function(k){ return groupMap[k]; });

	if (entries.length === 0) return 'No matching divisions found.';

	entries.sort(function(a,b){ return b.total - a.total; });

	const rows = entries.map(function(v) {
		const formattedTotal = (v.currency ? v.currency + ' ' : '') + formatMoney_(v.total);
		return [v.division, formattedTotal, formatCount_(v.posCount), formatCount_(v.rows)];
	});

	const headers = ['Division','Total unGR\'d','Remaining POs','Total POs'];
	const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
	return buildTableResponse_(headers, rows, { includeCsvDownload: true, csvFilename: 'sia-ungrd-division-' + timestamp + '.csv' });
}

function parseGrTicketSubmittedDate_(value) {
	if (value instanceof Date && !isNaN(value.getTime())) {
		return value;
	}

	const text = String(value || '').trim();
	if (!text) {
		return null;
	}

	const match = text.match(/^\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})\s*$/);
	if (match) {
		const first = Number(match[1]);
		const second = Number(match[2]);
		let year = Number(match[3]);
		if (match[3].length === 2) {
			year += 2000;
		}

		const candidates = [
			{ day: first, month: second - 1 },
			{ day: second, month: first - 1 },
		];

		for (let i = 0; i < candidates.length; i += 1) {
			const candidate = candidates[i];
			const parsed = new Date(year, candidate.month, candidate.day);
			if (
				!isNaN(parsed.getTime()) &&
				parsed.getFullYear() === year &&
				parsed.getMonth() === candidate.month &&
				parsed.getDate() === candidate.day
			) {
				return parsed;
			}
		}
	}

	const parsed = new Date(text);
	return isNaN(parsed.getTime()) ? null : parsed;
}

function checkGrTicketStatus(entities, parsed, context) {
	const grNumber = String(entities.GR_NUMBER || '').trim();
	if (!grNumber) {
		return getMissingEntityMessage('GR_NUMBER');
	}

	const lookup = lookupGrTicketRow_(grNumber, ['grStages', 'poNumber'], context);
	if (!lookup || !lookup.found) {
		return getGrTicketNotFoundMessage_(grNumber);
	}

	const stageValue = String(lookup.values && lookup.values.grStages ? lookup.values.grStages : '').trim().replace(/\s+/g, ' ');
	if (!stageValue) {
		return getGrTicketNoDataMessage_(grNumber);
	}

	const stageReplies = {
		'(1) For GR Submission': '<b>GR Ticket ' + grNumber + '</b> is for GR validation.',
		'(2) For GR Posting': '<b>GR Ticket ' + grNumber + '</b> is for GR posting.',
		'(3) GR Posted/Completed': '<b>GR Ticket ' + grNumber + '</b> has been GR posted.',
		'(4) For WBS Creation': '<b>GR Ticket ' + grNumber + '</b> is for WBS creation.',
		'(5) Return to Vendor': '<b>GR Ticket ' + grNumber + '</b> has been returned to the vendor.',
		'(6) For Revalidation': '<b>GR Ticket ' + grNumber + '</b> is for revalidation.',
		'(7) Resubmitted': '<b>GR Ticket ' + grNumber + '</b> has been resubmitted.',
		'(8) For Cancellation': '<b>GR Ticket ' + grNumber + '</b> has been cancelled.',
	};

	return stageReplies[stageValue] || getGrTicketNoDataMessage_(grNumber);
}

function checkGrTicketSubmitted(entities, parsed, context) {
	const grNumber = String(entities.GR_NUMBER || '').trim();
	if (!grNumber) {
		return getMissingEntityMessage('GR_NUMBER');
	}

	const lookup = lookupGrTicketRow_(grNumber, ['dateSubmitted', 'poNumber'], context);
	if (!lookup || !lookup.found) {
		return getGrTicketNotFoundMessage_(grNumber);
	}

	const submittedDateValue = lookup.values && lookup.values.dateSubmitted ? lookup.values.dateSubmitted : '';
	const parsedDate = parseGrTicketSubmittedDate_(submittedDateValue);
	if (!parsedDate) {
		return getGrTicketNoDataMessage_(grNumber);
	}

	const longDate = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), 'MMMM d, yyyy');
	const shortDate = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), 'M/d/yyyy');
	return '<b>GR Ticket ' + grNumber + '</b> was submitted on ' + longDate + ' (' + shortDate + ')';
}
