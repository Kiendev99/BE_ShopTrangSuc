const Voucher = require('../models/coupon')
const User = require('../models/user')
const asyncHandler = require('express-async-handler')

const createdCoupon = asyncHandler(async (req, res) => {
    try {
        const checkVoucher = await Voucher.findOne({ code: req.body.code });
        if (checkVoucher) {
            return res.status(404).json({
                message: "Mã code đã tồn tại",
            });
        }

        const data = await Voucher.create(req.body);

        if (!data) {
            return res.status(404).json({
                message: "Thêm voucher thất bại",
            });
        }

        return res.status(200).json({
            message: "Thêm voucher thành công",
            data: data,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi server: " + error.message,
        });
    }
})

const getCoupons = asyncHandler(async (req, res) => {
    try {
        const data = await Voucher.findOne({ code: req.body.code });

        if (!data) {
            return res.status(404).json({
                message: "Voucher không tồn tại",
            });
        }

        const user = await User.findOne({ coupon: data._id });
        if (user) {
            return res.status(400).json({
                message: "Bạn đã sử dụng voucher này",
            });
        }

        if (data.limit === 0) {
            return res.status(404).json({
                message: "Voucher đã hết lượt sử dụng",
            });
        }

        return res.status(200).json({
            message: "Thông tin voucher",
            data: data,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi server: " + error.message,
        });
    }
})

const getCouponByDiscount = asyncHandler(async (req, res) => {
    try {
        const data = await Voucher.find({ type: ["discount","freeship","percentage"]});

        if (!data || data.length === 0) {
            return res.status(404).json({
                message: "Không có dữ liệu",
            });
        }

        return res.status(200).json({
            message: "Thông tin các voucher",
            data,
        });
    } catch (err) {
        return res.status(500).json({
            message: "Đã có lỗi xảy ra",
        });
    }
})

// const deleteCoupon = asyncHandler(async (req, res) => {
//     const { cid } = req.params
//     const response = await Coupon.findByIdAndDelete(cid)
//     return res.json({
//         success: response ? 'Xoa Coupon thành công' : false,
//         deleteCoupon: response ? response : 'Ko xoa Coupon được!!'
//     })
// })

module.exports = {
    createdCoupon,
    getCoupons,
    getCouponByDiscount,
    // deleteCoupon
}