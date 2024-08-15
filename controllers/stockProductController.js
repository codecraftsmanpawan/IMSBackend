const mongoose = require('mongoose');
const StockProduct = require('../models/StockProduct');
const Brand = require('../models/Brand');
const Model = require('../models/Model');


const addStockProduct = async (req, res) => {
    const { brandId, modelId, quantity, date } = req.body;

    if (!brandId || !modelId || !quantity) {
        return res.status(400).json({ message: 'Brand, model, and quantity are required' });
    }

    try {
        // Check if the brand and model exist
        const brand = await Brand.findById(brandId);
        const model = await Model.findById(modelId);

        if (!brand || !model) {
            return res.status(404).json({ message: 'Brand or Model not found' });
        }

        // Check if stock product already exists
        let stockProduct = await StockProduct.findOne({ 
            brandId, 
            modelId,
            dealerId: req.user._id 
        });

        if (stockProduct) {
            // Update the existing stock product's total quantity
            stockProduct.totalQuantity += quantity;

            // Calculate the new currentTotalQuantity
            const currentTotalQuantity = stockProduct.totalQuantity;

            // Add the new stock entry to the history with updated currentTotalQuantity
            stockProduct.stockHistory.push({
                quantity,
                date: date || Date.now(),
                currentTotalQuantity: currentTotalQuantity,
            });

            // Save the updated stock product
            await stockProduct.save();

            res.status(200).json({
                message: 'Stock product updated successfully',
                stockProduct,
            });
        } else {
            // Create a new stock product if it doesn't exist
            const currentTotalQuantity = quantity;

            stockProduct = await StockProduct.create({
                brandId,
                modelId,
                totalQuantity: quantity,
                stockHistory: [{
                    quantity,
                    date: date || Date.now(),
                    currentTotalQuantity: currentTotalQuantity,
                }],
                dealerId: req.user._id,
            });

            res.status(201).json({
                message: 'Stock product added successfully',
                stockProduct,
            });
        }
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};



// Retrieve all stock products for the logged-in dealer
const getStockProducts = async (req, res) => {
    try {
        // Aggregate stock products by dealer, brand, and model
        const stockProducts = await StockProduct.aggregate([
            {
                $match: { dealerId: req.user._id }
            },
            {
                $lookup: {
                    from: 'brands', // Collection name for brands
                    localField: 'brandId',
                    foreignField: '_id',
                    as: 'brand'
                }
            },
            {
                $lookup: {
                    from: 'models', // Collection name for models
                    localField: 'modelId',
                    foreignField: '_id',
                    as: 'model'
                }
            },
            {
                $unwind: { path: '$brand', preserveNullAndEmptyArrays: true }
            },
            {
                $unwind: { path: '$model', preserveNullAndEmptyArrays: true }
            },
            {
                $addFields: {
                    // Add a field to extract the most recent date from stockHistory
                    recentStockDate: {
                        $max: {
                            $map: {
                                input: '$stockHistory',
                                as: 'history',
                                in: '$$history.date'
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: {
                        brandId: '$brandId',
                        modelId: '$modelId'
                    },
                    totalQuantity: { $sum: '$totalQuantity' },
                    brandName: { $first: '$brand.name' },
                    modelName: { $first: '$model.name' },
                    price: { $first: '$model.price' },
                    stockHistory: { $first: '$stockHistory' },
                    recentStockDate: { $first: '$recentStockDate' } // Include recentStockDate
                }
            },
            {
                $project: {
                    _id: 0,
                    brandId: '$_id.brandId',
                    modelId: '$_id.modelId',
                    brandName: 1,
                    modelName: 1,
                    totalQuantity: 1,
                    price: 1,
                    totalAmount: { $multiply: ['$totalQuantity', '$price'] },
                    stockHistory: 1,
                    recentStockDate: 1 // Include recentStockDate in the output
                }
            },
            {
                $sort: { recentStockDate: -1 } // Sort by most recent stock date in descending order
            }
        ]);

        res.status(200).json(stockProducts);
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Combined controller to get total stock quantity and total stock amount
const getStockSummary = async (req, res) => {
    try {
        // Check if req.user and req.user._id are defined
        if (!req.user || !req.user._id) {
            return res.status(400).json({ message: 'User is not authenticated' });
        }

        const dealerId = req.user._id;

        // Aggregate total quantity
        const totalQuantityResult = await StockProduct.aggregate([
            { $match: { dealerId } },
            { $group: { _id: null, totalQuantity: { $sum: '$totalQuantity' } } }
        ]);

        // Aggregate total amount
        const totalAmountResult = await StockProduct.aggregate([
            { $match: { dealerId } },
            {
                $lookup: {
                    from: 'models', // Collection name for models
                    localField: 'modelId',
                    foreignField: '_id',
                    as: 'model'
                }
            },
            { $unwind: { path: '$model', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: null,
                    totalAmount: {
                        $sum: {
                            $multiply: ['$totalQuantity', '$model.price']
                        }
                    }
                }
            }
        ]);

        // Extract results with default values if empty
        const totalQuantity = totalQuantityResult.length > 0 ? totalQuantityResult[0].totalQuantity : 0;
        const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;

        // Return the response
        res.status(200).json({
            totalQuantity,
            totalAmount
        });
    } catch (error) {
        // Log the error and respond with status 500
        console.error('Error getting stock summary:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const getStockModelDetails = async (req, res) => {
    try {
        // Extract the brand ID filter from query parameters
        const { brandId } = req.query;

        // Initialize the match criteria for the dealer
        let matchCriteria = { dealerId: req.user._id };

        // Add brand ID filter if provided
        if (brandId) {
            matchCriteria['brandId'] = new mongoose.Types.ObjectId(brandId); // Ensure brandId is in ObjectId format
        }

        // Aggregate stock products by model name and include brand name
        const stockModelDetails = await StockProduct.aggregate([
            {
                $match: matchCriteria // Match stocks for the logged-in dealer and apply brand filter if provided
            },
            {
                $lookup: {
                    from: 'models', // Collection name for models
                    localField: 'modelId',
                    foreignField: '_id',
                    as: 'model'
                }
            },
            {
                $unwind: { path: '$model', preserveNullAndEmptyArrays: true } // Flatten the model array
            },
            {
                $lookup: {
                    from: 'brands', // Collection name for brands
                    localField: 'brandId',
                    foreignField: '_id',
                    as: 'brand'
                }
            },
            {
                $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } // Flatten the brand array
            },
            {
                $group: {
                    _id: '$modelId',
                    modelName: { $first: '$model.name' }, // Get the model name
                    brandName: { $first: '$brand.name' }, // Get the brand name
                    brandId: { $first: '$brandId' }, // Include brandId in the result
                    modelId: { $first: '$modelId' }, // Include modelId in the result
                    totalQuantity: { $sum: '$totalQuantity' }, // Sum up the total quantity
                    price: { $first: '$model.price' } // Get the price of the model
                }
            },
            {
                $project: {
                    _id: 0, // Exclude the _id field from the result
                    modelName: 1, // Include the model name
                    brandName: 1, // Include the brand name
                    brandId: 1, // Include the brand ID
                    modelId: 1, // Include the model ID
                    totalQuantity: 1, // Include the total quantity
                    price: 1, // Include the price
                    totalAmount: { $multiply: ['$totalQuantity', '$price'] } // Calculate the total amount
                }
            },
            {
                $sort: { modelName: 1 } // Sort the result by model name
            }
        ]);

        res.status(200).json(stockModelDetails); // Send the aggregated data as a response
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { addStockProduct, getStockProducts, getStockSummary, getStockModelDetails };
