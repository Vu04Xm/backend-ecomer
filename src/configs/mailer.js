const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const data = await resend.emails.send({
            from: 'Cellphones <onboarding@resend.dev>', // Resend cho phép dùng mail này để test
            to: to,
            subject: subject,
            html: htmlContent,
        });
        return data;
    } catch (error) {
        console.error("❌ Lỗi API Resend:", error);
        throw error;
    }
};

module.exports = sendEmail;