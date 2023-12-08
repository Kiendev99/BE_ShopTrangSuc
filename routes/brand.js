const router = require('express').Router()
const ctrls = require('../controllers/brand')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')



router.post('/add', [verifyAccessToken, isAdmin], ctrls.createdBrand)
router.get('/', ctrls.getAllBrand)
router.put('/:brid', [verifyAccessToken, isAdmin], ctrls.updateBrand)
router.delete('/:brid', [verifyAccessToken, isAdmin], ctrls.deleteBrand)
router.get('/brand/:brand', ctrls.getProductsByBrandId);


module.exports = router