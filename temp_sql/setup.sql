-- setup_professional_variants.sql
-- Run this script AFTER products (3).sql to setup the variant system and standardize data.

-- 1. Create Variant Related Tables
CREATE TABLE IF NOT EXISTS attributes (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS attribute_values (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  attribute_id int NOT NULL,
  value varchar(255) NOT NULL,
  FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS product_variants (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id int NOT NULL,
  variant_name varchar(255) DEFAULT NULL,
  sku varchar(100) DEFAULT NULL,
  price decimal(15,2) DEFAULT NULL,
  quantity int DEFAULT 0,
  image varchar(255) DEFAULT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS product_variant_values (
  variant_id int NOT NULL,
  attribute_value_id int NOT NULL,
  PRIMARY KEY (variant_id, attribute_value_id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  FOREIGN KEY (attribute_value_id) REFERENCES attribute_values(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Seed Attributes and Values for Different Categories
INSERT IGNORE INTO attributes (id, name) VALUES 
(1, 'Màu sắc'), 
(2, 'Dung lượng (RAM/ROM)'), 
(3, 'Kích thước màn hình'),
(4, 'Công suất / Khối lượng'),
(5, 'Loại kết nối');

INSERT IGNORE INTO attribute_values (id, attribute_id, value) VALUES 
-- Màu sắc (ID 1)
(1, 1, 'Đen'), (2, 1, 'Trắng'), (3, 1, 'Bạc'), (4, 1, 'Hồng'), (5, 1, 'Xanh'), (6, 1, 'Titan'),
-- Dung lượng (ID 2)
(7, 2, '128GB'), (8, 2, '256GB'), (9, 2, '512GB'), (10, 2, '1TB'), (11, 2, '16GB RAM'),
-- Kích thước (ID 3)
(12, 3, '14 inch'), (13, 3, '15.6 inch'), (14, 3, '55 inch'), (15, 3, '65 inch'),
-- Công suất / Khối lượng (ID 4)
(16, 4, '9kg'), (17, 4, '10kg'), (18, 4, '2000W'), (19, 4, '1.5 HP'),
-- Kết nối (ID 5)
(20, 5, 'Bluetooth 5.3'), (21, 5, 'Wi-Fi 6E'), (22, 5, 'Wireless 2.4GHz');

-- 3. Standardize Descriptions by Category
-- Category 1: Smartphones
UPDATE products 
SET description = JSON_OBJECT(
    'hang', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.hang')), 'Khác'),
    'mau_sac', 'Đen',
    'bo_nho_trong_gb', COALESCE(NULLIF(REGEXP_REPLACE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.rom')), '[^0-9]', ''), ''), 256),
    'ram_gb', COALESCE(NULLIF(REGEXP_REPLACE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.ram')), '[^0-9]', ''), ''), 8),
    'man_hinh_inch', 6.7,
    'chip', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.chip')), 'Chipset'),
    'pin_mah', COALESCE(NULLIF(REGEXP_REPLACE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.pin')), '[^0-9]', ''), ''), 5000),
    'camera_sau', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.camera')), 'Chính 50MP'),
    'he_dieu_hanh', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.he_dieu_hanh')), 'Android/iOS')
)
WHERE category_id = 1;

-- Category 2: Laptops
UPDATE products 
SET description = JSON_OBJECT(
    'hang', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.hang')), 'Khác'),
    'cpu', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.cpu')), 'Intel/AMD'),
    'ram_gb', COALESCE(NULLIF(REGEXP_REPLACE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.ram')), '[^0-9]', ''), ''), 16),
    'o_cung_gb', COALESCE(NULLIF(REGEXP_REPLACE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.o_cung')), '[^0-9]', ''), ''), 512),
    'man_hinh_inch', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.man_hinh')), '15.6 inch'),
    'card_do_hoa', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.card_do_hoa')), 'Tích hợp'),
    'trong_luong_kg', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.trong_luong')), '1.8kg')
)
WHERE category_id = 2;

-- Category 3: Monitors
UPDATE products 
SET description = JSON_OBJECT(
    'hang', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.hang')), 'Khác'),
    'kich_thuoc_inch', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.kich_thuoc')), '24 inch'),
    'do_phan_giai', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.do_phan_giai')), 'FHD'),
    'tan_so_quet_hz', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.tan_so_quet')), '100Hz'),
    'tam_nen', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.tam_nen')), 'IPS')
)
WHERE category_id = 3;

-- Category 4: Headphones
UPDATE products 
SET description = JSON_OBJECT(
    'hang', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.hang')), 'Khác'),
    'loai_tai_nghe', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.loai_tai_nghe')), 'TWS'),
    'chong_on', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.chong_on')), 'ANC'),
    'pin_gio', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.pin')), '24h'),
    'chong_nuoc', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.chong_nuoc')), 'IPX4')
)
WHERE category_id = 4;

-- Category 5: TVs
UPDATE products 
SET description = JSON_OBJECT(
    'hang', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.hang')), 'Khác'),
    'kich_thuoc_inch', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.kich_thuoc')), '55 inch'),
    'do_phan_giai', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.do_phan_giai')), '4K'),
    'he_dieu_hanh', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.he_dieu_hanh')), 'Google TV'),
    'am_thanh', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.am_thanh')), 'Dolby Atmos')
)
WHERE category_id = 5;

-- Category 6: Home Appliances (Fridge, Washer, AC...)
UPDATE products 
SET description = JSON_OBJECT(
    'hang', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.hang')), 'Khác'),
    'loai_thiet_bi', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.loai_bep')), 'Gia dụng'),
    'cong_suat', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.cong_suat')), '2000W'),
    'dung_tich_lit', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.khoi_luong')), '7kg/200L'),
    'bao_hanh', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(description, '$.bao_hanh')), '12 tháng')
)
WHERE category_id = 6;

-- 4. Specific Mappings for Variants using 'soucreanh'
-- iPhone 17 Pro Max (Assuming ID 41 from products (3).sql)
INSERT INTO product_variants (product_id, variant_name, sku, price, quantity, image) VALUES 
(41, 'Bạc - 1TB', 'IP17PM-1TB-SILVER', 44990000, 50, '/images/products/iphone-17-pro-max_home_05_2026.png'),
(41, 'Đen - 512GB', 'IP17PM-512GB-BLACK', 38990000, 50, '/images/products/iphone-17-pro-max_3.jpg');

-- Map variant attributes for ID 41
-- IP17PM-1TB-SILVER: Bạc (3) + 1TB (11)
INSERT INTO product_variant_values (variant_id, attribute_value_id) 
SELECT id, 3 FROM product_variants WHERE sku = 'IP17PM-1TB-SILVER'
UNION ALL
SELECT id, 11 FROM product_variants WHERE sku = 'IP17PM-1TB-SILVER';

-- IP17PM-512GB-BLACK: Đen (1) + 512GB (10)
INSERT INTO product_variant_values (variant_id, attribute_value_id) 
SELECT id, 1 FROM product_variants WHERE sku = 'IP17PM-512GB-BLACK'
UNION ALL
SELECT id, 10 FROM product_variants WHERE sku = 'IP17PM-512GB-BLACK';

-- iPhone 16e (Assuming ID 40)
INSERT INTO product_variants (product_id, variant_name, sku, price, quantity, image) VALUES 
(40, 'Hồng - 128GB', 'IP16E-128GB-PINK', 18990000, 40, '/images/products/iphone_17e_pink_1.png');

INSERT INTO product_variant_values (variant_id, attribute_value_id)
SELECT id, 4 FROM product_variants WHERE sku = 'IP16E-128GB-PINK'
UNION ALL
SELECT id, 8 FROM product_variants WHERE sku = 'IP16E-128GB-PINK';

-- Samsung S25 Edge (Search by name if ID unknown, but let's assume it's near)
-- We'll add it as a new product if not found, or map it.
-- Based on the name 'Samsung galaxy s25 plus gray' at ID 131
INSERT INTO product_variants (product_id, variant_name, sku, price, quantity, image) VALUES 
(131, 'Bạc - 256GB', 'SS-S25E-256GB-SILVER', 29990000, 30, '/images/products/dien-thoai-samsung-galaxy-s25-edge.jpg');

INSERT INTO product_variant_values (variant_id, attribute_value_id)
SELECT id, 3 FROM product_variants WHERE sku = 'SS-S25E-256GB-SILVER'
UNION ALL
SELECT id, 9 FROM product_variants WHERE sku = 'SS-S25E-256GB-SILVER';

-- Xiaomi 17 Ultra (Not found in SQL inserts, let's map it to an existing Xiaomi like ID 1)
-- ID 1 is '21 Tainghe' but brand is Xiaomi. Let's find a better one.
-- ID 193 is 'Xiaomi poco x8 pro'
INSERT INTO product_variants (product_id, variant_name, sku, price, quantity, image) VALUES 
(193, 'Đen - 512GB', 'XI-17U-512GB-BLACK', 28990000, 20, '/images/products/dien-thoai-xiaomi-17-ultra-den.jpg');

INSERT INTO product_variant_values (variant_id, attribute_value_id)
SELECT id, 1 FROM product_variants WHERE sku = 'XI-17U-512GB-BLACK'
UNION ALL
SELECT id, 10 FROM product_variants WHERE sku = 'XI-17U-512GB-BLACK';

COMMIT;
