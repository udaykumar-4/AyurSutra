const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

const doctor = (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a doctor' });
  }
};

const therapist = (req, res, next) => {
  if (req.user && req.user.role === 'therapist') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a therapist' });
  }
};

const receptionist = (req, res, next) => {
  if (req.user && req.user.role === 'receptionist') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a receptionist' });
  }
};

const therapistOrDoctor = (req, res, next) => {
  if (req.user && (req.user.role === 'therapist' || req.user.role === 'doctor')) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a medical staff' });
  }
};

const staff = (req, res, next) => {
  if (req.user && (
    req.user.role === 'admin' || 
    req.user.role === 'doctor' || 
    req.user.role === 'therapist' ||
    req.user.role === 'receptionist'
  )) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized for this action' });
  }
};

module.exports = { 
  protect, 
  admin, 
  doctor, 
  therapist,
  receptionist,
  therapistOrDoctor, 
  staff 
};