/**
 * Consultation Controller — Video + Chat consultation endpoints
 */

const consultationService = require('../services/consultationService');

/**
 * POST /api/consultation/create
 * Create a consultation session from a booking
 * Body: { bookingId, doctorId, patientId, type, doctorName, patientName }
 */
exports.createConsultation = (req, res) => {
  try {
    const { bookingId, doctorId, patientId, type, doctorName, patientName } = req.body;

    if (!bookingId || !doctorId || !patientId) {
      return res.status(400).json({
        error: 'Missing required fields: bookingId, doctorId, patientId'
      });
    }

    const result = consultationService.createSession({
      bookingId, doctorId, patientId,
      type: type || 'video',
      doctorName, patientName
    });

    if (result.error) {
      return res.status(409).json({ error: result.error, consultation: result.consultation });
    }

    res.status(201).json(result);
  } catch (err) {
    console.error('[Consultation Controller] create error:', err.message);
    res.status(500).json({ error: 'Failed to create consultation' });
  }
};

/**
 * GET /api/consultation/:id/join
 * Join a consultation session
 * Query: ?userId=&role=doctor|patient
 */
exports.joinConsultation = (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.query;

    if (!userId || !role) {
      return res.status(400).json({ error: 'userId and role are required' });
    }

    if (!['doctor', 'patient'].includes(role)) {
      return res.status(400).json({ error: 'role must be "doctor" or "patient"' });
    }

    const result = consultationService.joinSession(id, userId, role);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error('[Consultation Controller] join error:', err.message);
    res.status(500).json({ error: 'Failed to join consultation' });
  }
};

/**
 * POST /api/consultation/:id/end
 * End a consultation session
 * Body: { prescription?, notes?, diagnosis? }
 */
exports.endConsultation = (req, res) => {
  try {
    const { id } = req.params;
    const { prescription, notes, diagnosis } = req.body;

    const result = consultationService.endSession(id, { prescription, notes, diagnosis });

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error('[Consultation Controller] end error:', err.message);
    res.status(500).json({ error: 'Failed to end consultation' });
  }
};

/**
 * POST /api/consultation/:id/chat
 * Send a chat message
 * Body: { sender, message }
 */
exports.sendMessage = (req, res) => {
  try {
    const { id } = req.params;
    const { sender, message } = req.body;

    if (!sender || !message) {
      return res.status(400).json({ error: 'sender and message are required' });
    }

    if (!['doctor', 'patient'].includes(sender)) {
      return res.status(400).json({ error: 'sender must be "doctor" or "patient"' });
    }

    const result = consultationService.addChatMessage(id, sender, message);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error('[Consultation Controller] sendMessage error:', err.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

/**
 * GET /api/consultation/:id/messages
 * Get chat history
 */
exports.getMessages = (req, res) => {
  try {
    const result = consultationService.getChatMessages(req.params.id);

    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error('[Consultation Controller] getMessages error:', err.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

/**
 * GET /api/consultation/:id
 * Get consultation details
 */
exports.getConsultation = (req, res) => {
  try {
    const consultation = consultationService.getConsultationById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }
    res.json(consultation);
  } catch (err) {
    console.error('[Consultation Controller] get error:', err.message);
    res.status(500).json({ error: 'Failed to fetch consultation' });
  }
};

/**
 * GET /api/consultation/user/:userId
 * Get all consultations for a user
 */
exports.getUserConsultations = (req, res) => {
  try {
    const consultations = consultationService.getUserConsultations(req.params.userId);
    res.json({ data: consultations, total: consultations.length });
  } catch (err) {
    console.error('[Consultation Controller] getUserConsultations error:', err.message);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
};
