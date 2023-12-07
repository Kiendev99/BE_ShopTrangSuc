const Order = require('../models/order');
const User = require('../models/user');
const Product = require('../models/product');
const Stat = require('../models/statis');

const getStatistics = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);

        const orderStatusCounts = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const totalUsers = await User.countDocuments();

        const bestSellingProduct = await Order.aggregate([
            { $unwind: "$products" },
            { $group: { _id: "$products.product", totalQuantity: { $sum: "$products.quantity" } } },
            { $sort: { totalQuantity: -1 } },
            { $limit: 1 }
        ]);

        const statistic = {
            totalOrders,
            totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
            orderStatusCounts: orderStatusCounts.reduce((acc, status) => {
                acc[status._id] = status.count;
                return acc;
            }, {}),
            totalUsers,
            bestSellingProduct: bestSellingProduct.length > 0 ? bestSellingProduct[0]._id : null,
        };
        const confirmedStatus = "Đã xác nhận";
        const confirmedOrdersTotal = await Order.aggregate([
            { $match: { status: confirmedStatus } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);

        
        const pendingPaymentOrdersTotal = await Order.aggregate([
            { $match: { status: "Chờ thanh toán" } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);

        const processingOrdersTotal = await Order.aggregate([
            { $match: { status: "Đang xử lý" } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);

        
        statistic.confirmedOrdersTotal = confirmedOrdersTotal.length > 0 ? confirmedOrdersTotal[0].total : 0;
        statistic.pendingPaymentOrdersTotal = pendingPaymentOrdersTotal.length > 0 ? pendingPaymentOrdersTotal[0].total : 0;
        statistic.processingOrdersTotal = processingOrdersTotal.length > 0 ? processingOrdersTotal[0].total : 0;
        return res.status(200).json({
            success: true,
            message: 'Hiển thị thống kê thành công! ',
            statistic,
        })
    } catch (error) {
        console.error("Error getting statistics:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


const updateStatistics = async () => {
    try {
        
        const totalOrders = await Order.countDocuments();
        
        
        let statistic = await Stat.findOne();

        if (!statistic) {
            statistic = await Stat.create({
                totalOrders,
                
            });
        } else {
           
            statistic.totalOrders = totalOrders;
            
            
            await statistic.save();
        }
    } catch (error) {
        
        console.error("Lỗi cập nhật thống kê:", error);
    }
};

module.exports = { 
    getStatistics,
   updateStatistics,
};