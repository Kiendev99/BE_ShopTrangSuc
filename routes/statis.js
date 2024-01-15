const router = require('express').Router()
const ctrls = require('../controllers/statis')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')

router.get('/getStat', ctrls.getStatistics);
router.get('/getTopBuyer', ctrls.getTopBuyers);
router.get('/getTopProductSeller', ctrls.getTopProductSeller);
router.post('/getTotalPriceMonth', ctrls.getTotalPriceMonth);
router.post('/getTotalPriceDay', ctrls.getTotalPriceDay);
module.exports = router 
