/**
 * Safety Layer Service — Critical Symptom Detection Engine
 * 
 * Detects dangerous symptoms and overrides AI responses
 * with immediate medical advice. Categorizes severity into
 * CRITICAL, URGENT, and MODERATE levels.
 */

// ============================================================
// SEVERITY LEVELS
// ============================================================
const SEVERITY = {
  CRITICAL: 'CRITICAL',   // Life-threatening — call emergency immediately
  URGENT: 'URGENT',       // Needs immediate medical attention
  MODERATE: 'MODERATE'    // Should see a doctor soon
};

// ============================================================
// DANGEROUS SYMPTOM PATTERNS
// ============================================================
const CRITICAL_PATTERNS = [
  // Cardiac emergencies
  { pattern: /chest\s*pain/i, condition: 'Possible cardiac emergency' },
  { pattern: /heart\s*attack/i, condition: 'Suspected heart attack' },
  { pattern: /cardiac\s*arrest/i, condition: 'Cardiac arrest' },
  { pattern: /irregular\s*heart/i, condition: 'Cardiac arrhythmia' },
  
  // Neurological emergencies
  { pattern: /stroke/i, condition: 'Suspected stroke' },
  { pattern: /unconscious/i, condition: 'Loss of consciousness' },
  { pattern: /seizure|convulsion/i, condition: 'Seizure episode' },
  { pattern: /paralysis|cannot\s*move/i, condition: 'Possible paralysis' },
  { pattern: /faint(ing|ed)?|collapse/i, condition: 'Fainting/collapse' },
  
  // Respiratory emergencies
  { pattern: /cannot\s*breathe|can'?t\s*breathe/i, condition: 'Breathing difficulty' },
  { pattern: /choking/i, condition: 'Choking' },
  { pattern: /drowning/i, condition: 'Drowning incident' },
  
  // Trauma
  { pattern: /severe\s*bleeding|heavy\s*bleeding/i, condition: 'Severe hemorrhage' },
  { pattern: /severe\s*burn/i, condition: 'Severe burn injury' },
  { pattern: /electric\s*shock/i, condition: 'Electric shock' },
  { pattern: /blood\s*vomit|vomiting\s*blood/i, condition: 'Hematemesis' },
  
  // Poisoning
  { pattern: /poison(ing|ed)?/i, condition: 'Poisoning' },
  { pattern: /overdose/i, condition: 'Drug overdose' },
  { pattern: /anaphylaxis|severe\s*allergic/i, condition: 'Anaphylactic reaction' },
  
  // Mental health crisis
  { pattern: /suicid(e|al)/i, condition: 'Suicidal ideation — mental health crisis' },
  { pattern: /self\s*harm/i, condition: 'Self-harm risk' }
];

const URGENT_PATTERNS = [
  { pattern: /high\s*fever.*child|child.*high\s*fever/i, condition: 'High fever in child' },
  { pattern: /fever.*10[3-5]|10[3-5].*fever/i, condition: 'Dangerously high fever' },
  { pattern: /difficulty\s*breathing|breathless/i, condition: 'Respiratory distress' },
  { pattern: /severe\s*headache|worst\s*headache/i, condition: 'Severe headache' },
  { pattern: /severe\s*abdominal|severe\s*stomach/i, condition: 'Acute abdominal pain' },
  { pattern: /blood\s*in\s*(stool|urine)/i, condition: 'Internal bleeding signs' },
  { pattern: /sudden\s*vision\s*loss/i, condition: 'Sudden vision loss' },
  { pattern: /broken\s*bone|fracture/i, condition: 'Possible fracture' },
  { pattern: /severe\s*dehydration/i, condition: 'Severe dehydration' },
  { pattern: /diabetic\s*emergency|sugar\s*(very\s*)?(high|low)/i, condition: 'Diabetic emergency' }
];

const MODERATE_PATTERNS = [
  { pattern: /persistent\s*vomiting/i, condition: 'Persistent vomiting' },
  { pattern: /fever.*3\s*days|three\s*days.*fever/i, condition: 'Prolonged fever' },
  { pattern: /infection|infected/i, condition: 'Possible infection' },
  { pattern: /swelling.*face|face.*swelling/i, condition: 'Facial swelling' },
  { pattern: /rash.*spread|spreading\s*rash/i, condition: 'Spreading rash' },
  { pattern: /cannot\s*eat|unable\s*to\s*eat/i, condition: 'Inability to eat' },
  { pattern: /chest\s*tightness/i, condition: 'Chest tightness' }
];

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Analyze user input for dangerous symptoms
 * @param {string} text - User input text (in English)
 * @returns {Object|null} { severity, condition, message } or null if safe
 */
function analyzeSafety(text) {
  if (!text || text.trim().length === 0) return null;

  // Check CRITICAL patterns first
  for (const { pattern, condition } of CRITICAL_PATTERNS) {
    if (pattern.test(text)) {
      return {
        severity: SEVERITY.CRITICAL,
        condition,
        message: buildCriticalResponse(condition),
        shouldOverride: true  // Override any AI response
      };
    }
  }

  // Check URGENT patterns
  for (const { pattern, condition } of URGENT_PATTERNS) {
    if (pattern.test(text)) {
      return {
        severity: SEVERITY.URGENT,
        condition,
        message: buildUrgentResponse(condition),
        shouldOverride: true
      };
    }
  }

  // Check MODERATE patterns
  for (const { pattern, condition } of MODERATE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        severity: SEVERITY.MODERATE,
        condition,
        message: buildModerateResponse(condition),
        shouldOverride: false  // Can append to AI response
      };
    }
  }

  return null; // No dangerous symptoms detected
}

