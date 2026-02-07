const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Thư viện tạo mã ngẫu nhiên (có sẵn trong Node)
const pool = require('../configs/db'); // Kết nối DB để lưu token
const sendEmail = require('../configs/mailer'); // File gửi mail ở Bước 3

const authController = {
    // --- GIỮ NGUYÊN LOGIN CỦA BẠN VÀ TỐI ƯU BẢO MẬT ---
    login: async (req, res) => {
        const { email, password } = req.body;
        try {
            const user = await userModel.findByEmail(email);
            if (!user) {
                return res.status(404).json({ message: "Email không tồn tại" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Mật khẩu không đúng" });
            }

            if (user.status !== 'active') {
                return res.status(403).json({ message: "Tài khoản đã bị khóa" });
            }

            // Dùng SECRET từ .env đã set trên Render
            const token = jwt.sign(
                { id: user.id, role: user.role_id }, 
                process.env.JWT_SECRET || 'BI_MAT_CUA_BAN', 
                { expiresIn: '15m' }
            );

            res.status(200).json({
                message: "Đăng nhập thành công",
                token,
                user: { 
                    id: user.id, 
                    full_name: user.full_name, 
                    email: user.email,
                    phone: user.phone,
                    role: user.role_id,
                    status: user.status
                }
            });
        } catch (error) {
            console.error("Login Error:", error);
            res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
        }
    },

    // --- BƯỚC 4: THÊM HÀM QUÊN MẬT KHẨU ---
   // Sửa tạm để test mail
forgotPassword: async (req, res) => {
    const { email } = req.body;
    try {
        // Bỏ qua check user, gửi thẳng mail tới email nhập vào
        await sendEmail(email, "Test Mail", "<h1>Chào bạn, đây là mail test!</h1>");
        res.status(200).json({ success: true, message: "Mail test đã gửi!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
},
    resetPassword: async (req, res) => {
        const { token, newPassword } = req.body;
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
                [token]
            );
            if (rows.length === 0) return res.status(400).json({ message: "Token không hợp lệ hoặc hết hạn" });

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await pool.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, rows[0].email]);
            await pool.execute('DELETE FROM password_resets WHERE email = ?', [rows[0].email]);

            res.status(200).json({ success: true, message: "Mật khẩu đã được cập nhật!" });
        } catch (error) {
            res.status(500).json({ message: "Lỗi hệ thống" });
        }
    }
};

module.exports = authController;