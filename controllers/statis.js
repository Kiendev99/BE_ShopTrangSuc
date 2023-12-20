const Order = require('../models/order');
const User = require('../models/user');
const Product = require('../models/product');
const Stat = require('../models/statis');
const moment = require('moment')

const getStatistics = async (req, res) => {
    try {
        let matchCondition = {}
        if (req.query.startDate) {
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(req.query.endDate || new Date());

            matchCondition.createdAt = {
                $gte: startDate,
                $lte: endDate,
            };
        }


        const totalOrders = await Order.countDocuments(matchCondition);


        const cancelledOrders = await Order.countDocuments({
            ...matchCondition,
            status: 'Đã hủy',
        });


        const validOrders = totalOrders - cancelledOrders;

        const totalRevenue = await Order.aggregate([
            { $match: matchCondition, },
            { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ['$status', 'Đã nhận hàng'] }, '$totalPrice', 0] } } } }
        ]);


        const orderStatusCounts = await Order.aggregate([
            { $match: matchCondition, },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);


        const totalUsers = await User.aggregate([
            { $match: matchCondition, },
            { $group: { _id: null, total: { $sum: 1 }, } }
        ]);

        const bestSellingProduct = await Order.aggregate([
            { $match: matchCondition, },
            { $unwind: "$products" },
            { $group: { _id: "$products.product", totalQuantity: { $sum: "$products.quantity" } } },
            { $sort: { totalQuantity: -1 } },
            { $limit: 1 }
        ]);

        const statistic = {
            totalOrdersL: validOrders,
            totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
            orderStatusCounts: orderStatusCounts.reduce((acc, status) => {
                acc[status._id] = status.count;
                return acc;
            }, {}),
            totalUsers,
            bestSellingProduct: bestSellingProduct.length > 0 ? bestSellingProduct[0]._id : null,
        };

        const pendingPaymentOrdersTotal = await Order.aggregate([
            { $match: { ...matchCondition, status: "Chờ thanh toán" } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);

        const confirmedOrdersTotal = await Order.aggregate([
            { $match: { ...matchCondition, status: { $in: ["Đợi xác nhận", "Đã xác nhận", "Đang giao hàng"] }  } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);

        const processingOrdersTotal = await Order.aggregate([
            { $match: { ...matchCondition, status: "Đã nhận hàng" } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
        const confirmedAndDeliveredOrdersTotal = await Order.aggregate([
            { $match: { ...matchCondition, status: { $in: ["Đợi xác nhận", "Đã xác nhận", "Đang giao hàng"] } } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);


        const receivedOrdersTotal = await Order.aggregate([
            { $match: { ...matchCondition, status: "Đã nhận hàng" } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);

        const revenue = receivedOrdersTotal.length > 0 ? receivedOrdersTotal[0].total : 0;
        const totalOrdersValue = confirmedAndDeliveredOrdersTotal.length > 0 ? confirmedAndDeliveredOrdersTotal[0].total : 0;

        statistic.confirmedOrdersTotal = confirmedOrdersTotal.length > 0 ? confirmedOrdersTotal[0].total : 0;
        statistic.pendingPaymentOrdersTotal = pendingPaymentOrdersTotal.length > 0 ? pendingPaymentOrdersTotal[0].total : 0;
        statistic.processingOrdersTotal = processingOrdersTotal.length > 0 ? processingOrdersTotal[0].total : 0;
        statistic.totalUsers = totalUsers.length > 0 ? totalUsers[0].total : 0
        statistic.cancelledOrders = cancelledOrders > 0 ? cancelledOrders[0] : 0;
        return res.status(200).json({
            success: true,
            message: 'Hiển thị thống kê thành công! ',
            statistic,
            revenue,
            totalOrdersValue,
            cancelledOrders
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
const getTopBuyers = async (req, res) => {
    try {
        let matchCondition = {};


        if (req.query.startDate) {
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(req.query.endDate || new Date());

            matchCondition.createdAt = {
                $gte: startDate,
                $lte: endDate,
            };
        }

        const topBuyers = await Order.aggregate([
            { $match: matchCondition },
            { $unwind: "$user" },
            { $group: { _id: "$user", totalAmount: { $sum: "$totalPrice" } } },
            { $sort: { totalAmount: -1 } },
            { $limit: 5 }
        ]);


        const topBuyersWithDetails = await User.populate(topBuyers, { path: '_id', select: 'firstname lastname email' });

        return res.status(200).json({
            success: true,
            message: 'Top 5 người mua hàng nhiều nhất',
            topBuyers: topBuyersWithDetails,
        });
    } catch (error) {
        console.error("Error getting top buyers:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
module.exports = {
    getStatistics,
    updateStatistics,
    getTopBuyers,
};