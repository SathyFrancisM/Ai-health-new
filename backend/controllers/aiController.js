const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');

// Initialize Gemini with API Key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const FALLBACK_DATABASE = {
  "cough": "For a cough, a traditional remedy is Ginger & Honey: Mix ginger juice (Adrak) with honey and consume twice a day. Also, try Turmeric Milk (Haldi Doodh) before bed to soothe the throat.",
  "fever": "For fever (Bukhaar), Tulsi Tea is highly effective: Boil 10-12 Holy Basil leaves in water and drink warm. Giloy juice (Amrita) also helps boost immunity and lower body temperature.",
  "stomach": "For stomach issues like bloating or gas, try Ajwain (Carom seeds) & Black Salt with warm water. Drinking Ginger water (Adrak Jal) after meals also helps with digestion.",
  "headache": "For a headache (Sir Dard), massage Peppermint or Eucalyptus oil onto your temples. Applying a Cinnamon (Dalchini) paste on the forehead can also provide instant relief.",
  "cold": "For a cold (Sardi), Steam Inhalation with Eucalyptus oil or Ajwain leaves is best. Drinking warm Pepper Soup (Rasam) can clear nasal congestion.",
  "skin": "For minor skin irritations or burns, apply fresh Aloe Vera gel (Gritkumari) or a Neem leaf paste to the affected area.",
  "joint": "For joint pain, a massage with warm Sesame oil (Til ka tel) infused with Garlic (Lasun) is traditionally used in Ayurveda."
};

const FALLBACK_DATABASE_TA = {
  "cough": "இருமலுக்கு ஒரு சிறந்த நாட்டு மருந்து இஞ்சி மற்றும் தேன்: இஞ்சி சாற்றை தேனுடன் கலந்து தினமும் இரண்டு முறை குடிக்கவும். தொண்டைக்கு இதமளிக்க இரவில் மஞ்சள் பால் குடிக்கலாம்.",
  "fever": "காய்ச்சலுக்கு துளசி தேநீர் சிறந்தது: 10-12 துளசி இலைகளை நீரில் கொதிக்க வைத்து குடிக்கவும். நிலவேம்பு கசாயம் காய்ச்சலை தணிக்க உதவும்.",
  "stomach": "வயிறு உப்புசம் அல்லது வாயு தொல்லைக்கு, சுடுநீரில் ஓமம் மற்றும் இந்துப்பு கலந்து குடிக்கவும். உணவு உண்ட பின் இஞ்சி நீர் குடிப்பது செரிமானத்திற்கு உதவும்.",
  "headache": "தலைவலிக்கு, புதினா அல்லது நீலகிரி தைலத்தை தடவி மசாஜ் செய்யவும். தலையில் பட்டை பொடியை பற்று போடுவது உடனடி நிவாரணம் தரும்.",
  "cold": "சளிக்கு, யூக்கலிப்டஸ் எண்ணெய் அல்லது ஓம இலைகளை கொண்டு ஆவி பிடிப்பது நன்று. சூடான மிளகு ரசம் குடிப்பது மூக்கடைப்பை போக்கும்.",
  "skin": "சரும எரிச்சல் அல்லது சிறு காயங்களுக்கு, சுத்தமான கற்றாழை சாறு அல்லது வேப்பிலை அரைத்து தடவவும்.",
  "joint": "மூட்டு வலிக்கு, பூண்டு கலந்த வெதுவெதுப்பான நல்லெண்ணெய் கொண்டு மசாஜ் செய்வது ஆயுர்வேதத்தில் சிறந்தது."
};

