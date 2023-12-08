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
            message: "Thông tin các coupon",
            data,
        });
    } catch (err) {
        return res.status(500).json({
            message: "Đã có lỗi xảy ra",
        });
    }
})

const deleteCoupon = asyncHandler(async (req, res) => {
     const { cid } = req.params
    const response = await Voucher.findByIdAndDelete(cid)
    return res.json({
        success: response ? 'Xoa Coupon thành công' : false,
        deleteCoupon: response ? response : 'Ko xoa Coupon được!!'
    })
})
const getAll = async (req, res) => {
    try {
        const vouchers = await Voucher.find();

        if (!vouchers || vouchers.length === 0) {
            return res.status(404).json({
                message: "Không có danh sách",
            });
        }
        res.status(200).json({
            message: "Danh sách voucher",
            data: vouchers,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi server: " + error.message,
        });
    }
};
const getCouponById = asyncHandler(async(req, res) =>{
    try {
        const data = await Voucher.findById(req.params.id);

        if (!data) {
            return res.status(404).json({
                message: "Không có thông tin",
            });
        }

        return res.status(200).json({
            message: "Thông tin coupon",
            data: data,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi server: " + error.message,
        });
    }
})
const updateCoupon = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const existingCoupon = await Voucher.findById(id);
        if (!existingCoupon) {
            return res.status(404).json({
                message: "Cập nhật coupon thất bại. Coupon không tồn tại.",
            });
        }
        const newData = req.body;
        if (!Object.keys(newData).length) {
            return res.status(400).json({
                message: "Cập nhật coupon thất bại. Vui lòng điền dữ liệu mới.",
            });
        }
   
        const updatedCoupon = await Voucher.findByIdAndUpdate(
            id,
            { $set: newData },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            message: "Cập nhật coupon thành công",
            data: updatedCoupon,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi server: " + error.message,
        });
    }
});
module.exports = {
    createdCoupon,
    getCoupons,
    getCouponByDiscount,
    deleteCoupon,
    getAll,
    getCouponById,
    updateCoupon,
};
