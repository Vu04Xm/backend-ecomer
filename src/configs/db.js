//ket noi tap trung 
const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo một Connection Pool (giúp tối ưu hiệu năng khi có nhiều request)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Kiểm tra kết nối khi khởi động
const checkConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Kết nối MySQL thành công!');
        connection.release();
    } catch (err) {
        console.error('❌ Kết nối MySQL thất bại:', err.message);
    }
};

// checkConnection();

module.exports = pool;