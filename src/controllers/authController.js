const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = {
    login: async (req, res) => {

        const { email, password } = req.body;
        try {
            // 1. Kiểm tra User tồn tại
            const user = await userModel.findByEmail(email);
            if (!user) {
                return res.status(404).json({ message: "Email không tồn tại" });
            }

            // 2. Kiểm tra mật khẩu (Sử dụng bcrypt để so sánh mật khẩu hash)
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Mật khẩu không đúng" });
            }

            // 3. Kiểm tra trạng thái tài khoản (Nếu cần)
            if (user.status !== 'active') {
                return res.status(403).json({ message: "Tài khoản đã bị khóa" });
            }

            // 4. Tạo Token (Thời hạn 1 ngày)
            // Lưu ý: 'BI_MAT_CUA_BAN' nên để trong file .env (ví dụ: process.env.JWT_SECRET)
            const token = jwt.sign(
                { id: user.id, role: user.role_id }, 
                'BI_MAT_CUA_BAN', 
                { expiresIn: '1d' }
            );

            // 5. Trả về dữ liệu
            // Quan trọng: Trả về full_name để Frontend hiện "Xin chào, [Tên]"
            res.status(200).json({
                message: "Đăng nhập thành công",
                token,
                user: { 
        id: user.id, 
        full_name: user.full_name, 
        email: user.email,
        phone: user.phone, // Dòng này sẽ đẩy dữ liệu từ DB sang Frontend
        role: user.role_id,
        status: user.status
    }
            });
        } catch (error) {
            console.error("Login Error:", error);
            res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
        }
    }
};

module.exports = authController;