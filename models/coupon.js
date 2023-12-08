const mongoose = require('mongoose');


var couponSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },

  discountPrice: {
    type: String,
    required: true,
  },
  fromPrice: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    required: true,

  },

  limit: {
    type: Number,
    required: true,
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "expired"],
    default: "active",
  },
},
  { versionKey: false, timestamps: true }
);

//Export the model
module.exports = mongoose.model('Coupon', couponSchema);