    const router = require('express').Router()
    const ctrls = require('../controllers/order')
    const { verifyAccessToken, isAdmin } = require('../middlewares/verifyToken')

    router.post('/', [verifyAccessToken], ctrls.createOrder)
    router.put('/status/:oid', ctrls.updateStatus)
    router.put('/statusSendEmail/:oid', ctrls.updateStatusSendEmail)
    router.put('/statusUser/:oid', ctrls.updateStatusForuser)
    router.get('/getUserOder/:userId', ctrls.getUserOrder)
    router.get('/getAll', ctrls.getAllOrders)
    router.post('/create_payment_url', ctrls.createPaymentUrl)
    router.get('/vnpay_return', ctrls.vnpayReturn)
    router.post('/changeStatusPayment', ctrls.changeStatusPayment)
    router.get('/getOrder/:id', [verifyAccessToken, isAdmin], ctrls.getOrder);
    router.post('/getOrder', ctrls.getOrders);
    router.get('/filterByStatus', ctrls.getOrdersByStatus);

    module.exports = router 