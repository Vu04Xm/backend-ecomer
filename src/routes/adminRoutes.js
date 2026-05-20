const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const statsController = require('../controllers/statsController');
const promotionController = require('../controllers/promotionController');
const chatController = require('../controllers/chatController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

// User Management (Admin only)
router.get('/users', verifyToken, verifyRole(1), userController.fetchUsers);
router.post('/users', verifyToken, verifyRole(1), userController.addUser);
router.put('/users/:id', verifyToken, verifyRole(1), userController.editUser);
router.delete('/users/:id', verifyToken, verifyRole(1), userController.removeUser);

// Promo
router.get('/promotions', promotionController.getPromotions);
router.post('/promotions', verifyToken, promotionController.addPromotion);
router.delete('/promotions/:id', verifyToken, promotionController.deletePromotion);
router.post('/check-voucher', promotionController.checkVoucher);

// Stats
router.get('/stats/dashboard',  verifyToken, statsController.getDashboardStats);
router.get('/stats/financial',  verifyToken, statsController.getFinancialStats);
router.get('/stats/inventory',  verifyToken, statsController.getInventoryStats);
router.get('/stats/orders',     verifyToken, statsController.getOrderStats);
router.get('/stats/cancelled',  verifyToken, statsController.getCancelledStats);
router.get('/stats/customers',  verifyToken, statsController.getCustomerStats);
router.get('/stats/ai-insights', verifyToken, statsController.getAIInsights);

module.exports = router;
