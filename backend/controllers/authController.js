const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password, age, gender, height, weight, bloodGroup, existingConditions, allergies, lifestyleHabits, activityLevel } = req.body;

    // --- DEMO REGISTRATION BYPASS START ---
    if (process.env.IS_DEMO_MODE === 'true') {
      const mockUser = {
        id: 'mock_user_' + Math.random().toString(36).substr(2, 9),
        name, email, age, gender, bloodGroup, allergies,
        existingConditions: existingConditions || 'None'
      };
      const payload = { user: { id: mockUser.id } };
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
      name, email, password, age, gender, height, weight, bloodGroup, existingConditions, allergies, lifestyleHabits, activityLevel
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
    if (email === 'demo@mediguide.com' && password === 'password123') {
      const demoUser = {
        id: 'demo_user_id',
        name: 'Advait',
        email: 'demo@mediguide.com',
        age: 26,
        gender: 'Male',
        bloodGroup: 'O+',
        existingConditions: 'None',
        allergies: 'None'
      };
      const payload = { user: { id: demoUser.id } };
      return jwt.sign(payload, process.env.JWT_SECRET || 'secret123', { expiresIn: 360000 }, (err, token) => {
        if (err) throw err;
        res.json({ token, user: demoUser });
      });
    }
    // --- DEMO BYPASS END ---

    // Only query database if NOT in demo mode or NOT demo user
    if (process.env.IS_DEMO_MODE === 'true') {
      return res.status(400).json({ msg: 'Invalid Credentials (Demo Mode limits logins to demo user)' });
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
    if (req.user.id === 'demo_user_id' || process.env.IS_DEMO_MODE === 'true') {
      return res.json({
        id: 'demo_user_id',
        name: 'Advait',
        email: 'demo@mediguide.com',
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
