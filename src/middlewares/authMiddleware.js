const jwt = require('jsonwebtoken');

// ────────────────────────────────────────────────────────────
// Middleware 1: Xác thực Access Token
// ────────────────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log("🔍 [DEBUG] Authorization Header received:", authHeader ? "YES (Bearer ...)" : "NO");
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: "Bạn chưa đăng nhập. Vui lòng gửi kèm Access Token!" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, role, email }
        next();
    } catch (error) {
        console.error("🚨 [AUTH ERROR] Token verification failed:", error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token đã hết hạn!", error: 'TokenExpiredError' });
        }
        return res.status(403).json({ message: `Token không hợp lệ! (${error.message})` });
    }
};

// ────────────────────────────────────────────────────────────
// Middleware 2: Kiểm tra Role (dùng sau verifyToken)
// Ví dụ dùng: verifyRole(1)         → chỉ Admin
//             verifyRole(1, 2)       → Admin + Staff
//             verifyRole(1, 2, 3)    → Tất cả roles
// ────────────────────────────────────────────────────────────
const verifyRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Chưa xác thực!" });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Bạn không có quyền thực hiện thao tác này!"
            });
        }

        next();
    };
};

module.exports = { verifyToken, verifyRole };