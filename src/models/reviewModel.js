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

    // 3. Kiểm tra xem người dùng đã mua sản phẩm này chưa (Trạng thái đơn hàng phải là 'Delivered')
    checkPurchase: async (userId, productId) => {
        const query = `
            SELECT od.order_id 
            FROM orderdetails od
            JOIN orders o ON od.order_id = o.order_id
            WHERE o.user_id = ? AND od.product_id = ? AND o.status = 'Delivered'
            LIMIT 1
        `;
        const [rows] = await db.query(query, [userId, productId]);
        return rows.length > 0;
    },

    // 4. Xóa đánh giá (Dành cho Admin hoặc người dùng muốn xóa bài của mình)
    delete: async (id) => {
        const [result] = await db.query('DELETE FROM reviews WHERE id = ?', [id]);
        return result;
    }
};

module.exports = reviewModel;