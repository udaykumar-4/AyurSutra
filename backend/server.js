require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import User model for auto-seeding
const User = require('./models/user');

// Import main router
const mainApiRouter = require('./routes/index');

const app = express();

// --- Middleware ---
app.use(cors()); 
app.use(express.json()); 

// --- Routes ---
app.use('/api', mainApiRouter); 

// --- Auto-Seed Demo Users ---
const seedDemoUsers = async () => {
  const demoAccounts = [
    { full_name: 'System Administrator', email: 'admin@ayursutra.com', password: 'password123', role: 'admin', designation: 'Chief Administrator' },
    { full_name: 'Dr. Ananya Sharma', email: 'doctor@ayursutra.com', password: 'password123', role: 'doctor', designation: 'Senior Ayurvedic Physician' },
    { full_name: 'Rajesh Varma', email: 'therapist@ayursutra.com', password: 'password123', role: 'therapist', designation: 'Panchakarma Therapist' },
    { full_name: 'Priya Nair', email: 'receptionist@ayursutra.com', password: 'password123', role: 'receptionist', designation: 'Front Desk Officer' },
    { full_name: 'Aarav Patel', email: 'patient@ayursutra.com', password: 'password123', role: 'patient' }
  ];

  for (const account of demoAccounts) {
    try {
      const exists = await User.findOne({ email: account.email });
      if (!exists) {
        await User.create(account);
        console.log(`✅ Seeded demo account: ${account.email} (${account.role})`);
      }
    } catch (err) {
      console.warn(`Seeding warning for ${account.email}:`, err.message);
    }
  }
};

// --- Database Connection ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedDemoUsers();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });