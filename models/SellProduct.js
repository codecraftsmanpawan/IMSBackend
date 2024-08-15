const mongoose = require('mongoose');

const sellProductSchema = mongoose.Schema({
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    modelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Model',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    dealerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dealer',
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SellProduct', sellProductSchema);
