const router = require('express').Router()
const ctrls = require('../controllers/statis')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')

router.get('/getStat',  ctrls.getStatistics);
router.get('/getTopBuyer',  ctrls.getTopBuyers);
module.exports = router 
