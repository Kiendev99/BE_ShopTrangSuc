const router = require('express').Router()
const ctrls = require('../controllers/listSize')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')



router.post('/add', [verifyAccessToken, isAdmin], ctrls.createdSize)
router.get('/', ctrls.getAllSize)
// router.get('/:id', ctrls.getBrand)
// router.put('/:brid', [verifyAccessToken, isAdmin], ctrls.updateBrand)
// router.delete('/:brid', [verifyAccessToken, isAdmin], ctrls.deleteBrand)
// router.get('/brand/:brand', ctrls.getProductsByBrandId);


module.exports = router