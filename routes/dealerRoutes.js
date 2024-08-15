const express = require('express');
const { addBrand,updateBrand,  getBrands, addModel, getModels,updateModel, loginDealer, deleteModel, deleteBrand, } = require('../controllers/dealerController');
const { addStockProduct, getStockProducts, getStockSummary,getStockModelDetails } = require('../controllers/stockProductController');
const { addSellProduct, getSellProducts } = require('../controllers/sellProductController');
const {  getPerformanceDataByBrand, getAllBrandPerformance } = require('../controllers/performanceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Route to log in a dealer
router.post('/login', loginDealer);

// Route to add a new brand
router.post('/brands', protect, addBrand);

// Route to update the brand
router.put('/brands/:id',protect, updateBrand); 

// Route to get all brands for the logged-in dealer
router.get('/brands', protect, getBrands);

// Route to add a new model under a specific brand
router.post('/brands/:brandId/models', protect, addModel);

// Route to get all models under a specific brand
router.get('/brands/:brandId/models', protect, getModels);

// Route to update the model
router.put('/brands/:brandId/models/:id',protect, updateModel); 

// Route to delete a model by ID
router.delete('/models/:modelId', protect, deleteModel);

// Route to delete a brand by ID and all associated models
router.delete('/brands/:brandId', protect, deleteBrand);

// Route to add a new stock product
router.post('/stock', protect, addStockProduct);

// Route to get all stock products for the logged-in dealer
router.get('/stock', protect, getStockProducts);

// Route to add a new sell product
router.post('/sell', protect, addSellProduct);

// Route to get all sell products for the logged-in dealer
router.get('/sell', protect, getSellProducts);

// Route to get performance data by brand
router.get('/performance/brand',protect, getPerformanceDataByBrand);

router.get('/performance/brands',protect, getAllBrandPerformance);

// Route to get total sales amount
router.get('/summary',protect, getStockSummary);

router.get('/stock/bybrand',protect, getStockModelDetails);

module.exports = router;
