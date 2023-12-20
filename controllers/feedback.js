const Feedback = require('../models/feedback');
const Product = require('../models/product');

const getall = async (req, res) => {
  try {
    // Lấy tất cả dữ liệu phản hồi
    const feedbacks = await Feedback.find();

    // Tạo một mảng chứa thông tin sản phẩm và phản hồi kết hợp
    const combinedData = await Promise.all(feedbacks.map(async (feedback) => {
      // Lấy thông tin sản phẩm tương ứng với phản hồi
      const product = await Product.findById(feedback.productId);

      // Kết hợp thông tin sản phẩm và phản hồi
      return {
        feedback: feedback,
        product: product,
      };
    }));

    return res.json({
      message: "Danh sách phản hồi và thông tin sản phẩm",
      data: combinedData,
    });
  } catch (error) {
    return res.json({
      message: error.message,
    });
  }
};


const createFeedback = async (req, res) => {
  try {

        const feedback = await Feedback.create(req.body);
        console.log(feedback);
        await Product.findByIdAndUpdate(feedback.productId, {
          $addToSet: {
            feedbacks: feedback._id,
          },
        });

        if (!feedback) {
          return res.json({
            message: "Gửi phản hồi thất bại.",
          });
        }
        return res.json({
          message: "Gửi phản hồi thành công.",
          data: feedback,
        });
      
  } catch ({ errors }) {
    return res.json({
      message: errors,
    });
  }
};

const updateFeedback = async (req, res) => {
  try {
   
    
        const feedback = await Feedback.findByIdAndUpdate(
          req.params.id,
          req.body
        );
        if (!feedback) {
          return res.json({
            message: "Cập nhập phản hồi thất bại.",
          });
        }
        return res.json({
          message: "Cập nhập phản hồi thành công.",
          data: feedback,
        });
  } catch ({ errors }) {
    return res.json({
      message: errors,
    });
  }
};

const getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate("bookId");
    if (!feedback) {
      return res.json({
        message: "Không tồn tại phản hồi này.",
      });
    }
    return res.json({
      message: "Chi tiết phản hồi",
      data: feedback,
    });
  } catch (error) {
    return res.json({
      message: error,
    });
  }
};

const removeFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if(!feedback) {
        return res.json({
            message: "Phản hồi không tồn tại",
          });
    }
    return res.json({
      message: "Xóa phản hồi thành công",
      data: feedback,
    });
  } catch (error) {
    return res.json({
      message: error,
    });
  }
};

const getFeedbacks = async (req, res) => {
  try {

      const feedbackId = req.body.feedbackId; 

      // Kiểm tra nếu không có ID đơn hàng
      if (!feedbackId || feedbackId.length === 0) {
          return res.status(400).json({
              message: "Không có ID đơn hàng được cung cấp",
          });
      }

      // Tìm tất cả đơn hàng dựa trên mảng ID
      const feeback = await Feedback.find({ _id: { $in: feedbackId } })

      if (!feeback || feeback.length === 0) {
          return res.status(404).json({
              message: "Không tìm thấy thông tin đơn hàng",
          });
      }

      return res.json({
          feeback: feeback,
      });

  } catch (error) {
      console.error(error);
      return res.status(500).json({
          message: "Đã có lỗi xảy ra khi xử lý yêu cầu",
          error: error.message,
      });
  }
};

module.exports = {
  getFeedbacks,
  removeFeedback,
  getFeedback,
  createFeedback,
  updateFeedback,
  getall
};
