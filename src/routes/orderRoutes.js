const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const orderDetailController = require('../controllers/orderDetailController');
const orderTrackingController = require('../controllers/orderTrackingController');
const walletController = require('../controllers/walletController');
const deliveryPhotoController = require('../controllers/deliveryPhotoController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

// ── Cart ────────────────────────────────────────
router.get('/cart/:userId', verifyToken, cartController.getCart);
router.post('/cart', verifyToken, cartController.addItem);
router.put('/cart/:cartId', verifyToken, cartController.updateItem);
router.delete('/cart/:cartId', verifyToken, cartController.deleteItem);
router.delete('/cart/clear/:userId', verifyToken, cartController.clearCart);

// ── Orders ──────────────────────────────────────
router.get('/orders', verifyToken, verifyRole(1, 2), orderController.getAllOrders);
router.get('/orders/:orderId', verifyToken, orderController.getOrderById);
router.put('/orders/:orderId/status', verifyToken, verifyRole(1, 2), orderController.changeStatus);
router.get('/orders/user/:userId', verifyToken, orderController.getUserOrders);
router.post('/orders', verifyToken, orderController.createOrder);

// TH1: Huỷ đơn (user tự huỷ hoặc admin/staff huỷ)
router.post('/orders/:orderId/cancel', verifyToken, orderController.cancelOrder);

// TH4: Thống kê đơn huỷ (admin + staff)
router.get('/orders/stats/cancelled', verifyToken, verifyRole(1, 2), async (req, res) => {
    try {
        const orderModel = require('../models/orderModel');
        const stats = await orderModel.getCancelledStats();
        res.json(stats);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── Tracking ────────────────────────────────────
router.get('/orders/:orderId/tracking', orderTrackingController.getTrackingHistory);

// TH5: Audit log (chỉ admin)
router.get('/orders/:orderId/audit', verifyToken, verifyRole(1), async (req, res) => {
    try {
        const orderTrackingModel = require('../models/orderTrackingModel');
        const audit = await orderTrackingModel.getAuditByOrderId(req.params.orderId);
        res.json(audit);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── Order Details ───────────────────────────────
router.get('/order-details/:orderId', verifyToken, orderDetailController.getDetailsByOrder);

// ── Wallet (TH3) ────────────────────────────────
router.get('/wallet', verifyToken, walletController.getWallet);
router.post('/wallet/withdraw', verifyToken, walletController.withdraw);
router.get('/wallet/transactions', verifyToken, walletController.getTransactions);

// ── Delivery Photos (TH2) ───────────────────────
router.post(
    '/orders/:orderId/photos',
    verifyToken,
    deliveryPhotoController.uploadMiddleware,
    deliveryPhotoController.uploadPhoto
);
router.get('/orders/:orderId/photos', verifyToken, deliveryPhotoController.getPhotos);

module.exports = router;
