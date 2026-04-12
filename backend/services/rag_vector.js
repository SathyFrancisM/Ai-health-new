/**
 * RAG Vector Search Service — TF-IDF based lightweight vector search
 * Builds inverted index + IDF scores from remedies.json on startup.
 * Provides cosine similarity scoring for improved retrieval quality.
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// DATA LOADING
// ============================================================
let remediesDB = [];
try {
  const dataPath = path.join(__dirname, '../data/remedies.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  remediesDB = JSON.parse(raw);
  console.log(`[RAG Vector] Loaded ${remediesDB.length} disease entries for indexing.`);
} catch (err) {
  console.error('[RAG Vector] Failed to load remedies.json:', err.message);
}

// ============================================================
// STOP WORDS (expanded for medical context)
// ============================================================
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
  'like', 'since', 'because', 'due', 'please', 'help', 'need',
  'want', 'know', 'think', 'make', 'take', 'come', 'go', 'see'
]);

// ============================================================
// TOKENIZER
// ============================================================

/**
 * Tokenize text: lowercase, split on non-alphanumeric, remove stop words
 * @param {string} text 
 * @returns {string[]}
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

// ============================================================
// TF-IDF INDEX
// ============================================================

// Document frequency map: word -> number of documents containing it
const documentFrequency = {};

// Per-document term frequency vectors
const documentVectors = [];

// Total number of documents
const N = remediesDB.length;

/**
 * Build text representation for a remedy entry
 * Weights disease name and symptoms more heavily by repeating them
 */
function buildDocumentText(entry) {
  const parts = [];
  // Disease name (weight x3)
  parts.push(entry.disease, entry.disease, entry.disease);
  // Symptoms (weight x2)
  if (entry.symptoms) {
    entry.symptoms.forEach(s => { parts.push(s, s); });
  }
  // Remedies
  if (entry.herbal_remedies) parts.push(...entry.herbal_remedies);
  if (entry.ayurvedic_herbs) parts.push(...entry.ayurvedic_herbs);
  // Diet and lifestyle
  if (entry.diet_recommendations) parts.push(entry.diet_recommendations);
  if (entry.lifestyle_recommendations) parts.push(entry.lifestyle_recommendations);

  return parts.join(' ');
}

/**
 * Build the TF-IDF index on startup
 */
function buildIndex() {
  if (remediesDB.length === 0) return;

  // Step 1: Compute term frequencies for each document
  for (let i = 0; i < remediesDB.length; i++) {
    const text = buildDocumentText(remediesDB[i]);
    const tokens = tokenize(text);
    const tf = {};

    for (const token of tokens) {
      tf[token] = (tf[token] || 0) + 1;
    }

    // Normalize TF by document length
    const docLength = tokens.length || 1;
    for (const term in tf) {
      tf[term] = tf[term] / docLength;
    }

    documentVectors.push({ index: i, tf, entry: remediesDB[i] });
  }

  // Step 2: Compute document frequency for each term
  for (const doc of documentVectors) {
    const seenTerms = new Set(Object.keys(doc.tf));
    for (const term of seenTerms) {
      documentFrequency[term] = (documentFrequency[term] || 0) + 1;
    }
  }

  console.log(`[RAG Vector] Index built: ${documentVectors.length} documents, ${Object.keys(documentFrequency).length} unique terms.`);
}

// Build index on module load
buildIndex();

// ============================================================
// SEARCH
// ============================================================

/**
 * Compute IDF for a term
 * @param {string} term 
 * @returns {number}
 */
function idf(term) {
  const df = documentFrequency[term] || 0;
  if (df === 0) return 0;
  return Math.log((N + 1) / (df + 1)) + 1; // Smoothed IDF
}

/**
 * Compute TF-IDF vector for a query
 * @param {string[]} queryTokens 
 * @returns {Object} term -> tfidf score
 */
function queryVector(queryTokens) {
  const tf = {};
  for (const token of queryTokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  const len = queryTokens.length || 1;

  const vector = {};
  for (const term in tf) {
    vector[term] = (tf[term] / len) * idf(term);
  }
  return vector;
}

/**
 * Compute TF-IDF vector for a document
 * @param {Object} docTf - Term frequency map
 * @returns {Object} term -> tfidf score
 */
function docTfidfVector(docTf) {
  const vector = {};
  for (const term in docTf) {
    vector[term] = docTf[term] * idf(term);
  }
  return vector;
}

/**
 * Cosine similarity between two sparse vectors
 * @param {Object} vecA 
 * @param {Object} vecB 
 * @returns {number} Similarity score [0, 1]
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  // Compute dot product (only over shared terms)
  for (const term in vecA) {
    normA += vecA[term] * vecA[term];
    if (vecB[term]) {
      dotProduct += vecA[term] * vecB[term];
    }
  }

  for (const term in vecB) {
    normB += vecB[term] * vecB[term];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Perform vector search over the remedies database
 * @param {string} userInput - User's query text (in English)
 * @param {number} topN - Number of results to return (default 3)
 * @returns {Array} Top matching remedy entries with similarity scores
 */
function vectorSearch(userInput, topN = 3) {
  if (documentVectors.length === 0) {
    return [];
  }

  const queryTokens = tokenize(userInput);
  if (queryTokens.length === 0) {
    return [];
  }

  const qVec = queryVector(queryTokens);

  // Score each document
  const scored = documentVectors.map(doc => {
    const dVec = docTfidfVector(doc.tf);
    const similarity = cosineSimilarity(qVec, dVec);
    return { entry: doc.entry, score: similarity };
  });

  // Sort by score descending, filter zero scores
  const results = scored
    .filter(r => r.score > 0.01)  // Minimum threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return results;
}

/**
 * Format vector search results into text context for AI prompt
 * @param {Array} results - Results from vectorSearch
 * @returns {string} Formatted context
 */
function formatVectorResults(results) {
  if (!results.length) {
    return 'No specific remedies found in the knowledge base for this query.';
  }

  return results.map((r, i) => {
    const e = r.entry;
    return `REMEDY ${i + 1} (relevance: ${(r.score * 100).toFixed(1)}%): ${e.disease}
Symptoms: ${e.symptoms ? e.symptoms.join(', ') : 'N/A'}
Herbal Remedies: ${e.herbal_remedies ? e.herbal_remedies.join('; ') : 'N/A'}
Ayurvedic Herbs: ${e.ayurvedic_herbs ? e.ayurvedic_herbs.join(', ') : 'N/A'}
Diet: ${e.diet_recommendations || 'N/A'}
Lifestyle: ${e.lifestyle_recommendations || 'N/A'}`;
  }).join('\n\n');
}

module.exports = { vectorSearch, formatVectorResults, tokenize, buildDocumentText };
