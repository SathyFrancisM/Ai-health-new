const fs = require('fs');
const path = require('path');

// Load remedies dataset on startup (cached in memory)
let remediesDB = [];
try {
  const dataPath = path.join(__dirname, '../data/remedies.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  remediesDB = JSON.parse(raw);
  console.log(`[RAG Engine] Loaded ${remediesDB.length} disease entries.`);
} catch (err) {
  console.error('[RAG Engine] Failed to load remedies.json:', err.message);
}

// Common stop words to ignore during matching
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'shall', 'can', 'may', 'might', 'must', 'a', 'an', 'the',
  'and', 'but', 'or', 'nor', 'not', 'no', 'so', 'if', 'then', 'than',
  'too', 'very', 'just', 'about', 'above', 'after', 'before', 'from',
  'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
  'for', 'with', 'to', 'of', 'at', 'by', 'this', 'that', 'these',
  'those', 'it', 'its', 'he', 'she', 'they', 'we', 'you', 'what',
  'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
  'every', 'both', 'few', 'more', 'most', 'some', 'any', 'such',
  'only', 'own', 'same', 'also', 'get', 'got', 'getting', 'feel',
  'feeling', 'having', 'lot', 'lots', 'really', 'much', 'many',
  'like', 'since', 'because', 'due', 'please', 'help', 'need'
]);

/**
 * Tokenize input: lowercase, split on non-alphanumeric, remove stop words
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Score a remedy entry against user keywords
 * - disease name match = 5 points per keyword match
 * - symptom match = 3 points per keyword match
 * - partial match (substring) = 1 point
 */
function scoreEntry(entry, keywords) {
  let score = 0;
  const diseaseLower = entry.disease.toLowerCase();
  const symptomsJoined = entry.symptoms.join(' ').toLowerCase();

  for (const kw of keywords) {
    // Exact disease name match
    if (diseaseLower.includes(kw)) {
      score += 5;
    }
    // Symptom match
    for (const symptom of entry.symptoms) {
      const symptomLower = symptom.toLowerCase();
      if (symptomLower === kw) {
        score += 4; // Exact symptom keyword
      } else if (symptomLower.includes(kw)) {
        score += 3; // Partial symptom match
      }
    }
    // Check in herbal remedies text for extra relevance
    const herbsText = entry.herbal_remedies.join(' ').toLowerCase();
    if (herbsText.includes(kw)) {
      score += 1;
    }
  }

  return score;
}

/**
 * Retrieve top N most relevant remedies for the given user input
 * @param {string} userInput - English text (already translated if needed)
 * @param {number} topN - Number of results to return (default 3)
 * @returns {Array} Top matching remedy entries with scores
 */
function retrieve(userInput, topN = 3) {
  if (!remediesDB.length) {
    return [];
  }

  const keywords = tokenize(userInput);

  if (keywords.length === 0) {
    return [];
  }

  const scored = remediesDB.map(entry => ({
    entry,
    score: scoreEntry(entry, keywords)
  }));

  // Sort by score descending, filter out zero scores
  const results = scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(r => r.entry);

  return results;
}

/**
 * Format retrieved remedies into a text context for the AI prompt
 */
function formatRemediesContext(remedies) {
  if (!remedies.length) {
    return 'No specific remedies found in the database for this query.';
  }

  return remedies.map((r, i) => {
    return `REMEDY ${i + 1}: ${r.disease}
Symptoms: ${r.symptoms.join(', ')}
Herbal Remedies: ${r.herbal_remedies.join('; ')}
Ayurvedic Herbs: ${r.ayurvedic_herbs.join(', ')}
Diet: ${r.diet_recommendations}
Lifestyle: ${r.lifestyle_recommendations}`;
  }).join('\n\n');
}

module.exports = { retrieve, formatRemediesContext, tokenize };
