/**
 * Language Detection & Translation Service
 * Supports: English (en), Tamil (ta), Hindi (hi)
 * Uses google-translate-api-x for translation (free, no API key)
 */

let translate;
try {
  translate = require('google-translate-api-x');
} catch (err) {
  console.warn('[Lang] google-translate-api-x not installed. Translation will be limited.');
  translate = null;
}

// Tamil Unicode range: U+0B80 – U+0BFF
const TAMIL_REGEX = /[\u0B80-\u0BFF]/;

// Hindi/Devanagari Unicode range: U+0900 – U+097F
const HINDI_REGEX = /[\u0900-\u097F]/;

// Romanized Hindi keyword patterns
const HINDI_ROMANIZED = /\b(mujhe|mera|hai|hain|dard|bukhar|khansi|sardi|pet|sir|jod|raha|rahi|bahut|thoda|aur|ka|ki|ke|nahi|kya|chahiye|lagta|lagti|bukhaar|peth|rog|bimari|dawai|ilaj|upay)\b/i;

// Romanized Tamil keyword patterns 
const TAMIL_ROMANIZED = /\b(enakku|ennaku|enna|irukkuthu|irukku|vali|kaichal|irumal|sali|vayiru|thalai|moottu|udambu|marundhu|vaithiyam|nalla|sari|illai|romba|konjam|thalaivali|eppadi|yenna)\b/i;

/**
 * Detect the language of user input
 * @param {string} text - User input text
 * @returns {string} Language code: 'en', 'ta', or 'hi'
 */
function detectLanguage(text) {
  // Count script characters
  const tamilChars = (text.match(/[\u0B80-\u0BFF]/g) || []).length;
  const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;

  // If significant non-Latin script is present, use that
  if (tamilChars > 2) return 'ta';
  if (hindiChars > 2) return 'hi';

  // Check for even a single script character
  if (TAMIL_REGEX.test(text)) return 'ta';
  if (HINDI_REGEX.test(text)) return 'hi';

  // Check romanized patterns
  const textLower = text.toLowerCase();
  const tamilRomanMatch = (textLower.match(TAMIL_ROMANIZED) || []).length;
  const hindiRomanMatch = (textLower.match(HINDI_ROMANIZED) || []).length;

  if (tamilRomanMatch > hindiRomanMatch && tamilRomanMatch > 0) return 'ta';
  if (hindiRomanMatch > tamilRomanMatch && hindiRomanMatch > 0) return 'hi';

  // Default to English
  return 'en';
}

/**
 * Translate text to English
 * @param {string} text - Input text
 * @param {string} fromLang - Source language code
 * @returns {Promise<string>} English translation
 */
async function translateToEnglish(text, fromLang) {
  if (fromLang === 'en') return text;

  if (!translate) {
    console.warn('[Lang] Translator not available, returning original text');
    return text;
  }

  try {
    const result = await translate(text, { from: fromLang, to: 'en' });
    console.log(`[Lang] Translated (${fromLang}→en): "${text}" → "${result.text}"`);
    return result.text;
  } catch (err) {
    console.error('[Lang] Translation to English failed:', err.message);
    return text; // Fallback: return original
  }
}

/**
 * Translate text back to the detected language
 * @param {string} text - English text
 * @param {string} toLang - Target language code
 * @returns {Promise<string>} Translated text
 */
async function translateBack(text, toLang) {
  if (toLang === 'en') return text;

  if (!translate) {
    console.warn('[Lang] Translator not available, returning English text');
    return text;
  }

  try {
    const result = await translate(text, { from: 'en', to: toLang });
    console.log(`[Lang] Translated (en→${toLang}): response translated successfully`);
    return result.text;
  } catch (err) {
    console.error(`[Lang] Translation to ${toLang} failed:`, err.message);
    return text; // Fallback: return English
  }
}

module.exports = { detectLanguage, translateToEnglish, translateBack };
