const { notFound, errHandler } = require('../middlewares/errHandler')


const userRouter = require('./user')
const categoryRouter = require('./category')
const orderRouter = require('./order')
const productRouter = require('./product')
const couponRouter = require('./coupon')
const blogRouter = require('./blog')
const brandRouter = require('./brand')
const sizeRouter = require('./listSize')
const blogCategoryRouter = require('./blogCategory')
const cartRouter = require('./cart');
const feeback = require('./feedback');
const Stat = require('./statis');
// const ggRouter = require('./google');

const initRoutes = (app) => {

    app.use('/api/user', userRouter)
    app.use('/api/category', categoryRouter),
        app.use('/api/product', productRouter)
    app.use('/api/blog', blogRouter)
    app.use('/api/blogcategory', blogCategoryRouter)
    app.use('/api/brand', brandRouter)
    app.use('/order', orderRouter)
    app.use('/api/cart', cartRouter);
    app.use('/api/coupon', couponRouter);
    app.use('/api', feeback);
    app.use('/api/statis', Stat);
    app.use('/api/size', sizeRouter)
    // app.use('/api/google', ggRouter);
    app.use(notFound)
    app.use(errHandler)
}

module.exports = initRoutes