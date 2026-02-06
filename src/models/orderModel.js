const db = require('../configs/db');

const orderModel = {
    // 1. Lấy TẤT CẢ đơn hàng chưa hoàn tất (Dành cho Admin xử lý)
    getAll: async () => {
        try {
            const query = `
                SELECT 
                    o.*, 
                    u.full_name as customer_name 
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id 
                WHERE o.status NOT IN ('Delivered', 'Cancelled')
                ORDER BY o.created_at DESC
            `;
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            console.error("!!! LỖI TẠI MODEL getAll:", error.message);
            throw error;
        }
    },

    // 2. Lấy đơn hàng theo ID (Dùng order_id làm khóa chính)
    getById: async (orderId) => {
        const query = "SELECT * FROM orders WHERE order_id = ?";
        const [rows] = await db.query(query, [orderId]);
        return rows.length > 0 ? rows[0] : null;
    },

    // 3. Lấy lịch sử đơn hàng đã xong hoặc đã hủy
    getHistory: async () => {
        const query = `
            SELECT o.*, u.full_name as customer_name 
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id 
            WHERE o.status IN ('Delivered', 'Cancelled')
            ORDER BY o.created_at DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // 4. Lấy danh sách sản phẩm trong đơn hàng (Cực kỳ quan trọng để trừ kho)
    getOrderItems: async (orderId) => {
        // Lấy product_id và quantity từ bảng chi tiết
        const query = "SELECT product_id, quantity FROM orderdetails WHERE order_id = ?"; 
        const [rows] = await db.query(query, [orderId]);
        return rows;
    },

    // 5. Lấy danh sách đơn hàng của 1 người dùng cụ thể
    getByUserId: async (userId) => {
        const [rows] = await db.query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', 
            [userId]
        );
        return rows;
    },

    // 6. Tạo đơn hàng mới (Bảng orders)
    create: async (data) => {
        const { userId, totalAmount, paymentMethod, address, customerName, phone } = data;
        // Gộp thông tin người nhận vào một cột shipping_address nếu DB của bạn thiết kế vậy
        const fullShippingInfo = `Người nhận: ${customerName} | SĐT: ${phone} | ĐC: ${address}`;

        const query = `
            INSERT INTO orders (user_id, total_amount, payment_method, status, shipping_address) 
            VALUES (?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(query, [
            userId,          
            totalAmount,     
            paymentMethod,   
            'Pending',       
            fullShippingInfo 
        ]);
        
        return result;
    },

    // 7. Cập nhật trạng thái đơn hàng (Có ràng buộc logic)
    updateStatus: async (orderId, newStatus) => {
        // Lấy trạng thái hiện tại để kiểm tra logic
        const [rows] = await db.query('SELECT status FROM orders WHERE order_id = ?', [orderId]);
        if (rows.length === 0) throw new Error("Đơn hàng không tồn tại!");

        const currentStatus = rows[0].status;

        // Trọng số quy trình
        const priority = {
            'Pending': 1,
            'Confirmed': 2,
            'Shipping': 3,
            'Delivered': 4,
            'Cancelled': 0 
        };

        const currentP = priority[currentStatus];
        const newP = priority[newStatus];

        // --- RÀNG BUỘC LOGIC ---
        // Không cho phép sửa nếu đã xong hoặc đã hủy
        if (currentStatus === 'Delivered' || currentStatus === 'Cancelled') {
            throw new Error(`Đơn hàng đã ${currentStatus === 'Delivered' ? 'hoàn tất' : 'bị hủy'}, không thể thay đổi.`);
        }

        if (newStatus === 'Cancelled') {
            if (currentP > 2) throw new Error("Đơn hàng đang giao, không thể hủy!");
        } else {
            // Chặn đi lùi quy trình
            if (newP < currentP) {
                throw new Error(`Không thể chuyển ngược từ ${currentStatus} về ${newStatus}!`);
            }
            // Chặn nhảy bước quá xa (ví dụ từ Pending nhảy thẳng lên Delivered)
            if (newP > currentP + 1) {
                throw new Error(`Phải chuyển trạng thái theo trình tự. Hiện tại là: ${currentStatus}`);
            }
        }

        // --- THỰC THI ---
        const [result] = await db.query(
            'UPDATE orders SET status = ? WHERE order_id = ?',
            [newStatus, orderId]
        );

        return result;
    }
};

module.exports = orderModel;