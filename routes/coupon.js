const router = require('express').Router()
const ctrls = require('../controllers/coupon')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')



router.post('/add', [verifyAccessToken, isAdmin], ctrls.createdCoupon)
router.post('/', ctrls.getCoupons)
router.get('/getCouponByDiscount', ctrls.getCouponByDiscount)
router.delete('/:cid', [verifyAccessToken, isAdmin], ctrls.deleteCoupon)
router.get('/getAll', ctrls.getAll)
router.get('/getOne/:id', ctrls.getCouponById)
router.put('/update/:id', [verifyAccessToken, isAdmin], ctrls.updateCoupon)



module.exports = router