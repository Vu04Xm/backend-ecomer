const db = require('../configs/db');

const promotionModel = {
    // 1. LẤY TẤT CẢ: Dùng LEFT JOIN để lấy được cả mã Voucher (product_id = null)
    getAll: async () => {
        const query = `
            SELECT prom.*, p.name as product_name 
            FROM promotions prom
            LEFT JOIN products p ON prom.product_id = p.id
            ORDER BY prom.id DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // 2. KIỂM TRA KM THEO SP: Giữ nguyên
    getByProductId: async (productId) => {
        const query = `
            SELECT * FROM promotions 
            WHERE product_id = ? 
            AND NOW() BETWEEN start_date AND end_date
            LIMIT 1
        `;
        const [rows] = await db.query(query, [productId]);
        return rows[0];
    },

    // 3. TẠO MỚI: Sửa lại cho khớp tham số và tên cột
    create: async (data) => {
        // Lưu ý: frontend gửi lên 'coupon_code', database của bạn là 'magiamgia'
        const { product_id, title, discount_percent, start_date, end_date, coupon_code } = data;
        
        const query = `
            INSERT INTO promotions 
            (product_id, title, discount_percent, start_date, end_date, magiamgia) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        // Truyền đủ 6 tham số vào mảng
        const [result] = await db.query(query, [
            product_id || null, 
            title, 
            discount_percent, 
            start_date, 
            end_date, 
            coupon_code || null
        ]);
        return result;
    },
   checkCoupon: async (code) => {
    const query = `
        SELECT * FROM promotions 
        WHERE magiamgia = ? 
        AND product_id IS NULL 
        AND NOW() BETWEEN start_date AND end_date
    `;
    const [rows] = await db.query(query, [code]);
    console.log("Kết quả tìm mã:", rows); // Dòng này sẽ in ra Terminal của VS Code
    return rows[0];
},
    delete: async (id) => {
        const query = `DELETE FROM promotions WHERE id = ?`;
        const [result] = await db.query(query, [id]);
        return result;
    }
};

module.exports = promotionModel;