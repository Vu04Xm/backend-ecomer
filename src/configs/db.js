const mysql = require('mysql2/promise');
require('dotenv').config();

// Kiểm tra môi trường Local dựa trên Host
const isLocal = process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS, // Đã đổi thành DB_PASS cho khớp với .env của bạn
    database: process.env.DB_NAME,
    // Local dùng 3306, Render/Aiven dùng 25363
    port: process.env.DB_PORT || (isLocal ? 3306 : 25363), 
    
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    // Tự động bật SSL khi lên Cloud, Local thì tắt
    ssl: isLocal ? null : { rejectUnauthorized: false }
});

// Kiểm tra kết nối khi khởi động
const checkConnection = async () => {
    try {
        const connection = await pool.getConnection();
        const currentPort = process.env.DB_PORT || (isLocal ? 3306 : 25363);
        console.log(`✅ Kết nối MySQL thành công trên cổng: ${currentPort}`);
        connection.release();
    } catch (err) {
        console.error('❌ Kết nối MySQL thất bại!');
        console.error('Chi tiết lỗi:', err.message);
    }
};

checkConnection();

module.exports = pool;