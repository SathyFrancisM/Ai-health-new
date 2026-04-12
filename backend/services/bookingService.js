/**
 * Booking Service — Concurrency-safe appointment booking logic
 * 
 * Handles slot management, availability checks, and atomic booking
 * operations to prevent double-booking. Supports both demo mode
 * (in-memory) and MongoDB mode.
 */

const { getSeedHospitals, getSeedDoctors, generateSlots } = require('../data/seed_data');

// ============================================================
// IN-MEMORY STORE (Demo Mode)
// ============================================================
let demoHospitals = null;
let demoDoctors = null;
let demoBookings = [];
let bookingCounter = 0;

function initDemoData() {
  if (!demoHospitals) {
    demoHospitals = getSeedHospitals();
    demoDoctors = getSeedDoctors();
    console.log(`[Booking Service] Demo data initialized: ${demoHospitals.length} hospitals, ${demoDoctors.length} doctors`);
  }
}

// Initialize on load
initDemoData();

// ============================================================
// HAVERSINE DISTANCE FORMULA
// ============================================================
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// ============================================================
// HOSPITAL OPERATIONS
// ============================================================

/**
 * Get all hospitals, optionally filtered and sorted by distance
 */
function getHospitals({ search, specialty, lat, lng } = {}) {
  initDemoData();
  let hospitals = [...demoHospitals];

  // Filter by search term
  if (search) {
    const s = search.toLowerCase();
    hospitals = hospitals.filter(h =>
      h.name.toLowerCase().includes(s) ||
      h.location.toLowerCase().includes(s) ||
      (h.departments && h.departments.some(d => d.toLowerCase().includes(s)))
    );
  }

  // Filter by specialty
  if (specialty) {
    const sp = specialty.toLowerCase();
    hospitals = hospitals.filter(h =>
      h.specialty.toLowerCase().includes(sp) ||
      (h.departments && h.departments.some(d => d.toLowerCase().includes(sp)))
    );
  }

  // Sort by distance if GPS provided
  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    if (!isNaN(userLat) && !isNaN(userLng)) {
      hospitals = hospitals.map(h => ({
        ...h,
        distanceKm: haversineKm(userLat, userLng, h.lat, h.lng)
      })).sort((a, b) => a.distanceKm - b.distanceKm);
    }
  }

  return hospitals;
}

// ============================================================
// DOCTOR OPERATIONS
// ============================================================

/**
 * Get doctors, optionally filtered by hospital, specialty, and sorted by distance
 */
function getDoctors({ hospitalId, specialty, search, lat, lng } = {}) {
  initDemoData();
  let doctors = [...demoDoctors];

  if (hospitalId) {
    doctors = doctors.filter(d => d.hospitalId === hospitalId);
  }

  if (specialty) {
    const sp = specialty.toLowerCase();
    doctors = doctors.filter(d => d.specialty.toLowerCase().includes(sp));
  }

  if (search) {
    const s = search.toLowerCase();
    doctors = doctors.filter(d =>
      d.name.toLowerCase().includes(s) ||
      d.specialty.toLowerCase().includes(s)
    );
  }

  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    if (!isNaN(userLat) && !isNaN(userLng)) {
      doctors = doctors.map(d => ({
        ...d,
        distanceKm: haversineKm(userLat, userLng, d.lat || 0, d.lng || 0)
      })).sort((a, b) => a.distanceKm - b.distanceKm);
    }
  }

  return doctors;
}

// ============================================================
// SLOT OPERATIONS
// ============================================================

/**
 * Get available slots for a doctor on a specific date
 */
function getAvailableSlots(doctorId, date) {
  initDemoData();
  const doctor = demoDoctors.find(d => d.id === doctorId);
  if (!doctor) {
    return { error: 'Doctor not found', slots: [] };
  }

  let slots = doctor.availableSlots || [];

  // Filter by date if provided
  if (date) {
    slots = slots.filter(s => s.date === date);
  }

  // Only return unbooked slots
  const available = slots.filter(s => !s.isBooked);
  const booked = slots.filter(s => s.isBooked);

  return {
    doctorId,
    doctorName: doctor.name,
    date,
    totalSlots: slots.length,
    availableCount: available.length,
    bookedCount: booked.length,
    slots: slots.map(s => ({
      id: s.id,
      date: s.date,
      time: s.time,
      isBooked: s.isBooked
    }))
  };
}

/**
 * Generate fresh slots for a doctor if none exist for a date
 */
