/**
 * Seed Data — Mock data for demo mode
 * 
 * Provides realistic Indian healthcare data for:
 * - Hospitals (6) with GPS coordinates
 * - Doctors (12) across specialties
 * - Medicines (25) with pricing
 * 
 * Used when MongoDB is unavailable (demo mode)
 */

// ============================================================
// HOSPITALS
// ============================================================
function getSeedHospitals() {
  return [
    {
      id: 'hosp_1',
      name: 'Apollo Greams Road',
      location: 'Chennai, Tamil Nadu',
      lat: 13.0618,
      lng: 80.2502,
      specialty: 'Multi-specialty',
      departments: ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Pediatrics'],
      phone: '044-28293333',
      emergency: true,
      rating: 4.8,
      operatingHours: '24/7'
    },
    {
      id: 'hosp_2',
      name: 'Fortis Malar Hospital',
      location: 'Adyar, Chennai',
      lat: 13.0067,
      lng: 80.2567,
      specialty: 'Cardiac Sciences',
      departments: ['Cardiology', 'Cardiac Surgery', 'Pulmonology'],
      phone: '044-42892222',
      emergency: true,
      rating: 4.6,
      operatingHours: '24/7'
    },
    {
      id: 'hosp_3',
      name: 'KIMS Hospital',
      location: 'Coimbatore, Tamil Nadu',
      lat: 11.0168,
      lng: 76.9558,
      specialty: 'Multi-specialty',
      departments: ['General Medicine', 'Surgery', 'Gynecology', 'Pediatrics'],
      phone: '0422-4323800',
      emergency: true,
      rating: 4.7,
      operatingHours: '24/7'
    },
    {
      id: 'hosp_4',
      name: 'Manipal Hospital',
      location: 'Bangalore, Karnataka',
      lat: 12.9716,
      lng: 77.5946,
      specialty: 'Super-specialty',
      departments: ['Neurosurgery', 'Transplants', 'Oncology', 'Cardiology'],
      phone: '080-25024444',
      emergency: true,
      rating: 4.9,
      operatingHours: '24/7'
    },
    {
      id: 'hosp_5',
      name: 'AIIMS Delhi',
      location: 'New Delhi',
      lat: 28.5672,
      lng: 77.2100,
      specialty: 'Government Super-specialty',
      departments: ['All Departments'],
      phone: '011-26588500',
      emergency: true,
      rating: 4.5,
      operatingHours: '24/7'
    },
    {
      id: 'hosp_6',
      name: 'Meenakshi Mission Hospital',
      location: 'Madurai, Tamil Nadu',
      lat: 9.9400,
      lng: 78.1200,
      specialty: 'Multi-specialty',
      departments: ['Cardiology', 'Neurology', 'Nephrology', 'Orthopedics'],
      phone: '0452-4288888',
      emergency: true,
      rating: 4.6,
      operatingHours: '24/7'
    }
  ];
}

