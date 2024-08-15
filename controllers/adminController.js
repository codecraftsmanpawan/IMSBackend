const Admin = require('../models/Admin');
const Dealer = require('../models/Dealer');
const generateToken = require('../utils/generateToken');

// Admin login
const loginAdmin = async (req, res) => {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (admin && (await admin.matchPassword(password))) {
        res.json({
            _id: admin._id,
            username: admin.username,
            role: admin.role,
            token: generateToken(admin._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
};

// Create dealer
const createDealer = async (req, res) => {
    const { name, username, password } = req.body;

    try {
        // Check if the dealer already exists
        const dealerExists = await Dealer.findOne({ username });
        if (dealerExists) {
            return res.status(400).json({ message: 'Dealer already exists' });
        }

        // Create a new dealer
        const dealer = await Dealer.create({
            name,
            username,
            password,
            createdBy: req.user._id,
        });

        // Check if the dealer was created successfully
        if (dealer) {
            res.status(201).json({
                message: 'Dealer created successfully',
                dealer: {
                    _id: dealer._id,
                    name: dealer.name,
                    username: dealer.username,
                },
            });
        } else {
            res.status(400).json({ message: 'Invalid dealer data' });
        }
    } catch (error) {
        // Handle server errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all dealers
const getAllDealers = async (req, res) => {
    try {
        const dealers = await Dealer.find().select('-password'); // Exclude the password field
        res.status(200).json(dealers);
    } catch (error) {
        // Handle server errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update dealer
const updateDealer = async (req, res) => {
    const { id } = req.params;
    const { name, username, password } = req.body;

    try {
        // Find the dealer by ID
        const dealer = await Dealer.findById(id);

        if (!dealer) {
            return res.status(404).json({ message: 'Dealer not found' });
        }

        // Update the dealer's information
        dealer.name = name || dealer.name;
        dealer.username = username || dealer.username;
        if (password) {
            dealer.password = password;
        }

        const updatedDealer = await dealer.save();

        res.status(200).json({
            message: 'Dealer updated successfully',
            dealer: {
                _id: updatedDealer._id,
                name: updatedDealer.name,
                username: updatedDealer.username,
            },
        });
    } catch (error) {
        // Handle server errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete dealer
const deleteDealer = async (req, res) => {
    const { id } = req.params;

    try {
        // Find the dealer by ID
        const dealer = await Dealer.findById(id);

        if (!dealer) {
            return res.status(404).json({ message: 'Dealer not found' });
        }

        // Remove the dealer
        await dealer.deleteOne();

        res.status(200).json({ message: 'Dealer deleted successfully' });
    } catch (error) {
        // Handle server errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};



module.exports = { loginAdmin, createDealer, getAllDealers, updateDealer, deleteDealer };
