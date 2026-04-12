/**
 * RAG Controller — Enhanced RAG endpoints with vector search + safety layer
 */

const { vectorSearch, formatVectorResults } = require('../services/rag_vector');
const { retrieve, formatRemediesContext } = require('../services/rag_engine');
const { analyzeSafety } = require('../services/safety');
const { generateResponse } = require('../services/ai');
const { detectLanguage, translateToEnglish, translateBack } = require('../services/lang');

/**
 * POST /api/rag/query
 * Enhanced RAG query with vector search + safety layer
 * Body: { query, allergies?, language? }
 */
exports.query = async (req, res) => {
  try {
    const { query, allergies = [], language } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Query is required',
        text: "Please describe your symptoms or health concern."
      });
    }

    // Step 1: Detect language
    const detectedLang = language || detectLanguage(query);

    // Step 2: Translate to English if needed
    let englishQuery = query;
    if (detectedLang !== 'en') {
      try {
        englishQuery = await translateToEnglish(query, detectedLang);
      } catch (err) {
        console.warn('[RAG] Translation failed, using original:', err.message);
      }
    }

    // Step 3: Safety check (CRITICAL — runs before any response generation)
    const safetyResult = analyzeSafety(englishQuery);
    if (safetyResult && safetyResult.shouldOverride) {
      let responseText = safetyResult.message;
      
      // Translate safety message if needed
      if (detectedLang !== 'en') {
        try {
          responseText = await translateBack(responseText, detectedLang);
        } catch (err) {
          // Safety messages should still be delivered even if translation fails
          console.warn('[RAG] Safety message translation failed');
        }
      }

      return res.json({
        text: responseText,
        safety: {
          triggered: true,
          severity: safetyResult.severity,
          condition: safetyResult.condition
        },
        remedies: [],
        language: detectedLang
      });
    }

    // Step 4: Vector search (enhanced) + keyword search (fallback)
    const vectorResults = vectorSearch(englishQuery, 3);
    const keywordResults = retrieve(englishQuery, 3);

    // Merge results, preferring vector search but including unique keyword results
    const seenDiseases = new Set(vectorResults.map(r => r.entry.disease));
    const mergedRemedies = [
      ...vectorResults.map(r => r.entry),
      ...keywordResults.filter(r => !seenDiseases.has(r.disease))
    ].slice(0, 5);

    // Step 5: Format context
    const remediesContext = vectorResults.length > 0
      ? formatVectorResults(vectorResults)
      : formatRemediesContext(keywordResults);

    // Step 6: Generate AI response (if Gemini available)
    let responseText;
    const normalizedAllergies = (Array.isArray(allergies) ? allergies : [])
      .filter(a => typeof a === 'string' && a.length > 0)
      .map(a => a.toLowerCase().trim());

    try {
      responseText = await generateResponse(englishQuery, remediesContext, normalizedAllergies);
    } catch (aiErr) {
      console.warn('[RAG] AI generation failed, returning raw remedies:', aiErr.message);
      responseText = `Based on traditional knowledge:\n\n${remediesContext}`;
    }

    // Step 7: Append moderate safety warning if applicable
    if (safetyResult && !safetyResult.shouldOverride) {
      responseText = safetyResult.message + '\n\n' + responseText;
    }

    // Step 8: Translate back if needed
    if (detectedLang !== 'en') {
      try {
        responseText = await translateBack(responseText, detectedLang);
      } catch (err) {
        console.warn('[RAG] Response translation failed');
      }
    }

    return res.json({
      text: responseText,
      safety: safetyResult ? {
        triggered: true,
        severity: safetyResult.severity,
        condition: safetyResult.condition
      } : { triggered: false },
      remedies: mergedRemedies.map(r => ({
        disease: r.disease,
        symptoms: r.symptoms,
        herbalRemedies: r.herbal_remedies
      })),
      language: detectedLang
    });

  } catch (err) {
    console.error('[RAG Controller] query error:', err.message);
    res.status(500).json({ error: 'RAG service error', msg: err.message });
  }
};

/**
 * GET /api/rag/remedies
 * Browse the remedies database
 * Query: ?search=&page=&limit=
 */
exports.getRemedies = (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let results = require('../services/rag_engine').retrieve.__remediesDB || [];
    
    // If the internal DB isn't directly accessible, load it fresh
    if (!results || results.length === 0) {
      try {
        const fs = require('fs');
        const path = require('path');
        results = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/remedies.json'), 'utf8'));
      } catch (e) {
        results = [];
      }
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(r =>
        r.disease.toLowerCase().includes(searchLower) ||
        (r.symptoms && r.symptoms.some(s => s.toLowerCase().includes(searchLower)))
      );
    }

    // Paginate
    const total = results.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedResults = results.slice(startIndex, startIndex + limitNum);

    res.json({
      data: paginatedResults,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('[RAG Controller] getRemedies error:', err.message);
    res.status(500).json({ error: 'Failed to fetch remedies' });
  }
};

/**
 * GET /api/rag/remedies/:disease
 * Get specific disease remedies
 */
exports.getRemedyByDisease = (req, res) => {
  try {
    const diseaseName = req.params.disease.toLowerCase();
    
    let remediesDB = [];
    try {
      const fs = require('fs');
      const path = require('path');
      remediesDB = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/remedies.json'), 'utf8'));
    } catch (e) {
      return res.status(500).json({ error: 'Remedies database unavailable' });
    }

    const remedy = remediesDB.find(r => 
      r.disease.toLowerCase() === diseaseName ||
      r.disease.toLowerCase().includes(diseaseName)
    );

    if (!remedy) {
      return res.status(404).json({ error: 'Remedy not found for this condition' });
    }

    res.json(remedy);
  } catch (err) {
    console.error('[RAG Controller] getRemedyByDisease error:', err.message);
    res.status(500).json({ error: 'Failed to fetch remedy' });
  }
};
