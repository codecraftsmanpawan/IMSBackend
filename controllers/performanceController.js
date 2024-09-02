const mongoose = require('mongoose');
const SellProduct = require('../models/SellProduct');
const Brand = require('../models/Brand'); // Import the Brand model
const Model = require('../models/Model'); // Import the Model model
const Dealer = require('../models/Dealer'); // Import the Model model
const { 
    startOfWeek, endOfWeek, 
    startOfMonth, endOfMonth, 
    startOfQuarter, endOfQuarter, 
    startOfYear, endOfYear, 
    formatISO 
} = require('date-fns');

// Get all brands according to sales data (total quantity sold, total sales amount)
const getPerformanceDataByDealer = async (req, res) => {
    try {
        const { dealerId } = req.query;

        if (!dealerId) {
            return res.status(400).json({ message: 'Dealer ID is required' });
        }

        // Perform aggregation to get the total sales per brand for a specific dealer
        const sellDataByBrand = await SellProduct.aggregate([
            {
                $match: {
                    dealerId: new mongoose.Types.ObjectId(dealerId) // Match the dealerId from the request
                }
            },
            {
                $group: {
                    _id: "$brandId", // Group by brandId
                    totalQuantity: { $sum: "$quantity" }, // Sum the quantity sold for each brand
                    totalAmount: { $sum: "$totalAmount" } // Sum the total amount for each brand
                }
            },
            {
                $lookup: {
                    from: "brands", // Look up the brand details from the Brand collection
                    localField: "_id", // brandId from SellProduct
                    foreignField: "_id", // _id in Brand collection
                    as: "brandDetails"
                }
            },
            {
                $unwind: "$brandDetails" // Unwind the brandDetails array to get individual objects
            },
            {
                $project: {
                    _id: 0, // Exclude the _id field from the result
                    brandId: "$_id", // Include brandId
                    brandName: "$brandDetails.name", // Include the brand name
                    totalQuantity: 1, // Include totalQuantity
                    totalAmount: 1 // Include totalAmount
                }
            }
        ]);

        res.status(200).json(sellDataByBrand);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// controllers/performanceController.js
const getAllDealerPerformance = async (req, res) => {
    try {
        const { period, startDate, endDate } = req.query;

        if (period && !['week', 'month', 'quarter', 'year', 'lifetime'].includes(period)) {
            return res.status(400).json({ message: 'Invalid period specified' });
        }

        let start, end;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            switch (period) {
                case 'week':
                    start = startOfWeek(new Date(), { weekStartsOn: 1 });
                    end = endOfWeek(new Date(), { weekStartsOn: 1 });
                    break;
                case 'month':
                    start = startOfMonth(new Date());
                    end = endOfMonth(new Date());
                    break;
                case 'quarter':
                    start = startOfQuarter(new Date());
                    end = endOfQuarter(new Date());
                    break;
                case 'year':
                    start = startOfYear(new Date());
                    end = endOfYear(new Date());
                    break;
                case 'lifetime':
                    start = new Date(0);
                    end = new Date();
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid period specified' });
            }
        }

        const performanceData = await SellProduct.aggregate([
            {
                $match: {
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: "$dealerId",
                    totalQuantity: { $sum: "$quantity" },
                    totalAmount: { $sum: "$totalAmount" }
                }
            },
            {
                $lookup: {
                    from: 'dealers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'dealerDetails'
                }
            },
            {
                $unwind: '$dealerDetails'
            },
            {
                $project: {
                    _id: 0,
                    dealerId: '$_id',
                    dealerName: '$dealerDetails.name',
                    totalQuantity: 1,
                    totalAmount: 1
                }
            },
            {
                $sort: { totalAmount: -1 }
            }
        ]);

        // Calculate overall totals
        const overallPerformance = performanceData.reduce((acc, dealer) => {
            acc.totalQuantity += dealer.totalQuantity;
            acc.totalAmount += dealer.totalAmount;
            return acc;
        }, { totalQuantity: 0, totalAmount: 0 });

        res.status(200).json({
            startDate: formatISO(start),
            endDate: formatISO(end),
            performanceData,
            overallPerformance
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// Controller to get performance for all models
const getAllModelPerformance = async (req, res) => {
    try {
        const { dealerId, period, startDate, endDate } = req.query;

        // Validate that dealerId is provided
        if (!dealerId) {
            return res.status(400).json({ message: 'Dealer ID is required' });
        }

        let start, end;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            switch (period) {
                case 'week':
                    start = startOfWeek(new Date(), { weekStartsOn: 1 });
                    end = endOfWeek(new Date(), { weekStartsOn: 1 });
                    break;
                case 'month':
                    start = startOfMonth(new Date());
                    end = endOfMonth(new Date());
                    break;
                case 'quarter':
                    start = startOfQuarter(new Date());
                    end = endOfQuarter(new Date());
                    break;
                case 'year':
                    start = startOfYear(new Date());
                    end = endOfYear(new Date());
                    break;
                case 'lifetime':
                    start = new Date(0); // January 1, 1970
                    end = new Date();
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid period specified' });
            }
        }

        const matchConditions = {
            dealerId: new mongoose.Types.ObjectId(dealerId), // Match the dealerId
            date: { $gte: start, $lte: end }
        };

        const performanceData = await SellProduct.aggregate([
            {
                $match: matchConditions
            },
            {
                $group: {
                    _id: "$modelId",
                    totalQuantity: { $sum: "$quantity" },
                    totalAmount: { $sum: "$totalAmount" }
                }
            },
            {
                $lookup: {
                    from: 'models',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'modelDetails'
                }
            },
            {
                $unwind: '$modelDetails'
            },
            {
                $project: {
                    _id: 0,
                    modelId: '$_id',
                    modelName: '$modelDetails.name',
                    modelPrice: '$modelDetails.price',
                    totalQuantity: 1,
                    totalAmount: 1
                }
            },
            {
                $sort: { totalAmount: -1 } // Sort by totalAmount in descending order
            }
        ]);

        res.status(200).json({
            startDate: formatISO(start),
            endDate: formatISO(end),
            performanceData
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


module.exports = { getPerformanceDataByDealer, getAllDealerPerformance, getAllModelPerformance };
