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
            { $match: { ...matchCondition, status: { $in: ["Đợi xác nhận", "Đã xác nhận", "Đang giao hàng"] } } },
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
            { $group: { _id: "$user", totalPrice: { $sum: "$totalPrice" } } },
            { $sort: { totalPrice: -1 } },
            { $limit: 5 }
        ]);


        const topBuyersWithDetails = await User.populate(topBuyers, { path: '_id', select: 'firstname lastname email orders' });

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

const getTopProductSeller = async (req, res) => {
    try {
        const topProducts = await Product.find({})
            .sort({ sold: -1 })
            .select("title price sold")
            .limit(5);

        return res.status(200).json({
            success: true,
            message: 'Top 5 sản phẩm mua hàng nhiều nhất',
            topProducts: topProducts,
        });
    } catch (error) {
        console.error("Error getting top buyers:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const getTotalPriceMonth = async (req, res) => {
    try {
        let matchCondition = {}

        const { startYear, endYear } = req.body;

        const startDate = new Date(`${startYear}-01T00:00:00.000Z`);
        const endDate = new Date(`${endYear}-12-31T23:59:59.999Z`);

        matchCondition.createdAt = {
            $gte: startDate,
            $lte: endDate,
        };

        const result = await Order.aggregate([
            {
                $match: {
                    status: { $nin: ["Đã hủy"] },
                    ...matchCondition
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    totalPrice: { $sum: "$totalPrice" }
                }
            },
        ]);

        const finalData = [];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const formattedMonth = currentDate.toISOString().slice(0, 7);

            // Kiểm tra xem tháng này có trong kết quả không
            const foundMonth = result.find(item => item._id === formattedMonth);

            // Chỉ thêm vào finalData nếu nằm trong khoảng thời gian đã chọn
            if (currentDate >= startDate && currentDate <= endDate) {
                if (foundMonth) {
                    finalData.push({ month: formattedMonth, totalAmount: foundMonth.totalPrice });
                } else {
                    finalData.push({ month: formattedMonth, totalAmount: 0 });
                }
            }

            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        const totalAmountAllMonths = finalData.reduce((total, monthData) => total + monthData.totalAmount, 0);

        console.log(totalAmountAllMonths);

        res.json({ result: finalData, totalAmountAllMonths });
    } catch (error) {
        console.error("Lỗi khi lấy tổng tiền theo khoảng thời gian:", error);
        res.status(500).json({ error: "Đã xảy ra lỗi khi lấy tổng tiền theo khoảng thời gian" });
    }
}

const getTotalPriceDay = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const datesInRange = [];

        // Tạo mảng chứa tất cả ngày trong khoảng thời gian
        const currentDate = new Date(start);
        while (currentDate <= end) {
            datesInRange.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const result = await Order.aggregate([
            {
                $match: {
                    status: { $nin: ["Đã hủy", "Đã hoàn tiền"] },
                    createdAt: {
                        $gte: new Date(startDate),
                        $lt: new Date(endDate)
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalAmount: { $sum: "$totalPrice" }
                }
            },
            {
                $sort: { _id: 1 } // Sắp xếp theo ngày tăng dần
            }
        ]);

        const logData = {};

        result.forEach(item => {
            logData[item._id] = item.totalAmount;
        });

        console.log("Tất cả các ngày trong khoảng thời gian:");
        console.log(datesInRange);

        console.log("Tổng tiền từng ngày trong khoảng thời gian:");
        console.log(logData);

        // Kiểm tra và log những ngày không có dữ liệu từ kết quả truy vấn
        datesInRange.forEach(date => {
            const dateString = date.toISOString().split('T')[0];
            if (!logData.hasOwnProperty(dateString)) {
                logData[dateString] = 0;
            }
        });

        // Tạo mảng giống dailyTotals từ kết quả truy vấn và logData
        const dailyTotals = datesInRange.map(date => {
            const dateString = date.toISOString().split('T')[0];
            return {
                _id: dateString,
                totalAmount: logData[dateString]
            };
        });

        console.log("Tổng tiền từng ngày trong khoảng thời gian sau khi kiểm tra:");
        console.log(logData);

        // Tính totalAmountInRange từ logData
        const totalAmountInRange = Object.values(logData).reduce((total, amount) => total + amount, 0);

        console.log("Tổng tổng tiền trong khoảng thời gian:", totalAmountInRange);

        res.json({ dailyTotals, logData, totalAmountInRange });

    } catch (error) {
        console.error("Lỗi khi lấy tổng tiền từng ngày trong khoảng thời gian:", error);
        res.status(500).json({ error: "Đã xảy ra lỗi khi lấy tổng tiền từng ngày trong khoảng thời gian" });
    }
}

module.exports = {
    getStatistics,
    updateStatistics,
    getTopBuyers,
    getTotalPriceMonth,
    getTotalPriceDay,
    getTopProductSeller
};