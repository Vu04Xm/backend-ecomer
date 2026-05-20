require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importSql() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'web_cellphones',
        multipleStatements: true // Quan trọng để chạy tệp SQL lớn
    });

    const sqlPath = path.join(__dirname, 'new_products.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    try {
        console.log('Đang nạp 196 sản phẩm vào database...');
        await connection.query(sql);
        console.log('CHÚC MỪNG! Đã nạp thành công 196 sản phẩm cùng với các thương hiệu mới.');
    } catch (err) {
        console.error('Lỗi khi nạp dữ liệu:', err.message);
    } finally {
        await connection.end();
    }
}

importSql();
