const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

// Chỉ Admin và Staff (Role 1, 2) mới được thao tác với Nhà cung cấp
router.get('/suppliers', verifyToken, verifyRole(1, 2), supplierController.getAllSuppliers);
router.get('/suppliers/:id', verifyToken, verifyRole(1, 2), supplierController.getSupplierById);
router.post('/suppliers', verifyToken, verifyRole(1, 2), supplierController.createSupplier);
router.put('/suppliers/:id', verifyToken, verifyRole(1, 2), supplierController.updateSupplier);
router.delete('/suppliers/:id', verifyToken, verifyRole(1, 2), supplierController.deleteSupplier);

module.exports = router;
