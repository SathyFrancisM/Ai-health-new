const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Haversine Distance Formula - calculates km between two GPS coordinates
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
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
};

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password, age, gender, height, weight, bloodGroup, existingConditions, allergies, lifestyleHabits, activityLevel, whatsappNumber, location, fees, specialty } = req.body;

    let role = 'User';
    if (email.includes('.doctor@')) role = 'Doctor';
    if (email.includes('.hospital@')) role = 'Hospital';



    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name, email, password, role, whatsappNumber: whatsappNumber || '0000', location: location || 'Unknown', 
      fees, specialty,
      age, gender, height, weight, bloodGroup, existingConditions, allergies, lifestyleHabits, activityLevel
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = { user: { id: user.id } };

    jwt.sign(payload, process.env.JWT_SECRET || 'secret123', { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token, user });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;



    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = { user: { id: user.id } };

    jwt.sign(payload, process.env.JWT_SECRET || 'secret123', { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token, user });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {

    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Global network endpoints for finding nearby users/doctors
exports.getNetwork = async (req, res) => {
  try {
    const { role, lat, lng } = req.query; // Filter by role, sort by GPS distance
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const hasGPS = !isNaN(userLat) && !isNaN(userLng);



    // Real DB path with GPS sorting
    let query = {};
    if (role) query.role = role;
    let users = await User.find({ ...query, location: { $exists: true, $ne: 'Unknown' } }).select('-password -existingConditions -allergies');

    if (hasGPS) {
      users = users
        .map(u => ({ ...u.toObject(), distanceKm: haversineKm(userLat, userLng, u.lat || 0, u.lng || 0) }))
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }
    res.json(users);
  } catch (err) {
    console.error("Network Error:", err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// --- MOCK PAYMENTS / RECEIPTS ---
let mockReceipts = [];

exports.makePayment = (req, res) => {
  const { userId, doctorId, amount, doctorName, userName } = req.body;
  const receiptId = "TXN" + Math.floor(100000 + Math.random() * 900000);
  const newReceipt = { receiptId, userId, doctorId, amount, doctorName, userName, date: new Date().toISOString() };
  mockReceipts.push(newReceipt);
  res.json({ success: true, receipt: newReceipt });
};

exports.getReceipts = (req, res) => {
  const { doctorId } = req.query;
  const docs = mockReceipts.filter(r => r.doctorId === doctorId);
  res.json(docs);
};
