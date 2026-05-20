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

    // 1b. Lấy 5 sản phẩm mới nhất (cho slide trang chủ)
    getNewest: async (limit = 5) => {
        const query = `
            SELECT p.*, c.name as category_name, b.name as brand_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            ORDER BY p.id DESC
            LIMIT ?
        `;
        const [rows] = await db.query(query, [limit]);
        return rows;
    },

    // 1c. Lấy sản phẩm theo Brand ID
    getByBrand: async (brandId) => {
        const query = `
            SELECT p.*, c.name as category_name, b.name as brand_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.brand_id = ?
            ORDER BY p.id DESC
        `;
        const [rows] = await db.query(query, [brandId]);
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
        let { category_id, brand_id, name, price, discount, quantity, description, status, product_image } = data;
        
        // --- BẬY LOG MODEL ---
        console.log('  🔍 [MODEL.create] Dữ liệu nhận vào:', { category_id, brand_id, name, price, discount, quantity, status, product_image });
        console.log('  📝 [MODEL.create] description (raw):', description);

        if (typeof description === 'string') {
            try {
                JSON.parse(description);
                console.log('  ✅ [MODEL.create] description là JSON chuẩn, giữ nguyên');
            } catch (e) {
                description = JSON.stringify({ detail: description });
                console.log('  🔄 [MODEL.create] description đã wrap thành JSON:', description);
            }
        } else if (description === null || description === undefined) {
            description = JSON.stringify({});
            console.warn('  ⚠️ [MODEL.create] description null/undefined -> set to {}');
        } else {
            description = JSON.stringify(description);
            console.log('  🔄 [MODEL.create] description stringify từ object:', description);
        }

        const sqlParams = [category_id, brand_id, name, price, discount ?? 0, quantity ?? 0, description, status || 'Out of Stock', product_image];
        console.log('  🚀 [MODEL.create] SQL params:', sqlParams);

        const query = `
            INSERT INTO products (category_id, brand_id, name, price, discount, quantity, description, status, product_image) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, sqlParams);
        return result;
    },

    // 5. Cập nhật sản phẩm
    update: async (id, data) => {
        let { category_id, brand_id, name, price, discount, quantity, description, status, product_image } = data;
        
        // --- BẬY LOG MODEL ---
        console.log('  🔍 [MODEL.update] ID:', id, '| Dữ liệu:', { category_id, brand_id, name, price, discount, quantity, status });

        if (typeof description === 'string') {
            try {
                JSON.parse(description);
            } catch (e) {
                description = JSON.stringify({ detail: description });
            }
        } else if (description === null || description === undefined) {
            description = JSON.stringify({});
        } else {
            description = JSON.stringify(description);
        }

        const sqlParams = [category_id, brand_id, name, price, discount ?? 0, quantity ?? 0, description, status || 'Out of Stock', product_image, id];
        console.log('  🚀 [MODEL.update] SQL params:', sqlParams);

        const query = `
            UPDATE products 
            SET category_id=?, brand_id=?, name=?, price=?, discount=?, quantity=?, description=?, status=?, product_image=? 
            WHERE id=?
        `;
        const [result] = await db.query(query, sqlParams);
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
            const [current] = await db.query("SELECT quantity FROM products WHERE id = ?", [productId]);
            if (current.length === 0) {
                console.error(`[KHO] Thất bại: Không tìm thấy SP ID ${productId}`);
                return null;
            }
            const oldQty = current[0].quantity;

            const sql = "UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ?";
            const [result] = await db.query(sql, [quantityToReduce, productId, quantityToReduce]);

            if (result.affectedRows > 0) {
                console.log(`[KHO] SP ID ${productId}: ${oldQty} -> ${oldQty - quantityToReduce} (Thành công)`);
            } else {
                console.error(`[KHO] SP ID ${productId}: Trừ kho thất bại (Hết hàng hoặc SL yêu cầu lớn hơn tồn kho)`);
            }
            return result;
        } catch (error) {
            console.error("Lỗi tại reduceStock Model:", error.message);
            throw error;
        }
    },

    // 8. Lấy danh sách sản phẩm bán chạy (Dựa trên số lượng đã giao thành công)
    getBestSellers: async (limit = 10) => {
        const query = `
            SELECT 
                p.*, 
                c.name as category_name, 
                b.name as brand_name,
                COALESCE(SUM(od.quantity), 0) as total_sold
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN orderdetails od ON p.id = od.product_id
            LEFT JOIN orders o ON od.order_id = o.order_id AND o.status = 'Delivered'
            GROUP BY p.id
            HAVING total_sold > 0
            ORDER BY total_sold DESC
            LIMIT ?
        `;
        const [rows] = await db.query(query, [limit]);
        return rows;
    },

    // 9. Tìm kiếm sản phẩm (cho gợi ý)
    searchProducts: async (searchTerm, limit = 5) => {
        const query = `
            SELECT p.id, p.name, p.price, p.discount, p.product_image, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.name LIKE ?
            LIMIT ?
        `;
        const [rows] = await db.query(query, [`%${searchTerm}%`, limit]);
        return rows;
    },

    // 10. Lấy sản phẩm gợi ý cho người dùng (AI Recommend)
    getRecommendations: async (userId, limit = 8) => {
        try {
            // Bước 1: Lấy các Category ID và Brand ID mà User đã từng mua hoặc thích
            const interestQuery = `
                SELECT DISTINCT p.category_id, p.brand_id
                FROM (
                    SELECT product_id FROM favorites WHERE user_id = ?
                    UNION
                    SELECT od.product_id 
                    FROM orderdetails od 
                    JOIN orders o ON od.order_id = o.order_id 
                    WHERE o.user_id = ?
                ) as user_interests
                JOIN products p ON user_interests.product_id = p.id
            `;
            const [interests] = await db.query(interestQuery, [userId, userId]);

            if (!interests || interests.length === 0) {
                // Nếu chưa có lịch sử, lấy các sản phẩm bán chạy nhất hoặc mới nhất
                return await productModel.getNewest(limit);
            }

            const categoryIds = interests.map(i => i.category_id).filter(id => id !== null);
            const brandIds = interests.map(i => i.brand_id).filter(id => id !== null);

            // Bước 2: Tìm các sản phẩm cùng Category hoặc Brand nhưng User chưa mua/thích
            const recommendQuery = `
                SELECT p.*, c.name as category_name, b.name as brand_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN brands b ON p.brand_id = b.id
                WHERE (p.category_id IN (?) OR p.brand_id IN (?))
                AND p.id NOT IN (
                    SELECT product_id FROM favorites WHERE user_id = ?
                    UNION
                    SELECT od.product_id 
                    FROM orderdetails od 
                    JOIN orders o ON od.order_id = o.order_id 
                    WHERE o.user_id = ?
                )
                ORDER BY RAND()
                LIMIT ?
            `;
            
            // Xử lý trường hợp mảng trống để tránh lỗi SQL
            const safeCategoryIds = categoryIds.length > 0 ? categoryIds : [-1];
            const safeBrandIds = brandIds.length > 0 ? brandIds : [-1];

            const [rows] = await db.query(recommendQuery, [safeCategoryIds, safeBrandIds, userId, userId, limit]);
            
            // Nếu kết quả ít quá, bù thêm bằng sản phẩm mới
            if (rows.length < limit) {
                const newest = await productModel.getNewest(limit);
                // Gộp và loại trùng
                const combined = [...rows];
                newest.forEach(np => {
                    if (!combined.find(p => p.id === np.id) && combined.length < limit) {
                        combined.push(np);
                    }
                });
                return combined;
            }

            return rows;
        } catch (error) {
            console.error("Lỗi tại Model getRecommendations:", error.message);
            return await productModel.getNewest(limit);
        }
    }
};

module.exports = productModel;