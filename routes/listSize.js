const router = require('express').Router()
const ctrls = require('../controllers/listSize')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')



router.post('/add', [verifyAccessToken, isAdmin], ctrls.createdSize)
router.get('/', ctrls.getAllSize)
router.get('/:id', ctrls.getSize)
router.put('/:id', [verifyAccessToken, isAdmin], ctrls.updateSize)
router.delete('/:id', [verifyAccessToken, isAdmin], ctrls.deleteSize)
// router.get('/brand/:brand', ctrls.getProductsByBrandId);


module.exports = router