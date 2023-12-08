const e = require('express')
const Product = require('../models/product')
const asyncHandler = require('express-async-handler')
const slugify = require('slugify') //npm i slugify
const Category = require('../models/category')
const brand = require('../models/brand')
// Thêm sản phẩm
const createProduct = asyncHandler(async (req, res) => {
    const fileData = req.files;
    if (!fileData || fileData.length === 0) {
        return res.status(400).json({
            error: 'Vui lòng tải lên ít nhất một hình ảnh sản phẩm',
        });
    }

    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
            error: 'Dữ liệu không được để trống',
        });
    }

    if (!req.body.category) {
        return res.status(400).json({
            error: 'Vui lòng cung cấp categoryId cho sản phẩm',
        });
    }
  
    if (req.body.title) {
        req.body.slug = slugify(req.body.title);
    }
    console.log(req.body.category)
    const imagePaths = fileData.map(file => file.path);

    const newProduct = await Product.create({
        ...req.body,
        images: imagePaths, // Sử dụng mảng đường dẫn đến các tệp
    });

    // Thêm sản phẩm vào danh mục
    await Category.findByIdAndUpdate(newProduct.category, {
        $addToSet: {
            products: newProduct._id,
        },
    });
    await brand.findByIdAndUpdate(newProduct.brand, {
        $addToSet: {
            products: newProduct._id,
        },
    });
    return res.status(200).json({
        success: newProduct ? 'Thêm sản phẩm thành công' : false,
        createdProduct: newProduct ? newProduct : 'Không thêm được sản phẩm mới',
    });
});

