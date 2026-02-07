const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Chuyển sang cổng 465 (cổng bảo mật cao của Google)
    secure: true, // Phải là true nếu dùng cổng 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Thêm phần này để tránh lỗi timeout khi server phản hồi chậm
    connectionTimeout: 10000, // 10 giây
    greetingTimeout: 10000,
    socketTimeout: 10000
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

        // Log để theo dõi tiến trình trên Render
        console.log(`--- Đang thử gửi mail qua IPv4 tới: ${to} ---`);
        
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email gửi thành công!");
        return info;
    } catch (error) {
        console.error("❌ Lỗi Mailer:", error.message);
        throw error;
    }
};

module.exports = sendEmail;