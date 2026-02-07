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
    // GIẢI PHÁP QUAN TRỌNG NHẤT: Ép sử dụng IPv4 
    // giúp sửa lỗi ENETUNREACH (Mạng không thể kết nối IPv6)
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