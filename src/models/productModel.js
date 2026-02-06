const db = require('../configs/db');

const productModel = {
    // 1. Lấy tất cả sản phẩm (Kèm theo tên danh mục và thương hiệu)
    getAll: async () => {
        const query = `
            SELECT p.*, c.name as category_name, b.name as brand_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            ORDER BY p.id DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // 2. Lấy chi tiết 1 sản phẩm theo ID
    getById: async (id) => {
        try {
            const query = `
                SELECT p.*, c.name as category_name, b.name as brand_name 
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN brands b ON p.brand_id = b.id
                WHERE p.id = ?
            `;
            const [rows] = await db.query(query, [id]);
            return rows.length > 0 ? rows[0] : null; 
        } catch (error) {
            console.error("Lỗi tại Model getById:", error.message);
            throw error;
        }
    },

    // 3. Lấy sản phẩm theo Category ID
    getByCategory: async (categoryId) => {
        const query = `
            SELECT p.*, c.name as category_name 
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.category_id = ?
        `;
        const [rows] = await db.query(query, [categoryId]);
        return rows;
    },

    // 4. Thêm sản phẩm mới
    create: async (data) => {
        const { category_id, brand_id, name, price, discount, quantity, description, status, product_image } = data;
        const query = `
            INSERT INTO products (category_id, brand_id, name, price, discount, quantity, description, status, product_image) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [category_id, brand_id, name, price, discount, quantity, description, status, product_image]);
        return result;
    },

    // 5. Cập nhật sản phẩm
    update: async (id, data) => {
        const { category_id, brand_id, name, price, discount, quantity, description, status, product_image } = data;
        const query = `
            UPDATE products 
            SET category_id=?, brand_id=?, name=?, price=?, discount=?, quantity=?, description=?, status=?, product_image=? 
            WHERE id=?
        `;
        const [result] = await db.query(query, [category_id, brand_id, name, price, discount, quantity, description, status, product_image, id]);
        return result;
    },

    // 6. Xóa sản phẩm
    delete: async (id) => {
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
        return result;
    },

    // 7. Logic Trừ Kho (Đã tối ưu để khớp hoàn toàn với quy trình Order)
    // models/productModel.js

reduceStock: async (productId, quantityToReduce) => {
    try {
        // Bước 1: Lấy số lượng hiện tại để log đối soát
        const [current] = await db.query("SELECT quantity FROM products WHERE id = ?", [productId]);
        if (current.length === 0) {
            console.error(`[KHO] Thất bại: Không tìm thấy SP ID ${productId}`);
            return null;
        }
        const oldQty = current[0].quantity;

        // Bước 2: Thực hiện trừ kho
        // WHERE quantity >= ? để đảm bảo không bị trừ âm nếu có 2 người mua cùng lúc
        const sql = "UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ?";
        const [result] = await db.query(sql, [quantityToReduce, productId, quantityToReduce]);

        if (result.affectedRows > 0) {
            console.log(`[KHO] SP ID ${productId}: ${oldQty} -> ${oldQty - quantityToReduce} (Thành công)`);
        } else {
            console.error(`[KHO] SP ID ${productId}: Trừ kho thất bại (Có thể do hết hàng hoặc số lượng yêu cầu lớn hơn tồn kho)`);
        }

        return result;
    } catch (error) {
        console.error("Lỗi tại reduceStock Model:", error.message);
        throw error;
    }
}
};

module.exports = productModel;