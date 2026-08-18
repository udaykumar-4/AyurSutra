const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Helper function to generate a token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  const { full_name, email, password, role, designation } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      full_name,
      email,
      password,
      role,
      designation
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// REPLACE your old 'loginUser' function with this
const loginUser = async (req, res) => {
  // 1. Get all three fields from the request
  const { email, password, role } = req.body;

  try {
    // 2. Find the user by email first
    const user = await User.findOne({ email });

    // 3. Check if user exists AND password is correct
    if (user && (await user.matchPassword(password))) {
        
        // 4. ⭐️ THIS IS THE FIX ⭐️
        //    Check if the user's role matches the role from the login page
        if (user.role !== role) {
            // If it doesn't match, reject the login
            return res.status(401).json({ message: `You are not registered as a ${role}` });
        }

        // 5. Success! Roles match.
        user.lastLogin = Date.now();
        await user.save();
      
        res.json({
            _id: user._id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
            ...user.toObject(), 
        });
    } else {
      // General error for email not found or wrong password
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { registerUser, loginUser };