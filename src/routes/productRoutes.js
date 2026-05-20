const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const brandController = require('../controllers/brandController');
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Categories & Brands
router.get('/categories', categoryController.getCategories);
router.get('/categories/:id/products', productController.getProductsByCategory);
router.post('/categories', verifyToken, categoryController.addCategory);
router.put('/categories/:id', verifyToken, categoryController.editCategory);
router.delete('/categories/:id', verifyToken, categoryController.deleteCategory);

router.get('/brands', brandController.getBrands);
router.get('/brands/:categoryId/by-category', brandController.getBrandsByCategory);
router.post('/brands', verifyToken, brandController.addBrand);
router.put('/brands/:id', verifyToken, brandController.editBrand);
router.delete('/brands/:id', verifyToken, brandController.deleteBrand);

// Products
router.get('/products/best-sellers', productController.getBestSellers);
router.get('/products/newest', productController.getNewestProducts);
router.get('/products/by-brand/:id', productController.getProductsByBrand);
router.get('/products/recommendations/:userId', productController.getRecommendedProducts);
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);
router.post('/products', verifyToken, productController.addProduct);
router.put('/products/:id', verifyToken, productController.editProduct);
router.get('/products/search/suggestions', productController.searchProducts);
router.delete('/products/:id', verifyToken, productController.deleteProduct);

// Reviews
router.get('/reviews/:productId', reviewController.getProductReviews);
router.get('/reviews/check-purchase/:productId', verifyToken, reviewController.checkCanReview);
router.post('/reviews', verifyToken, reviewController.addReview);

module.exports = router;
