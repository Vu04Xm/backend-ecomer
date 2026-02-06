const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // 1. Lấy chuỗi Authorization từ Header gửi lên
    const authHeader = req.headers['authorization'];
    
    // 2. Token thường có dạng: "Bearer chuoi_token_cua_ban"
    // Ta dùng split(' ') để lấy phần chuỗi sau chữ 'Bearer'
    const token = authHeader && authHeader.split(' ')[1];

    // 3. Nếu không có token, báo lỗi ngay
    if (!token) {
        return res.status(401).json({ message: "Bạn chưa đăng nhập. Vui lòng gửi kèm Token!" });
    }

    try {
        // 4. Kiểm tra token có đúng không (Sử dụng Secret Key đã dùng ở authController)
        const decoded = jwt.verify(token, 'BI_MAT_CUA_BAN');
        
        // 5. Nếu đúng, lưu thông tin user vào đối tượng req để các hàm sau sử dụng
        req.user = decoded;
        
        // 6. Cho phép đi tiếp vào Controller
        next();
    } catch (error) {
        // Nếu token hết hạn hoặc sai lệch
        return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    }
};

module.exports = verifyToken;