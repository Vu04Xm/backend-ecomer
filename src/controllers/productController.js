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

    // 3. Lấy sản phẩm THEO DAȦH MỤC
    getProductsByCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await productModel.getByCategory(id);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 3b. Lấy 5 sản phẩm MỚI NHẤT (dùng cho slide trang chủ)
    getNewestProducts: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 5;
            const data = await productModel.getNewest(limit);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 3c. Lấy sản phẩm THEO THƯƠNG HIỆU
    getProductsByBrand: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await productModel.getByBrand(id);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 4. Thêm sản phẩm mới
    addProduct: async (req, res) => {
        try {
            console.log('\n🔵 [ADD PRODUCT] ===== BẮT ĐẦU THÊM SẢN PHẨM =====');
            console.log('📦 Body nhận được:', JSON.stringify(req.body, null, 2));

            const { name, price, category_id, brand_id, discount, quantity, status, product_image, description } = req.body;

            // Kiểm tra từng trường bắt buộc
            if (!name) console.error('❌ [TRAP] Thiếu: name');
            if (!price) console.error('❌ [TRAP] Thiếu: price');
            if (!product_image) console.error('❌ [TRAP] Thiếu: product_image');
            if (category_id === undefined) console.error('❌ [TRAP] Thiếu: category_id');
            if (brand_id === undefined) console.error('❌ [TRAP] Thiếu: brand_id');

            console.log('✅ [TRAP] Truyền vào Model - params:', { name, price, category_id, brand_id, discount, quantity, status, product_image, descriptionType: typeof description });

            const result = await productModel.create(req.body);
            console.log('🎉 [ADD PRODUCT] Thành công! insertId:', result.insertId);
            res.status(201).json({ message: "Thêm sản phẩm thành công", id: result.insertId });
        } catch (error) {
            console.error('\n🔴 [ADD PRODUCT ERROR] ===== LỖI XẢY RA =====');
            console.error('💥 Loại lỗi:', error.code || 'UNKNOWN');
            console.error('📝 Message:', error.message);
            console.error('🗄️  SQL Error:', error.sql || 'N/A');
            console.error('📋 Stack:', error.stack);
            console.error('===============================================\n');
            res.status(500).json({ error: error.message, code: error.code, sql: error.sql });
        }
    },

    // 5. Cập nhật sản phẩm
    editProduct: async (req, res) => {
        try {
            console.log('\n🟡 [EDIT PRODUCT] ===== BẮT ĐẦU CẬP NHẬT =====');
            console.log('🆔 Product ID:', req.params.id);
            console.log('📦 Body nhận được:', JSON.stringify(req.body, null, 2));

            const result = await productModel.update(req.params.id, req.body);
            if (result.affectedRows === 0) return res.status(404).json({ message: "Sản phẩm không tồn tại" });
            console.log('🎉 [EDIT PRODUCT] Thành công! affectedRows:', result.affectedRows);
            res.status(200).json({ message: "Cập nhật sản phẩm thành công" });
        } catch (error) {
            console.error('\n🔴 [EDIT PRODUCT ERROR] ===== LỖI XẢY RA =====');
            console.error('💥 Loại lỗi:', error.code || 'UNKNOWN');
            console.error('📝 Message:', error.message);
            console.error('🗄️  SQL Error:', error.sql || 'N/A');
            console.error('📋 Stack:', error.stack);
            console.error('===============================================\n');
            res.status(500).json({ error: error.message, code: error.code });
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
    },

    // 7. Lấy danh sách sản phẩm BÁN CHẠY (Top Sellers)
    getBestSellers: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const data = await productModel.getBestSellers(limit);
            res.status(200).json(data);
        } catch (error) {
            console.error("!!! [ERROR] Tại Controller getBestSellers:", error.message);
            res.status(500).json({ error: error.message });
        }
    },

    // 8. Tìm kiếm gợi ý
    searchProducts: async (req, res) => {
        try {
            const { q } = req.query;
            if (!q) return res.status(200).json([]);
            
            const limit = parseInt(req.query.limit) || 6;
            const data = await productModel.searchProducts(q, limit);
            res.status(200).json(data);
        } catch (error) {
            console.error("!!! [ERROR] Tại Controller searchProducts:", error.message);
            res.status(500).json({ error: error.message });
        }
    },
    // 9. Lấy sản phẩm gợi ý cá nhân hóa (AI Recommend)
    getRecommendedProducts: async (req, res) => {
        try {
            const { userId } = req.params;
            const limit = parseInt(req.query.limit) || 8;
            
            // Nếu không có userId (khách vãng lai), lấy sản phẩm mới nhất
            if (!userId || userId === 'null' || userId === 'undefined') {
                const data = await productModel.getNewest(limit);
                return res.status(200).json(data);
            }

            const data = await productModel.getRecommendations(userId, limit);
            res.status(200).json(data);
        } catch (error) {
            console.error("!!! [ERROR] Tại Controller getRecommendedProducts:", error.message);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = productController;