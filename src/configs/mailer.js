const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Cấu hình Transporter - "Nhân viên bưu điện"
 * Sử dụng Gmail Service và thông tin từ file .env
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587, // Đổi từ 465 sang 587
    secure: false, // Cổng 587 thì secure phải là false
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Thêm dòng này để bỏ qua lỗi chứng chỉ nếu có
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