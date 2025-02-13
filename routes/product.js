const router = require('express').Router()
const ctrls = require('../controllers/product')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')
const uploadImage = require('../config/cloudinary.config')
const uploadCloudinary = require('../config/cloudinary.config')

router.get('/filter', ctrls.getFilteredProducts);

router.post('/add', uploadCloudinary.array('image', 5), [verifyAccessToken, isAdmin], ctrls.createProduct)
router.get('/', ctrls.getProducts)
router.get('/getAdminProducts', ctrls.getAdminProducts)
router.get('/:pid', ctrls.getProduct)
router.delete('/:pid', [verifyAccessToken, isAdmin], ctrls.deleteProduct)
router.put('/:pid', uploadCloudinary.array('image', 5), [verifyAccessToken, isAdmin], ctrls.updateProduct);
router.post("/search-product", ctrls.searchProduct)

router.put('/ratings/add', verifyAccessToken, ctrls.ratings)
router.put('/:pid/updateAssess', [verifyAccessToken], ctrls.updateAssess);
router.put('/active/:proId', [verifyAccessToken, isAdmin], ctrls.activeProduct)
module.exports = router