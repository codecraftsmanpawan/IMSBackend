const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
         unique: true,
    },
    price: {
        type: Number,
        required: true,
    },
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true,
    },
    dealerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dealer',
        required: true,
    },
});

module.exports = mongoose.model('Model', modelSchema);