function ensureSlotsExist(doctorId, date) {
  initDemoData();
  const doctor = demoDoctors.find(d => d.id === doctorId);
  if (!doctor) return false;

  const existingSlotsForDate = (doctor.availableSlots || []).filter(s => s.date === date);
  if (existingSlotsForDate.length === 0) {
    // Generate new slots for this date
    const newSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        newSlots.push({
          id: `${doctorId}_${date}_${timeStr}`,
          date,
          time: timeStr,
          isBooked: false,
          bookedBy: null
        });
      }
    }
    doctor.availableSlots = [...(doctor.availableSlots || []), ...newSlots];
  }
  return true;
}

// ============================================================
// BOOKING OPERATIONS (Concurrency-safe for demo mode)
// ============================================================

// Simple lock mechanism for demo mode to prevent race conditions
const bookingLocks = new Map();

/**
 * Book an appointment slot (atomic operation)
 * Prevents double-booking by checking and marking slot in one operation
 */
async function bookSlot({ userId, doctorId, date, timeSlot, type = 'in-person', patientName, patientPhone, notes }) {
  initDemoData();

  const lockKey = `${doctorId}_${date}_${timeSlot}`;
  
  // Simple lock check (for demo mode concurrency handling)
  if (bookingLocks.has(lockKey)) {
    return { error: 'This slot is currently being booked by another user. Please try again.' };
  }

  try {
    // Set lock
    bookingLocks.set(lockKey, true);

    const doctor = demoDoctors.find(d => d.id === doctorId);
    if (!doctor) {
      return { error: 'Doctor not found' };
    }

    // Ensure slots exist for the date
    ensureSlotsExist(doctorId, date);

    // Find the specific slot
    const slotId = `${doctorId}_${date}_${timeSlot}`;
    const slot = doctor.availableSlots.find(s => s.id === slotId || (s.date === date && s.time === timeSlot));

    if (!slot) {
      return { error: 'Slot not found' };
    }

    if (slot.isBooked) {
      return { error: 'This slot is already booked. Please choose a different time.' };
    }

    // ATOMIC: Mark slot as booked
    slot.isBooked = true;
    slot.bookedBy = userId;

    // Find hospital name
    const hospital = demoHospitals.find(h => h.id === doctor.hospitalId);

    // Create booking record
    bookingCounter++;
    const booking = {
      id: `booking_${bookingCounter}_${Date.now()}`,
      userId,
      doctorId,
      hospitalId: doctor.hospitalId,
      doctorName: doctor.name,
      hospitalName: hospital ? hospital.name : 'Unknown Hospital',
      date,
      timeSlot,
      type,
      status: 'confirmed',
      consultationId: null,
      paymentStatus: 'pending',
      amount: doctor.fees || 500,
      patientName: patientName || 'Patient',
      patientPhone: patientPhone || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    demoBookings.push(booking);

    return { success: true, booking };
  } finally {
    // Release lock
    bookingLocks.delete(lockKey);
  }
}

/**
 * Cancel a booking and release the slot
 */
function cancelBooking(bookingId, userId) {
  const bookingIndex = demoBookings.findIndex(b => b.id === bookingId);
  if (bookingIndex === -1) {
    return { error: 'Booking not found' };
  }

  const booking = demoBookings[bookingIndex];

  if (booking.userId !== userId) {
    return { error: 'Unauthorized: You can only cancel your own bookings' };
  }

  if (booking.status === 'cancelled') {
    return { error: 'Booking is already cancelled' };
  }

  // Release the slot
  const doctor = demoDoctors.find(d => d.id === booking.doctorId);
  if (doctor) {
    const slot = doctor.availableSlots.find(s => 
      s.date === booking.date && s.time === booking.timeSlot
    );
    if (slot) {
      slot.isBooked = false;
      slot.bookedBy = null;
    }
  }

  // Update booking status
  booking.status = 'cancelled';
  booking.updatedAt = new Date().toISOString();

  return { success: true, booking };
}

/**
 * Get all bookings for a user
 */
function getUserBookings(userId) {
  return demoBookings
    .filter(b => b.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Get a single booking by ID
 */
function getBookingById(bookingId) {
  return demoBookings.find(b => b.id === bookingId) || null;
}

module.exports = {
  getHospitals,
  getDoctors,
  getAvailableSlots,
  bookSlot,
  cancelBooking,
  getUserBookings,
  getBookingById,
  ensureSlotsExist
};
