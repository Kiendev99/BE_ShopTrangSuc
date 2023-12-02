const User = require('../models/user')
const asyncHandler = require('express-async-handler') // yarn add express-async-handler 
const { generateAccessToken, generateRefreshToken } = require('../middlewares/jwt')
const jwt = require('jsonwebtoken') 
const crypto = require('crypto')
const sendMail = require('../ultils/sendMail')
const bcrypt = require('bcrypt');

// Đăng ký
const register = asyncHandler(async (req, res) => {
    const { email, password, firstname, lastname } = req.body
    if (!email || !password || !lastname || !firstname)
        return res.status(400).json({
            sucess: false,
            mes: 'Ko được bỏ trống'
        })

    const user = await User.findOne({ email })
    if (user) throw new Error('Người dùng đã tồn tại')
    else {
        const newUser = await User.create(req.body)
        return res.status(200).json({
            sucess: newUser ? true : false,
            mes: newUser ? 'Đăng ký thành công Vui lòng Đăng nhập!~' : 'Đã xảy ra lỗi'
        })
    }
})
// Refresh token => Cấp mới access token
// Access token => Xác thực người dùng, quân quyên người dùng
// Đăng Nhập
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            mes: 'Ko được bỏ trống',
        });
    }

    const response = await User.findOne({ email });

    if (response && (await response.isCorrectPassword(password))) {
        
        const { password: _, ...userData } = response.toObject();

        const accessToken = generateAccessToken(response._id, response.role);
        const newRefreshToken = generateRefreshToken(response._id);

        await User.findByIdAndUpdate(response._id, { refreshToken: newRefreshToken }, { new: true });

        res.cookie('refreshToken', newRefreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

        return res.status(200).json({
            success: true,
            accessToken,
            userData,
        });
    } else {
        throw new Error('Thông tin không hợp lệ!');
    }
});

// GET ra 1 người dùng
// const getCurrent = asyncHandler(async (req, res) => {
//     const { _id } = req.params
//     const user = await User.findById(_id).select('-refreshToken -password -role')
//     return res.status(200).json({
//         success: user ? true : false,
//         rs: user ? user : 'Ko tìm thấy người dùng'
//     })
// })
const getCurrent = asyncHandler(async (req, res) => {
    const { uid } = req.params
    const user = await User.findById(uid)
    return res.status(200).json({
        success: user ? 'Hiển thị người dùng' : false,
        use: user ? user : 'Ko tìm thấy người dùng'
    })
})



// Hiển thị tài khoản người dùng
const getUsers = asyncHandler(async (req, res) => {
    const response = await User.find()
    return res.status(200).json({
        success: response ? true : false,
        users: response
    })
})

// Xóa tài khoản User
const deleteUser = asyncHandler(async (req, res) => {
    const { _id } = req.query
    if (!_id) throw new Error('Missing inputs')
    const response = await User.findByIdAndDelete(_id)
    return res.status(200).json({
        success: response ? true : false,
        deletedUser: response ? `Người dùng ${response.email} đã bị xóa` : 'Tài khoản ko tồn tại'
    })
})

// Cập nhập Người dùng
const updateUser = asyncHandler(async (req, res) => {
    const { _id, password } = req.body;
  
    if (!_id || Object.keys(req.body).length === 0) {
      throw new Error('Missing inputs');
    }
  
    if (password) {
      req.body.password = await bcrypt.hash(password, 10);
    }
  
    const response = await User.findByIdAndUpdate(_id, req.body, { new: true }).select('-password -role -refreshToken');
  
    return res.status(200).json({
      success: !!response,
      updatedUser: response ? response : 'Something went wrong',
    });
  });


