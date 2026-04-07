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

    // --- DEMO REGISTRATION BYPASS START ---
    if (process.env.IS_DEMO_MODE === 'true') {
      const { lat, lng } = req.body;
      const mockUser = {
        id: 'mock_user_' + Math.random().toString(36).substr(2, 9),
        name, email, role, whatsappNumber: whatsappNumber || '0000000000', location: location || 'Unknown',
        lat: lat || null, lng: lng || null,
        fees: fees || 500, specialty: specialty || 'General',
        age, gender, bloodGroup, allergies,
        existingConditions: existingConditions || 'None'
      };
      const payload = { user: { id: mockUser.id, role: mockUser.role } };
      return jwt.sign(payload, process.env.JWT_SECRET || 'secret123', { expiresIn: 360000 }, (err, token) => {
        if (err) throw err;
        res.json({ token, user: mockUser });
      });
    }
    // --- DEMO REGISTRATION BYPASS END ---

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

    // --- DEMO BYPASS START ---
    const isDoctorDemo = email.includes('.doctor@');
    const isHospitalDemo = email.includes('.hospital@');
    
    if (email === 'demo@mediguide.com' || email === 'demo.user@gmail.com' || isDoctorDemo || isHospitalDemo) {
      let role = 'User';
      let name = 'Advait';
      if (isDoctorDemo) { role = 'Doctor'; name = 'Dr. Sharma'; }
      if (isHospitalDemo) { role = 'Hospital'; name = 'City Care Hospital'; }

      const demoUser = {
        id: `demo_${role.toLowerCase()}_id`,
        name: name,
        email: email,
        role: role,
        whatsappNumber: '8778741264',
        location: 'Coimbatore, India',
        age: 26,
        gender: 'Male',
        bloodGroup: 'O+',
        existingConditions: 'None',
        allergies: 'None'
      };
      const payload = { user: { id: demoUser.id, role: demoUser.role } };
      return jwt.sign(payload, process.env.JWT_SECRET || 'secret123', { expiresIn: 360000 }, (err, token) => {
        if (err) throw err;
        res.json({ token, user: demoUser });
      });
    }
    // --- DEMO BYPASS END ---

    // Only query database if NOT in demo mode or NOT demo user
    if (process.env.IS_DEMO_MODE === 'true') {
      return res.status(400).json({ msg: 'Invalid Credentials (Demo Mode limits logins to demo users)' });
    }

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
    if (req.user.id.startsWith('demo_') || process.env.IS_DEMO_MODE === 'true') {
      let role = 'User';
      let name = 'Advait';
      let email = 'demo@mediguide.com';
      if (req.user.id === 'demo_doctor_id') { role = 'Doctor'; name = 'Dr. Sharma'; email = 'demo.doctor@gmail.com'; }
      if (req.user.id === 'demo_hospital_id') { role = 'Hospital'; name = 'City Care Hospital'; email = 'demo.hospital@gmail.com'; }

      return res.json({
        id: req.user.id,
        name: name,
        email: email,
        role: role,
        whatsappNumber: '8778741264',
        location: 'Coimbatore, India',
        age: 26,
        gender: 'Male',
        bloodGroup: 'O+',
        existingConditions: 'None',
        allergies: 'None'
      });
    }
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

    if (process.env.IS_DEMO_MODE === 'true') {
      // Real Indian GPS coordinates for demo providers
      let network = [];
      if (role === 'User' || !role) {
        network.push({ id: 'demo_user_id', name: 'Advait', location: 'Coimbatore, India', lat: 11.0168, lng: 76.9558, whatsappNumber: '8778741264', role: 'User', severity: 'Medium (Cough)' });
        network.push({ id: 'dummy_u2', name: 'Raj', location: 'Chennai, India', lat: 13.0827, lng: 80.2707, whatsappNumber: '9876543210', role: 'User', severity: 'Emergency' });
      }
      if (role === 'Doctor' || !role) {
        network.push({ id: 'demo_doctor_id', name: 'Dr. Sharma', location: 'Delhi, India', lat: 28.6139, lng: 77.2090, whatsappNumber: '8778741264', role: 'Doctor', specialty: 'General Physician', fees: 500 });
        network.push({ id: 'dummy_d2', name: 'Dr. Priya Nair', location: 'Coimbatore, India', lat: 11.0168, lng: 76.9558, whatsappNumber: '9876543211', role: 'Doctor', specialty: 'Ayurveda', fees: 600 });
        network.push({ id: 'dummy_d3', name: 'Dr. Arun Kumar', location: 'Chennai, India', lat: 13.0827, lng: 80.2707, whatsappNumber: '9988771234', role: 'Doctor', specialty: 'Cardiologist', fees: 900 });
        network.push({ id: 'dummy_d4', name: 'Dr. Kavitha', location: 'Bangalore, India', lat: 12.9716, lng: 77.5946, whatsappNumber: '9123456789', role: 'Doctor', specialty: 'Pediatrician', fees: 700 });
      }
      if (role === 'Hospital' || !role) {
        network.push({ id: 'demo_hospital_id', name: 'KIMS Hospital', location: 'Coimbatore, India', lat: 11.0168, lng: 76.9558, whatsappNumber: '8778741264', role: 'Hospital', fees: 1000, specialty: 'Multi-specialty' });
        network.push({ id: 'dummy_h2', name: 'Apollo Hospitals', location: 'Chennai, India', lat: 13.0827, lng: 80.2707, whatsappNumber: '9876543299', role: 'Hospital', fees: 2000, specialty: 'Super-specialty' });
      }

      // If GPS is provided, augment with calculated distance and sort nearest first
      if (hasGPS) {
        network = network.map(item => ({
          ...item,
          distanceKm: haversineKm(userLat, userLng, item.lat, item.lng)
        })).sort((a, b) => a.distanceKm - b.distanceKm);
      }

      return res.json(network);
    }

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
