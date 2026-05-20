const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const adminRoutes = require('./adminRoutes');
const shippingRoutes = require('./shippingRoutes');
const chatRoutes = require('./chat');
const payosRoutes = require('./payosRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const supplierRoutes = require('./supplierRoutes');
const importRoutes = require('./importRoutes');
const bannerRoutes = require('./bannerRoutes');

// Mount routes
router.use('/', authRoutes);
router.use('/', productRoutes);
router.use('/', orderRoutes);
router.use('/', adminRoutes);
router.use('/shipping', shippingRoutes);
router.use('/chat', chatRoutes);
router.use('/payos', payosRoutes);
router.use('/', favoriteRoutes);
router.use('/', supplierRoutes);
router.use('/', importRoutes);
router.use('/', bannerRoutes);

module.exports = router;
