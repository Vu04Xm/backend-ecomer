const brandModel = require('../models/brandModel');

const brandController = {
    getBrands: async (req, res) => {
        try {
            const brands = await brandModel.getAll();
            res.status(200).json(brands);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    addBrand: async (req, res) => {
        try {
            const result = await brandModel.create(req.body);
            res.status(201).json({ message: "Thêm thương hiệu thành công", id: result.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    editBrand: async (req, res) => {
        try {
            const result = await brandModel.update(req.params.id, req.body);
            if (result.affectedRows === 0) return res.status(404).json({ message: "Không tìm thấy thương hiệu" });
            res.status(200).json({ message: "Cập nhật thương hiệu thành công" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    deleteBrand: async (req, res) => {
        try {
            const result = await brandModel.delete(req.params.id);
            if (result.affectedRows === 0) return res.status(404).json({ message: "Không tìm thấy thương hiệu" });
            res.status(200).json({ message: "Xóa thương hiệu thành công" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = brandController;