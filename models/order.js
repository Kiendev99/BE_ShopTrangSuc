const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            size: {
                type: Number,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
        },
    ],
    email: {
        type: String,
        required: true, 
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email address'], 
    },
    address: {
        type: String,
        default: "",
        required: true,
        trim: true
    },
    note: {
        type: String,
        default: "",
        required: true,
        
    },
    mobile: {
        type: String,
        required: true
    },

    totalPrice: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ["Thanh toán khi nhận hàng", "VN Pay"],
        required: true,
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
    },
    coupon: {
        type: mongoose.Types.ObjectId,
        ref: 'Coupon'
    },
    status: {
        type: String,
        enum: [
            "Đã thanh toán",
            "Đang xử lý",
            "Đang giao hàng",
            "Đã giao hàng",
            "Đã hủy",
            "Đã hoàn tiền",
            "Đã hoàn thành",
            "Đợi xác nhận",
            "Đã xác nhận"
        ],
        default: "Đang xử lý",
    },
},
    { timestamps: true }
);

//Export the model
module.exports = mongoose.model('Order', orderSchema);