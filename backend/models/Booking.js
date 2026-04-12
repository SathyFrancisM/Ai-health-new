const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true },     // ObjectId or string for demo
  doctorId: { type: mongoose.Schema.Types.Mixed, required: true },
  hospitalId: { type: mongoose.Schema.Types.Mixed },
  doctorName: { type: String },
  hospitalName: { type: String },
  date: { type: String, required: true },         // YYYY-MM-DD
  timeSlot: { type: String, required: true },      // HH:MM
  type: { 
    type: String, 
    enum: ['in-person', 'video', 'chat'], 
    default: 'in-person' 
  },
  status: { 
    type: String, 
    enum: ['confirmed', 'cancelled', 'completed', 'no-show'], 
    default: 'confirmed' 
  },
  consultationId: { type: String, default: null },  // Links to consultation session
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'refunded'], 
    default: 'pending' 
  },
  amount: { type: Number, default: 0 },
  patientName: { type: String },
  patientPhone: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Prevent double booking: unique constraint on doctor + date + timeSlot for active bookings
BookingSchema.index({ doctorId: 1, date: 1, timeSlot: 1 });
BookingSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);
