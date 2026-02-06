const categoryModel = require('../models/categoryModel');

const categoryController = {
    getCategories: async (req, res) => {
        try {
            const categories = await categoryModel.getAll();
            res.status(200).json(categories);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    addCategory: async (req, res) => {
        try {
            const result = await categoryModel.create(req.body);
            res.status(201).json({ message: "Thêm danh mục thành công", id: result.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    editCategory: async (req, res) => {
        try {
            const result = await categoryModel.update(req.params.id, req.body);
            if (result.affectedRows === 0) return res.status(404).json({ message: "Không tìm thấy danh mục" });
            res.status(200).json({ message: "Cập nhật danh mục thành công" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const result = await categoryModel.delete(req.params.id);
            if (result.affectedRows === 0) return res.status(404).json({ message: "Không tìm thấy danh mục" });
            res.status(200).json({ message: "Xóa danh mục thành công" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = categoryController;