const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/favorites', verifyToken, favoriteController.getFavorites);
router.post('/favorites/toggle', verifyToken, favoriteController.toggleFavorite);
router.get('/favorites/status/:productId', verifyToken, favoriteController.checkStatus);

module.exports = router;
