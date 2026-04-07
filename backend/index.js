const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('MediGuide API is running');
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/emergency', require('./routes/emergency'));

// Port
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (Background)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mediguide';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.env.IS_DEMO_MODE = 'true';
    console.log('Running in DEMO MODE (without MongoDB)');
  });

// Start Server Immediately
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
