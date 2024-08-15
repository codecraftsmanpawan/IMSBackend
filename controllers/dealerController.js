const Dealer = require('../models/Dealer');
const Brand = require('../models/Brand');
const Model = require('../models/Model');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken'); // Ensure you have this utility function

// Dealer login
const loginDealer = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find the dealer by username
        const dealer = await Dealer.findOne({ username });
        if (!dealer) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, dealer.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Generate a token
        const token = generateToken(dealer._id);

        // Respond with success and token
        res.status(200).json({
            message: 'Login successful',
            dealer: {
                username: dealer.username,
            },
            token,
        });
    } catch (error) {
        // Handle server errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Add brand
const addBrand = async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Brand name is required' });
    }

    try {
        // Check if the brand already exists
        const existingBrand = await Brand.findOne({ name, dealerId: req.user._id });
        if (existingBrand) {
            return res.status(400).json({ message: 'Brand with this name already exists' });
        }

        // Create a new brand
        const brand = await Brand.create({
            name,
            dealerId: req.user._id,
        });

        // Check if the brand was created successfully
        if (!brand) {
            return res.status(400).json({ message: 'Failed to create brand' });
        }

        res.status(201).json({
            message: 'Brand added successfully',
            brand,
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update brand
const updateBrand = async (req, res) => {
    const { id } = req.params; // Brand ID from the request parameters
    const { name } = req.body; // New name from the request body

    if (!name) {
        return res.status(400).json({ message: 'Brand name is required' });
    }

    try {
        // Find the brand by ID and ensure it belongs to the current dealer
        const brand = await Brand.findOne({ _id: id, dealerId: req.user._id });

        if (!brand) {
            return res.status(404).json({ message: 'Brand not found or you do not have permission to update this brand' });
        }

        // Check if a brand with the new name already exists for this dealer
        const existingBrand = await Brand.findOne({ name, dealerId: req.user._id });
        if (existingBrand && existingBrand._id.toString() !== id) {
            return res.status(400).json({ message: 'Another brand with this name already exists' });
        }

        // Update the brand's name
        brand.name = name;

        // Save the updated brand
        const updatedBrand = await brand.save();

        res.status(200).json({
            message: 'Brand updated successfully',
            brand: updatedBrand,
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteBrand = async (req, res) => {
    const { brandId } = req.params;

    try {
        // Find and delete the brand by ID
        const brand = await Brand.findByIdAndDelete(brandId);

        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        // Delete all models associated with the deleted brand
        await Model.deleteMany({ brandId });

        res.status(200).json({
            message: 'Brand and associated models deleted successfully',
            brand,
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all brands
const getBrands = async (req, res) => {
    try {
        // Find all brands associated with the logged-in dealer
        const brands = await Brand.find({ dealerId: req.user._id });
        res.json(brands);
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Add model under brand
const addModel = async (req, res) => {
    const { name, price } = req.body;
    const { brandId } = req.params;

    if (!name || !price) {
        return res.status(400).json({ message: 'Model name and price are required' });
    }

    try {
        // Check if the model already exists for the given brand
        const existingModel = await Model.findOne({ name, brandId, dealerId: req.user._id });
        if (existingModel) {
            return res.status(400).json({ message: 'Model with this name already exists under the specified brand' });
        }

        // Create a new model
        const model = await Model.create({
            name,
            price,
            brandId,
            dealerId: req.user._id,
        });

        res.status(201).json({
            message: 'Model added successfully',
            model,
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update model
const updateModel = async (req, res) => {
    const { id } = req.params; // Model ID from the request parameters
    const { name, price } = req.body; // New name and price from the request body
    const { brandId } = req.params; // Brand ID from the request parameters

    if (!name || !price) {
        return res.status(400).json({ message: 'Model name and price are required' });
    }

    try {
        // Find the model by ID and ensure it belongs to the current dealer and brand
        const model = await Model.findOne({ _id: id, brandId, dealerId: req.user._id });

        if (!model) {
            return res.status(404).json({ message: 'Model not found or you do not have permission to update this model' });
        }

        // Check if another model with the same name already exists under the same brand for this dealer
        const existingModel = await Model.findOne({ name, brandId, dealerId: req.user._id });
        if (existingModel && existingModel._id.toString() !== id) {
            return res.status(400).json({ message: 'Another model with this name already exists under the specified brand' });
        }

        // Update the model's name and price
        model.name = name;
        model.price = price;

        // Save the updated model
        const updatedModel = await model.save();

        res.status(200).json({
            message: 'Model updated successfully',
            model: updatedModel,
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const deleteModel = async (req, res) => {
    const { modelId } = req.params;

    try {
        // Find and delete the model by ID
        const model = await Model.findByIdAndDelete(modelId);

        if (!model) {
            return res.status(404).json({ message: 'Model not found' });
        }

        res.status(200).json({
            message: 'Model deleted successfully',
            model,
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all models under a brand
const getModels = async (req, res) => {
    const { brandId } = req.params;

    try {
        // Find all models associated with the given brand and dealer
        const models = await Model.find({ brandId, dealerId: req.user._id });
        res.json(models);
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    loginDealer,
    addBrand,
    updateBrand,
    deleteBrand,
    getBrands,
    addModel,
    updateModel,
    deleteModel,
    getModels,
};
