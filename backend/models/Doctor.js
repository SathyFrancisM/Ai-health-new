const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
  date: { type: String, required: true },       // YYYY-MM-DD
  time: { type: String, required: true },        // HH:MM
  isBooked: { type: Boolean, default: false },
  bookedBy: { type: mongoose.Schema.Types.Mixed, default: null }  // ObjectId or string for demo
}, { _id: true });

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  specialty: { type: String, required: true },
  hospitalId: { type: mongoose.Schema.Types.Mixed },  // ObjectId ref or string for demo
  experience: { type: String },
  fees: { type: Number, default: 500 },
  rating: { type: Number, default: 4.0, min: 0, max: 5 },
  online: { type: Boolean, default: false },
  qualifications: [{ type: String }],
  location: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  availableSlots: [SlotSchema],
  createdAt: { type: Date, default: Date.now }
});

// Indexes for common queries
DoctorSchema.index({ specialty: 1 });
DoctorSchema.index({ hospitalId: 1 });
DoctorSchema.index({ 'availableSlots.date': 1, 'availableSlots.isBooked': 1 });

module.exports = mongoose.model('Doctor', DoctorSchema);
