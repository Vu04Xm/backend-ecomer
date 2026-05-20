const userModel = require('../models/userModel');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Cấu hình Nodemailer bằng .env
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const passwordController = {
    // 1. Gửi mã OTP
    forgotPassword: async (req, res) => {
        const { email } = req.body;
        try {
            const user = await userModel.findByEmail(email);
            if (!user) {
                return res.status(404).json({ message: "Email không tồn tại trong hệ thống" });
            }

            // Tạo mã OTP 6 chữ số
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            await userModel.saveOTP(email, otp);

            // Gửi mail
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Mã xác thực khôi phục mật khẩu - E-Comer',
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
                        <h2 style="color: #1e40af; text-align: center;">Mã Xác Thực OTP</h2>
                        <p>Chào bạn,</p>
                        <p>Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản tại <b>E-Comer</b>. Đây là mã OTP của bạn:</p>
                        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 12px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #1e40af;">${otp}</span>
                        </div>
                        <p style="color: #ef4444; font-size: 14px; text-align: center;">Mã này sẽ hết hạn sau 5 phút.</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #64748b; text-align: center;">Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email này.</p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);

            return res.status(200).json({ message: "Mã OTP đã được gửi tới email của bạn" });
        } catch (error) {
            return res.status(500).json({ message: "Lỗi hệ thống khi gửi mail", error: error.message });
        }
    },

    // 2. Kiểm tra OTP (Chỉ kiểm tra, không đổi pass)
    verifyOtpOnly: async (req, res) => {
        const { email, otp } = req.body;
        try {
            const isValid = await userModel.verifyOTP(email, otp);
            if (!isValid) {
                return res.status(400).json({ message: "Mã OTP không đúng hoặc đã hết hạn" });
            }
            return res.status(200).json({ message: "Xác thực OTP thành công" });
        } catch (error) {
            return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
        }
    },

    // 3. Kiểm tra OTP và đổi mật khẩu
    resetPassword: async (req, res) => {
        const { email, otp, newPassword } = req.body;
        try {
            const isValid = await userModel.verifyOTP(email, otp);
            if (!isValid) {
                return res.status(400).json({ message: "Mã OTP không đúng hoặc đã hết hạn" });
            }

            // Cập nhật mật khẩu mới
            await userModel.updatePassword(isValid.id, newPassword);
            
            // Xóa mã OTP sau khi đổi thành công
            await userModel.clearOTP(email);

            return res.status(200).json({ message: "Cập nhật mật khẩu mới thành công" });
        } catch (error) {
            return res.status(500).json({ message: "Lỗi hệ thống khi đặt lại mật khẩu", error: error.message });
        }
    }
};

module.exports = passwordController;
