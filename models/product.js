const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    // 
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: true,
    },
    brand: 
        {
          type: mongoose.Types.ObjectId,
          ref: "Brand",
        },

    price: {
        type: Number,
        required: true
    },
    priceroot: {
        type: Number,
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'Category'
    },
    quantity: {
        type: Number,
        
    },
    sold: {
        type: Number,
        default: 0
    },
    images: [{
        type: String
    }],

    size: {
        type: String,
        enum: ['6', '7', '8', '9','10','11']
    },
    ratings: [
        {
            star: { type: Number },
            postedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
            comment: { type: String }
        }
    ],
    feedbacks: [
        {
            type: mongoose.Types.ObjectId,
            ref: "Feedback",
            autopopulate: true,
        }
    ],
    totalRatings: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);