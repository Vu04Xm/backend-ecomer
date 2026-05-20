require('dotenv').config();
const mysql = require('mysql2/promise');

const SQL = `
CREATE TABLE IF NOT EXISTS banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500) DEFAULT NULL,
    image_url TEXT NOT NULL,
    link_url VARCHAR(500) DEFAULT NULL,
    badge_text VARCHAR(100) DEFAULT NULL,
    badge_color VARCHAR(50) DEFAULT 'red',
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO banners (id, title, subtitle, image_url, link_url, badge_text, badge_color, is_active, sort_order) VALUES
(1, 'Siêu Sale Hè 2026', 'Giảm đến 40% toàn bộ điện thoại flagship', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80', '/', 'HOT', 'red', 1, 1),
(2, 'iPhone 16 Pro Max', 'Trải nghiệm hiệu năng đỉnh cao với chip A18 Bionic', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80', '/', 'MỚI', 'blue', 1, 2),
(3, 'Samsung Galaxy S25', 'Camera AI thế hệ mới — Chụp đẹp mọi khoảnh khắc', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80', '/', 'SALE', 'orange', 1, 3);
`;

async function migrate() {
    const isLocal = process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1';
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || (isLocal ? 3306 : 25363),
        ssl: isLocal ? null : { rejectUnauthorized: false },
        multipleStatements: true,
    });

    try {
        await conn.query(SQL);
        console.log('✅ Migration banners thành công! Bảng đã được tạo và dữ liệu mẫu đã được thêm.');
    } catch (err) {
        console.error('❌ Migration lỗi:', err.message);
    } finally {
        await conn.end();
    }
}

migrate();
