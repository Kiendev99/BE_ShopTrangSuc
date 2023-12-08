// const brand = require('../models/brand')
const Brand = require('../models/brand')
const asyncHandler = require('express-async-handler')
const Product = require('../models/product')

const createdBrand = asyncHandler(async (req, res) => {
    const response = await Brand.create(req.body)
    return res.json({
        success: response ? 'Thêm Brand thành công' : false,
        createdBrand: response ? response : 'Ko thêm Brand được!!'
    })
})



const getAllBrand = asyncHandler(async (req, res) => {
    const response = await Brand.find().select('title _id')
    return res.json({
        success: response ? 'Hiển thị Brand thành công' : false,
        getAllBrand: response ? response : 'Ko hiển thị Brand được!!'
    })
})
const getBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const response = await Brand.findById(id);
    return res.json({
        success: response ? 'Hiển thị brand thành công' : false,
        getBrand: response ? response : 'Không tìm thấy brand!!',
    });
});





const updateBrand = asyncHandler(async (req, res) => {
    const { brid } = req.params
    const response = await Brand.findByIdAndUpdate(brid, req.body, { new: true })
    return res.json({
        success: response ? 'Cập nhập Brand thành công' : false,
        updateBrand: response ? response : 'Ko cập nhập brand được!!'
    })
})



const deleteBrand = asyncHandler(async (req, res) => {
    const { brid } = req.params
    const response = await Brand.findByIdAndDelete(brid)
    return res.json({
        success: response ? 'Xóa Brand thành công' : false,
        deleteBrand: response ? response : 'Ko xóa brand được!!'
    })
})
const getProductsByBrandId = asyncHandler(async (req, res) => {
    const { brand } = req.params;

    // Kiểm tra xem brand có hợp lệ không, nếu không trả về lỗi
    if (!brand) {
        return res.status(400).json({
            success: false,
            error: 'brand brand không hợp lệ',
        });
    }

    // Tìm tất cả sản phẩm thuộc brand có brand
    const products = await Product.find({ brand });

    return res.json({
        success: true,
        products,
    });
});

module.exports = {
    createdBrand,
    getAllBrand,
    updateBrand,
    deleteBrand,
    getBrand,
    getProductsByBrandId
}