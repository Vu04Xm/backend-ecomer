const db = require('../configs/db');

const brandModel = {
    // Lấy tất cả thương hiệu
    getAll: async () => {
        const [rows] = await db.query('SELECT * FROM brands');
        return rows;
    },

    // Thêm thương hiệu mới
    create: async (data) => {
        const { name, status } = data;
        const [result] = await db.query(
            'INSERT INTO brands (name, status) VALUES (?, ?)',
            [name, status]
        );
        return result;
    },

    // Cập nhật thương hiệu
    update: async (id, data) => {
        const { name, status } = data;
        const [result] = await db.query(
            'UPDATE brands SET name = ?, status = ? WHERE id = ?',
            [name, status, id]
        );
        return result;
    },

    // Xóa thương hiệu
    delete: async (id) => {
        const [result] = await db.query('DELETE FROM brands WHERE id = ?', [id]);
        return result;
    }
};

module.exports = brandModel;