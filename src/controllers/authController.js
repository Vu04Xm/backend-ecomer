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
    forgotPassword: async (req, res) => {
        const { email } = req.body;
        try {
            // 1. Kiểm tra User có tồn tại không
            const user = await userModel.findByEmail(email);
            if (!user) {
                return res.status(404).json({ success: false, message: "Email không tồn tại trên hệ thống!" });
            }

            // 2. Tạo Token ngẫu nhiên (dài 40 ký tự)
            const resetToken = crypto.randomBytes(20).toString('hex');
            
            // 3. Thời gian hết hạn (15 phút)
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            // 4. Lưu vào bảng password_resets (Đã tạo ở SQL Bước 4)
            await pool.execute(
                'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
                [email, resetToken, expiresAt]
            );

            // 5. Gửi Email (Thay link frontend thật của bạn vào đây)
            const resetLink = `https://your-frontend-domain.com/reset-password?token=${resetToken}`;
            
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #d70018; text-align: center;">CELLPHONES - ĐẶT LẠI MẬT KHẨU</h2>
                    <p>Chào <b>${user.full_name}</b>,</p>
                    <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #d70018; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đổi mật khẩu ngay</a>
                    </div>
                    <p style="color: #666; font-size: 13px;">Link này sẽ hết hạn sau 15 phút. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
                    <hr style="border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 11px; color: #999;">Đây là email tự động, vui lòng không phản hồi.</p>
                </div>
            `;

            await sendEmail(email, "Yêu cầu đặt lại mật khẩu - Cellphones", htmlContent);

            res.status(200).json({ 
                success: true, 
                message: "Mã khôi phục đã được gửi vào Email của bạn. Vui lòng kiểm tra hộp thư!" 
            });

        } catch (error) {
            console.error("Forgot Password Error:", error);
            res.status(500).json({ success: false, message: "Lỗi gửi mail, vui lòng thử lại sau." });
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