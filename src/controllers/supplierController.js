const pool = require('../configs/db');

const supplierController = {
    // 1. Lấy danh sách nhà cung cấp
    getAllSuppliers: async (req, res) => {
        try {
            const [suppliers] = await pool.query('SELECT * FROM suppliers ORDER BY id DESC');
            res.status(200).json(suppliers);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách nhà cung cấp:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    // 2. Lấy chi tiết nhà cung cấp
    getSupplierById: async (req, res) => {
        try {
            const { id } = req.params;
            const [suppliers] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
            if (suppliers.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
            }
            res.status(200).json(suppliers[0]);
        } catch (error) {
            console.error('Lỗi khi lấy nhà cung cấp:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    // 3. Thêm nhà cung cấp
    createSupplier: async (req, res) => {
        try {
            const { name, phone, address, status } = req.body;
            if (!name) {
                return res.status(400).json({ message: 'Tên nhà cung cấp là bắt buộc' });
            }

            const [result] = await pool.query(
                'INSERT INTO suppliers (name, phone, address, status) VALUES (?, ?, ?, ?)',
                [name, phone, address, status || 'Active']
            );

            res.status(201).json({
                message: 'Thêm nhà cung cấp thành công',
                supplierId: result.insertId
            });
        } catch (error) {
            console.error('Lỗi khi thêm nhà cung cấp:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    // 4. Cập nhật nhà cung cấp
    updateSupplier: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, phone, address, status } = req.body;

            const [result] = await pool.query(
                'UPDATE suppliers SET name = ?, phone = ?, address = ?, status = ? WHERE id = ?',
                [name, phone, address, status, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
            }

            res.status(200).json({ message: 'Cập nhật thành công' });
        } catch (error) {
            console.error('Lỗi khi cập nhật nhà cung cấp:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },

    // 5. Xóa nhà cung cấp
    deleteSupplier: async (req, res) => {
        try {
            const { id } = req.params;
            // Kiểm tra xem nhà cung cấp này đã có phiếu nhập nào chưa
            const [imports] = await pool.query('SELECT id FROM import_receipts WHERE supplier_id = ? LIMIT 1', [id]);
            if (imports.length > 0) {
                return res.status(400).json({ message: 'Không thể xóa nhà cung cấp đã có giao dịch nhập hàng. Vui lòng chuyển trạng thái sang Inactive.' });
            }

            const [result] = await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
            }

            res.status(200).json({ message: 'Xóa thành công' });
        } catch (error) {
            console.error('Lỗi khi xóa nhà cung cấp:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
};

module.exports = supplierController;
