/**
 * AI Engine Service — Gemini-powered conversational health companion
 * Uses RAG-retrieved remedies + conversational system prompt
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Emergency keywords that trigger immediate medical warning
const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'stroke', 'unconscious', 'seizure',
  'severe bleeding', 'cannot breathe', 'breathing difficulty', 'suicide',
  'poisoning', 'overdose', 'accident', 'paralysis', 'fainting',
  'blood vomit', 'severe burn', 'electric shock', 'drowning',
  'anaphylaxis', 'choking', 'collapse', 'emergency'
];

/**
 * Check if input contains emergency keywords
 */
function isEmergency(text) {
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Build the conversational system prompt
 */
function buildSystemPrompt(remediesContext, allergies) {
  return `You are MediGuide — a warm, caring, and knowledgeable health companion specializing in Traditional Indian Home Remedies (Ayurveda, Siddha, and Patti Vaithiyam/Nattupura Maruthuvam).

YOUR PERSONALITY:
- You speak like a caring elder or a trusted family friend — warm, empathetic, and reassuring.
- You weave remedies naturally into conversation — never present them as cold bullet-point lists.
- Your tone is conversational, gentle, and encouraging.

RETRIEVED REMEDIES FROM KNOWLEDGE BASE:
${remediesContext}

USER'S KNOWN ALLERGIES: ${allergies.length > 0 ? allergies.join(', ') : 'None reported'}

STRICT RULES:
1. NEVER use markdown headings (##), bullet points (- or *), or numbered lists. Write in flowing, natural paragraphs.
2. ALLERGY SAFETY: If any remedy ingredient matches the user's allergies (${allergies.join(', ')}), DO NOT mention that remedy at all. Suggest a safe alternative instead.
3. Naturally weave in 1-3 relevant remedies from the knowledge base above. Don't dump all information at once.
4. Suggest seeing a doctor organically within the conversation — like a caring friend would — not as a formal disclaimer block.
5. Keep your response concise (3-5 short paragraphs maximum). Don't write an essay.
6. End with a brief, warm disclaimer like: "Of course, this is just traditional wisdom passed down through generations — if things don't improve in a day or two, do visit a doctor, okay?"
7. If the user's query doesn't match any health condition, politely say you specialize in health-related guidance and ask if they have any health concerns.
8. DO NOT diagnose. You suggest home remedies and lifestyle changes, not medical diagnoses.`;
}

/**
 * Generate AI response using Gemini
 * @param {string} userInput - User message (in English, already translated)
 * @param {string} remediesContext - Formatted remedies from RAG engine
 * @param {Array<string>} allergies - User's allergies
 * @returns {Promise<string>} Generated response text
 */
async function generateResponse(userInput, remediesContext, allergies) {
  // Check for emergency first
  if (isEmergency(userInput)) {
    return `I'm really concerned about what you're describing — this sounds like it could be a medical emergency. Please don't rely on home remedies for this. Call your local emergency number (112 in India) or get to the nearest hospital right away. If someone is with you, ask them to help. Your safety comes first, and a doctor needs to see you immediately. I'll be here when you're feeling better. 🙏`;
  }

  const apiKey = process.env.GEMINI_API_KEY || '';
  const backupKey = process.env.GEMINI_API_KEY_BACKUP || '';

  if (!apiKey && !backupKey) {
    throw new Error('No Gemini API key configured');
  }

  // Try primary key, then backup
  const keysToTry = [apiKey, backupKey].filter(k => k.length > 0);

  for (const key of keysToTry) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

      const systemPrompt = buildSystemPrompt(remediesContext, allergies);

      const result = await model.generateContent([
        { text: systemPrompt },
        { text: `User says: ${userInput}` }
      ]);

      const responseText = result.response.text();
      return responseText;
    } catch (err) {
      console.error(`[AI Engine] Gemini call failed with key ${key.substring(0, 10)}...:`, err.message);
      // Try next key
      continue;
    }
  }

  // All keys failed
  throw new Error('All Gemini API keys failed');
}

module.exports = { generateResponse, isEmergency };
