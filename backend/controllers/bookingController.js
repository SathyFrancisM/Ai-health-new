/**
 * Booking Controller — Hospital & Doctor appointment system
 * 
 * Handles hospital listing, doctor search, slot availability,
 * appointment booking, and booking management.
 */

const bookingService = require('../services/bookingService');

/**
 * GET /api/booking/hospitals
 * List hospitals with optional filters
 * Query: ?search=&specialty=&lat=&lng=
 */
exports.getHospitals = (req, res) => {
  try {
    const { search, specialty, lat, lng } = req.query;
    const hospitals = bookingService.getHospitals({ search, specialty, lat, lng });
    res.json({ data: hospitals, total: hospitals.length });
  } catch (err) {
    console.error('[Booking Controller] getHospitals error:', err.message);
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
};

/**
 * GET /api/booking/doctors
 * List doctors with optional filters
 * Query: ?hospitalId=&specialty=&search=&lat=&lng=
 */
exports.getDoctors = (req, res) => {
  try {
    const { hospitalId, specialty, search, lat, lng } = req.query;
    const doctors = bookingService.getDoctors({ hospitalId, specialty, search, lat, lng });
    
    // Don't expose slot details in listing — only count
    const doctorsWithSummary = doctors.map(d => ({
      ...d,
      availableSlots: undefined,
      slotsAvailableToday: (d.availableSlots || [])
        .filter(s => s.date === new Date().toISOString().split('T')[0] && !s.isBooked).length
    }));

    res.json({ data: doctorsWithSummary, total: doctorsWithSummary.length });
  } catch (err) {
    console.error('[Booking Controller] getDoctors error:', err.message);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

/**
 * GET /api/booking/slots
 * Get available slots for a doctor
 * Query: ?doctorId=&date=
 */
exports.getSlots = (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId) {
      return res.status(400).json({ error: 'doctorId is required' });
    }

    // Default to today if no date provided
    const slotDate = date || new Date().toISOString().split('T')[0];

    // Ensure slots exist for the requested date
    bookingService.ensureSlotsExist(doctorId, slotDate);

    const result = bookingService.getAvailableSlots(doctorId, slotDate);
    
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error('[Booking Controller] getSlots error:', err.message);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
};

/**
 * POST /api/booking/book
 * Book an appointment
 * Body: { userId, doctorId, date, timeSlot, type, patientName, patientPhone, notes }
 */
exports.bookAppointment = async (req, res) => {
  try {
    const { userId, doctorId, date, timeSlot, type, patientName, patientPhone, notes } = req.body;

    if (!userId || !doctorId || !date || !timeSlot) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, doctorId, date, timeSlot' 
      });
    }

    const result = await bookingService.bookSlot({
      userId, doctorId, date, timeSlot, 
      type: type || 'in-person',
      patientName, patientPhone, notes
    });

    if (result.error) {
      return res.status(409).json({ error: result.error });
    }

    res.status(201).json(result);
  } catch (err) {
    console.error('[Booking Controller] bookAppointment error:', err.message);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
};

/**
 * DELETE /api/booking/:bookingId
 * Cancel a booking
 * Query: ?userId= (for authorization)
 */
exports.cancelBooking = (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.query.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = bookingService.cancelBooking(bookingId, userId);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error('[Booking Controller] cancelBooking error:', err.message);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

/**
 * GET /api/booking/my-bookings
 * Get all bookings for a user
 * Query: ?userId=
 */
exports.getMyBookings = (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const bookings = bookingService.getUserBookings(userId);
    res.json({ data: bookings, total: bookings.length });
  } catch (err) {
    console.error('[Booking Controller] getMyBookings error:', err.message);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

/**
 * GET /api/booking/:bookingId
 * Get a single booking by ID
 */
exports.getBooking = (req, res) => {
  try {
    const booking = bookingService.getBookingById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    console.error('[Booking Controller] getBooking error:', err.message);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};
