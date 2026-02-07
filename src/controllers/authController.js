const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
const pool = require('../configs/db'); 


const authController = {
    // 1. LOGIN (GIỮ NGUYÊN)
    login: async (req, res) => {
        const { email, password } = req.body;
        try {
            const user = await userModel.findByEmail(email);
            if (!user) return res.status(404).json({ message: "Email không tồn tại" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ message: "Mật khẩu không đúng" });

            if (user.status !== 'active') return res.status(403).json({ message: "Tài khoản đã bị khóa" });

            const token = jwt.sign(
                { id: user.id, role: user.role_id }, 
                process.env.JWT_SECRET || 'BI_MAT_CUA_BAN', 
                { expiresIn: '15m' }
            );

            res.status(200).json({
                message: "Đăng nhập thành công",
                token,
                user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role_id }
            });
        } catch (error) {
            res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
        }
    }

    // 2. FORGOT PASSWORD (ĐÃ BẪY LỖI CHI TIẾT)

    // 3. RESET PASSWORD (ĐÃ TỐI ƯU)
   
};

module.exports = authController;