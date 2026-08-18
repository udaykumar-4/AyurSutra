const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  updateUserProfile,
  blockTimeSlot,      
  deleteBlockedSlot   // ⭐️ IMPORTANT: This must be imported
} = require('../controllers/userController');

const { protect, admin, staff } = require('../middleware/authMiddleware'); 

// --- Profile Routes (For the logged-in user) ---
// Update own profile
router.put('/profile', protect, updateUserProfile);

// Block a time slot
router.post('/profile/block-slot', protect, blockTimeSlot);

// ⭐️ THIS WAS MISSING OR INCORRECT
// This connects the "Remove" button to the controller
router.delete('/profile/unblock-slot/:slotId', protect, deleteBlockedSlot);


// --- Admin / Staff Routes ---
// GET /api/users
router.get('/', protect, getAllUsers); 

// GET /api/users/:id
router.get('/:id', protect, staff, getUserById);

// PUT /api/users/:id (Admin only)
router.put('/:id', protect, admin, updateUser);

// DELETE /api/users/:id (Admin only)
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;