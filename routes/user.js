const router = require('express').Router()
const ctrls = require('../controllers/user')



const {verifyAccessToken,isAdmin} = require('../middlewares/verifyToken')
router.post('/register', ctrls.register)
router.post('/login', ctrls.login)
router.get('/current', verifyAccessToken, ctrls.getCurrent)

router.get('/', [verifyAccessToken, isAdmin], ctrls.getUsers)
router.delete('/', [verifyAccessToken, isAdmin], ctrls.deleteUser)
router.put('/current', [verifyAccessToken], ctrls.updateUser)
router.put('/address', [verifyAccessToken], ctrls.updateUserAddress)
router.put('/cart', [verifyAccessToken], ctrls.updateCart)
router.post('/refreshtoken', ctrls.refreshAccessToken)

router.put('/:uid', [verifyAccessToken, isAdmin], ctrls.updateUserByAdmin)
router.get('/logout', ctrls.logout)
router.get('/forgotpassword', ctrls.forgotPassword)




module.exports = router