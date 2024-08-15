const SellProduct = require('../models/SellProduct');
const StockProduct = require('../models/StockProduct');


const addSellProduct = async (req, res) => {
    const { brandId, modelId, quantity, date } = req.body;

    try {
        // Find the stock product to verify availability
        const stockProduct = await StockProduct.findOne({ 
            brandId, 
            modelId,
            dealerId: req.user._id 
        }).populate('modelId', 'price'); // Populate modelId to get the price

        if (!stockProduct) {
            return res.status(404).json({ message: 'Stock product not found' });
        }

        if (quantity > stockProduct.totalQuantity) { // Check totalQuantity instead of quantity
            return res.status(400).json({ message: 'Insufficient stock' });
        }

        // Calculate total amount using the model's price
        const totalAmount = quantity * stockProduct.modelId.price;

        // Create a new sell product
        const sellProduct = await SellProduct.create({
            brandId,
            modelId,
            quantity,
            date,
            dealerId: req.user._id,
            totalAmount
        });

        // Update the stock product's total quantity
        stockProduct.totalQuantity -= quantity;

        // Calculate the new currentTotalQuantity
        const currentTotalQuantity = stockProduct.totalQuantity;

        // Add the new stock entry to the history
        stockProduct.stockHistory.push({
            quantity: -quantity, // Use negative quantity for sales
            date: date || Date.now(),
            currentTotalQuantity: currentTotalQuantity, // Save the updated total quantity in history
        });

        await stockProduct.save();

        res.status(201).json({
            message: 'Sell product added successfully',
            sellProduct
        });
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// Retrieve all sell products for the logged-in dealer
const getSellProducts = async (req, res) => {
    try {
        // Find sell products for the dealer and populate brand and model details
        const sellProducts = await SellProduct.find({ dealerId: req.user._id })
            .populate('brandId', 'name') // Populate brand details with only the name
            .populate('modelId', 'name price'); // Populate model details with name and price

        // Check if any sell products were found
        if (sellProducts.length === 0) {
            return res.status(404).json({ message: 'No sell products found' });
        }

        res.status(200).json(sellProducts);
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


module.exports = { addSellProduct, getSellProducts };
