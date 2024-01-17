const Size = require('../models/listSize');
const asyncHandler = require('express-async-handler')
const Product = require('../models/product');
const listSize = require('../models/listSize');


const createdSize = asyncHandler(async (req, res) => {
    const response = await Size.create(req.body)
    return res.json({
        success: response ? 'Thêm Size thành công' : false,
        createdBrand: response ? response : 'Ko thêm Size được!!'
    })
})
const getAllSize = asyncHandler(async(req,res)=>{
    const response = await listSize.find()
    return res.json({
        success : response ? 'Hiển thị size thành công' : false,
        getAllSize : response ? response : 'Ko hiển thị size được!!'
    })
})
const deleteSize = asyncHandler(async (req, res) => {
    const { id } = req.params
    const response = await listSize.findByIdAndDelete(id)
    return res.json({
        success: response ? 'Xóa Size thành công' : false,
        deleteSize: response ? response : 'Ko xóa Size được!!'
    })
})
const getSize = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const response = await Size.findById(id);
    return res.json({
        success: response ? 'Hiển thị Size thành công' : false,
        getSize: response ? response : 'Không tìm thấy Size!!',
    });
});
const updateSize = asyncHandler(async (req, res) => {
    const { id } = req.params
    const response = await listSize.findByIdAndUpdate(id, req.body, { new: true })
    return res.json({
        success: response ? 'Cập nhập Size thành công' : false,
        updateSize: response ? response : 'Ko cập nhập Size được!!'
    })
})
const searchSize = async (req, res) => {
    try {
        const { search = "" } = req.body;

        const sizes = await Size.find({
            nameSize: { $regex: new RegExp(search, "i") }
        });

        if (!sizes || sizes.length === 0) {
            return res.json({
                message: "Danh sách sản phẩm trống.",
            });
        }

        return res.json({
            message: "Lấy danh sách thành công.",
            data: sizes,
        });
    } catch (error) {
        return res.json({
            message: error.message || "Xảy ra lỗi không xác định.",
        });
    }
};

module.exports = {
    createdSize,
    getAllSize,
    deleteSize,
    updateSize,
    getSize,
    searchSize
    // getAllBrand,
    // updateBrand,
    // deleteBrand,
    // getBrand,
    // getProductsByBrandId
}