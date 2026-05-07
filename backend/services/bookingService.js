/**
 * Booking Service — Concurrency-safe appointment booking logic
 * 
 * Handles slot management, availability checks, and atomic booking
 * operations to prevent double-booking. Supports MongoDB mode.
 */

const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');

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
async function getHospitals({ search, specialty, lat, lng } = {}) {
  let query = {};

  if (search) {
    const s = new RegExp(search, 'i');
    query.$or = [
      { name: s },
      { location: s },
      { departments: s }
    ];
  }

  if (specialty) {
    const sp = new RegExp(specialty, 'i');
    query.$or = [
      ...(query.$or || []),
      { specialty: sp },
      { departments: sp }
    ];
  }

  let hospitals = await Hospital.find(query).lean();

  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    if (!isNaN(userLat) && !isNaN(userLng)) {
      hospitals = hospitals.map(h => ({
        ...h,
        id: h._id.toString(),
        distanceKm: haversineKm(userLat, userLng, h.lat, h.lng)
      })).sort((a, b) => a.distanceKm - b.distanceKm);
    } else {
      hospitals = hospitals.map(h => ({...h, id: h._id.toString()}));
    }
  } else {
    hospitals = hospitals.map(h => ({...h, id: h._id.toString()}));
  }

  return hospitals;
}

// ============================================================
// DOCTOR OPERATIONS
// ============================================================

/**
 * Get doctors, optionally filtered by hospital, specialty, and sorted by distance
 */
async function getDoctors({ hospitalId, specialty, search, lat, lng } = {}) {
  let query = {};
  
  if (hospitalId) {
    query.hospitalId = hospitalId;
  }

  if (specialty) {
    query.specialty = new RegExp(specialty, 'i');
  }

  if (search) {
    const s = new RegExp(search, 'i');
    query.$or = [
      { name: s },
      { specialty: s }
    ];
  }

  let doctors = await Doctor.find(query).lean();

  if (lat && lng) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    if (!isNaN(userLat) && !isNaN(userLng)) {
      doctors = doctors.map(d => ({
        ...d,
        id: d._id.toString(),
        distanceKm: haversineKm(userLat, userLng, d.lat || 0, d.lng || 0)
      })).sort((a, b) => a.distanceKm - b.distanceKm);
    } else {
      doctors = doctors.map(d => ({...d, id: d._id.toString()}));
    }
  } else {
    doctors = doctors.map(d => ({...d, id: d._id.toString()}));
  }

  return doctors;
}

// ============================================================
// SLOT OPERATIONS
// ============================================================

/**
 * Get available slots for a doctor on a specific date
 */
async function getAvailableSlots(doctorId, date) {
  const doctor = await Doctor.findById(doctorId).lean();
  if (!doctor) {
    return { error: 'Doctor not found', slots: [] };
  }

  let slots = doctor.availableSlots || [];

  if (date) {
    slots = slots.filter(s => s.date === date);
  }

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
      id: s._id ? s._id.toString() : `${doctorId}_${s.date}_${s.time}`,
      date: s.date,
      time: s.time,
      isBooked: s.isBooked
    }))
  };
}

/**
 * Generate fresh slots for a doctor if none exist for a date
 */
async function ensureSlotsExist(doctorId, date) {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return false;

  const existingSlotsForDate = (doctor.availableSlots || []).filter(s => s.date === date);
  if (existingSlotsForDate.length === 0) {
    // Generate new slots for this date
    const newSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        newSlots.push({
          date,
          time: timeStr,
          isBooked: false,
          bookedBy: null
        });
      }
    }
    doctor.availableSlots = [...(doctor.availableSlots || []), ...newSlots];
    await doctor.save();
  }
  return true;
}

// ============================================================
// BOOKING OPERATIONS 
// ============================================================

/**
 * Book an appointment slot (atomic operation)
 * Prevents double-booking by checking and marking slot in one operation
 */
async function bookSlot({ userId, doctorId, date, timeSlot, type = 'in-person', patientName, patientPhone, notes }) {
  // ATOMIC: Find the doctor, match the exact unbooked slot, and set it to booked in one DB query!
  const updateResult = await Doctor.updateOne(
    { 
      _id: doctorId, 
      availableSlots: { $elemMatch: { date: date, time: timeSlot, isBooked: false } }
    },
    { 
      $set: { 
        'availableSlots.$.isBooked': true,
        'availableSlots.$.bookedBy': userId
      } 
    }
  );

  if (updateResult.modifiedCount === 0) {
    // Either doctor not found, slot doesn't exist, or already booked
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return { error: 'Doctor not found' };
    return { error: 'This slot is already booked or not available. Please choose a different time.' };
  }

  // Slot was successfully locked and booked.
  const doctor = await Doctor.findById(doctorId).lean();
  let hospitalName = 'Unknown Hospital';
  if (doctor.hospitalId) {
    const hospital = await Hospital.findById(doctor.hospitalId).lean();
    if (hospital) hospitalName = hospital.name;
  }

  // Create booking record
  const booking = new Booking({
    userId,
    doctorId,
    hospitalId: doctor.hospitalId,
    doctorName: doctor.name,
    hospitalName,
    date,
    timeSlot,
    type,
    status: 'confirmed',
    paymentStatus: 'pending',
    amount: doctor.fees || 500,
    patientName: patientName || 'Patient',
    patientPhone: patientPhone || '',
    notes: notes || ''
  });

  await booking.save();

  return { success: true, booking: { ...booking.toObject(), id: booking._id.toString() } };
}

/**
 * Cancel a booking and release the slot
 */
async function cancelBooking(bookingId, userId) {
  const booking = await Booking.findById(bookingId);
  
  if (!booking) {
    return { error: 'Booking not found' };
  }

  if (booking.userId !== userId) {
    return { error: 'Unauthorized: You can only cancel your own bookings' };
  }

  if (booking.status === 'cancelled') {
    return { error: 'Booking is already cancelled' };
  }

  // Release the slot atomically
  await Doctor.updateOne(
    { 
      _id: booking.doctorId, 
      availableSlots: { $elemMatch: { date: booking.date, time: booking.timeSlot } }
    },
    { 
      $set: { 
        'availableSlots.$.isBooked': false,
        'availableSlots.$.bookedBy': null
      } 
    }
  );

  // Update booking status
  booking.status = 'cancelled';
  booking.updatedAt = new Date();
  await booking.save();

  return { success: true, booking };
}

/**
 * Get all bookings for a user
 */
async function getUserBookings(userId) {
  const bookings = await Booking.find({ userId }).sort({ createdAt: -1 }).lean();
  return bookings.map(b => ({ ...b, id: b._id.toString() }));
}

/**
 * Get a single booking by ID
 */
async function getBookingById(bookingId) {
  const booking = await Booking.findById(bookingId).lean();
  if (booking) {
    booking.id = booking._id.toString();
  }
  return booking;
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
