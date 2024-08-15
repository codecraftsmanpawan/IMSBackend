const mongoose = require('mongoose');

const stockRecordSchema = new mongoose.Schema({
    quantity: {
        type: Number,
        required: true,
        min: -Infinity,
    },
    currentTotalQuantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

const stockProductSchema = new mongoose.Schema({
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true,
    },
    modelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Model',
        required: true,
    },
    totalQuantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    stockHistory: [stockRecordSchema], 
    dealerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dealer',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

stockProductSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const StockProduct = mongoose.model('StockProduct', stockProductSchema);

module.exports = StockProduct;
