const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// @route   GET /api/booking/hospitals
// @desc    List hospitals with optional filters
// @access  Public
router.get('/hospitals', bookingController.getHospitals);

// @route   GET /api/booking/doctors
// @desc    List doctors with optional filters
// @access  Public
router.get('/doctors', bookingController.getDoctors);

// @route   GET /api/booking/slots
// @desc    Get available slots for a doctor
// @access  Public
router.get('/slots', bookingController.getSlots);

// @route   GET /api/booking/my-bookings
// @desc    Get user's bookings
// @access  Public (for demo)
router.get('/my-bookings', bookingController.getMyBookings);

// @route   GET /api/booking/:bookingId
// @desc    Get a single booking
// @access  Public
router.get('/:bookingId', bookingController.getBooking);

// @route   POST /api/booking/book
// @desc    Book an appointment (concurrency-safe)
// @access  Public (for demo)
router.post('/book', bookingController.bookAppointment);

// @route   DELETE /api/booking/:bookingId
// @desc    Cancel a booking
// @access  Public (for demo)
router.delete('/:bookingId', bookingController.cancelBooking);

module.exports = router;
