const express = require('express');
const router = express.Router();

// ==========================================
// IMPORT MIDDLEWARE
// ==========================================
const verifyToken = require('../middlewares/authMiddleware');

// ==========================================
// IMPORT CONTROLLERS
// ==========================================
const chatController = require('../controllers/chatController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const categoryController = require('../controllers/categoryController');
const brandController = require('../controllers/brandController');
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const orderDetailController = require('../controllers/orderDetailController');
const promotionController = require('../controllers/promotionController');
const reviewController = require('../controllers/reviewController');

// 👉 CHAT AI ROUTE
const chatRoutes = require('./chat');

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================
router.post('/login', authController.login);
router.post('/register', userController.register);
router.get('/me', verifyToken, userController.getMe);
router.post('/forgot-password', authController.forgotPassword); // Gửi mail
router.post('/reset-password', authController.resetPassword);
// Profile
router.put('/users/update-profile/:id', verifyToken, userController.updateProfile);
router.put('/users/change-password/:id', verifyToken, userController.changePassword);

// ==========================================
// 2. QUẢN LÝ USER (ADMIN)
// ==========================================
router.get('/users', verifyToken, userController.fetchUsers);
router.post('/users', verifyToken, userController.addUser);
router.put('/users/:id', verifyToken, userController.editUser);
router.delete('/users/:id', verifyToken, userController.removeUser);

// ==========================================
// 3. DANH MỤC & THƯƠNG HIỆU
// ==========================================
router.get('/categories', categoryController.getCategories);
router.get('/categories/:id/products', productController.getProductsByCategory);

router.post('/categories', verifyToken, categoryController.addCategory);
router.put('/categories/:id', verifyToken, categoryController.editCategory);
router.delete('/categories/:id', verifyToken, categoryController.deleteCategory);

router.get('/brands', brandController.getBrands);
router.post('/brands', verifyToken, brandController.addBrand);
router.put('/brands/:id', verifyToken, brandController.editBrand);
router.delete('/brands/:id', verifyToken, brandController.deleteBrand);

// ==========================================
// 4. SẢN PHẨM & ĐÁNH GIÁ
// ==========================================
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);

router.post('/products', verifyToken, productController.addProduct);
router.put('/products/:id', verifyToken, productController.editProduct);
router.delete('/products/:id', verifyToken, productController.deleteProduct);

// Reviews
router.get('/reviews/:productId', reviewController.getProductReviews);
router.post('/reviews', verifyToken, reviewController.addReview);

// ==========================================
// 5. GIỎ HÀNG & ĐƠN HÀNG
// ==========================================

// Cart
router.get('/cart/:userId', verifyToken, cartController.getCart);
router.post('/cart', verifyToken, cartController.addItem);
router.put('/cart/:cartId', verifyToken, cartController.updateItem);
router.delete('/cart/:cartId', verifyToken, cartController.deleteItem);

// Orders - STAFF / ADMIN
router.get('/orders', verifyToken, orderController.getAllOrders);
router.put('/orders/:orderId/status', verifyToken, orderController.changeStatus);

// Orders - USER
router.get('/orders/user/:userId', verifyToken, orderController.getUserOrders);
router.post('/orders', verifyToken, orderController.createOrder);

// Order Details
router.get('/order-details/:orderId', verifyToken, orderDetailController.getDetailsByOrder);

// ==========================================
// 6. PROMOTIONS
// ==========================================
router.get('/promotions', promotionController.getPromotions);
router.post('/promotions', verifyToken, promotionController.addPromotion);
router.delete('/promotions/:id', verifyToken, promotionController.deletePromotion);
router.post('/check-voucher', promotionController.checkVoucher);

// ==========================================
// 7. CHAT AI (MỚI 🔥)
// ==========================================
router.use('/chat', chatRoutes);
router.post('/chat', chatController.handleChat);

// ==========================================
module.exports = router;
