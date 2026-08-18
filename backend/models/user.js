const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  full_name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'doctor', 'therapist', 'patient', 'receptionist']
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  },
  designation: { 
    type: String 
  },
  condition: { 
    type: String 
  },
  assignedDoctor: {           
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  phone: { type: String },
  age: { type: Number },
  gender: { type: String },
  dob: { type: Date },
  address: { type: String },
  emergencyContact: { type: String },
  bloodGroup: { type: String },
  allergies: { type: String },
  lastLogin: { type: Date },
  heartRate: { type: String },
  bloodPressure: { type: String },
  weight: { type: String },
  temperature: { type: String },
  blockedSlots: [
    {
      date: { type: Date, required: true },
      time: { type: String, required: true }
    }
  ]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);