// ============================================================
// DOCTORS
// ============================================================
function getSeedDoctors() {
  return [
    {
      id: 'doc_1',
      name: 'Dr. Arvind Swaminathan',
      email: 'arvind.doctor@mediguide.com',
      specialty: 'Cardiologist',
      hospitalId: 'hosp_1',
      experience: '15+ Years',
      fees: 800,
      rating: 4.9,
      online: true,
      qualifications: ['MBBS', 'MD Cardiology', 'DM'],
      location: 'Chennai, Tamil Nadu',
      lat: 13.0618,
      lng: 80.2502,
      availableSlots: generateSlots('doc_1')
    },
    {
      id: 'doc_2',
      name: 'Dr. Priya Ramakrishnan',
      email: 'priya.doctor@mediguide.com',
      specialty: 'Dermatologist',
      hospitalId: 'hosp_1',
      experience: '10+ Years',
      fees: 600,
      rating: 4.8,
      online: true,
      qualifications: ['MBBS', 'MD Dermatology'],
      location: 'Chennai, Tamil Nadu',
      lat: 13.0618,
      lng: 80.2502,
      availableSlots: generateSlots('doc_2')
    },
    {
      id: 'doc_3',
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.doctor@mediguide.com',
      specialty: 'General Physician',
      hospitalId: 'hosp_3',
      experience: '20+ Years',
      fees: 500,
      rating: 4.7,
      online: false,
      qualifications: ['MBBS', 'MD General Medicine'],
      location: 'Coimbatore, Tamil Nadu',
      lat: 11.0168,
      lng: 76.9558,
      availableSlots: generateSlots('doc_3')
    },
    {
      id: 'doc_4',
      name: 'Dr. Meera Iyer',
      email: 'meera.doctor@mediguide.com',
      specialty: 'Pediatrician',
      hospitalId: 'hosp_1',
      experience: '12+ Years',
      fees: 700,
      rating: 4.9,
      online: true,
      qualifications: ['MBBS', 'MD Pediatrics'],
      location: 'Chennai, Tamil Nadu',
      lat: 13.0618,
      lng: 80.2502,
      availableSlots: generateSlots('doc_4')
    },
    {
      id: 'doc_5',
      name: 'Dr. Arun Sharma',
      email: 'arun.doctor@mediguide.com',
      specialty: 'Orthopedic Surgeon',
      hospitalId: 'hosp_4',
      experience: '18+ Years',
      fees: 1000,
      rating: 4.8,
      online: true,
      qualifications: ['MBBS', 'MS Orthopedics'],
      location: 'Bangalore, Karnataka',
      lat: 12.9716,
      lng: 77.5946,
      availableSlots: generateSlots('doc_5')
    },
    {
      id: 'doc_6',
      name: 'Dr. Kavitha Sundaram',
      email: 'kavitha.doctor@mediguide.com',
      specialty: 'Gynecologist',
      hospitalId: 'hosp_3',
      experience: '14+ Years',
      fees: 750,
      rating: 4.7,
      online: true,
      qualifications: ['MBBS', 'MS OBG', 'Fellowship in Reproductive Medicine'],
      location: 'Coimbatore, Tamil Nadu',
      lat: 11.0168,
      lng: 76.9558,
      availableSlots: generateSlots('doc_6')
    },
    {
      id: 'doc_7',
      name: 'Dr. Vikram Patel',
      email: 'vikram.doctor@mediguide.com',
      specialty: 'Neurologist',
      hospitalId: 'hosp_4',
      experience: '16+ Years',
      fees: 900,
      rating: 4.9,
      online: true,
      qualifications: ['MBBS', 'MD Neurology', 'DM'],
      location: 'Bangalore, Karnataka',
      lat: 12.9716,
      lng: 77.5946,
      availableSlots: generateSlots('doc_7')
    },
    {
      id: 'doc_8',
      name: 'Dr. Lakshmi Narayanan',
      email: 'lakshmi.doctor@mediguide.com',
      specialty: 'Ayurvedic Physician',
      hospitalId: 'hosp_6',
      experience: '22+ Years',
      fees: 400,
      rating: 4.6,
      online: true,
      qualifications: ['BAMS', 'MD Ayurveda'],
      location: 'Madurai, Tamil Nadu',
      lat: 9.9400,
      lng: 78.1200,
      availableSlots: generateSlots('doc_8')
    },
    {
      id: 'doc_9',
      name: 'Dr. Suresh Menon',
      email: 'suresh.doctor@mediguide.com',
      specialty: 'Pulmonologist',
      hospitalId: 'hosp_2',
      experience: '13+ Years',
      fees: 850,
      rating: 4.7,
      online: false,
      qualifications: ['MBBS', 'MD Pulmonology'],
      location: 'Chennai, Tamil Nadu',
      lat: 13.0067,
      lng: 80.2567,
      availableSlots: generateSlots('doc_9')
    },
    {
      id: 'doc_10',
      name: 'Dr. Anita Desai',
      email: 'anita.doctor@mediguide.com',
      specialty: 'Psychiatrist',
      hospitalId: 'hosp_5',
      experience: '11+ Years',
      fees: 1200,
      rating: 4.8,
      online: true,
      qualifications: ['MBBS', 'MD Psychiatry'],
      location: 'New Delhi',
      lat: 28.5672,
      lng: 77.2100,
      availableSlots: generateSlots('doc_10')
    },
    {
      id: 'doc_11',
      name: 'Dr. Ramesh Babu',
      email: 'ramesh.doctor@mediguide.com',
      specialty: 'ENT Specialist',
      hospitalId: 'hosp_6',
      experience: '9+ Years',
      fees: 550,
      rating: 4.5,
      online: true,
      qualifications: ['MBBS', 'MS ENT'],
      location: 'Madurai, Tamil Nadu',
      lat: 9.9400,
      lng: 78.1200,
      availableSlots: generateSlots('doc_11')
    },
    {
      id: 'doc_12',
      name: 'Dr. Deepa Krishnan',
      email: 'deepa.doctor@mediguide.com',
      specialty: 'Ophthalmologist',
      hospitalId: 'hosp_3',
      experience: '17+ Years',
      fees: 650,
      rating: 4.8,
      online: false,
      qualifications: ['MBBS', 'MS Ophthalmology', 'Fellowship AIOS'],
      location: 'Coimbatore, Tamil Nadu',
      lat: 11.0168,
      lng: 76.9558,
      availableSlots: generateSlots('doc_12')
    }
  ];
}

/**
 * Generate time slots for next 7 days
 * 30-minute intervals from 9AM to 5PM
 * Randomly marks some as booked for realism
 */
