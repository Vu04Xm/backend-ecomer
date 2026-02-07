const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2"
    },
    // Chốt chặn cuối cùng: Ép dùng IPv4 để hết lỗi ENETUNREACH
    family: 4 
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

        console.log(`--- Đang kết nối IPv4 tới Google để gửi thư ---`);
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email gửi thành công:", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Lỗi chi tiết Mailer:", error.message);
        throw error;
    }
};

module.exports = sendEmail;