exports.getConsultation = async (req, res) => {
  try {
    const { message, userId, allergies } = req.body;
    const msgLower = message.toLowerCase();
    
    // Check API Key
    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;
    
    // --- DATABASE & ALLERGY PROCESSING ---
    let user = null;
    if (userId !== 'demo_user_id' && process.env.IS_DEMO_MODE !== 'true' && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    
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

    // --- DEMO/FALLBACK LOGIC HELPER ---
    const getFallbackResponse = () => {
      let responseText = "";
      let found = false;
      let detectedLang = "en"; // Default

      // Multi-lingual Symptom Mapper (English, Hindi, Tamil — romanized AND native script)
      const SYMPTOM_MAP = {
        "cough":    ["cough", "khansi", "irumal", "இருமல்", "இருமல்", "இருமல்", "தொண்டை"],
        "fever":    ["fever", "bukhaar", "bukhar", "kaichal", "காய்ச்சல்", "காய்சல்", "உடல்வெப்பம்"],
        "stomach":  ["stomach", "peth", "pet dard", "vayiru", "digestion", "gas", "வயிறு", "வயிறுவலி", "வாயு"],
        "headache": ["headache", "sir dard", "thalai vali", "தலைவலி", "தலை வலி"],
        "cold":     ["cold", "sardi", "jaladosham", "சளி", "ஜலதோஷம்", "மூக்கடைப்பு"],
        "skin":     ["skin", "burn", "twacha", "thol", "rash", "தோல்", "எரிச்சல்", "சரும"],
        "joint":    ["joint", "knee", "pain", "jod", "moottu vali", "மூட்டு", "மூட்டுவலி", "முழங்கால்"]
      };

      // Language detection: check Tamil Unicode block (U+0B80–U+0BFF) first — most reliable!
      const hasTamilScript = /[\u0B80-\u0BFF]/.test(message);
      if (hasTamilScript) {
        detectedLang = "ta";
      } else if (/(bukhaar|khansi|peth|sir dard|sardi|mujhe|hai)/i.test(msgLower)) {
        detectedLang = "hi";
      } else if (/(kaichal|irumal|vayiru|thalai vali|jaladosham|enakku)/i.test(msgLower)) {
        detectedLang = "ta";
      }

      // Also do keyword matching against the original message (not lowercased) for Tamil Unicode
      const msgForMatch = message + " " + msgLower;

      // Alternative safe options if an allergy matches
      const ALLERGY_ALTERNATIVES = {
        "cough": "Since you mentioned an allergy, a very safe traditional alternative for a cough is slowly chewing on a clove (Laung) or drinking warm water with a pinch of Turmeric (Haldi).",
        "fever": "Taking your allergy into consideration, a gentle alternative for fever is placing a damp cloth on the forehead and drinking plain warm water infused with coriander seeds (Dhania) to naturally cool the body.",
        "stomach": "With your allergy in mind, a safe alternative for stomach issues is drinking a mild concoction of cumin seeds (Jeera) boiled in water.",
        "headache": "Considering your allergy, try applying a simple sandalwood (Chandan) paste on your forehead to cool your body and relieve tension.",
        "cold": "Due to your allergy, simply inhaling plain hot water steam and drinking warm water regularly is a safe and effective way to clear congestion."
      };

      const ALLERGY_ALTERNATIVES_TA = {
        "cough": "உங்களுக்கு ஒவ்வாமை உள்ளதால், ஒரு கிராம்பை மென்று சாப்பிடுவது அல்லது மஞ்சள் கலந்த சுடுநீரை குடிப்பது இருமலுக்கு பாதுகாப்பான மாற்று வழியாகும்.",
        "fever": "உங்கள் ஒவ்வாமையை கருத்தில் கொண்டு, காய்ச்சலுக்கு பாதுகாப்பான மாற்று வழி நெற்றியில் ஈரத்துணியை வைப்பதும் மற்றும் கொத்தமல்லி விதைகளை சுடுநீரில் கொதிக்க வைத்து குடிப்பதும் ஆகும்.",
        "stomach": "உங்களுக்கு ஒவ்வாமை உள்ளதால், சீரகத்தை சுடுநீரில் கொதிக்க வைத்து குடிப்பது வயிற்றுப் பிரச்சனைகளுக்கு பாதுகாப்பான வழியாகும்.",
        "headache": "உங்கள் ஒவ்வாமையை கருத்தில் கொண்டு, தலைவலிக்கு சந்தனத்தை நெற்றியில் பற்று போடுவது உடலை குளிர்ச்சி அடையச் செய்யும்.",
        "cold": "உங்கள் ஒவ்வாமை காரணமாக, வெறும் வெந்நீரில் ஆவி பிடிப்பது மற்றும் சூடான நீரை அடிக்கடி குடிப்பது சளியை அகற்ற சிறந்த பாதுகாப்பான வழியாகும்."
      };

      // Also map English allergy ingredients to Tamil to ensure the `.includes` check works when searching the TN database!
      const isAllergicCheck = (dbVal, allergyArr) => {
         // Simple allergy detector across both languages given our dataset
         return allergyArr.some(allergy => dbVal.toLowerCase().includes(allergy) || (allergy === 'ginger' && dbVal.includes('இஞ்சி')) || (allergy === 'honey' && dbVal.includes('தேன்')));
      }

      for (const [key, keywords] of Object.entries(SYMPTOM_MAP)) {
        if (keywords.some(kw => msgForMatch.includes(kw))) {
          const valueEN = FALLBACK_DATABASE[key];
          const valueTA = FALLBACK_DATABASE_TA[key];
          
          if (detectedLang === "hi") responseText += "Namaste! ";
          if (detectedLang === "ta") responseText += "Vanakkam! ";

          // Check if user is allergic to an ingredient in the standard fallback
          const isAllergic = isAllergicCheck(valueEN, normalizedAllergies);
          
          if (isAllergic) {
             if (detectedLang === "ta") {
                 responseText += `இந்த தீர்வு உங்களுக்கு ஒவ்வாமையை ஏற்படுத்த வாய்ப்புள்ளது. ஆதால், `;
                 responseText += ALLERGY_ALTERNATIVES_TA[key] || "பாதுகாப்பிற்காக மருத்துவரை அணுகவும்.";
             } else {
                 responseText += `I noticed you have an allergy that conflicts with our usual remedy for a ${key}. `;
                 responseText += ALLERGY_ALTERNATIVES[key] || "Please consult a professional, as I want to keep you perfectly safe.";
             }
          } else {
             responseText += detectedLang === "ta" ? valueTA : valueEN;
          }
          found = true;
          break;
        }
      }

      if (!found) {
        if (detectedLang === "hi") {
            responseText += "Kshama karein (Sorry), ";
            if (normalizedAllergies.length > 0) responseText += "I see you're asking about something specific! Given your allergies, please consult a professional.";
            else responseText += "I see you're asking about something specific! Please stick to light food and consult a local Ayurvedic practitioner.";
        } else if (detectedLang === "ta") {
            responseText += "மன்னிக்கவும், ";
            if (normalizedAllergies.length > 0) responseText += "உங்கள் ஒவ்வாமைகளை கருத்தில் கொண்டு, தயவுசெய்து ஒரு மருத்துவரை அணுகவும்.";
            else responseText += "உங்கள் கேள்விக்கு சரியான தீர்வை இப்போது தர இயலவில்லை. தயவுசெய்து ஒரு மருத்துவரை அணுகவும்.";
        } else {
            // English default
            if (normalizedAllergies.length > 0) {
                responseText += `I see you're asking about something specific! Given your allergy to ${normalizedAllergies.join(', ')}, please stick to light food and consult a local Ayurvedic practitioner.`;
            } else {
                responseText += "I see you're asking about something specific! For now, please stick to light food and consult a local Ayurvedic practitioner.";
            }
        }
      }
      
      return responseText;
    };



    // If no API key, use fallback immediately
    if (!apiKey) {
      return res.json({ text: getFallbackResponse("I'm in 'Demo Mode' because the API Key is missing."), remedy: null });
    }

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
      You are MediGuide, a specialized AI Health Assistant focusing on TRADITIONAL INDIAN HOME REMEDIES (Ayurveda/Patti Vaithiyam).
      
      KNOWLEDGE BASE:
      ${knowledgeBase}

      USER PROFILE:
      - Known Allergies: ${normalizedAllergies.join(', ') || 'None reported'}
      
      INSTRUCTIONS:
      1. Use the KNOWLEDGE BASE above to suggest traditional remedies.
      2. CRITICAL ALLERGY FILTER: NEVER suggest a remedy that contains any ingredient the user is allergic to (${normalizedAllergies.join(', ')}). 
      3. If a remedy from the knowledge base contains an allergen, DO NOT mention it. Instead, suggest an alternative or say you cannot provide a safe remedy for their specific case.
      4. Use common Indian names for ingredients (e.g., Haldi instead of just Turmeric, Tulsi instead of Basil) where appropriate.
      5. Always include a medical disclaimer: "This is not a medical diagnosis. Consult a doctor for serious issues."
      6. Be empathetic, practical, and clear.
      7. CRITICAL LANGUAGE RULE: If the user explicitly asks or speaks in Tamil (e.g. using Tamil words), you MUST reply IN TAMIL language natively. If they speak Hindi, reply in Hindi.
    `;

    // 3. Generate Response (Generation)
    try {
        const genAIInstance = new GoogleGenerativeAI(apiKey);
        // Using 'gemini-1.5-flash-latest' to be more resilient to versioning changes
        const model = genAIInstance.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        
        const result = await model.generateContent([
          { text: systemPrompt },
          { text: `User Message: ${message}` }
        ]);
        
        const responseText = result.response.text();
        return res.json({ text: responseText, remedy: null });
    } catch (aiErr) {
        console.error("Gemini API Error:", aiErr.message);
        // Robust fallback if AI fails
        return res.json({ 
            text: getFallbackResponse("I'm having trouble connecting to my deep intelligence system."), 
            remedy: null 
        });
    }

  } catch (err) {
    console.error("Controller Error:", err.message);
    res.status(500).json({ msg: 'Internal Server Error' });
  }
};
