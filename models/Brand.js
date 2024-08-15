const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    dealerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dealer',
        required: true,
    },
}, {
    timestamps: true, 
});

module.exports = mongoose.model('Brand', brandSchema);
