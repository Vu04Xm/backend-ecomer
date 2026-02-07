
const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * CẤU HÌNH TRANSPORTER - TỐI ƯU CHO RENDER
 * Sử dụng Port 587 và cấu hình chống Timeout
 */
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Bắt buộc false cho cổng 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        // Vượt qua lỗi xác thực và ép sử dụng phiên bản TLS an toàn
        rejectUnauthorized: false,
        minVersion: "TLSv1.2"
    },
    // Tăng thời gian chờ để tránh lỗi Connection Timeout trên server chậm
    connectionTimeout: 15000, 
    greetingTimeout: 15000,
    socketTimeout: 20000,
    // Ép sử dụng IPv4 để tránh lỗi ENETUNREACH do IPv6 trên Render
    dnsTimeout: 10000
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
            from: `"Cellphones Shop" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent
        };

        console.log(`--- Đang kết nối tới bưu điện Google để gửi thư tới: ${to} ---`);
        
        const info = await transporter.sendMail(mailOptions);
        
        console.log("✅ Email đã được gửi thành công:", info.messageId);
        return info;
    } catch (error) {
        // Log lỗi chi tiết này sẽ hiện trong tab Logs của Render
        console.error("❌ Lỗi chi tiết tại Mailer.js:", error.message);
        throw error;
    }
};

module.exports = sendEmail;