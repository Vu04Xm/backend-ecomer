-- =============================================
-- MIGRATION: Tạo bảng banners quảng cáo
-- Chạy lệnh này trong MySQL Workbench hoặc terminal
-- =============================================

CREATE TABLE IF NOT EXISTS banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề banner',
    subtitle VARCHAR(500) DEFAULT NULL COMMENT 'Mô tả phụ',
    image_url TEXT NOT NULL COMMENT 'URL ảnh banner',
    link_url VARCHAR(500) DEFAULT NULL COMMENT 'Link khi bấm vào banner',
    badge_text VARCHAR(100) DEFAULT NULL COMMENT 'Text badge nhỏ (VD: HOT, SALE)',
    badge_color VARCHAR(50) DEFAULT 'red' COMMENT 'Màu badge: red, blue, green, orange, purple',
    is_active TINYINT(1) DEFAULT 1 COMMENT '1=Hiện, 0=Ẩn',
    sort_order INT DEFAULT 0 COMMENT 'Thứ tự hiển thị (nhỏ hơn = ưu tiên hơn)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Dữ liệu mẫu
INSERT INTO banners (title, subtitle, image_url, link_url, badge_text, badge_color, is_active, sort_order) VALUES
('Siêu Sale Hè 2026', 'Giảm đến 40% toàn bộ điện thoại flagship', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80', '/products', 'HOT', 'red', 1, 1),
('iPhone 16 Pro Max', 'Trải nghiệm hiệu năng đỉnh cao với chip A18 Bionic', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80', '/product/1', 'MỚI', 'blue', 1, 2),
('Samsung Galaxy S25', 'Camera AI thế hệ mới - Chụp đẹp mọi khoảnh khắc', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80', '/product/2', 'SALE', 'orange', 1, 3);
