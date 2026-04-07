const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: Number,
  gender: String,
  height: Number,
  weight: Number,
  bloodGroup: String,
  existingConditions: [String],
  allergies: [String],
  lifestyleHabits: String,
  activityLevel: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
