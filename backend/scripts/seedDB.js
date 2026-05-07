const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { getSeedHospitals, getSeedDoctors, getSeedMedicines } = require('../data/seed_data');

// Models
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Medicine = require('../models/Medicine');
const User = require('../models/User');

dotenv.config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mediguide';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    console.log('Clearing existing data...');
    await Hospital.deleteMany({});
    await Doctor.deleteMany({});
    await Medicine.deleteMany({});

    console.log('Inserting Hospitals...');
    const hospitals = getSeedHospitals();
    const hospitalDocs = await Hospital.insertMany(hospitals.map(h => {
      // Map the string ID from seed_data to the _id or keep it as a string field if needed, 
      // but let's let Mongoose generate _id and we'll map references.
      return {
        ...h,
        _id: new mongoose.Types.ObjectId() // Generate a new ObjectId
      };
    }));
    
    // Map old hosp_1, hosp_2 to new ObjectIds
    const hospitalIdMap = {};
    hospitals.forEach((h, index) => {
      hospitalIdMap[h.id] = hospitalDocs[index]._id;
    });

    console.log('Inserting Doctors...');
    const doctors = getSeedDoctors();
    await Doctor.insertMany(doctors.map(d => {
      return {
        ...d,
        hospitalId: hospitalIdMap[d.hospitalId] || d.hospitalId // Replace string ID with ObjectId
      };
    }));

    console.log('Inserting Medicines...');
    const medicines = getSeedMedicines();
    await Medicine.insertMany(medicines);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err.message);
    process.exit(1);
  }
}

seedDatabase();
