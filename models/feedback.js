const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Sử dụng kiểu ObjectId thay vì String
      ref: 'User', // Liên kết với mô hình User
      required: true,
    },
    productId: {  
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    userTitle: {
      type: String,
   
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
