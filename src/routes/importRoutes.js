const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

// Chỉ Admin và Staff (Role 1, 2) mới được thao tác với Nhập hàng
router.get('/imports', verifyToken, verifyRole(1, 2), importController.getAllImports);
router.get('/imports/:id', verifyToken, verifyRole(1, 2), importController.getImportById);
router.post('/imports', verifyToken, verifyRole(1, 2), importController.createImport);
router.put('/imports/:id/cancel', verifyToken, verifyRole(1, 2), importController.cancelImport);
router.put('/imports/:id/complete', verifyToken, verifyRole(1, 2), importController.completeImport); // API quan trọng

module.exports = router;
