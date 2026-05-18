/* parser.js

- normalizes the input text
- extract entities like PO number, GR ticket case number, etc.
- compare the user text to the defined intents and find the best match
- decide whether confidence is high enough
- return the intent name, confidence score, and extracted entities

example input: "what is the status of PO 1234567890"
example output: 
{ 
	intent: "check_po_status", 
	confidence: 0.95, 
	entities: { 
		PO_NUMBER: "1234567890" 
	} 
}

*/

function normalizeText(text) {
	return String(text || "")
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function tokenize(text) {
	if (!text) return [];
	return text.split(/\s+/).filter(Boolean);
}

function jaccardSimilarity(tokensA, tokensB) {
	if (!tokensA.length && !tokensB.length) return 1;
	if (!tokensA.length || !tokensB.length) return 0;
	const setA = new Set(tokensA);
	const setB = new Set(tokensB);
	let intersection = 0;
	setA.forEach((tok) => {
		if (setB.has(tok)) intersection += 1;
	});
	const union = setA.size + setB.size - intersection;
	return union === 0 ? 0 : intersection / union;
}

function levenshteinDistance(a, b) {
	const s = a || "";
	const t = b || "";
	const m = s.length;
	const n = t.length;
	if (m === 0) return n;
	if (n === 0) return m;

	const dp = Array(m + 1)
		.fill(null)
		.map(() => Array(n + 1).fill(0));

	for (let i = 0; i <= m; i += 1) dp[i][0] = i;
	for (let j = 0; j <= n; j += 1) dp[0][j] = j;

	for (let i = 1; i <= m; i += 1) {
		for (let j = 1; j <= n; j += 1) {
			const cost = s[i - 1] === t[j - 1] ? 0 : 1;
			dp[i][j] = Math.min(
				dp[i - 1][j] + 1,
				dp[i][j - 1] + 1,
				dp[i - 1][j - 1] + cost,
			);
		}
	}

	return dp[m][n];
}

function normalizedLevenshteinSimilarity(a, b) {
	const maxLen = Math.max(a.length, b.length);
	if (maxLen === 0) return 1;
	const dist = levenshteinDistance(a, b);
	return 1 - dist / maxLen;
}

function extractPoNumber(normalizedText) {
	const matches = normalizedText.match(/\b\d{10}\b/g) || [];
	if (matches.length === 0) {
		return { error: "Please provide a 10-digit PO number." };
	}
	if (matches.length > 1) {
		return { error: "Please provide a single 10-digit PO number." };
	}
	return { value: matches[0] };
}

function replacePoWithPlaceholder(normalizedText, poNumber) {
	if (!poNumber) return normalizedText;
	const escaped = poNumber.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
	const re = new RegExp("\\b" + escaped + "\\b", "g");
	return normalizedText.replace(re, "x");
}

function scoreIntent(inputForMatch, phrase) {
	const normalizedPhrase = normalizeText(phrase);
	const tokensA = tokenize(inputForMatch);
	const tokensB = tokenize(normalizedPhrase);
	const jaccard = jaccardSimilarity(tokensA, tokensB);
	const levenshteinSim = normalizedLevenshteinSimilarity(
		inputForMatch,
		normalizedPhrase,
	);
	const score = jaccard * 0.6 + levenshteinSim * 0.4;
	return { score: score, jaccard: jaccard, levenshtein: levenshteinSim };
}

function parseInput(userText) {
	const normalized = normalizeText(userText);
	if (!normalized) {
		return { error: "Please provide a 10-digit PO number." };
	}

	const poExtraction = extractPoNumber(normalized);
	if (poExtraction.error) {
		return { error: poExtraction.error };
	}

	const poNumber = poExtraction.value;
	const normalizedForMatch = replacePoWithPlaceholder(normalized, poNumber);

	let bestIntent = null;
	let bestScore = 0;
	let bestPhrase = null;

	INTENTS.forEach((intent) => {
		intent.phrases.forEach((phrase) => {
			const scored = scoreIntent(normalizedForMatch, phrase);
			if (scored.score > bestScore) {
				bestScore = scored.score;
				bestIntent = intent;
				bestPhrase = phrase;
			}
		});
	});

	const entities = { PO_NUMBER: poNumber };

	if (!bestIntent) {
		return {
			intent: null,
			confidence: 0,
			entities: entities,
			matchedPhrase: null,
		};
	}

	return {
		intent: bestIntent.name,
		confidence: bestScore,
		entities: entities,
		matchedPhrase: bestPhrase,
	};
}

