const db = require('../configs/db');

const favoriteModel = {
    // 1. Lấy danh sách yêu thích của người dùng
    getByUserId: async (userId) => {
        const query = `
            SELECT f.id as favorite_id, p.*, c.name as category_name, b.name as brand_name 
            FROM favorites f
            JOIN products p ON f.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `;
        const [rows] = await db.query(query, [userId]);
        return rows;
    },

    // 2. Thêm vào yêu thích
    add: async (userId, productId) => {
        // Kiểm tra xem đã tồn tại chưa để tránh trùng lặp
        const checkQuery = "SELECT id FROM favorites WHERE user_id = ? AND product_id = ?";
        const [exists] = await db.query(checkQuery, [userId, productId]);
        
        if (exists.length > 0) return { message: "Đã có trong danh sách yêu thích" };

        const query = "INSERT INTO favorites (user_id, product_id) VALUES (?, ?)";
        const [result] = await db.query(query, [userId, productId]);
        return result;
    },

    // 3. Xóa khỏi yêu thích
    remove: async (userId, productId) => {
        const query = "DELETE FROM favorites WHERE user_id = ? AND product_id = ?";
        const [result] = await db.query(query, [userId, productId]);
        return result;
    },

    // 4. Kiểm tra xem một sản phẩm có được user thích không
    isFavorite: async (userId, productId) => {
        const query = "SELECT id FROM favorites WHERE user_id = ? AND product_id = ?";
        const [rows] = await db.query(query, [userId, productId]);
        return rows.length > 0;
    }
};

module.exports = favoriteModel;
