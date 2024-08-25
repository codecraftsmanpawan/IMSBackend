const mongoose = require('mongoose');
const SellProduct = require('../models/SellProduct');
const Brand = require('../models/Brand'); // Import the Brand model
const Model = require('../models/Model'); // Import the Model model
const { 
    startOfWeek, endOfWeek, 
    startOfMonth, endOfMonth, 
    startOfQuarter, endOfQuarter, 
    startOfYear, endOfYear, 
    formatISO 
} = require('date-fns');

const getPerformanceDataByBrand = async (req, res) => {
    try {
        const { brandId, period, startDate, endDate } = req.query;

        if (!brandId) {
            return res.status(400).json({ message: 'Brand ID is required' });
        }

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
                    start = new Date(0); // January 1, 1970
                    end = new Date();
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid period specified' });
            }
        }

        console.log('Brand ID:', brandId);
        console.log('Date Range:', start, end);

        const performanceData = await SellProduct.aggregate([
            {
                $match: {
                    brandId: new mongoose.Types.ObjectId(brandId), // Use new mongoose.Types.ObjectId()
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: {
                        brandId: "$brandId",
                        modelId: "$modelId"
                    },
                    totalQuantity: { $sum: "$quantity" },
                    totalAmount: { $sum: "$totalAmount" }
                }
            },
            {
                $lookup: {
                    from: 'brands', // Collection name for brands
                    localField: '_id.brandId',
                    foreignField: '_id',
                    as: 'brandDetails'
                }
            },
            {
                $unwind: '$brandDetails'
            },
            {
                $lookup: {
                    from: 'models', // Collection name for models
                    localField: '_id.modelId',
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
                    brandId: '$_id.brandId',
                    modelId: '$_id.modelId',
                    brandName: '$brandDetails.name',
                    modelName: '$modelDetails.name',
                    modelPrice: '$modelDetails.price',
                    totalQuantity: 1,
                    totalAmount: 1
                }
            },
            {
                $sort: { totalQuantity: -1 } // Sort by most sold products
            }
        ]);

        console.log('Performance Data by Brand:', performanceData);

        res.status(200).json({
            brandId,
            startDate: formatISO(start),
            endDate: formatISO(end),
            performanceData
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const getAllBrandPerformance = async (req, res) => {
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
                    _id: "$brandId",
                    totalQuantity: { $sum: "$quantity" },
                    totalAmount: { $sum: "$totalAmount" }
                }
            },
            {
                $lookup: {
                    from: 'brands',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'brandDetails'
                }
            },
            {
                $unwind: '$brandDetails'
            },
            {
                $project: {
                    _id: 0,
                    brandId: '$_id',
                    brandName: '$brandDetails.name',
                    totalQuantity: 1,
                    totalAmount: 1
                }
            },
            {
                $sort: { totalAmount: -1 }
            }
        ]);

        // Calculate overall totals
        const overallPerformance = performanceData.reduce((acc, brand) => {
            acc.totalQuantity += brand.totalQuantity;
            acc.totalAmount += brand.totalAmount;
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
        const { period, startDate, endDate } = req.query;

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
                $sort: { totalAmount: -1 }
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



module.exports = { getPerformanceDataByBrand, getAllBrandPerformance, getAllModelPerformance };
