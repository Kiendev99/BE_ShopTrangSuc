const Size = require('../models/listSize');
const asyncHandler = require('express-async-handler')
const Product = require('../models/product');


const createdSize = asyncHandler(async (req, res) => {
    const response = await Size.create(req.body)
    return res.json({
        success: response ? 'Thêm Size thành công' : false,
        createdBrand: response ? response : 'Ko thêm Size được!!'
    })
})


module.exports = {
    createdSize,
    // getAllBrand,
    // updateBrand,
    // deleteBrand,
    // getBrand,
    // getProductsByBrandId
}