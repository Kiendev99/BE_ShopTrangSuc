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

const updateSize = asyncHandler(async (req, res) => {
    const { id } = req.params
    const response = await listSize.findByIdAndUpdate(id, req.body, { new: true })
    return res.json({
        success: response ? 'Cập nhập Size thành công' : false,
        updateSize: response ? response : 'Ko cập nhập Size được!!'
    })
})
module.exports = {
    createdSize,
    getAllSize,
    deleteSize,
    updateSize
    // getAllBrand,
    // updateBrand,
    // deleteBrand,
    // getBrand,
    // getProductsByBrandId
}