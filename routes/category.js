const router = require('express').Router();
const ctrls = require('../controllers/category');
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken');

// Đường dẫn để lấy tất cả sản phẩm của một category dựa trên ID của category
router.get('/:category/products', ctrls.getProductsByCategoryId);

// Các đường dẫn hiện tại của category
router.post('/add', ctrls.createdCategory);
router.get('/', ctrls.getAllCategory);
router.put('/:pcid', ctrls.updateCategory);
router.delete('/:pcid', ctrls.deleteCategory);
router.get('/:pcid', ctrls.getOneCategory);

module.exports = router;
