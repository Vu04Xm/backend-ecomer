const db = require('../configs/db');
const bcrypt = require('bcryptjs');

const userModel = {
    // 1. Lấy toàn bộ user (Sắp xếp ID mới nhất lên đầu)
    getAllUsers: async () => {
        const [rows] = await db.query('SELECT id, full_name, email, phone, role_id, status FROM users ORDER BY id DESC');    
        return rows;
    },

    // 2. Tìm bằng email (Dùng cho Login)
    findByEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    // 3. Tìm bằng ID (Dùng cho trang Profile)
    findById: async (id) => {
        const [rows] = await db.query('SELECT id, full_name, email, phone, role_id, status, avatar FROM users WHERE id = ?', [id]);
        return rows[0];
    },

    // 4. Tạo user mới (Register)
    createUser: async (userData) => {
        const { full_name, email, password, phone, role_id, status } = userData;
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, phone, role_id, status, password) VALUES (?, ?, ?, ?, ?, ?)', 
            [full_name, email, phone || null, role_id || 3, status || 'active', hashedPassword]
        );
        return result;
    },

    // 5. Cập nhật thông tin cá nhân (Họ tên, SĐT)
    updateProfile: async (id, full_name, phone) => {
        const query = 'UPDATE users SET full_name = ?, phone = ? WHERE id = ?';
        const [result] = await db.query(query, [full_name, phone, id]);
        return result;
    },

    // 6. Cập nhật mật khẩu mới
    updatePassword: async (id, newPassword) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        const query = 'UPDATE users SET password = ? WHERE id = ?';
        const [result] = await db.query(query, [hashedPassword, id]);
        return result;
    },

     findByPhone: async (phone) => {
        const [rows] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
        return rows[0];
    },
    // 7. Cập nhật tổng quát (Dùng cho Admin sửa thông tin HOẶC Khóa/Mở tài khoản)
    updateUser: async (id, userData) => {
        const { full_name, email, phone, role_id, status, password } = userData;
        
        // Tạo mảng động để build câu lệnh SQL tránh lỗi nếu thiếu dữ liệu
        let query = 'UPDATE users SET full_name = ?, email = ?, phone = ?, role_id = ?, status = ?';
        let params = [full_name, email, phone, role_id, status];

        // Nếu có gửi password mới (khi Admin reset pass) thì mới hash và cập nhật
        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        const [result] = await db.query(query, params);
        return result;
    },

    // 8. Xóa User (Vẫn giữ lại phòng khi bạn thực sự cần xóa cứng trong DB)
    deleteUser: async (id) => {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        return result;
    },

    // 9. Cập nhật Refresh Token
    updateRefreshToken: async (id, refreshToken) => {
        const query = 'UPDATE users SET refresh_token = ? WHERE id = ?';
        const [result] = await db.query(query, [refreshToken, id]);
        return result;
    },

    // 10. Tìm User bằng Refresh Token
    findByRefreshToken: async (refreshToken) => {
        const [rows] = await db.query('SELECT * FROM users WHERE refresh_token = ?', [refreshToken]);
        return rows[0];
    },
    // 11. Lưu mã OTP và thời gian hết hạn (5 phút)
    saveOTP: async (email, otp) => {
        const query = 'UPDATE users SET otp = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE email = ?';
        const [result] = await db.query(query, [otp, email]);
        return result;
    },
    // 12. Kiểm tra mã OTP và hạn dùng
    verifyOTP: async (email, otp) => {
        const query = 'SELECT id FROM users WHERE email = ? AND otp = ? AND otp_expiry > NOW()';
        const [rows] = await db.query(query, [email, otp]);
        return rows[0];
    },
    // 13. Xóa OTP sau khi sử dụng thành công
    clearOTP: async (email) => {
        const query = 'UPDATE users SET otp = NULL, otp_expiry = NULL WHERE email = ?';
        const [result] = await db.query(query, [email]);
        return result;
    }
};

module.exports = userModel;