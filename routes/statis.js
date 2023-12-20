const router = require('express').Router()
const ctrls = require('../controllers/statis')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')

router.get('/getStat', [verifyAccessToken, isAdmin], ctrls.getStatistics);
router.get('/getTopBuyer', [verifyAccessToken, isAdmin], ctrls.getTopBuyers);
module.exports = router 
