const Order = require("../models/order");
const Cart = require("../models/cart");
const User = require("../models/user");
const Voucher = require("../models/coupon");
const Product = require("../models/product");
const Size = require("../models/listSize");
const config = require("config");
const moment = require("moment");
const querystring = require("qs");
const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

const createPaymentUrl = (req, res, next) => {
  process.env.TZ = "Asia/Ho_Chi_Minh";

  let date = new Date();
  let createDate = moment(date).format("YYYYMMDDHHmmss");

  let ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  let config = require("config");

  let tmnCode = config.get("vnp_TmnCode");
  let secretKey = config.get("vnp_HashSecret");
  let vnpUrl = config.get("vnp_Url");
  let returnUrl = config.get("vnp_ReturnUrl");
  let orderId = moment(date).format("DDHHmmss");
  let amount = req.body.amount;
  // let bankCode = req.body.bankCode;

  let locale = req.body.language;
  if (locale === null || locale === "") {
    locale = "vn";
  }
  let currCode = "VND";
  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = locale;
  vnp_Params["vnp_CurrCode"] = currCode;
  vnp_Params["vnp_TxnRef"] = orderId;
  vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = amount * 100;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;
  // if (bankCode !== null && bankCode !== '') {
  //     vnp_Params['vnp_BankCode'] = bankCode;
  // }

  vnp_Params = sortObject(vnp_Params);

  let querystring = require("qs");
  let signData = querystring.stringify(vnp_Params, { encode: false });
  let crypto = require("crypto");
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;
  vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

  return res.status(200).json({
    message: "Truy cập đường dẫn",
    url: vnpUrl,
  });
};

const changeStatusPayment = async (req, res) => {
  const id = req.body.idOrder;
  const data = await Order.findById(id);

  data.status = "Đang xử lý";
  await data.save();
  return res.status(200).json({
    message: "Thanh cong",
  });
};

const vnpayReturn = (req, res, next) => {
  // Nhận Tham số từ VNPay
  let vnp_Params = req.query;

  // Lấy và Xác Minh Chữ Ký An toàn
  let secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  // Sắp Xếp và Chuẩn Bị Dữ liệu để Xác Minh Chữ Ký
  vnp_Params = sortObject(vnp_Params);

  // Lấy Cấu Hình và Khóa Bí mật
  let tmnCode = config.get("vnp_TmnCode");
  let secretKey = config.get("vnp_HashSecret");

  // Tạo và Xác Minh Chữ Ký
  let signData = querystring.stringify(vnp_Params, { encode: false });
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

  // Xử lý Kết Quả và Hiển Thị Trang Tương Ứng
  if (secureHash === signed) {
    res.redirect("http://localhost:4200/");
  }
};

