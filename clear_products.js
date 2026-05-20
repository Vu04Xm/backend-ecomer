require('dotenv').config();
const mysql = require('mysql2/promise');

async function clearProducts() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'web_cellphones'
    });

    try {
        console.log('Đang kết nối tới database...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE products');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Thành công! Toàn bộ dữ liệu trong bảng products đã bị xóa.');
    } catch (err) {
        console.error('Lỗi khi xóa dữ liệu:', err.message);
    } finally {
        await connection.end();
    }
}

clearProducts();
