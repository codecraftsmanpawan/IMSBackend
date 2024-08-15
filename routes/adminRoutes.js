const express = require('express');
const { loginAdmin, createDealer, getAllDealers, updateDealer,  deleteDealer } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Route to Loign Admin
router.post('/login', loginAdmin);

// Route to create a dealer
router.post('/dealer', protect, createDealer);

// Route to get all dealers
router.get('/dealers',protect, getAllDealers);

// Route to update a dealer by ID
router.put('/dealers/:id',protect, updateDealer);

// Route to delete a dealer by ID
router.delete('/dealers/:id',protect, deleteDealer);

module.exports = router;