//Update Password
const updatePassword = asyncHandler(async (req, res) => {
    try {
        // const { _id } = req.user;
        const { oldPassword, newPassword, _id } = req.body;

        const user = await User.findById(_id);

        if (!oldPassword) {
            return res.status(400).json({ success: false, error: "Vui lòng nhập mật khẩu cũ." });
        }

        const isPasswordMatch = await user.isCorrectPassword(oldPassword);
        if (!isPasswordMatch) {
            return res.status(401).json({ success: false, error: "Mật khẩu cũ không đúng." });
        }

        if (newPassword) {
            // Ensure that you're using a secure method to hash the new password, e.g., bcrypt
            user.password = newPassword;
            const updatedUser = await user.save();
            return res.json({ success: true, user: updatedUser });
        } else {
            return res.json({ success: true, user });
        }
    } catch (error) {
        console.error("Error updating password:", error);
        return res.status(500).json({ success: false, error: "Đã xảy ra lỗi khi cập nhật mật khẩu." });
    }
});


// Cập nhập Admin
const updateUserByAdmin = asyncHandler(async (req, res) => {
    const { uid } = req.params
    if (Object.keys(req.body).length === 0) throw new Error('Missing inputs')
    const response = await User.findByIdAndUpdate(uid, req.body, { new: true }).select('-password -role -refreshToken')
    return res.status(200).json({
        success: response ? true : false,
        updatedUser: response ? response : 'Some thing went wrong'
    })
})

// Cập nhập địa chỉ User
const updateUserAddress = asyncHandler(async (req, res) => {
    const { _id } = req.user
    if (!req.body.address) throw new Error('Ko duoc bo trong')
    const response = await User.findByIdAndUpdate(_id, { $push: {address: req.body.address }}, { new: true }).select('-password -role -refreshToken')
    return res.status(200).json({
        success: response ? true : false,
        updatedUser: response ? response : 'Some thing went wrong'
    })
})

const updateCart = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const {pid , quantity, size} = req.body
    if (!pid || !quantity || !size) throw new Error('Ko được để trống !')
    const user = await User.findById(_id).select('cart')
    const alreadyProduct = user?.cart?.find(el => el.product.toString() === pid)
    if (alreadyProduct) {
        if(alreadyProduct.size === size){
            const response = await User.updateOne({cart: { $elemMatch:alreadyProduct }}, { $set: {"cart.$.quantity":quantity}}, {new:true})
            return res.status(200).json({
                success: response ? true : false,
                updatedUser: response ? response : 'Some thing went wrong'
            })
        }else{
            const response = await User.findByIdAndUpdate(_id, {$push: {cart: {product: pid, quantity, size}}}, { new: true })
            return res.status(200).json({
                success: response ? true : false,
                updatedUser: response ? response : 'Some thing went wrong'
            })
        }
    } else {
        const response = await User.findByIdAndUpdate(_id, {$push: {cart: {product: pid, quantity, size}}}, { new: true })
        return res.status(200).json({
            success: response ? true : false,
            updatedUser: response ? response : 'Some thing went wrong'
        })
    }
   
})


// 
const refreshAccessToken = asyncHandler(async (req, res) => {
    // Lấy token từ cookies
    const cookie = req.cookies
    // Check xem có token hay không
    if (!cookie && !cookie.refreshToken) throw new Error('Ko có mã thông báo làm mới trong cookie')
    // Check token có hợp lệ hay không
    const rs = await jwt.verify(cookie.refreshToken, process.env.JWT_SECRET)
    const response = await User.findOne({ _id: rs._id, refreshToken: cookie.refreshToken })
    return res.status(200).json({
        success: response ? true : false,
        newAccessToken: response ? generateAccessToken(response._id, response.role) : 'Làm mới mã thông báo ko khớp!'
    })
})
// Đăng Xuất
const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies
    if (!cookie || !cookie.refreshToken) throw new Error('KO có mã thông báo làm mới trong cookie')
    // Xóa refresh token ở db
    await User.findOneAndUpdate({ refreshToken: cookie.refreshToken }, { refreshToken: '' }, { new: true })
    // Xóa refresh token ở cookie trình duyệt
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true
    })
    return res.status(200).json({
        success: true,
        mes: 'Đăng xuất thành công !'
    })
})


