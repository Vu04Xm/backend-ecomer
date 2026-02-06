const userModel = require('../models/userModel');
const db = require('../configs/db'); 
const bcrypt = require('bcryptjs');

const userController = {
    // 1. Lấy thông tin cá nhân của chính mình (Dùng cho trang Profile/Home)
    getMe: async (req, res) => {
        try {
            // req.user được lấy từ token thông qua middleware verifyToken
            const userId = req.user.id; 
            const user = await userModel.findById(userId);
            
            if (!user) {
                return res.status(404).json({ message: "Không tìm thấy người dùng" });
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 2. Đăng ký tài khoản (Dành cho người dùng mới)
 register: async (req, res) => {
    try {
        // 1. Lấy dữ liệu từ req.body
        const { full_name, email, password, phone } = req.body;

        // 2. Kiểm tra đầy đủ các trường bắt buộc
        if (!full_name || !email || !password || !phone) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
        }

        // 3. Kiểm tra định dạng SĐT: Bắt đầu bằng 02, 03, 09 và đủ 10 số
        const phoneRegex = /^(02|03|09)[0-9]{8}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ 
                message: "Số điện thoại không hợp lệ! Phải bắt đầu bằng 02, 03 hoặc 09 và đủ 10 chữ số." 
            });
        }

        // 4. Kiểm tra trùng Email
        const existingEmail = await userModel.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ message: "Email này đã được sử dụng!" });
        }

        // 5. Kiểm tra trùng Số điện thoại (QUAN TRỌNG)
        const existingPhone = await userModel.findByPhone(phone);
        if (existingPhone) {
            return res.status(400).json({ message: "Số điện thoại này đã được đăng ký cho một tài khoản khác!" });
        }

        // 6. Thực hiện tạo User sau khi đã vượt qua các lớp validate
        await userModel.createUser({ 
            full_name, 
            email, 
            password, 
            phone,
            role_id: 3, 
            status: 'Active' 
        });

        res.status(201).json({ message: "Đăng ký tài khoản thành công!" });

    } catch (error) {
        console.error("Lỗi Register:", error);
        res.status(500).json({ error: error.message });
    }
},

    // 3. Cập nhật hồ sơ (Dùng cho trang Profile - Tên & SĐT)
    updateProfile: async (req, res) => {
        const userId = req.params.id;
        const { full_name, phone } = req.body;

        try {
            const result = await userModel.updateProfile(userId, full_name, phone);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Không tìm thấy người dùng" });
            }
            res.status(200).json({ message: "Cập nhật hồ sơ thành công!" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 4. Đổi mật khẩu (Dùng cho trang Profile)
    changePassword: async (req, res) => {
        const userId = req.params.id;
        const { oldPassword, newPassword } = req.body;

        try {
            // Lấy mật khẩu hiện tại trong DB để đối chiếu
            const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
            if (rows.length === 0) return res.status(404).json({ message: "User không tồn tại" });

            const isMatch = await bcrypt.compare(oldPassword, rows[0].password);
            if (!isMatch) return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });

            await userModel.updatePassword(userId, newPassword);
            res.status(200).json({ message: "Đổi mật khẩu thành công!" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 5. Lấy toàn bộ danh sách (Dành cho Admin)
    fetchUsers: async (req, res) => {
        try {
            const users = await userModel.getAllUsers();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: "Lỗi lấy dữ liệu", error: error.message });
        }
    },

    // 6. Admin thêm User mới
    addUser: async (req, res) => {
        try {
            const result = await userModel.createUser(req.body); 
            res.status(201).json({
                message: "Thêm người dùng thành công!",
                userId: result.insertId
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 7. Admin sửa thông tin User bất kỳ
    editUser: async (req, res) => {
        try {
            const userId = req.params.id;
            const result = await userModel.updateUser(userId, req.body);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Không tìm thấy người dùng để cập nhật" });
            }
            res.status(200).json({ message: "Cập nhật thông tin thành công!" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 8. Xóa người dùng (Admin)
    removeUser: async (req, res) => {
        try {
            const result = await userModel.deleteUser(req.params.id);
            if (result.affectedRows === 0) return res.status(404).json({ message: "Người dùng không tồn tại!" });
            res.status(200).json({ message: "Xóa thành công!" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = userController;