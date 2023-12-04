const router = require('express').Router()
const ctrls = require('../controllers/product')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')
const uploadImage = require('../config/cloudinary.config')
const uploadCloudinary = require('../config/cloudinary.config')

router.get('/filter', ctrls.getFilteredProducts);

router.post('/add', uploadCloudinary.array('image', 5) , [verifyAccessToken, isAdmin], ctrls.createProduct)
router.get('/', ctrls.getProducts)
router.get('/:pid', ctrls.getProduct)
router.delete('/:pid', [verifyAccessToken, isAdmin],ctrls.deleteProduct)
router.put('/:pid', uploadCloudinary.array('image', 5), [verifyAccessToken, isAdmin], ctrls.updateProduct);


router.put('/ratings/add',verifyAccessToken, ctrls.ratings)

module.exports = router