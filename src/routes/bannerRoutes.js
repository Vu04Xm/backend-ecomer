const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

// Public — Trang Home lấy banner active
router.get('/banners', bannerController.getActiveBanners);

// Admin + Staff (role 1 và 2) quản lý banner
router.get('/admin/banners', verifyToken, bannerController.getAllBanners);
router.post('/admin/banners', verifyToken, bannerController.createBanner);
router.put('/admin/banners/:id', verifyToken, bannerController.updateBanner);
router.delete('/admin/banners/:id', verifyToken, bannerController.deleteBanner);
router.patch('/admin/banners/:id/toggle', verifyToken, bannerController.toggleBanner);

module.exports = router;
