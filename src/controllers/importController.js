const pool = require('../configs/db');

const importController = {
    // 1. Lấy danh sách phiếu nhập
    getAllImports: async (req, res) => {
        try {
            const query = `
                SELECT ir.*, s.name as supplier_name, u.email as user_email
                FROM import_receipts ir
                JOIN suppliers s ON ir.supplier_id = s.id
                JOIN users u ON ir.user_id = u.id
                ORDER BY ir.id DESC
            `;
            const [imports] = await pool.query(query);
            res.status(200).json(imports);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách phiếu nhập:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    // 2. Lấy chi tiết phiếu nhập (kèm theo các sản phẩm)
    getImportById: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Thông tin phiếu nhập
            const [receipts] = await pool.query(`
                SELECT ir.*, s.name as supplier_name, u.email as user_email
                FROM import_receipts ir
                JOIN suppliers s ON ir.supplier_id = s.id
                JOIN users u ON ir.user_id = u.id
                WHERE ir.id = ?
            `, [id]);

            if (receipts.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy phiếu nhập' });
            }

            // Chi tiết các sản phẩm trong phiếu nhập
            const [details] = await pool.query(`
                SELECT ird.*, p.name as product_name, p.product_image 
                FROM import_receipt_details ird
                JOIN products p ON ird.product_id = p.id
                WHERE ird.import_receipt_id = ?
            `, [id]);

            const receipt = receipts[0];
            receipt.details = details;

            res.status(200).json(receipt);
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết phiếu nhập:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    // 3. Tạo phiếu nhập mới (Trạng thái mặc định là Pending)
    createImport: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { supplier_id, details } = req.body; // details là mảng: [{ product_id, quantity, import_price }]
            const user_id = req.user.id; // Lấy từ authMiddleware

            if (!supplier_id || !details || details.length === 0) {
                return res.status(400).json({ message: 'Thiếu thông tin nhà cung cấp hoặc danh sách sản phẩm' });
            }

            // Tính tổng tiền
            let total_amount = 0;
            const processedDetails = details.map(item => {
                const itemTotal = Number(item.quantity) * Number(item.import_price);
                total_amount += itemTotal;
                return {
                    ...item,
                    total_price: itemTotal
                };
            });

            // Insert vào bảng import_receipts
            const [receiptResult] = await connection.query(
                'INSERT INTO import_receipts (supplier_id, user_id, total_amount, status, import_date) VALUES (?, ?, ?, ?, NOW())',
                [supplier_id, user_id, total_amount, 'Pending']
            );
            const receiptId = receiptResult.insertId;

            // Insert vào bảng import_receipt_details
            for (const item of processedDetails) {
                await connection.query(
                    'INSERT INTO import_receipt_details (import_receipt_id, product_id, quantity, import_price, total_price) VALUES (?, ?, ?, ?, ?)',
                    [receiptId, item.product_id, item.quantity, item.import_price, item.total_price]
                );
            }

            await connection.commit();
            res.status(201).json({ message: 'Tạo phiếu nhập thành công', receiptId });
        } catch (error) {
            await connection.rollback();
            console.error('Lỗi khi tạo phiếu nhập:', error);
            res.status(500).json({ message: 'Lỗi server' });
        } finally {
            connection.release();
        }
    },

    // 4. Hủy phiếu nhập (Chỉ được hủy khi đang Pending)
    cancelImport: async (req, res) => {
        try {
            const { id } = req.params;
            
            const [receipts] = await pool.query('SELECT status FROM import_receipts WHERE id = ?', [id]);
            if (receipts.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy phiếu nhập' });
            }

            if (receipts[0].status === 'Completed') {
                return res.status(400).json({ message: 'Không thể hủy phiếu nhập đã hoàn tất!' });
            }

            await pool.query('UPDATE import_receipts SET status = ? WHERE id = ?', ['Cancelled', id]);
            res.status(200).json({ message: 'Hủy phiếu nhập thành công' });
        } catch (error) {
            console.error('Lỗi khi hủy phiếu nhập:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    // 5. HOÀN TẤT PHIẾU NHẬP (QUAN TRỌNG NHẤT)
    completeImport: async (req, res) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const { id } = req.params;

            // Kiểm tra trạng thái phiếu
            const [receipts] = await connection.query('SELECT * FROM import_receipts WHERE id = ? FOR UPDATE', [id]);
            if (receipts.length === 0) {
                throw new Error('NOT_FOUND');
            }
            if (receipts[0].status !== 'Pending') {
                throw new Error('INVALID_STATUS');
            }

            // Lấy chi tiết phiếu nhập
            const [details] = await connection.query('SELECT * FROM import_receipt_details WHERE import_receipt_id = ?', [id]);

            // Lặp qua từng sản phẩm để chạy thuật toán Bình quân gia quyền
            for (const item of details) {
                const { product_id, quantity: importQty, import_price: importPrice } = item;
                
                // Lấy thông tin sản phẩm hiện tại
                const [products] = await connection.query('SELECT quantity, cost_price, status FROM products WHERE id = ? FOR UPDATE', [product_id]);
                if (products.length === 0) continue; // Nếu sản phẩm không tồn tại thì bỏ qua

                const currentQty = Number(products[0].quantity) || 0;
                const currentCost = Number(products[0].cost_price) || 0;

                const importedQty = Number(importQty);
                const importedPrice = Number(importPrice);

                // THUẬT TOÁN BÌNH QUÂN GIA QUYỀN
                // Giá vốn mới = (Tồn cũ * Giá cũ + Nhập mới * Giá mới) / (Tồn cũ + Nhập mới)
                let newCostPrice = 0;
                const newTotalQty = currentQty + importedQty;

                if (newTotalQty > 0) {
                    newCostPrice = ((currentQty * currentCost) + (importedQty * importedPrice)) / newTotalQty;
                }

                // Cập nhật lại số lượng và giá vốn vào bảng products
                // Nếu sản phẩm đang "Out of Stock" và số lượng mới > 0 thì tự động bật lại "In Stock"
                const currentStatus = products[0].status;
                const newStatus = (newTotalQty > 0 && currentStatus === 'Out of Stock') ? 'In Stock' : currentStatus;

                if (newStatus !== currentStatus) {
                    console.log(`🟢 [IMPORT] SP ID ${product_id}: Tự động chuyển trạng thái "${currentStatus}" → "In Stock" (Tồn kho: ${newTotalQty})`);
                }

                await connection.query(
                    'UPDATE products SET quantity = ?, cost_price = ?, status = ? WHERE id = ?',
                    [newTotalQty, newCostPrice, newStatus, product_id]
                );
            }

            // Đổi trạng thái phiếu nhập thành Completed
            await connection.query('UPDATE import_receipts SET status = ? WHERE id = ?', ['Completed', id]);

            await connection.commit();
            res.status(200).json({ message: 'Hoàn tất phiếu nhập thành công. Đã cộng số lượng và cập nhật giá vốn!' });
        } catch (error) {
            await connection.rollback();
            console.error('Lỗi khi hoàn tất phiếu nhập:', error);
            if (error.message === 'NOT_FOUND') return res.status(404).json({ message: 'Không tìm thấy phiếu nhập' });
            if (error.message === 'INVALID_STATUS') return res.status(400).json({ message: 'Phiếu nhập không ở trạng thái Chờ xử lý' });
            res.status(500).json({ message: 'Lỗi server' });
        } finally {
            connection.release();
        }
    }
};

module.exports = importController;
