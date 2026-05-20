const pool = require('../configs/db');

// GET /banners — Lấy tất cả banner đang active (cho Home)
exports.getActiveBanners = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
        );
        res.json(rows);
    } catch (err) {
        console.error('❌ getActiveBanners:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// GET /admin/banners — Lấy tất cả banner (admin/staff quản lý)
exports.getAllBanners = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM banners ORDER BY sort_order ASC, id ASC'
        );
        res.json(rows);
    } catch (err) {
        console.error('❌ getAllBanners:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// POST /admin/banners — Thêm banner mới
exports.createBanner = async (req, res) => {
    const { title, subtitle, image_url, link_url, badge_text, badge_color, is_active, sort_order } = req.body;
    if (!title || !image_url) {
        return res.status(400).json({ error: 'Tiêu đề và ảnh là bắt buộc' });
    }
    try {
        const [result] = await pool.execute(
            `INSERT INTO banners (title, subtitle, image_url, link_url, badge_text, badge_color, is_active, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, subtitle || null, image_url, link_url || null, badge_text || null, badge_color || 'red', is_active ?? 1, sort_order ?? 0]
        );
        const [newBanner] = await pool.execute('SELECT * FROM banners WHERE id = ?', [result.insertId]);
        res.status(201).json(newBanner[0]);
    } catch (err) {
        console.error('❌ createBanner:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// PUT /admin/banners/:id — Cập nhật banner
exports.updateBanner = async (req, res) => {
    const { id } = req.params;
    const { title, subtitle, image_url, link_url, badge_text, badge_color, is_active, sort_order } = req.body;
    try {
        await pool.execute(
            `UPDATE banners SET title=?, subtitle=?, image_url=?, link_url=?, badge_text=?, badge_color=?, is_active=?, sort_order=?
             WHERE id=?`,
            [title, subtitle || null, image_url, link_url || null, badge_text || null, badge_color || 'red', is_active ?? 1, sort_order ?? 0, id]
        );
        const [updated] = await pool.execute('SELECT * FROM banners WHERE id = ?', [id]);
        if (!updated.length) return res.status(404).json({ error: 'Không tìm thấy banner' });
        res.json(updated[0]);
    } catch (err) {
        console.error('❌ updateBanner:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// DELETE /admin/banners/:id — Xóa banner
exports.deleteBanner = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.execute('DELETE FROM banners WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy banner' });
        res.json({ success: true, message: 'Đã xóa banner' });
    } catch (err) {
        console.error('❌ deleteBanner:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// PATCH /admin/banners/:id/toggle — Bật/tắt banner nhanh
exports.toggleBanner = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.execute('UPDATE banners SET is_active = NOT is_active WHERE id = ?', [id]);
        const [updated] = await pool.execute('SELECT * FROM banners WHERE id = ?', [id]);
        res.json(updated[0]);
    } catch (err) {
        console.error('❌ toggleBanner:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};