// Hiển thị 1 sản phẩm
const getProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params
    const product = await Product.findById(pid)
    return res.status(200).json({
        success: product ? 'Hiển thị sản phẩm thành công' : false,
        productData: product ? product : 'KO có sản phẩm'
    })
})
// Hiển thị tất cả sản phẩm
// Filtering, sorting & pagination (Lọc Sắp xếp và phân trang)
const getProducts = asyncHandler(async (req, res) => {
    const queries = {...req.query}
    // tách các trường đặc biệt ra khỏi query
    const excludeFields = ['limit','sort','page','fields']
    excludeFields.forEach(el => delete queries[el]);

    //Format lại các operators cho đúng cú pháp mongoose 
    let queryString = JSON.stringify(queries)
    queryString = queryString.replace(/\b(gte|gt|lt|lte)\b/g, matchedEl => `$${matchedEl}`)
    const formattedQueries = JSON.parse(queryString)
    // Filtering lọc
    if(queries?.title) formattedQueries.title = {$regex:queries.title,$options:'i'}
	
    // Pagination
    const page = +req.query.page || 1; // Trang hiện tại
    const limit = +req.query.limit || process.env.LIMIT_PRODUCTS // Số lượng sản phẩm trên mỗi trang
    const skip = (page -1) * limit
    try {

        // Tạo đối tượng truy vấn
        let queryCommand = Product.find(formattedQueries);



        // Fields limiting (Hạn chế trường)
          if (req.query?.fields) {
            const fieldsToInclude = req.query.fields.split(',').join(' ');
            queryCommand = queryCommand.select(fieldsToInclude);
        }


        //Sắp xếp
        if (req.query?.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            queryCommand = queryCommand.sort(sortBy);
        } else {
            queryCommand = queryCommand.sort('_id'); // Sắp xếp theo trường _id mặc định nếu không có trường sort được chỉ định
        }



        // Phân trang
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Product.countDocuments(formattedQueries);
        queryCommand = queryCommand.skip(startIndex).limit(limit);
        queryCommand.skip(skip).limit(limit)



        // Thực thi truy vấn
        const response = await queryCommand.exec();
        

        // Đếm số lượng sản phẩm thỏa mãn điều kiện
        const counts = await Product.find(formattedQueries).countDocuments();


        // Tạo đối tượng phân trang 
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }
        return res.status(200).json({
            success: response.length > 0 ? 'Hiển thị sản phẩm thành công' : false,
            counts,
            productDatas: response.length > 0 ? response : 'Không có sản phẩm',
            pagination
        });
    } catch (err) {
        throw new Error(err.message);
    }


   
    
   
})
const getFilteredProducts = async (req, res) => {
    try {
        const { title, minPrice, maxPrice } = req.query;

        const filterConditions = {};

        if (title) {
            filterConditions.title = { $regex: title, $options: 'i' };
        }

        if (minPrice) {
            filterConditions.price = { $gte: parseFloat(minPrice) };
        }

        if (maxPrice) {
            filterConditions.price = {
                ...filterConditions.price,
                $lte: parseFloat(maxPrice),
            };
        }

        const filteredProducts = await Product.find(filterConditions);

        return res.status(200).json({
            success: filteredProducts.length > 0,
            productData: filteredProducts.length > 0 ? filteredProducts : 'Không có sản phẩm phù hợp',
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
// cập nhập sản phẩm
const updateProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const fileData = req.files;
    
    try {
        let updatedFields = req.body;

        // Nếu có tựa đề mới, cập nhật slug
        if (req.body.title) {
            updatedFields.slug = slugify(req.body.title);
        }

        // Nếu có hình ảnh mới, thêm vào mảng images
        if (req.files && req.files.length > 0) {
            // Lưu ý: Điều này giả sử bạn sử dụng middleware để xử lý file (ví dụ: multer)
            const newImages = req.files.map(file => file.path);
            updatedFields.images = [...newImages];
            
            // Xóa hình ảnh cũ trên Cloudinary
            const oldProduct = await Product.findById(pid);
            oldProduct.images.forEach(async (oldImage) => {
                // Sử dụng Cloudinary API để xóa hình ảnh
                // Cloudinary.v2.uploader.destroy(oldImage.public_id, (error, result) => {
                //     if (error) console.log(error);
                //     console.log(result);
                // });
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(pid, updatedFields, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm để cập nhật',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Cập nhật sản phẩm thành công',
            updatedProduct,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật sản phẩm',
            error: error.message,
        });
    }
});

// Xóa sản phẩm
const deleteProduct = asyncHandler(async (req, res) => {
    const { pid } = req.params
    const deletedProduct = await Product.findByIdAndDelete(pid)
    return res.status(200).json({
        success: deletedProduct ? 'Xóa sản phẩm thành công' : false,
        deletedProduct: deletedProduct ? deletedProduct : 'KO xóa được sản phẩm'
    })
})




//
const ratings = asyncHandler( async(req,res)=>{
    const {_id} = req.user
    const {star,comment,pid} = req.body
    if(!star || !pid) throw new Error('KO dc bo trong')
    const ratingProduct = await Product.findById(pid)
    const alreadyRating = ratingProduct?.ratings?.find(el => el.postedBy.toString() === _id)
    // console.log({alreadyRating});
    if(alreadyRating){
        //update star & coment
        await Product.updateOne({
            ratings: { $elemMatch: alreadyRating}
        }, {
            $set:{"ratings.$.star":star,"ratings.$.comment":comment}
        },{new:true})

    }else{
        //add start %comment
        await Product.findByIdAndUpdate(pid,{
            $push:{ratings: {star,comment,postedBy:_id}}
        },{new:true})
       
    }
    // sum ratings

    const updateProduct = await Product.findById(pid)
    const ratingCount = updateProduct.ratings.length
    const sumRatings = updateProduct.ratings.reduce((sum,el) => sum + +el.star,0)
    updateProduct.totalRatings = Math.round(sumRatings * 10/ratingCount) / 10
    await updateProduct.save()

    return res.status(200).json({
        status:true
    })
})


module.exports = {
    createProduct,
    getProduct,
    getProducts,
    deleteProduct,
    updateProduct,
    ratings,
    getFilteredProducts
}