const db = require('../configs/db');

const reviewModel = {
    // 1. Lấy tất cả đánh giá của một sản phẩm cụ thể
    getByProductId: async (productId) => {
        const query = `
            SELECT r.*, u.full_name 
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC
        `;
        const [rows] = await db.query(query, [productId]);
        return rows;
    },

    // 2. Gửi đánh giá mới
    create: async (data) => {
        const { product_id, user_id, rating, comment } = data;
        const [result] = await db.query(
            'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
            [product_id, user_id, rating, comment]
        );
        return result;
    },

    // 3. Xóa đánh giá (Dành cho Admin hoặc người dùng muốn xóa bài của mình)
    delete: async (id) => {
        const [result] = await db.query('DELETE FROM reviews WHERE id = ?', [id]);
        return result;
    }
};

module.exports = reviewModel;