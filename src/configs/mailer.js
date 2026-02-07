const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Cấu hình Transporter - "Nhân viên bưu điện"
 * Sử dụng Gmail Service và thông tin từ file .env
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Sử dụng SSL
    auth: {
        user: process.env.EMAIL_USER, // Email của shop (ví dụ: shop@gmail.com)
        pass: process.env.EMAIL_PASS  // Mật khẩu ứng dụng 16 ký tự bạn đã lấy
    }
});

/**
 * Hàm gửi Email dùng chung
 * @param {string} to - Email người nhận (khách hàng)
 * @param {string} subject - Tiêu đề thư
 * @param {string} htmlContent - Nội dung thư dạng HTML (để hiển thị nút bấm, màu sắc)
 */
const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: `"Cellphones Shop" <${process.env.EMAIL_USER}>`, // Hiển thị tên cửa hàng
            to: to,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email đã được gửi thành công:", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Lỗi chi tiết tại Mailer.js:", error.message);
        throw error;
    }
};

module.exports = sendEmail;