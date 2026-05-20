-- ============================================================
-- Migration: Advanced Order Management Features (v2 - Improved Audit)
-- ============================================================

-- TH3: Ví ảo người dùng
CREATE TABLE IF NOT EXISTS wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  balance DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TH3: Lịch sử giao dịch ví (Bổ sung balance_before/after để đối soát)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_id INT DEFAULT NULL,
  type ENUM('refund', 'withdraw', 'payment') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance_before DECIMAL(15,2) DEFAULT 0.00,
  balance_after DECIMAL(15,2) DEFAULT 0.00,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
  bank_info JSON DEFAULT NULL, -- Lưu {bankName, accountNo, accountName} khi rút tiền
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TH2: Ảnh giao nhận (Thêm photo_type để phân biệt)
CREATE TABLE IF NOT EXISTS delivery_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  uploaded_by INT NOT NULL,
  uploader_role ENUM('admin', 'staff', 'user') NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type ENUM('PICKUP', 'DELIVERY', 'RETURN') DEFAULT 'DELIVERY',
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- TH1+TH4: Lý do & ai hủy đơn
ALTER TABLE orders ADD COLUMN cancel_reason TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN cancelled_by ENUM('user','admin','staff','system') DEFAULT NULL;

-- TH5: Nhân viên thực hiện thay đổi trạng thái
ALTER TABLE order_tracking ADD COLUMN staff_id INT DEFAULT NULL;
ALTER TABLE order_tracking ADD COLUMN staff_name VARCHAR(255) DEFAULT NULL;
