const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
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
    address: {
        type: String,
        default: "",
        require: true
    },
    mobile: {
        type: String,

        unique: true,
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
            "Chờ thanh toán",
            "Đang xử lý",
            "Đang giao hàng",
            "Đã giao hàng",
            "Đã hủy",
            "Đã hoàn tiền",
            "Đã hoàn thành",
        ],
        default: "Đang xử lý",
    },
},
    { timestamps: true }
);

//Export the model
module.exports = mongoose.model('Order', orderSchema);