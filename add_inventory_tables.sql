-- TẠO BẢNG NHÀ CUNG CẤP (SUPPLIERS)
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- TẠO BẢNG PHIẾU NHẬP (IMPORT_RECEIPTS)
CREATE TABLE IF NOT EXISTS `import_receipts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `user_id` int NOT NULL, -- Người tạo phiếu (Staff/Admin)
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `status` enum('Pending','Completed','Cancelled') COLLATE utf8mb4_general_ci DEFAULT 'Pending',
  `import_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- TẠO BẢNG CHI TIẾT PHIẾU NHẬP (IMPORT_RECEIPT_DETAILS)
CREATE TABLE IF NOT EXISTS `import_receipt_details` (
  `import_receipt_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `import_price` decimal(15,2) NOT NULL,
  `total_price` decimal(15,2) NOT NULL,
  PRIMARY KEY (`import_receipt_id`, `product_id`),
  FOREIGN KEY (`import_receipt_id`) REFERENCES `import_receipts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- CẬP NHẬT BẢNG PRODUCTS: THÊM CỘT COST_PRICE
-- Chạy lệnh này nếu cột chưa tồn tại
-- ALTER TABLE `products` ADD COLUMN `cost_price` decimal(15,2) DEFAULT '0.00' AFTER `price`;

-- CẬP NHẬT BẢNG ORDERDETAILS: THÊM CỘT COST_AT_PURCHASE
-- ALTER TABLE `orderdetails` ADD COLUMN `cost_at_purchase` decimal(15,2) DEFAULT '0.00' AFTER `price_at_purchase`;
