const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');

router.get('/provinces', shippingController.getProvinces);
router.get('/districts/:provinceId', shippingController.getDistricts);
router.get('/wards/:districtId', shippingController.getWards);
router.post('/fee', shippingController.calculateFee);

module.exports = router;
