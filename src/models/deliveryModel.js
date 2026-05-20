const db = require('../configs/db');

const deliveryModel = {
    addPhoto: async (data) => {
        const { orderId, uploadedBy, uploaderRole, photoUrl, photoType, note } = data;
        const [result] = await db.query(`
            INSERT INTO delivery_photos (order_id, uploaded_by, uploader_role, photo_url, photo_type, note)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [orderId, uploadedBy, uploaderRole, photoUrl, photoType || 'DELIVERY', note || null]);
        return result;
    },

    getPhotos: async (orderId) => {
        const [rows] = await db.query(`
            SELECT * FROM delivery_photos 
            WHERE order_id = ? 
            ORDER BY created_at ASC
        `, [orderId]);
        return rows;
    }
};

module.exports = deliveryModel;
