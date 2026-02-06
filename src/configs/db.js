// kết nối tập trung 
const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo một Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, // Đảm bảo khớp với Key trên Render
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 25363, // Cổng mặc định của Aiven
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // BẮT BUỘC: Thêm cấu hình SSL để chạy được trên Cloud (Aiven)
    ssl: {
        rejectUnauthorized: false
    }
});

// Kiểm tra kết nối khi khởi động
const checkConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Kết nối MySQL (Aiven) thành công!');
        connection.release();
    } catch (err) {
        console.error('❌ Kết nối MySQL thất bại:', err.message);
    }
};

checkConnection(); // Mở comment này để bạn dễ theo dõi trong Log của Render

module.exports = pool;