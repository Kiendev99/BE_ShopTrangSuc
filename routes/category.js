const router = require('express').Router()
const ctrls = require('../controllers/category')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')



router.post('/add',ctrls.createdCategory)
router.get('/',  ctrls.getAllCategory)
router.put('/:pcid', ctrls.updateCategory)
router.delete('/:pcid', ctrls.deleteCategory)
router.get('/:pcid',  ctrls.getOneCategory)



module.exports = router