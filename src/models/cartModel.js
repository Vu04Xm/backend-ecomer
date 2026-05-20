const db = require('../configs/db');

    const cartModel = {
        // 1. Lấy giỏ hàng của một người dùng cụ thể
        getByUserId: async (userId) => {
            const query = `
                SELECT c.cart_id, c.user_id, c.product_id, c.quantity, p.name, p.price, p.discount, p.product_image, p.cost_price 
                FROM cart c
                JOIN products p ON c.product_id = p.id
                WHERE c.user_id = ?
            `;
            const [rows] = await db.query(query, [userId]);
            return rows;
        },

        // 2. Thêm sản phẩm vào giỏ (Xử lý nếu trùng SP thì tăng số lượng)
        addToCart: async (data) => {
            const { user_id, product_id, quantity } = data;
            
            // Kiểm tra xem SP này đã có trong giỏ của user này chưa
            const [exist] = await db.query("SELECT * FROM cart WHERE user_id = ? AND product_id = ?", [user_id, product_id]);

            if (exist.length > 0) {
                const newQty = exist[0].quantity + Math.max(1, quantity || 1);
                return await db.query("UPDATE cart SET quantity = ? WHERE cart_id = ?", [newQty, exist[0].cart_id]);
            } else {
                return await db.query("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)", [user_id, product_id, Math.max(1, quantity || 1)]);
            }
        },

        // 3. Cập nhật số lượng
        updateQuantity: async (cartId, quantity) => {
            const query = "UPDATE cart SET quantity = ? WHERE cart_id = ?";
            const [result] = await db.query(query, [quantity, cartId]);
            return result;
        },

        // 4. Xóa một sản phẩm khỏi giỏ
        removeFromCart: async (cartId) => {
            const query = "DELETE FROM cart WHERE cart_id = ?";
            const [result] = await db.query(query, [cartId]);
            return result;
        },

        // 5. Xóa sạch giỏ hàng của một User (Dùng khi thanh toán xong)
        clearByUserId: async (userId) => {
            const query = "DELETE FROM cart WHERE user_id = ?";
            const [result] = await db.query(query, [userId]);
            return result;
        }
    };

    module.exports = cartModel;