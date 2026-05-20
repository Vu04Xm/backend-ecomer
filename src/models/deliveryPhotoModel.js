const db = require('../configs/db');

const deliveryPhotoModel = {
  add: async ({ orderId, uploadedBy, uploaderRole, photoUrl, photoType, note }) => {
    const [result] = await db.query(
      'INSERT INTO delivery_photos (order_id, uploaded_by, uploader_role, photo_url, photo_type, note) VALUES (?, ?, ?, ?, ?, ?)',
      [orderId, uploadedBy, uploaderRole, photoUrl, photoType || 'DELIVERY', note || null]
    );
    return result;
  },

  getByOrder: async (orderId) => {
    const [rows] = await db.query(
      `SELECT dp.*, u.full_name as uploader_name 
       FROM delivery_photos dp
       LEFT JOIN users u ON dp.uploaded_by = u.id
       WHERE dp.order_id = ? ORDER BY dp.created_at ASC`,
      [orderId]
    );
    return rows;
  }
};

module.exports = deliveryPhotoModel;
