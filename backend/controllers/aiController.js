const mongoose = require('mongoose');
const User = require('../models/User');

// Import new services
const { detectLanguage, translateToEnglish, translateBack } = require('../services/lang');
const { retrieve, formatRemediesContext } = require('../services/rag_engine');
const { generateResponse, isEmergency } = require('../services/ai');

// ============================================================
// FALLBACK DATABASE (used when API keys are missing or fail)
// ============================================================
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

/**
 * Main Consultation Handler — NEW AI PIPELINE
 * 
 * Flow:
 *   User Input
 *   → detectLanguage(input)
 *   → translateToEnglish(input, detectedLang)
 *   → RAG retrieve(englishInput)
 *   → generateResponse(englishInput, remedies, allergies)
 *   → translateBack(aiResponse, detectedLang)
 *   → Return { text: translatedResponse }
 */
exports.getConsultation = async (req, res) => {
  try {
    const { message, userId, allergies } = req.body;

    if (!message || message.trim().length === 0) {
      return res.json({ text: "I'd love to help! Could you describe your symptoms or health concern?", remedy: null });
    }

    // --- ALLERGY PROCESSING ---
    let user = null;
    if (userId !== 'demo_user_id' && process.env.IS_DEMO_MODE !== 'true' && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        user = await User.findById(userId);
      } catch (dbErr) {
        console.warn('[AI Controller] DB lookup failed:', dbErr.message);
      }
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

    // --- CHECK API KEY ---
    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : null;

    if (!apiKey) {
      console.log('[AI Controller] No API key — using fallback');
      return res.json({ text: getFallbackResponse(message, normalizedAllergies), remedy: null });
    }

    // ============================================================
    // NEW AI PIPELINE
    // ============================================================

    // Step 1: Detect language
    const detectedLang = detectLanguage(message);
    console.log(`[Pipeline] Language detected: ${detectedLang}`);

    // Step 2: Translate to English (if needed)
    let englishInput = message;
    if (detectedLang !== 'en') {
      englishInput = await translateToEnglish(message, detectedLang);
      console.log(`[Pipeline] Translated input: "${englishInput}"`);
    }

    // Step 3: RAG retrieval
    const retrievedRemedies = retrieve(englishInput);
    const remediesContext = formatRemediesContext(retrievedRemedies);
    console.log(`[Pipeline] RAG returned ${retrievedRemedies.length} remedies`);

    // Step 4: Generate AI response
    let aiResponse;
    try {
      aiResponse = await generateResponse(englishInput, remediesContext, normalizedAllergies);
    } catch (aiErr) {
      console.error('[Pipeline] AI generation failed:', aiErr.message);
      return res.json({ text: getFallbackResponse(message, normalizedAllergies), remedy: null });
    }

    // Step 5: Translate back (if needed)
    let finalResponse = aiResponse;
    if (detectedLang !== 'en') {
      finalResponse = await translateBack(aiResponse, detectedLang);
      console.log(`[Pipeline] Response translated back to ${detectedLang}`);
    }

    return res.json({ text: finalResponse, remedy: null });

  } catch (err) {
    console.error('[AI Controller] Error:', err.message);
    res.status(500).json({ msg: 'Internal Server Error' });
  }
};

// ============================================================
// FALLBACK LOGIC (preserved from original — used when AI unavailable)
// ============================================================
function getFallbackResponse(message, normalizedAllergies) {
  const msgLower = message.toLowerCase();
  let responseText = "";
  let found = false;
  let detectedLang = "en";

  const SYMPTOM_MAP = {
    "cough":    ["cough", "khansi", "irumal", "இருமல்", "தொண்டை"],
    "fever":    ["fever", "bukhaar", "bukhar", "kaichal", "காய்ச்சல்", "உடல்வெப்பம்"],
    "stomach":  ["stomach", "peth", "pet dard", "vayiru", "digestion", "gas", "வயிறு", "வாயு"],
    "headache": ["headache", "sir dard", "thalai vali", "தலைவலி", "தலை வலி"],
    "cold":     ["cold", "sardi", "jaladosham", "சளி", "ஜலதோஷம்", "மூக்கடைப்பு"],
    "skin":     ["skin", "burn", "twacha", "thol", "rash", "தோல்", "எரிச்சல்", "சரும"],
    "joint":    ["joint", "knee", "pain", "jod", "moottu vali", "மூட்டு", "முழங்கால்"]
  };

  const hasTamilScript = /[\u0B80-\u0BFF]/.test(message);
  if (hasTamilScript) {
    detectedLang = "ta";
  } else if (/(bukhaar|khansi|peth|sir dard|sardi|mujhe|hai)/i.test(msgLower)) {
    detectedLang = "hi";
  } else if (/(kaichal|irumal|vayiru|thalai vali|jaladosham|enakku)/i.test(msgLower)) {
    detectedLang = "ta";
  }

  const msgForMatch = message + " " + msgLower;

  for (const [key, keywords] of Object.entries(SYMPTOM_MAP)) {
    if (keywords.some(kw => msgForMatch.includes(kw))) {
      const valueEN = FALLBACK_DATABASE[key];
      const valueTA = FALLBACK_DATABASE_TA[key];

      if (detectedLang === "hi") responseText += "Namaste! ";
      if (detectedLang === "ta") responseText += "Vanakkam! ";

      const isAllergic = normalizedAllergies.some(allergy =>
        valueEN.toLowerCase().includes(allergy)
      );

      if (isAllergic) {
        responseText += `I noticed you have an allergy that conflicts with our usual remedy for ${key}. Please consult a professional for a safe alternative.`;
      } else {
        responseText += detectedLang === "ta" ? valueTA : valueEN;
      }
      found = true;
      break;
    }
  }

  if (!found) {
    if (detectedLang === "ta") {
      responseText += "மன்னிக்கவும், உங்கள் கேள்விக்கு சரியான தீர்வை இப்போது தர இயலவில்லை. தயவுசெய்து ஒரு மருத்துவரை அணுகவும்.";
    } else if (detectedLang === "hi") {
      responseText += "Kshama karein, I see you're asking about something specific! Please consult a local Ayurvedic practitioner.";
    } else {
      responseText += "I see you're asking about something specific! For now, please stick to light food and consult a local Ayurvedic practitioner.";
    }
  }

  responseText += "\n\n(Note: I'm currently in limited mode. The full AI experience will be available shortly.)";
  return responseText;
}
