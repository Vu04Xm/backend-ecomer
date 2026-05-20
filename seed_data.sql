-- ============================================================
-- SEED DATA - web_cellphones
-- Xóa và tạo lại toàn bộ danh mục, thương hiệu, sản phẩm
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE order_details;
TRUNCATE TABLE orders;
TRUNCATE TABLE cart_items;
TRUNCATE TABLE products;
TRUNCATE TABLE brands;
TRUNCATE TABLE categories;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- DANH MỤC (categories)
-- ============================================================
INSERT INTO categories (id, name, description, status) VALUES
(1, 'Điện thoại',       'Điện thoại thông minh các loại', 'active'),
(2, 'Laptop',           'Máy tính xách tay', 'active'),
(3, 'Màn hình',         'Màn hình máy tính', 'active'),
(4, 'Tai nghe',         'Tai nghe có dây và không dây', 'active'),
(5, 'Tivi',             'Tivi, Smart TV các hãng', 'active'),
(6, 'Đồ gia dụng điện tử', 'Máy lạnh, tủ lạnh, máy giặt, lò vi sóng...', 'active');

-- ============================================================
-- THƯƠNG HIỆU (brands)
-- ============================================================
INSERT INTO brands (id, name, status) VALUES
-- Điện thoại
(1,  'Apple',       'active'),
(2,  'Samsung',     'active'),
(3,  'Xiaomi',      'active'),
(4,  'OPPO',        'active'),
(5,  'Vivo',        'active'),
-- Laptop
(6,  'Dell',        'active'),
(7,  'HP',          'active'),
(8,  'ASUS',        'active'),
(9,  'Lenovo',      'active'),
(10, 'MSI',         'active'),
-- Màn hình
(11, 'LG',          'active'),
(12, 'BenQ',        'active'),
(13, 'Acer',        'active'),
-- Tai nghe
(14, 'Sony',        'active'),
(15, 'JBL',         'active'),
(16, 'AKG',         'active'),
-- Tivi
(17, 'TCL',         'active'),
(18, 'Panasonic',   'active'),
-- Đồ gia dụng
(19, 'Daikin',      'active'),
(20, 'Toshiba',     'active'),
(21, 'Electrolux',  'active'),
(22, 'Midea',       'active');

-- ============================================================
-- SẢN PHẨM (products)
-- category_id: 1=Điện thoại, 2=Laptop, 3=Màn hình, 4=Tai nghe, 5=Tivi, 6=Đồ gia dụng
-- ============================================================

-- (Sẵn sàng để thêm dữ liệu sản phẩm mới tại đây)