/**
 * Build response for CRITICAL severity
 */
function buildCriticalResponse(condition) {
  return `🚨 EMERGENCY — ${condition}

I'm very concerned about what you're describing. This sounds like it could be a serious medical emergency, and home remedies are NOT appropriate here.

Please take these steps RIGHT NOW:
1. Call emergency services immediately — dial 112 (India) or your local emergency number
2. If someone is with you, ask them to help
3. Do NOT attempt any home treatments for this condition
4. If at a hospital, go to the Emergency Room immediately

Your safety is the absolute priority. Please seek professional medical help right away. I'll be here when you're feeling better. 🙏

⚠️ DISCLAIMER: This is an AI health assistant. In any life-threatening situation, always prioritize professional emergency medical services.`;
}

/**
 * Build response for URGENT severity
 */
function buildUrgentResponse(condition) {
  return `⚠️ URGENT MEDICAL ATTENTION NEEDED — ${condition}

What you're describing needs proper medical evaluation as soon as possible. While I specialize in home remedies and traditional wellness guidance, this particular situation goes beyond what home remedies can safely address.

I strongly recommend:
1. Visit your nearest doctor or hospital within the next few hours
2. Do not ignore these symptoms — they can worsen quickly
3. If symptoms escalate, call 112 (emergency services) immediately

Please see a healthcare professional today. Your health comes first, and a qualified doctor needs to assess you properly. 🏥

⚠️ DISCLAIMER: This AI assistant provides general wellness guidance only. It is not a substitute for professional medical diagnosis or treatment.`;
}

/**
 * Build response for MODERATE severity
 */
function buildModerateResponse(condition) {
  return `I notice you're describing something that sounds like it could be ${condition}. While I can share some traditional wellness tips, I'd really recommend seeing a doctor if this has been going on for a while or is getting worse. A professional can give you the right diagnosis and treatment plan. In the meantime, let me share what traditional wisdom suggests...`;
}

/**
 * Get severity level description
 * @param {string} severity 
 * @returns {string}
 */
function getSeverityDescription(severity) {
  switch (severity) {
    case SEVERITY.CRITICAL: return 'Life-threatening — immediate emergency response required';
    case SEVERITY.URGENT: return 'Requires urgent medical attention within hours';
    case SEVERITY.MODERATE: return 'Should consult a doctor soon';
    default: return 'No immediate danger detected';
  }
}

module.exports = { analyzeSafety, SEVERITY, getSeverityDescription };
