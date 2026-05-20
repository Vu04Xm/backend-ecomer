const express = require("express");
const router = express.Router();
const payosController = require("../controllers/payosController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Route tạo link thanh toán (Cần đăng nhập)
router.post("/create-payment-link", verifyToken, payosController.createPaymentLink);

// Route nhận Webhook
// Cả POST (PayOS gọi thật) và GET (để Dashboard của PayOS ping kiểm tra lúc Lưu)
router.all("/webhook", payosController.webhook);

// Route kiểm tra trạng thái đơn hàng (Polling)
router.get("/check-status/:orderId", payosController.checkStatus);

module.exports = router;
