const mongoose = require('mongoose');

const statisSchema = new mongoose.Schema({

    totalOrders: {
        type: Number,
        default: 0,
    },
    totalRevenue: {
        type: Number,
        default: 0,
    },
    orderStatusCounts: {
        type: Map,
        of: Number,
        default: {},
    },
    totalUsers: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    bestSellingProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    },
},
    { timestamps: true }
)

module.exports = mongoose.model('Statis', statisSchema);
