/**
 * Consultation Service — Video + Chat session management
 * 
 * Handles session creation, token generation, chat messaging,
 * and consultation lifecycle. Uses mock tokens by default;
 * can integrate Agora/Twilio when API keys are provided.
 */

const crypto = require('crypto');

// ============================================================
// IN-MEMORY STORE (Demo Mode)
// ============================================================
let consultations = [];
let consultationCounter = 0;

// ============================================================
// TOKEN GENERATION
// ============================================================

/**
 * Generate a mock Agora-compatible token
 * In production, replace with actual Agora/Twilio token generation
 */
function generateSessionToken(channelName, userId) {
  const appId = process.env.AGORA_APP_ID || 'mock_agora_id';
  
  if (appId !== 'mock_agora_id' && process.env.AGORA_APP_CERTIFICATE) {
    // TODO: Integrate real Agora token generation
    // const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
    // return RtcTokenBuilder.buildTokenWithUid(appId, cert, channelName, 0, RtcRole.PUBLISHER, expirationTime);
    console.log('[Consultation] Real Agora integration pending');
  }

  // Mock token for demo
  return `mock_token_${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Generate a unique channel name for the consultation
 */
function generateChannelName(bookingId) {
  return `mediguide_${bookingId}_${Date.now()}`;
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

/**
 * Create a new consultation session from a booking
 * @param {Object} params - { bookingId, doctorId, patientId, type, doctorName, patientName }
 * @returns {Object} Created consultation
 */
function createSession({ bookingId, doctorId, patientId, type = 'video', doctorName, patientName }) {
  // Check if consultation already exists for this booking
  const existing = consultations.find(c => c.bookingId === bookingId && c.status !== 'cancelled');
  if (existing) {
    return { error: 'Consultation already exists for this booking', consultation: existing };
  }

  consultationCounter++;
  const channelName = generateChannelName(bookingId);
  
  const consultation = {
    id: `consult_${consultationCounter}_${Date.now()}`,
    bookingId,
    doctorId,
    patientId,
    doctorName: doctorName || 'Doctor',
    patientName: patientName || 'Patient',
    type,
    status: 'waiting',
    sessionToken: generateSessionToken(channelName, patientId),
    channelName,
    chatMessages: [
      {
        id: `msg_system_${Date.now()}`,
        sender: 'system',
        message: `Consultation session created. ${type === 'video' ? 'Video call' : 'Chat'} will begin when both parties join.`,
        timestamp: new Date().toISOString()
      }
    ],
    prescription: null,
    notes: null,
    diagnosis: null,
    startedAt: null,
    endedAt: null,
    duration: null,
    createdAt: new Date().toISOString()
  };

  consultations.push(consultation);
  return { success: true, consultation };
}

/**
 * Join a consultation session
 * @param {string} consultationId 
 * @param {string} userId 
 * @param {string} role - 'doctor' or 'patient'
 */
function joinSession(consultationId, userId, role) {
  const consultation = consultations.find(c => c.id === consultationId);
  if (!consultation) {
    return { error: 'Consultation not found' };
  }

  if (consultation.status === 'completed' || consultation.status === 'cancelled') {
    return { error: 'This consultation has already ended' };
  }

  // Verify user is authorized
  if (role === 'doctor' && consultation.doctorId !== userId) {
    return { error: 'Unauthorized: You are not the assigned doctor' };
  }
  if (role === 'patient' && consultation.patientId !== userId) {
    return { error: 'Unauthorized: You are not the assigned patient' };
  }

  // Activate session if not already active
  if (consultation.status === 'waiting') {
    consultation.status = 'active';
    consultation.startedAt = new Date().toISOString();
    
    // Add system message
    consultation.chatMessages.push({
      id: `msg_system_${Date.now()}`,
      sender: 'system',
      message: `${role === 'doctor' ? consultation.doctorName : consultation.patientName} has joined the consultation.`,
      timestamp: new Date().toISOString()
    });
  }

  // Generate fresh token for the user
  const token = generateSessionToken(consultation.channelName, userId);

  return {
    success: true,
    consultation: {
      id: consultation.id,
      type: consultation.type,
      status: consultation.status,
      channelName: consultation.channelName,
      sessionToken: token,
      appId: process.env.AGORA_APP_ID || 'mock_agora_id',
      doctorName: consultation.doctorName,
      patientName: consultation.patientName
    }
  };
}

/**
 * End a consultation session
 * @param {string} consultationId 
 * @param {Object} options - { prescription, notes, diagnosis }
 */
function endSession(consultationId, { prescription, notes, diagnosis } = {}) {
  const consultation = consultations.find(c => c.id === consultationId);
  if (!consultation) {
    return { error: 'Consultation not found' };
  }

  if (consultation.status === 'completed') {
    return { error: 'Consultation is already completed' };
  }

  consultation.status = 'completed';
  consultation.endedAt = new Date().toISOString();
  
  if (consultation.startedAt) {
    const start = new Date(consultation.startedAt);
    const end = new Date(consultation.endedAt);
    consultation.duration = Math.round((end - start) / 60000); // minutes
  }

  if (prescription) consultation.prescription = prescription;
  if (notes) consultation.notes = notes;
  if (diagnosis) consultation.diagnosis = diagnosis;

  // Add system message
  consultation.chatMessages.push({
    id: `msg_system_${Date.now()}`,
    sender: 'system',
    message: 'Consultation has ended. Thank you!',
    timestamp: new Date().toISOString()
  });

  return { success: true, consultation };
}

// ============================================================
// CHAT OPERATIONS
// ============================================================

/**
 * Add a chat message to a consultation
 * @param {string} consultationId 
 * @param {string} sender - 'doctor' or 'patient'
 * @param {string} message 
 */
function addChatMessage(consultationId, sender, message) {
  const consultation = consultations.find(c => c.id === consultationId);
  if (!consultation) {
    return { error: 'Consultation not found' };
  }

  if (consultation.status === 'completed' || consultation.status === 'cancelled') {
    return { error: 'Cannot send messages in a completed consultation' };
  }

  const chatMessage = {
    id: `msg_${sender}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    sender,
    message,
    timestamp: new Date().toISOString()
  };

  consultation.chatMessages.push(chatMessage);

  return { success: true, message: chatMessage };
}

/**
 * Get chat history for a consultation
 * @param {string} consultationId 
 */
function getChatMessages(consultationId) {
  const consultation = consultations.find(c => c.id === consultationId);
  if (!consultation) {
    return { error: 'Consultation not found', messages: [] };
  }

  return { 
    messages: consultation.chatMessages,
    consultationId,
    status: consultation.status
  };
}

/**
 * Get consultation by ID
 */
function getConsultationById(consultationId) {
  return consultations.find(c => c.id === consultationId) || null;
}

/**
 * Get consultations for a user (as patient or doctor)
 */
function getUserConsultations(userId) {
  return consultations
    .filter(c => c.patientId === userId || c.doctorId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
  createSession,
  joinSession,
  endSession,
  addChatMessage,
  getChatMessages,
  getConsultationById,
  getUserConsultations,
  generateSessionToken,
  generateChannelName
};
