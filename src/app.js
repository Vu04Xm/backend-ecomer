const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();

// ===== 1. CẤU HÌNH CORS (TRÁNH LỖI 403 & CHẶN API) =====
app.use(cors({
  // Cho phép link frontend của bạn sau khi deploy hoặc tất cả các nguồn (*) trong lúc test
  origin: process.env.FRONTEND_URL || '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ===== 2. MIDDLEWARE CƠ BẢN =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Thêm một route kiểm tra (Health Check) để biết Server đã online hay chưa
app.get('/', (req, res) => {
  res.status(200).json({ message: "API Cellphones đang hoạt động mượt mà! 🚀" });
});

// ===== 3. ĐƯỜNG DẪN API =====
app.use('/api', apiRoutes);

// ===== 4. XỬ LÝ LỖI (ERROR HANDLING) =====
// Middleware này giúp bắt các lỗi server để không làm sập app khi deploy
app.use((err, req, res, next) => {
  console.error("Lỗi Server:", err.stack);
  res.status(500).json({ message: "Có lỗi xảy ra từ phía Server!" });
});

// ===== 5. KHỞI CHẠY SERVER =====
const PORT = process.env.PORT || 5000;
// Render yêu cầu lắng nghe trên '0.0.0.0' thay vì 'localhost'
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  --------------------------------------------------
  🚀 Server đang chạy thành công!
  📡 Port: ${PORT}
  🔗 URL: http://0.0.0.0:${PORT}
  --------------------------------------------------
  `);
});