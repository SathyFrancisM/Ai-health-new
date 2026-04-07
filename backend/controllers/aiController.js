const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');

// Initialize Gemini with API Key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const FALLBACK_DATABASE = {
  "cough": "For a cough, a traditional remedy is Ginger & Honey: Mix ginger juice with honey and consume twice a day. Also, try Turmeric Milk before bed.",
  "fever": "For fever, Tulsi Tea is highly effective: Boil tulsi leaves in water and drink throughout the day. Giloy juice also helps boost immunity.",
  "stomach": "For stomach issues, try Ajwain & Black Salt with warm water. Ginger water after meals also helps with digestion.",
  "headache": "For a headache, massage Peppermint or Eucalyptus oil onto your temples. A cinnamon paste on the forehead can also provide relief.",
  "cold": "For a cold, Steam Inhalation with eucalyptus oil is best. Drinking warm Pepper Soup (Rasam) can clear congestion."
};

// GoogleGenerativeAI is required at the top

exports.getConsultation = async (req, res) => {
  try {
    const { message, userId, allergies } = req.body;
    const msgLower = message.toLowerCase();
    
    // Check API Key
    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
    
    // --- SMART FALLBACK START ---
    if (!apiKey) {
      let responseText = "I'm in 'Demo Mode' because the API Key is missing. ";
      let found = false;

      for (const [key, value] of Object.entries(FALLBACK_DATABASE)) {
        if (msgLower.includes(key)) {
          responseText += value;
          found = true;
          break;
        }
      }

      if (!found) {
        responseText += "I see you're asking about something new! Once the Gemini API Key is added to the .env file, I'll be able to give you deep, AI-driven advice on almost any traditional remedy.";
      }
      
      return res.json({ text: responseText, remedy: null });
    }
    // --- SMART FALLBACK END ---

    // Initialize genAI with the confirmed API key
    const genAI = new GoogleGenerativeAI(apiKey);

    let user = null;
    if (userId !== 'demo_user_id' && process.env.IS_DEMO_MODE !== 'true' && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    
    // Process allergies
    let requestAllergies = [];
    if (typeof allergies === 'string') {
      requestAllergies = allergies.split(',').map(a => a.trim());
    } else if (Array.isArray(allergies)) {
      requestAllergies = allergies;
    }

    const dbAllergies = user ? (Array.isArray(user.allergies) ? user.allergies : [user.allergies]) : [];
    const combinedAllergies = [...new Set([...requestAllergies, ...dbAllergies])];
    const normalizedAllergies = combinedAllergies
      .filter(a => typeof a === 'string' && a.length > 0)
      .map(a => a.toLowerCase().trim());

    // --- RAG LOGIC START ---
    
    // 1. Load Knowledge Base (Retrieval)
    const knowledgePath = path.join(__dirname, '../data/knowledge.md');
    let knowledgeBase = "No extra knowledge base found.";
    try {
      knowledgeBase = fs.readFileSync(knowledgePath, 'utf8');
    } catch (err) {
      console.error("Could not read knowledge.md:", err);
    }

    // 2. Prepare System Prompt (Augmentation)
    const systemPrompt = `
      You are MediGuide, a specialized AI Health Assistant focusing on TRADITIONAL INDIAN HOME REMEDIES.
      
      KNOWLEDGE BASE:
      ${knowledgeBase}

      USER PROFILE:
      - Known Allergies: ${normalizedAllergies.join(', ') || 'None reported'}
      
      INSTRUCTIONS:
      1. Use the KNOWLEDGE BASE above to suggest traditional remedies (Ayurveda/Patti Vaithiyam).
      2. CRITICAL: NEVER suggest a remedy that contains any ingredient the user is allergic to.
      3. If the user's symptom is not in the knowledge base, use your general knowledge of SAFE Indian home remedies (herbs, spices, kitchen items).
      4. Support the language the user speaks in (English, Hindi, or Tamil/other Indian languages).
      5. Always include a medical disclaimer: "This is not a medical diagnosis. Consult a doctor for serious issues."
      6. Be empathetic, practical, and clear.
    `;

    // 3. Generate Response (Generation)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `User Message: ${message}` }
    ]);
    
    const responseText = result.response.text();
    
    // Send response
    res.json({ text: responseText, remedy: null });

  } catch (err) {
    console.error("AI Error:", err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
