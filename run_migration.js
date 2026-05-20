const pool = require('./src/configs/db');

const runMigration = async () => {
    try {
        console.log('🔄 Bắt đầu chạy Migration...');

        // 1. Tạo bảng suppliers
        await pool.query(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id int NOT NULL AUTO_INCREMENT,
                name varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
                phone varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
                address varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
                status varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'Active',
                created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log('✅ Đã tạo bảng suppliers');

        // 2. Tạo bảng import_receipts
        await pool.query(`
            CREATE TABLE IF NOT EXISTS import_receipts (
                id int NOT NULL AUTO_INCREMENT,
                supplier_id int NOT NULL,
                user_id int NOT NULL,
                total_amount decimal(15,2) DEFAULT '0.00',
                status enum('Pending','Completed','Cancelled') COLLATE utf8mb4_general_ci DEFAULT 'Pending',
                import_date datetime DEFAULT NULL,
                created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log('✅ Đã tạo bảng import_receipts');

        // 3. Tạo bảng import_receipt_details
        await pool.query(`
            CREATE TABLE IF NOT EXISTS import_receipt_details (
                import_receipt_id int NOT NULL,
                product_id int NOT NULL,
                quantity int NOT NULL,
                import_price decimal(15,2) NOT NULL,
                total_price decimal(15,2) NOT NULL,
                PRIMARY KEY (import_receipt_id, product_id),
                FOREIGN KEY (import_receipt_id) REFERENCES import_receipts(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);
        console.log('✅ Đã tạo bảng import_receipt_details');

        // 4. Thêm cột cost_price vào bảng products nếu chưa có
        try {
            await pool.query(`ALTER TABLE products ADD COLUMN cost_price decimal(15,2) DEFAULT '0.00' AFTER price;`);
            console.log('✅ Đã thêm cột cost_price vào products');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ Cột cost_price đã tồn tại trong products');
            } else {
                throw err;
            }
        }

        // 5. Thêm cột cost_at_purchase vào bảng orderdetails nếu chưa có
        try {
            await pool.query(`ALTER TABLE orderdetails ADD COLUMN cost_at_purchase decimal(15,2) DEFAULT '0.00' AFTER price_at_purchase;`);
            console.log('✅ Đã thêm cột cost_at_purchase vào orderdetails');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ Cột cost_at_purchase đã tồn tại trong orderdetails');
            } else {
                throw err;
            }
        }

        console.log('🎉 MIGRATION HOÀN TẤT THÀNH CÔNG!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi chạy Migration:', error);
        process.exit(1);
    }
};

runMigration();
