const router = require('express').Router()
const ctrls = require('../controllers/blog')
const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')
const upload = require('../config/cloudinary.config')
const uploadCloudinary = require('../config/cloudinary.config')


router.post('/add', uploadCloudinary.array('image', 5), [verifyAccessToken, isAdmin], ctrls.createdBlog)
router.put('/:bid', [verifyAccessToken, isAdmin], ctrls.updateBlog)
router.post('/add', [verifyAccessToken, isAdmin], ctrls.createdBlog)
router.put('/update/:bid', [verifyAccessToken, isAdmin], ctrls.updateBlog)
router.get('/',  ctrls.getBlogs)
router.get('/one/:bid',  ctrls.getBlog)
router.delete('/:bid', [verifyAccessToken, isAdmin], ctrls.deleteBlog)
router.put('/image/:bid', [verifyAccessToken,isAdmin],upload.array('images',10), ctrls.uploadImageBlog)
router.put('/likes/:bid', [verifyAccessToken], ctrls.likeBlog)
router.put('/dislike/:bid', [verifyAccessToken], ctrls.dislikeBlog)


module.exports = router 