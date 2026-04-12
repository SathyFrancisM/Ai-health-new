const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: { type: String },
  category: { type: String, required: true },
  manufacturer: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  requiresPrescription: { type: Boolean, default: false },
  description: { type: String },
  dosage: { type: String },
  sideEffects: [{ type: String }],
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Full-text search index on name and genericName
MedicineSchema.index({ name: 'text', genericName: 'text', description: 'text' });
MedicineSchema.index({ category: 1 });

module.exports = mongoose.model('Medicine', MedicineSchema);
