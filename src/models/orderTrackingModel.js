const db = require('../configs/db');

const orderTrackingModel = {
    // 1. Lấy toàn bộ lịch sử của 1 đơn hàng
    getByOrderId: async (orderId) => {
        const query = "SELECT * FROM order_tracking WHERE order_id = ? ORDER BY created_at ASC";
        const [rows] = await db.query(query, [orderId]);
        return rows;
    },

    // 2. Thêm bản ghi theo dõi — TH5: hỗ trợ staff_id & staff_name
    create: async (data) => {
        const { order_id, status, description, staff_id, staff_name } = data;
        const query = `
            INSERT INTO order_tracking (order_id, status, description, staff_id, staff_name) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [
            order_id, status, description,
            staff_id || null, staff_name || null
        ]);
        return result;
    },

    // 3. Lấy audit log (chỉ admin — có cả staff_id & staff_name)
    getAuditByOrderId: async (orderId) => {
        const query = `
            SELECT t.*, u.full_name as staff_display
            FROM order_tracking t
            LEFT JOIN users u ON t.staff_id = u.id
            WHERE t.order_id = ?
            ORDER BY t.created_at DESC
        `;
        const [rows] = await db.query(query, [orderId]);
        return rows;
    }
};

module.exports = orderTrackingModel;
