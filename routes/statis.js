const router = require('express').Router()
const ctrls = require('../controllers/statis')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')

router.get('/getStat', [verifyAccessToken, isAdmin], ctrls.getStatistics);

module.exports = router 
