const Category = require('../models/category')
const asyncHandler = require('express-async-handler')

const createdCategory = asyncHandler(async(req,res)=>{
    const response = await Category.create(req.body)
    return res.json({
        success : response ? 'Thêm category thành công' : false,
        createdCategory : response ? response : 'Ko thêm category được!!'
    })
})



const getAllCategory = asyncHandler(async(req,res)=>{
    const response = await Category.find().select('title _id')
    return res.json({
        success : response ? 'Hiển thị category thành công' : false,
        getAllCategory : response ? response : 'Ko hiển thị category được!!'
    })
})

const getOneCategory = asyncHandler(async (req, res) => {
    const { pcid } = req.params;
    const response = await Category.findById(pcid);
    return res.json({
        success: response ? 'Hiển thị category thành công' : false,
        getOneCategory: response ? response : 'Không tìm thấy category!!',
    });
});




const updateCategory = asyncHandler(async(req,res)=>{
    const {pcid} = req.params
    const response = await Category.findByIdAndUpdate(pcid,req.body,{new:true})
    return res.json({
        success : response ? 'Cập nhập category thành công' : false,
        updateCategory : response ? response : 'Ko cập nhập category được!!'
    })
})



const deleteCategory = asyncHandler(async(req,res)=>{
    const {pcid} = req.params
    const response = await Category.findByIdAndDelete(pcid)
    return res.json({
        success : response ? 'Xóa Category thành công' : false,
        deleteCategory : response ? response : 'Ko xóa category được!!'
    })
})

module.exports = {
    createdCategory,
    getAllCategory,
    updateCategory,
    deleteCategory,
    getOneCategory

}
