const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ────────────────────────────────────────────────────────────
// Helper: ký token
// ────────────────────────────────────────────────────────────
const signAccessToken = (user) =>
    jwt.sign(
        { id: user.id, role: user.role_id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );  

const signRefreshToken = (user) =>
    jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

// ────────────────────────────────────────────────────────────
// Helper: gắn refresh token cookie
// ────────────────────────────────────────────────────────────
const setRefreshCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    });
};

// ────────────────────────────────────────────────────────────
const authController = {

    // 1. LOGIN
    login: async (req, res) => {
        const { email, password } = req.body;
        try {
            const user = await userModel.findByEmail(email);
            if (!user) return res.status(404).json({ message: "Email không tồn tại" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ message: "Mật khẩu không đúng" });

            if (user.status !== 'active')
                return res.status(403).json({ message: "Tài khoản đã bị khóa" });

            const accessToken  = signAccessToken(user);
            const refreshToken = signRefreshToken(user);

            // Lưu Refresh Token vào DB
            await userModel.updateRefreshToken(user.id, refreshToken);

            // Gửi Refresh Token qua HttpOnly Cookie
            setRefreshCookie(res, refreshToken);

            return res.status(200).json({
                message: "Đăng nhập thành công",
                accessToken,
                user: {
                    id:        user.id,
                    full_name: user.full_name,
                    email:     user.email,
                    phone:     user.phone,
                    avatar:    user.avatar,
                    role:      user.role_id
                }
            });
        } catch (error) {
            return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
        }
    },

    // 2. REFRESH TOKEN (Refresh Token Rotation - Xoay vòng Token)
    refreshToken: async (req, res) => {
        const token = req.cookies.refreshToken;
        if (!token)
            return res.status(401).json({ message: "Chưa đăng nhập (Thiếu Refresh Token)" });

        try {
            // Bước 1: Kiểm tra token có trong DB không (chặn token đã bị thu hồi/logout)
            const user = await userModel.findByRefreshToken(token);
            if (!user)
                return res.status(403).json({ message: "Refresh Token không hợp lệ hoặc đã bị vô hiệu hóa" });

            // Bước 2: Xác thực chữ ký và hạn dùng
            const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

            // Bước 3: Cấp CẶP TOKEN MỚI (Rotation)
            const newAccessToken = signAccessToken(user);
            const newRefreshToken = signRefreshToken(user);

            // Bước 4: Cập nhật Refresh Token mới vào DB (ghi đè cái cũ)
            await userModel.updateRefreshToken(user.id, newRefreshToken);

            // Bước 5: Gửi Refresh Token mới qua HttpOnly Cookie
            setRefreshCookie(res, newRefreshToken);

            return res.status(200).json({ 
                accessToken: newAccessToken 
            });

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                // Xóa token hết hạn khỏi DB để bảo mật
                try {
                    const user = await userModel.findByRefreshToken(token);
                    if (user) await userModel.updateRefreshToken(user.id, null);
                } catch (_) {}
                res.clearCookie('refreshToken');
                return res.status(403).json({ message: "Refresh Token đã hết hạn, vui lòng đăng nhập lại" });
            }
            return res.status(403).json({ message: "Token không hợp lệ" });
        }
    },

    // 3. LOGOUT
    logout: async (req, res) => {
        try {
            const token = req.cookies.refreshToken;
            if (token) {
                const user = await userModel.findByRefreshToken(token);
                if (user) {
                    await userModel.updateRefreshToken(user.id, null);
                }
            }
            res.clearCookie('refreshToken');
            return res.status(200).json({ message: "Đăng xuất thành công" });
        } catch (error) {
            return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
        }
    }
};

module.exports = authController;