const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.query
    if (!email) throw new Error('Thiếu email')
    const user = await User.findOne({ email })
    if (!user) throw new Error('Ko tìm thấy người dùng')
    const resetToken = user.createPasswordChangedToken()
    await user.save()

    const html = `Anh/chị đã yêu cầu đổi mật khẩu tại NROJewelry - Trang sức. <br> 

    Anh/chị vui lòng truy cập vào liên kết dưới đây để thay đổi mật khẩu của Anh/chị nhé.. <br> 
    Đây là mã thay đổi mật khẩu :
    ${resetToken}`

    const data = {
        email,
        html
    }
    const rs = await sendMail(data)
    return res.status(200).json({
        success: true,
        rs
    })
})


// rest mật khẩu
const resetPassword = asyncHandler(async (req, res) => {
    const { password, token } = req.body
    if (!password || !token) throw new Error('Ko được bỏ trống ')
    const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({ passwordResetToken, passwordResetExpires: { $gt: Date.now() } })
    if (!user) throw new Error('Mã thông báo đặt lại ko hợp lệ')
    user.password = password
    user.passwordResetToken = undefined
    user.passwordChangedAt = Date.now()
    user.passwordResetExpires = undefined
    await user.save()
    return res.status(200).json({
        success: user ? true : false,
        mes: user ? 'Cập nhật mật khẩu' : 'Đã xảy ra sự cố'
    })
})

//get wishlist
const getWishlist = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    try {
        const findUser = await User.findById(_id).populate('wishlist');
        res.json(findUser.wishlist);
    } catch (err) {
        throw new Error(err);
    }
});

const addCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { pid, quantity, size } = req.body;

    if (!pid || !quantity || !size) {
        throw new Error('Fields cannot be empty!');
    }

    const user = await User.findById(_id).select('cart');
    const alreadyProduct = user?.cart?.find(el => el.product.toString() === pid);

    let response;

    if (alreadyProduct) {
        // Product with the same ID already exists in the cart
        if (alreadyProduct.size === size) {
            // Update quantity if the size matches
            response = await User.updateOne({ cart: { $elemMatch: alreadyProduct } }, { $set: { "cart.$.quantity": quantity } }, { new: true });
        } else {
            // Add a new product with a different size
            response = await User.findByIdAndUpdate(_id, { $push: { cart: { product: pid, quantity, size } } }, { new: true });
        }
    } else {
        // Product does not exist in the cart, add a new one
        response = await User.findByIdAndUpdate(_id, { $push: { cart: { product: pid, quantity, size } } }, { new: true });
    }

    if (!response) {
        throw new Error('Something went wrong');
    }

    res.status(200).json({
        success: true,
        updatedUser: response,
    });
});

const deleteCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { cartId } = req.body;

    if (!cartId) {
        return res.status(400).json({ success: false, error: 'Cart ID is required.' });
    }

    try {
        const user = await User.findById(_id).select('cart');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found.' });
        }

        // Find the index of the cart item to be removed
        const cartIndex = user.cart.findIndex(cartItem => cartItem._id.toString() === cartId);

        if (cartIndex === -1) {
            return res.status(404).json({ success: false, error: 'Cart item not found.' });
        }

        // Remove the cart item using splice
        user.cart.splice(cartIndex, 1);

        // Save the updated user
        await user.save();

        // Recalculate total amount for the entire cart
        const updatedUser = await User.findById(_id).select('cart');
        const totalAmount = updatedUser?.cart?.reduce((sum, item) => sum + item.total, 0) || 0;

        return res.status(200).json({
            success: true,
            message: 'Mục giỏ hàng đã được xóa thành công',
            totalAmount: totalAmount,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});


module.exports = {
    register,
    login,
    getCurrent,
    getUsers,
    deleteUser,
    updateUser,
    updateUserByAdmin,
    updateCart,
    updateUserAddress,
    refreshAccessToken,
    logout,
    forgotPassword,
    resetPassword,
    getWishlist,
    addCart,
    deleteCart,
    updatePassword
}