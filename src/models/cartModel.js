    const db = require('../configs/db');

    const cartModel = {
        // 1. Lấy giỏ hàng của một người dùng cụ thể (Kèm thông tin sản phẩm)
        getByUserId: async (userId) => {
            const query = `
                SELECT c.*, p.name, p.price, p.product_image 
                FROM cart c
                JOIN products p ON c.product_id = p.id
                WHERE c.user_id = ?
            `;
            const [rows] = await db.query(query, [userId]);
            return rows;
        },

        // 2. Thêm sản phẩm vào giỏ hàng
        addToCart: async (data) => {
            const { user_id, product_id, quantity } = data;
            // Kiểm tra xem sản phẩm đã có trong giỏ chưa
            const [existing] = await db.query(
                'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
                [user_id, product_id]
            );

            if (existing.length > 0) {
                // Nếu có rồi thì cập nhật số lượng cộng thêm
                return await db.query(
                    'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
                    [quantity, user_id, product_id]
                );
            } else {
                // Nếu chưa có thì thêm mới
                return await db.query(
                    'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                    [user_id, product_id, quantity]
                );
            }
        },

        // 3. Cập nhật số lượng trong giỏ hàng (ví dụ khi nhấn nút +/-)
        updateQuantity: async (cartId, quantity) => {
            const [result] = await db.query(
                'UPDATE cart SET quantity = ? WHERE cart_id = ?',
                [quantity, cartId]
            );
            return result;
        },

        // 4. Xóa một sản phẩm khỏi giỏ
        removeFromCart: async (cartId) => {
            const [result] = await db.query('DELETE FROM cart WHERE cart_id = ?', [cartId]);
            return result;
        },
        // 5. Xóa toàn bộ giỏ hàng của một người dùng (sau khi đặt hàng thành công)
        clearByUserId: async (userId) => {
        const query = 'DELETE FROM cart WHERE user_id = ?';
        const [result] = await db.query(query, [userId]);
        return result;
    }
    };

    module.exports = cartModel;