function generateSlots(doctorId) {
  const slots = [];
  const today = new Date();
  
  for (let day = 0; day < 7; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    for (let hour = 9; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        // Randomly mark ~25% as booked for demo realism
        const isBooked = Math.random() < 0.25;
        slots.push({
          id: `${doctorId}_${dateStr}_${timeStr}`,
          date: dateStr,
          time: timeStr,
          isBooked,
          bookedBy: isBooked ? 'existing_patient' : null
        });
      }
    }
  }

  return slots;
}

// ============================================================
// MEDICINES
// ============================================================
function getSeedMedicines() {
  return [
    { id: 'med_1', name: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Pain Relief', manufacturer: 'Cipla', price: 25, stock: 150, requiresPrescription: false, description: 'For fever and mild to moderate pain relief', dosage: '1-2 tablets every 4-6 hours', sideEffects: ['Nausea', 'Liver damage (overdose)'] },
    { id: 'med_2', name: 'Dolo 650', genericName: 'Paracetamol', category: 'Pain Relief', manufacturer: 'Micro Labs', price: 30, stock: 200, requiresPrescription: false, description: 'Higher strength fever and pain relief', dosage: '1 tablet every 6-8 hours', sideEffects: ['Nausea', 'Allergic reactions (rare)'] },
    { id: 'med_3', name: 'Azithromycin 500mg', genericName: 'Azithromycin', category: 'Antibiotic', manufacturer: 'Alkem', price: 110, stock: 75, requiresPrescription: true, description: 'Broad-spectrum antibiotic for bacterial infections', dosage: 'As prescribed by doctor', sideEffects: ['Diarrhea', 'Nausea', 'Stomach pain'] },
    { id: 'med_4', name: 'Cetirizine 10mg', genericName: 'Cetirizine', category: 'Antihistamine', manufacturer: 'Dr. Reddy\'s', price: 15, stock: 300, requiresPrescription: false, description: 'For allergies, hay fever, and cold symptoms', dosage: '1 tablet daily', sideEffects: ['Drowsiness', 'Dry mouth'] },
    { id: 'med_5', name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'Antacid', manufacturer: 'Sun Pharma', price: 45, stock: 120, requiresPrescription: false, description: 'For acid reflux, heartburn, and stomach ulcers', dosage: '1 capsule before breakfast', sideEffects: ['Headache', 'Nausea'] },
    { id: 'med_6', name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', category: 'Antibiotic', manufacturer: 'Cipla', price: 85, stock: 90, requiresPrescription: true, description: 'Penicillin-type antibiotic for infections', dosage: 'As prescribed by doctor', sideEffects: ['Diarrhea', 'Rash', 'Nausea'] },
    { id: 'med_7', name: 'Metformin 500mg', genericName: 'Metformin', category: 'Diabetes', manufacturer: 'USV', price: 35, stock: 180, requiresPrescription: true, description: 'For Type 2 diabetes management', dosage: 'As prescribed by doctor', sideEffects: ['Nausea', 'Diarrhea', 'Metallic taste'] },
    { id: 'med_8', name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', category: 'Pain Relief', manufacturer: 'Abbott', price: 20, stock: 250, requiresPrescription: false, description: 'Anti-inflammatory pain reliever', dosage: '1 tablet every 6-8 hours with food', sideEffects: ['Stomach irritation', 'Nausea'] },
    { id: 'med_9', name: 'Cough Syrup (Benadryl)', genericName: 'Diphenhydramine', category: 'Cough & Cold', manufacturer: 'Johnson & Johnson', price: 95, stock: 60, requiresPrescription: false, description: 'Relieves cough and cold symptoms', dosage: '10ml every 6-8 hours', sideEffects: ['Drowsiness', 'Dizziness'] },
    { id: 'med_10', name: 'ORS Sachets', genericName: 'Oral Rehydration Salts', category: 'Rehydration', manufacturer: 'Electral', price: 12, stock: 500, requiresPrescription: false, description: 'For dehydration from diarrhea or vomiting', dosage: '1 sachet in 1 liter water', sideEffects: ['None'] },
    { id: 'med_11', name: 'Vitamin D3 60K', genericName: 'Cholecalciferol', category: 'Supplements', manufacturer: 'USV', price: 120, stock: 100, requiresPrescription: false, description: 'High-dose vitamin D supplement', dosage: '1 sachet weekly', sideEffects: ['Nausea (overdose)'] },
    { id: 'med_12', name: 'Amlodipine 5mg', genericName: 'Amlodipine', category: 'Blood Pressure', manufacturer: 'Pfizer', price: 55, stock: 140, requiresPrescription: true, description: 'For high blood pressure and angina', dosage: 'As prescribed by doctor', sideEffects: ['Swelling in ankles', 'Dizziness'] },
    { id: 'med_13', name: 'Pan-D (Pantoprazole + Domperidone)', genericName: 'Pantoprazole', category: 'Antacid', manufacturer: 'Alkem', price: 75, stock: 80, requiresPrescription: false, description: 'For acidity, bloating, and GERD', dosage: '1 capsule before meals', sideEffects: ['Headache', 'Diarrhea'] },
    { id: 'med_14', name: 'Montelukast 10mg', genericName: 'Montelukast', category: 'Respiratory', manufacturer: 'Sun Pharma', price: 130, stock: 65, requiresPrescription: true, description: 'For asthma and allergic rhinitis', dosage: '1 tablet at bedtime', sideEffects: ['Headache', 'Abdominal pain'] },
    { id: 'med_15', name: 'Chyawanprash 500g', genericName: 'Ayurvedic Formulation', category: 'Ayurvedic', manufacturer: 'Dabur', price: 250, stock: 40, requiresPrescription: false, description: 'Traditional immunity booster with Amla and herbs', dosage: '1-2 teaspoons daily', sideEffects: ['None known'] },
    { id: 'med_16', name: 'Triphala Churna', genericName: 'Triphala Powder', category: 'Ayurvedic', manufacturer: 'Himalaya', price: 140, stock: 55, requiresPrescription: false, description: 'Digestive health and detoxification', dosage: '1 teaspoon with warm water before bed', sideEffects: ['Loose stools initially'] },
    { id: 'med_17', name: 'Ashwagandha Capsules', genericName: 'Withania Somnifera', category: 'Ayurvedic', manufacturer: 'Himalaya', price: 180, stock: 70, requiresPrescription: false, description: 'Adaptogenic herb for stress and vitality', dosage: '1 capsule twice daily', sideEffects: ['Drowsiness'] },
    { id: 'med_18', name: 'B-Complex Tablets', genericName: 'Vitamin B Complex', category: 'Supplements', manufacturer: 'Zydus', price: 45, stock: 200, requiresPrescription: false, description: 'Essential B vitamins for energy and nerve health', dosage: '1 tablet daily after food', sideEffects: ['Yellow urine (harmless)'] },
    { id: 'med_19', name: 'Calcium + D3 Tablets', genericName: 'Calcium Carbonate + Cholecalciferol', category: 'Supplements', manufacturer: 'Abbott', price: 165, stock: 110, requiresPrescription: false, description: 'For bone health and calcium supplementation', dosage: '1 tablet daily after food', sideEffects: ['Constipation', 'Bloating'] },
    { id: 'med_20', name: 'Dermi Cool Powder', genericName: 'Menthol + Camphor', category: 'Skin Care', manufacturer: 'Dabur', price: 80, stock: 45, requiresPrescription: false, description: 'Cooling powder for prickly heat and rash', dosage: 'Apply on affected area', sideEffects: ['Skin irritation (rare)'] },
    { id: 'med_21', name: 'Betadine Ointment', genericName: 'Povidone-Iodine', category: 'Antiseptic', manufacturer: 'Win-Medicare', price: 65, stock: 130, requiresPrescription: false, description: 'Antiseptic for cuts, wounds, and burns', dosage: 'Apply thin layer on wound', sideEffects: ['Skin staining'] },
    { id: 'med_22', name: 'Insulin Glargine (Lantus)', genericName: 'Insulin Glargine', category: 'Diabetes', manufacturer: 'Sanofi', price: 1400, stock: 25, requiresPrescription: true, description: 'Long-acting insulin for diabetes', dosage: 'As prescribed by doctor', sideEffects: ['Hypoglycemia', 'Injection site reaction'] },
    { id: 'med_23', name: 'Atorvastatin 10mg', genericName: 'Atorvastatin', category: 'Cholesterol', manufacturer: 'Ranbaxy', price: 95, stock: 85, requiresPrescription: true, description: 'For lowering cholesterol levels', dosage: '1 tablet at night', sideEffects: ['Muscle pain', 'Liver issues (rare)'] },
    { id: 'med_24', name: 'Zincovit Tablets', genericName: 'Multivitamin + Zinc', category: 'Supplements', manufacturer: 'Apex', price: 110, stock: 160, requiresPrescription: false, description: 'Complete multivitamin with zinc for immunity', dosage: '1 tablet daily after food', sideEffects: ['Nausea (empty stomach)'] },
    { id: 'med_25', name: 'Tulsi Drops', genericName: 'Ocimum Tenuiflorum Extract', category: 'Ayurvedic', manufacturer: 'Organic India', price: 190, stock: 35, requiresPrescription: false, description: 'Natural immunity booster and respiratory support', dosage: '2-3 drops in warm water daily', sideEffects: ['None known'] }
  ];
}

module.exports = { getSeedHospitals, getSeedDoctors, getSeedMedicines, generateSlots };
