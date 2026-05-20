const db = require('../configs/db');

const auditModel = {
    logOrderAction: async (orderId, action, staffId, staffName, details = '') => {
        try {
            // Ghi vào bảng order_tracking (Để hiển thị cho khách và staff)
            await db.query(`
                INSERT INTO order_tracking (order_id, status, description, staff_id, staff_name)
                VALUES (?, ?, ?, ?, ?)
            `, [orderId, action, details, staffId, staffName]);

            return true;
        } catch (error) {
            console.error("Lỗi logOrderAction:", error.message);
            return false;
        }
    },

    getOrderHistory: async (orderId) => {
        const [rows] = await db.query(`
            SELECT * FROM order_tracking 
            WHERE order_id = ? 
            ORDER BY created_at DESC
        `, [orderId]);
        return rows;
    }
};

module.exports = auditModel;
