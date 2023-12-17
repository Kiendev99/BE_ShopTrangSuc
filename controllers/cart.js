const Cart = require('../models/cart');
const userModel = require('../models/user');
const Size = require('../models/listSize');
const Product = require('../models/product');


const getCartByUser = async (req, res) => {
  try {
    const cartId = req.params.id;
    const cart = await Cart.findById(cartId).populate("products._id").populate({
      path: "products",
      populate: "product"
    });
    // console.log(cart);

    return res.status(200).json({
      message: "Thông tin giỏ hàng",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message,
    });
  }
};

const addToCart = async (req, res) => {
  const productId = req.body.product;
  const quantity = req.body.quantity || 1;
  const userId = req.body.userId

  try {
    const user = await userModel.findById(userId);
    const cart = await Cart.findById(user.cart);
    const listSize = await Size.findById(req.body.listSize).populate('list_size')
    console.log(listSize);
    if (!cart) {
      const newCart = new Cart({
        products: [{ product: productId, quantity, listSize }],
      });

      const data = await newCart.save();
      user.cart = data._id;
      await user.save();
    } else {

      const existingProduct = cart.products.find(
        (item) => item.product === productId && item.listSize === listSize
      );

      if (existingProduct) {
        existingProduct.quantity += quantity;

      } else {
        cart.products.push({ product: productId, quantity: quantity, size: listSize });
      }

      await cart.save();
    }

    return res.status(200).json({
      message: "Sản phẩm đã được thêm vào giỏ hàng",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server: " + error.message,
    });
  }
};


const updateCart = async (req, res) => {
  const productId = req.body.productId;
  const quantity = req.body.quantity;
  const userId = req.body.userId;
  const size = req.body.size

  try {
    const user = await userModel.findById(userId);
    const cart = await Cart.findById(user.cart);

    if (!cart) {
      return res.status(404).json({ error: 'Giỏ hàng không tồn tại.' });
    } else {
      const existingProduct = cart.products.find(
        (item) => item.product.toString() === productId && item.size === size
      );

      if (!existingProduct) {
        return res.status(404).json({ error: 'Sản phẩm không tồn tại trong giỏ hàng.' });
      } else {

        existingProduct.quantity = quantity;

        // cart.totalPrice = TotalPrice(cart);


        await cart.save();

        return res.status(200).json({
          message: 'Giỏ hàng đã được cập nhật.',
          cart: cart
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server: ' + error.message,
    });
  }
};


const TotalPrice = (cart) => {
  let totalPrice = 0;
  for (let i = 0; i < cart.products.length; i++) {
    const product = cart.products[i];
    totalPrice += product.product.price * product.quantity;
  }
  return totalPrice;
};


const viewCart = async (req, res) => {
  try {
    const cartItems = await Cart.find().populate("product.productId");
    // console.log(cartItems);
    const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = cartItems.reduce((total, item) => total + item.total, 0);

    res.json({ cart: cartItems, totalQuantity, totalPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi kết nối' });
  }
};
const clearCart = async (req, res) => {
  const userId = req.body.userId;

  try {

    const user = await userModel.findById(userId);
    // console.log(userId)
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại.' });
    }


    let cart = await Cart.findById(user.cart);

    if (!cart) {
      return res.status(404).json({ error: 'Giỏ hàng không tồn tại.' });
    } else {

      cart.products = [];


      await cart.save();

      return res.status(200).json({
        message: 'Giỏ hàng đã được xóa.',
        cart: cart
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server: ' + error.message,
    });
  }
};
const removeProduct = async (req, res) => {
  const productId = req.body.productId;
  // const userId = req.body.userId;
  const idCart = req.params.id

  try {
    // console.log(productId);
    // const user = await userModel.findById(userId);
    // if (!user) {
    //   return res.status(404).json({ error: 'Người dùng không tồn tại.' });
    // }


    const cart = await Cart.findById(idCart);

    if (!cart) {
      return res.status(404).json({ error: 'Giỏ hàng không tồn tại.' });
    } else {

      const existingProductIndex = cart.products.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingProductIndex === -1) {
        return res.status(404).json({ error: 'Sản phẩm không tồn tại trong giỏ hàng.' });
      } else {

        cart.products.splice(existingProductIndex, 1);


        await cart.save();

        return res.status(200).json({
          message: 'Sản phẩm đã được xóa khỏi giỏ hàng.',
          cart: cart
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi server: ' + error.message,
    });
  }
};
module.exports = {
  updateCart,
  addToCart,
  viewCart,
  getCartByUser,
  removeProduct,
  clearCart,
};
