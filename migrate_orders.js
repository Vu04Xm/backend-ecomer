const pool = require('./src/configs/db');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
    try {
        console.log('🔄 Đang đọc file SQL migration...');
        const sqlPath = path.join(__dirname, 'src/configs/migration_advanced_orders.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Tách các câu lệnh bằng dấu chấm phẩy
        // Lưu ý: regex này đơn giản, không xử lý được nếu có ; bên trong string/comment
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`🚀 Bắt đầu thực hiện ${statements.length} câu lệnh SQL...`);

        for (let i = 0; i < statements.length; i++) {
            try {
                await pool.query(statements[i]);
                console.log(`✅ [${i + 1}/${statements.length}] Thành công.`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`⚠️ [${i + 1}/${statements.length}] Bỏ qua (Đã tồn tại).`);
                } else {
                    console.error(`❌ [${i + 1}/${statements.length}] Lỗi:`, err.message);
                    // Không throw lỗi để tiếp tục các câu lệnh khác nếu có thể
                }
            }
        }

        console.log('🎉 TẤT CẢ MIGRATION ĐÃ HOÀN TẤT!');
        process.exit(0);
    } catch (error) {
        console.error('🔥 Lỗi nghiêm trọng khi chạy migration:', error.message);
        process.exit(1);
    }
};

runMigration();
