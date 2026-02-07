const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
const pool = require('../configs/db'); 
const sendEmail = require('../configs/mailer'); 

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
    },

    // 2. FORGOT PASSWORD (ĐÃ BẪY LỖI CHI TIẾT)
    forgotPassword: async (req, res) => {
        const { email } = req.body;
        console.log("--- Bắt đầu quy trình quên mật khẩu cho:", email);

        try {
            // CASE 1: Kiểm tra User trong Database
            const user = await userModel.findByEmail(email);
            if (!user) {
                return res.status(404).json({ success: false, message: "Lỗi: Email này chưa đăng ký tài khoản!" });
            }

            const resetToken = crypto.randomBytes(20).toString('hex');
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            // CASE 2: Bẫy lỗi Database
            try {
                await pool.execute(
                    'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
                    [email, resetToken, expiresAt]
                );
            } catch (dbError) {
                console.error("❌ Lỗi DB:", dbError.message);
                return res.status(500).json({ success: false, message: "Lỗi Database: " + dbError.message });
            }

            // Link này khách sẽ bấm vào ở mail
            const resetLink = `https://your-frontend-domain.com/reset-password?token=${resetToken}`;
            const htmlContent = `
                <div style="font-family: Arial; padding: 20px; border: 1px solid #ddd;">
                    <h2 style="color: #d70018;">Cellphones - Đặt lại mật khẩu</h2>
                    <p>Chào ${user.full_name}, nhấn vào nút dưới để đổi mật khẩu:</p>
                    <a href="${resetLink}" style="background: #d70018; color: white; padding: 10px; text-decoration: none;">Đổi mật khẩu</a>
                </div>`;

            // CASE 3: Bẫy lỗi gửi Mail (Thường là sai App Password)
            try {
                await sendEmail(email, "Yêu cầu đặt lại mật khẩu", htmlContent);
                res.status(200).json({ success: true, message: "Thành công! Đã gửi mã vào Email của bạn." });
            } catch (mailError) {
                console.error("❌ Lỗi Nodemailer:", mailError.message);
                return res.status(500).json({ 
                    success: false, 
                    message: "Lỗi bưu điện: Google từ chối gửi mail. Hãy check App Password! Chi tiết: " + mailError.message 
                });
            }

        } catch (error) {
            console.error("❌ Lỗi hệ thống:", error);
            res.status(500).json({ success: false, message: "Lỗi không xác định: " + error.message });
        }
    },

    // 3. RESET PASSWORD (ĐÃ TỐI ƯU)
    resetPassword: async (req, res) => {
        const { token, newPassword } = req.body;
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
                [token]
            );

            if (rows.length === 0) {
                return res.status(400).json({ success: false, message: "Mã xác nhận không đúng hoặc đã hết hạn!" });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await pool.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, rows[0].email]);
            await pool.execute('DELETE FROM password_resets WHERE email = ?', [rows[0].email]);

            res.status(200).json({ success: true, message: "Chúc mừng! Mật khẩu đã được cập nhật." });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi khi đổi mật khẩu: " + error.message });
        }
    }
};

module.exports = authController;