const payos = require("../configs/payos");
const orderModel = require("../models/orderModel");
const orderDetailModel = require("../models/orderDetailModel");
const cartModel = require("../models/cartModel");
const db = require("../configs/db");
const fs = require("fs");
const path = require("path");

// Helper để ghi log "bẫy" tín hiệu
const writeTrapLog = (message, data = null) => {
  const logDir = path.join(__dirname, "../../logs");
  if (!fs.existsSync(logDir)) {
      try { fs.mkdirSync(logDir, { recursive: true }); } catch (e) {}
  }
  const logFile = path.join(logDir, "payos_trap.log");
  const timestamp = new Date().toLocaleString("vi-VN");
  const logMessage = `[${timestamp}] ${message} ${data ? "\nData: " + JSON.stringify(data, null, 2) : ""}\n------------------------------------\n`;
  try {
      fs.appendFileSync(logFile, logMessage);
  } catch (e) {
      console.error("Lỗi ghi log file:", e.message);
  }
  console.log(`🎯 [PAYOS_TRAP] ${message}`);
};

// Định nghĩa hàm xử lý thành công riêng biệt để tránh lỗi tham chiếu vòng
const processPaymentSuccessInternal = async (orderCode, io) => {
    try {
      const [updateResult] = await db.query(
        "UPDATE orders SET is_paid = 1, status = 'Confirmed' WHERE order_id = ?", 
        [orderCode]
      );
      
      if (updateResult.affectedRows > 0) {
        await db.query(
          "INSERT INTO order_tracking (order_id, status, description) VALUES (?, 'Confirmed', ?)",
          [orderCode, "Thanh toán thành công qua PayOS."]
        ).catch(() => {});

        const [orderRows] = await db.query("SELECT user_id FROM orders WHERE order_id = ?", [orderCode]);
        if (orderRows.length > 0) {
          await cartModel.clearByUserId(orderRows[0].user_id);
        }

        if (io) {
          io.to(`order_${orderCode}`).emit("payment-success", {
            orderCode,
            status: "Confirmed",
            isPaid: 1,
            message: "Thanh toán thành công!",
          });
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error(`❌ [SUCCESS_LOGIC] LỖI:`, err.message);
      return false;
    }
};

const payosController = {
  // 1. Tạo link thanh toán
  createPaymentLink: async (req, res) => {
    console.log("\n====================================");
    console.log("📥 [PAYOS] Nhận yêu cầu tạo link thanh toán");
    console.log("====================================");

    try {
      const { userId, totalAmount, address, customerName, phone } = req.body;

      if (!userId || !totalAmount || !address || !customerName || !phone) {
        return res.status(400).json({ message: "Thiếu thông tin đơn hàng" });
      }
      
      const cartItems = await cartModel.getByUserId(userId);
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: "Giỏ hàng trống" });
      }

      const getDiscountedPrice = (price, discount) => {
        const p = Number(price);
        const d = Number(discount);
        if (!d || d <= 0) return p;
        if (d > 100) return Math.max(0, p - d);
        return Math.max(0, p * (1 - d / 100));
      };

      const serverItems = cartItems.map(item => ({
        id: item.product_id,
        cartQuantity: item.quantity,
        price: getDiscountedPrice(item.price, item.discount),
        name: item.name
      }));

      const serverSubTotal = serverItems.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
      const reportedTotal = Number(totalAmount) || 0;
      const finalShipping = (reportedTotal > serverSubTotal) ? (reportedTotal - serverSubTotal) : 30000;
      const forcedTotal = serverSubTotal + finalShipping;

      let result = await orderModel.create({ 
        userId, 
        totalAmount: forcedTotal, 
        paymentMethod: "PAYOS", 
        address, 
        customerName, 
        phone 
      });
      const orderId = result.insertId;

      const detailPromises = serverItems.map((item) =>
        orderDetailModel.create({
          order_id: orderId,
          product_id: item.id,
          quantity: item.cartQuantity,
          price_at_purchase: item.price,
        })
      );
      await Promise.all(detailPromises);

      const description = `DH${orderId}`.substring(0, 25);
      const paymentData = {
        orderCode: orderId,
        amount: Math.round(forcedTotal),
        description,
        cancelUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/cart`,
        returnUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/order-success/${orderId}`,
      };

      const paymentLink = await payos.paymentRequests.create(paymentData);

      res.status(200).json({
        success: true,
        checkoutUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode,
        amount: paymentLink.amount,
        description: paymentLink.description,
        orderCode: orderId
      });
    } catch (error) {
      console.error("🔥 [PAYOS ERROR]:", error.message);
      res.status(500).json({ message: "Lỗi Server", detail: error.message });
    }
  },

  // 2. Xử lý Webhook (Nơi đặt BẪY)
  webhook: async (req, res) => {
    writeTrapLog(`NHẬN REQUEST ${req.method}`, { body: req.body });
    
    if (req.method === 'GET') {
      return res.status(200).json({ success: true, message: "Webhook URL hợp lệ" });
    }

    try {
      const webhookData = req.body;
      writeTrapLog("Đang xác thực chữ ký PayOS...");
      
      let verifiedData;
      try {
        verifiedData = payos.webhooks.verify(webhookData);
        writeTrapLog("Xác thực chữ ký thành công!", verifiedData);
      } catch (e) {
        writeTrapLog("XÁC THỰC CHỮ KÝ THẤT BẠI!", e.message);
        return res.status(200).json({ success: false, message: "Invalid Signature" });
      }
      
      if (verifiedData) {
        // Fallback: Nếu verifiedData rỗng nhưng webhookData.data có dữ liệu (và đã verify thành công)
        const orderCode = verifiedData.orderCode || webhookData.data?.orderCode;
        
        if (orderCode) {
          writeTrapLog(`BẮT ĐẦU CẬP NHẬT ĐƠN HÀNG #${orderCode}`);
          const success = await processPaymentSuccessInternal(orderCode, req.app.get("io"));
          
          if (success) {
            writeTrapLog(`HOÀN TẤT CẬP NHẬT ĐƠN HÀNG #${orderCode} THÀNH CÔNG (is_paid = 1)`);
          } else {
            writeTrapLog(`CẬP NHẬT THẤT BẠI (Lỗi DB hoặc đơn đã xử lý) #${orderCode}`);
          }
        } else {
          writeTrapLog("KHÔNG TÌM THẤY orderCode TRONG DỮ LIỆU ĐÃ XÁC THỰC");
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      writeTrapLog("LỖI CỰC NGHIÊM TRỌNG TRONG WEBHOOK:", error.message);
      res.status(200).json({ success: true }); // Trả về 200 để PayOS không gửi lại liên tục
    }
  },

  // Giả lập thành công
  simulateSuccess: async (req, res) => {
    const { orderId } = req.params;
    writeTrapLog(`YÊU CẦU GIẢ LẬP THÀNH CÔNG CHO ĐƠN #${orderId}`);
    const success = await processPaymentSuccessInternal(orderId, req.app.get("io"));
    if (success) {
      res.status(200).json({ success: true, message: "Giả lập thành công" });
    } else {
      res.status(404).json({ success: false, message: "Thất bại" });
    }
  },

  checkStatus: async (req, res) => {
    try {
      const { orderId } = req.params;
      const [rows] = await db.query("SELECT status, is_paid FROM orders WHERE order_id = ?", [orderId]);
      if (rows.length === 0) return res.status(404).json({ message: "Not found" });
      res.status(200).json({ status: rows[0].status, isPaid: rows[0].is_paid });
    } catch (error) {
      res.status(500).json({ message: "Error" });
    }
  },
};

module.exports = payosController;
