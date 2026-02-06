const db = require('../configs/db');

const orderDetailModel = {
    // 1. Lấy tất cả sản phẩm của một đơn hàng
    getByOrderId: async (orderId) => {
        try {
            const query = `
                SELECT od.*, p.name, p.product_image 
                FROM orderdetails od
                JOIN products p ON od.product_id = p.id
                WHERE od.order_id = ?
            `;
            const [rows] = await db.query(query, [orderId]);
            return rows;
        } catch (error) {
            console.error("Lỗi tại getByOrderId Model:", error.message);
            throw error;
        }
    },

    // 2. Lưu từng sản phẩm vào đơn hàng
    create: async (data) => {
        try {
            const { order_id, product_id, quantity, price_at_purchase } = data;
            
            if (!order_id || !product_id || !quantity) {
                throw new Error("Dữ liệu chi tiết đơn hàng không đầy đủ!");
            }

            // CHỈNH SỬA TẠI ĐÂY: Thêm cột status_time và gán giá trị NOW()
            const query = `
                INSERT INTO orderdetails 
                (order_id, product_id, quantity, price_at_purchase, status_time) 
                VALUES (?, ?, ?, ?, NOW())
            `;

            const [result] = await db.query(query, [
                order_id, 
                product_id, 
                quantity, 
                price_at_purchase
            ]);
            return result;
        } catch (error) {
            console.error("Lỗi tại orderDetailModel create:", error.message);
            throw error; 
        }
    }
};

module.exports = orderDetailModel;