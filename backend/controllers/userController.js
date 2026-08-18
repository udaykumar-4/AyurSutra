const User = require('../models/user');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// ... (Keep getAllUsers, getUserById, updateUser, deleteUser, updateUserProfile as they were) ...
// (I will omit them here to save space, but DO NOT DELETE THEM from your file)
// Copy the code below for the blocking functions:

// @desc    Get all users (for admin)
// @route   GET /api/users
const getAllUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    const users = await User.find(filter)
      .select('-password')
      .populate('assignedDoctor', 'full_name');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('assignedDoctor', 'full_name');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user (for admin)
// @route   PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.full_name = req.body.full_name || user.full_name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      user.status = req.body.status || user.status;
      user.phone = req.body.phone || user.phone;
      user.age = req.body.age || user.age;
      user.designation = req.body.designation || user.designation;
      user.assignedDoctor = req.body.assignedDoctor || user.assignedDoctor;
      
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user (for admin)
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile (for logged-in user)
// @route   PUT /api/users/profile
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.full_name = req.body.full_name || user.full_name;
    user.email = req.body.email || user.email;
    
    user.age = req.body.age || user.age;
    user.gender = req.body.gender || user.gender;
    user.dob = req.body.dob || user.dob;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    user.emergencyContact = req.body.emergencyContact || user.emergencyContact;
    user.bloodGroup = req.body.bloodGroup || user.bloodGroup;
    user.allergies = req.body.allergies || user.allergies;

    user.heartRate = req.body.heartRate || user.heartRate;
    user.bloodPressure = req.body.bloodPressure || user.bloodPressure;
    user.weight = req.body.weight || user.weight;
    user.temperature = req.body.temperature || user.temperature;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      full_name: updatedUser.full_name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id),
      ...updatedUser.toObject(),
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Block a time slot
// @route   POST /api/users/profile/block-slot
const blockTimeSlot = async (req, res) => {
  try {
    const { date, time } = req.body;
    if (!date || !time) {
      return res.status(400).json({ message: 'Date and time are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.blockedSlots.push({ date: new Date(date), time });
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      full_name: updatedUser.full_name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id),
      ...updatedUser.toObject(),
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove (Unblock) a time slot
// @route   DELETE /api/users/profile/unblock-slot/:slotId
// ... (rest of the file above)

// @desc    Remove (unblock) a time slot
// @route   DELETE /api/users/profile/unblock-slot/:slotId
const deleteBlockedSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Pull the slot with the matching _id from the array
    user.blockedSlots.pull({ _id: slotId });
    const updatedUser = await user.save();

    // Re-issue token
    res.json({
      _id: updatedUser._id,
      full_name: updatedUser.full_name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id),
      ...updatedUser.toObject(),
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  updateUserProfile,
  blockTimeSlot,
  deleteBlockedSlot 
};