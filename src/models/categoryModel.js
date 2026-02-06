const db = require('../configs/db');

const categoryModel = {
    // Lấy tất cả danh mục
    getAll: async () => {
        const [rows] = await db.query('SELECT * FROM categories');
        return rows;
    },

    // Thêm danh mục mới
    create: async (data) => {
        const { name, description, status } = data;
        const [result] = await db.query(
            'INSERT INTO categories (name, description, status) VALUES (?, ?, ?)',
            [name, description, status]
        );
        return result;
    },

    // Cập nhật danh mục
    update: async (id, data) => {
        const { name, description, status } = data;
        const [result] = await db.query(
            'UPDATE categories SET name = ?, description = ?, status = ? WHERE id = ?',
            [name, description, status, id]
        );
        return result;
    },

    // Xóa danh mục
    delete: async (id) => {
        const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
        return result;
    }
};

module.exports = categoryModel;