const createOrder = async (req, res) => {
  try {
    const user = await User.findById(req.body.user);
    const userCart = await Cart.findById(user.cart);

    if (!userCart) {
      return res.status(404).json({
        message: "Chưa có giỏ hàng",
      });
    }

    const orderStatus =
      req.body.paymentMethod === "VN Pay" ? "Đã thanh toán" : "Đợi xác nhận";

    const cartProducts = userCart.products;
    const userId = user._id;
    const orderData = {
      ...req.body,
      products: cartProducts,
      user: userId,
      status: orderStatus,
      name: req.body.name,
      note: req.body.note,
      mobile: req.body.mobile,
      address: req.body.address,
      email: req.body.email,
    };



    const createdOrder = await Order.create(orderData);
    if (!createdOrder) {
      return res.status(404).json({
        message: "Tạo đơn hàng thất bại",
      });
    }

    if (req.body.vouchers && req.body.vouchers.length > 0) {
      const voucherIds = req.body.vouchers;

      const updateVoucher = async (voucherId) => {
        const voucher = await Voucher.findById(voucherId);
        if (!voucher) {
          return res.status(404).json({
            message: "Voucher không tồn tại",
          });
        }

        voucher.limit -= 1;
        await voucher.save();
      };

      await Promise.all(voucherIds.map(updateVoucher));
    }

    const deletedCart = await Cart.findByIdAndRemove(user.cart);
    if (!deletedCart) {
      return res.status(404).json({
        message: "Không thể xóa giỏ hàng",
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      {
        $push: { orders: createdOrder._id, coupon: req.body.vouchers },
        cart: null,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "Người dùng không tồn tại",
      });
    }
    const updateProductSold = async (product) => {
      const productFind = await Product.findById(product.product);
      if (productFind) {
        productFind.sold += product.quantity;
        await productFind.save();
      }
    };

    await Promise.all(cartProducts.map(updateProductSold));

    const updateProductQuantity = async (product) => {
      const productFInd = await Product.findById(product.product);
      const listSize = await Size.findById(productFInd.list_size);

      const sizeUpdate = listSize.list_size.find(
        (item) => item.name === product.size.toString()
      );

      if (sizeUpdate) {
        sizeUpdate.quantity -= product.quantity;
      }

      await listSize.save();
    };

    await Promise.all(cartProducts.map(updateProductQuantity));

    return res.status(201).json({
      message: "Tạo đơn hàng thành công",
      order: createdOrder,
      orderCode: createdOrder.code,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Đã có lỗi xảy ra ",
    });
  }
};

const updateStatus = asyncHandler(async (req, res) => {
  const { oid } = req.params;
  const { status } = req.body;
  if (!status) throw new Error("Yeu cau trang thai");

  const updateProductQuantity = async (product) => {
    const productFInd = await Product.findById(product.product);
    const listSize = await Size.findById(productFInd.list_size);

    const sizeUpdate = listSize.list_size.find(
      (item) => item.name === product.size.toString()
    );

    if (sizeUpdate) {
      sizeUpdate.quantity += product.quantity;
    }

    await listSize.save();
  };

  const response = await Order.findByIdAndUpdate(
    oid,
    { status },
    { new: true }
  );

  if (status === "Đã hủy") {
    await Promise.all(response.products.map(updateProductQuantity));
  }

  return res.json({
    success: response ? "Cập nhật Order thành công" : false,
    response: response ? response : "Ko cập nhật Order được!!",
  });
});

const updateStatusSendEmail = asyncHandler(async (req, res) => {
  const { oid } = req.params;
  const { status } = req.body;
  if (!status) throw new Error("Yêu cầu trạng thái");

  const order = await Order.findById(oid);

  if (order) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "nrojewelry@gmail.com",
          pass: "rmui wqch uvbt hwyc",
        },
      });

      const { name, email, address, createdAt, paymentMethod } = order;
      const purchaseDate = moment(createdAt).format("DD/MM/YYYY");

      const mailOptions = {
        from: "nrojewelry@gmail.com",
        to: email,
        subject: "Cập nhật trạng thái đơn hàng",
        html: `
                    <p>Xin chào ${name},</p>
                
                    <p>Trạng thái của đơn hàng ${oid} đã được cập nhật thành ${status}.</p>
                    <p>Ngày mua hàng: ${purchaseDate}</p>
                    <p>Dịch vụ: ${paymentMethod}</p>
                    <p>Địa chỉ giao hàng: ${address}</p>
                    <p>Cảm ơn bạn đã mua hàng!</p>
                `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Gửi email thất bại:", error.message);
        } else {
          console.log("Email đã được gửi:", info.response);
        }
      });
      const updateProductQuantity = async (product) => {
        const productFInd = await Product.findById(product.product);
        const listSize = await Size.findById(productFInd.list_size);

        const sizeUpdate = listSize.list_size.find(
          (item) => item.name === product.size.toString()
        );

        if (sizeUpdate) {
          sizeUpdate.quantity += product.quantity;
        }

        await listSize.save();
      };
      const response = await Order.findByIdAndUpdate(
        oid,
        { status },
        { new: true }
      );
      if (status === "Đã hủy") {
        await Promise.all(response.products.map(updateProductQuantity));
      }

      if (!response) {
        return res.json({
          success: false,
          response: "Cập nhật trạng thái đơn hàng thất bại",
        });
      }

      return res.json({
        success:
          "Cập nhật trạng thái đơn hàng thành công và đã gửi email thông báo.",
      });
    } catch (error) {
      console.error("Lỗi khi gửi email:", error.message);
      return res.json({
        success:
          "Cập nhật trạng thái đơn hàng thành công, nhưng gửi email thất bại",
      });
    }
  } else {
    return res.json({
      success: false,
      response: "Không tìm thấy đơn hàng để cập nhật trạng thái",
    });
  }
});

