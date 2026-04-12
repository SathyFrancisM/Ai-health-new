const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  lat: { type: Number },
  lng: { type: Number },
  specialty: { type: String, default: 'Multi-specialty' },
  departments: [{ type: String }],
  phone: { type: String },
  emergency: { type: Boolean, default: true },
  rating: { type: Number, default: 4.0, min: 0, max: 5 },
  operatingHours: { type: String, default: '24/7' },
  createdAt: { type: Date, default: Date.now }
});

// Index for location-based queries
HospitalSchema.index({ location: 1 });
HospitalSchema.index({ specialty: 1 });

module.exports = mongoose.model('Hospital', HospitalSchema);
