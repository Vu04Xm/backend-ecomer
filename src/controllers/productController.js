const productModel = require('../models/productModel');

const productController = {
    // 1. Lấy danh sách tất cả sản phẩm
    getProducts: async (req, res) => {
        try {
            const data = await productModel.getAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 2. Lấy CHI TIẾT 1 sản phẩm (Quan trọng để fix lỗi 404)
   getProductById: async (req, res) => {
    try {
        const { id } = req.params;
        console.log(">>> [Step 1] Controller nhận yêu cầu lấy ID:", id); // Bẫy ID

        const data = await productModel.getById(id);
        
        if (!data) {
            console.warn(">>> [Step 2] Model trả về NULL cho ID:", id); // Bẫy trường hợp rỗng
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }
        
        console.log(">>> [Step 3] Dữ liệu tìm thấy:", data.name); // Bẫy xem data có tên không
        res.status(200).json(data);
    } catch (error) {
        console.error("!!! [ERROR] Tại Controller:", error.message);
        res.status(500).json({ error: error.message });
    }
},

    // 3. Lấy sản phẩm THEO DANH MỤC (Dùng cho trang Category)
    getProductsByCategory: async (req, res) => {
        try {
            const { id } = req.params; // id của category
            const data = await productModel.getByCategory(id);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 4. Thêm sản phẩm mới
    addProduct: async (req, res) => {
        try {
            const result = await productModel.create(req.body);
            res.status(201).json({ message: "Thêm sản phẩm thành công", id: result.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 5. Cập nhật sản phẩm
    editProduct: async (req, res) => {
        try {
            const result = await productModel.update(req.params.id, req.body);
            if (result.affectedRows === 0) return res.status(404).json({ message: "Sản phẩm không tồn tại" });
            res.status(200).json({ message: "Cập nhật sản phẩm thành công" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 6. Xóa sản phẩm
    deleteProduct: async (req, res) => {
        try {
            const result = await productModel.delete(req.params.id);
            if (result.affectedRows === 0) return res.status(404).json({ message: "Sản phẩm không tồn tại" });
            res.status(200).json({ message: "Xóa sản phẩm thành công" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = productController;