const updateStatusForuser = asyncHandler(async (req, res) => {
  try {
    const { oid } = req.params;
    let { status } = req.body;

    if (!status) {
      throw new Error("Yêu cầu trạng thái");
    }

    if (Array.isArray(status)) {
      const updatedOrders = await Order.updateMany(
        { _id: { $in: status } },
        { status: "Đã hủy" }
      );
      return res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái đơn hàng thành công",
        updatedOrders,
      });
    } else {
      // Nếu status không phải mảng, xử lý như trường hợp cập nhật một đơn hàng
      const order = await Order.findByIdAndUpdate(
        oid,
        { status },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng để cập nhật trạng thái",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái đơn hàng thành công",
        order,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra khi cập nhật trạng thái đơn hàng",
      error: error.message,
    });
  }
});

const getUserOrder = async (req, res) => {
  try {
    const userId = await User.findById(req.params.id);

    if (!userId) {
      return res.status(404).json({
        message: "Không có thông tin người dùng",
      });
    }

    const idOrder = await Order.findById(userId.orders).populate(
      "products.product"
    );

    if (!idOrder || !idOrder.length === 0) {
      return res.status(404).json({
        message: "Không có thông tin đơn hàng",
      });
    }

    return res.json({
      user: userId,
      order: idOrder,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Đã có lỗi xảy ra khi xử lý yêu cầu",
      error: error.message,
    });
  }
};
const deleteProductOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const productId = req.params.productId;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $pull: { products: { _id: productId } } },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Không tìm thấy đơn hàng để cập nhật",
      });
    }

    return res.status(200).json({
      message: "Xóa sản phẩm thành công",
      order: updatedOrder,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Đã có lỗi xảy ra khi xóa sản phẩm",
      error: error.message,
    });
  }
};

const getAllOrders = asyncHandler(async (req, res) => {
  const response = await Order.find().populate({
    path: "products",
    populate: {
      path: "product",
      populate: "list_size"
    }
  });
  return res.json({
    success: response ? "Hien thi Order thành công" : false,
    response: response ? response : "Ko thêm Order được!!",
  });
});

const getOrder = async (req, res) => {
  try {
    const data = await Order.findById(req.params.id).populate(
      "products.product"
    );

    if (!data || !data.length === 0) {
      return res.status(404).json({
        message: "Không có thông tin",
      });
    }

    return res.status(200).json({
      message: "Thông tin đơn hàng",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Đã có lỗi xảy ra " + err.message,
    });
  }
};
const getOrders = async (req, res) => {
  try {
    const orderIds = req.body.orderIds;


    if (!orderIds || orderIds.length === 0) {
      return res.status(400).json({
        message: "Không có ID đơn hàng được cung cấp",
      });
    }


    const orders = await Order.find({ _id: { $in: orderIds } }).populate({
      path: "products",
      populate: {
        path: "product",
        populate: "list_size"
      },
    });

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy thông tin đơn hàng",
      });
    }

    return res.json({
      orders: orders,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Đã có lỗi xảy ra khi xử lý yêu cầu",
      error: error.message,
    });
  }
};
const getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.query;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Thiếu trạng thái để lọc",
      });
    }


    const orders = await Order.find({ status }).populate("products.product");

    return res.json({
      success: true,
      message: `Danh sách đơn hàng có trạng thái ${status}`,
      orders: orders,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra khi lấy danh sách đơn hàng theo trạng thái",
      error: error.message,
    });
  }
};
const searchOrder = async (req, res) => {
  try {
      const { search = "" } = req.body;

      const orders = await Order.find({
        name: { $regex: new RegExp(search, "i") }
      });

      if (!orders || orders.length === 0) {
          return res.json({
              message: "Danh sách sản phẩm trống.",
          });
      }

      return res.json({
          message: "Lấy danh sách thành công.",
          data: orders,
      });
  } catch (error) {
      return res.json({
          message: error.message || "Xảy ra lỗi không xác định.",
      });
  }
};
module.exports = {
  createOrder,
  updateStatus,
  getUserOrder,
  getAllOrders,
  createPaymentUrl,
  vnpayReturn,
  changeStatusPayment,
  getOrder,
  getOrders,
  updateStatusForuser,
  deleteProductOrder,
  getOrdersByStatus,
  updateStatusSendEmail,
  searchOrder
};
