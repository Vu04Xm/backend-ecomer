const orderModel = require('../models/orderModel');
const orderDetailModel = require('../models/orderDetailModel');
const productModel = require('../models/productModel');
const cartModel = require('../models/cartModel');
const orderTrackingModel = require('../models/orderTrackingModel');
const walletModel = require('../models/walletModel');

const orderController = {
    // 1. Lấy TẤT CẢ đơn hàng (Dành cho Nhân viên/Admin)
    getAllOrders: async (req, res) => {
        try {
            const data = await orderModel.getAll();
            res.status(200).json(data);
        } catch (error) {
            console.error("LỖI LẤY TẤT CẢ ĐƠN HÀNG:", error.message);
            res.status(500).json({ message: "Lỗi Server", detail: error.message });
        }
    },

    // 1.5 Lấy chi tiết 1 đơn hàng (Cho trang Success/Lookup)
    getOrderById: async (req, res) => {
        try {
            const orderId = req.params.orderId;
            const data = await orderModel.getById(orderId);
            if (!data) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 2. Lấy đơn hàng của 1 người dùng
    getUserOrders: async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) return res.status(400).json({ error: "UserId không hợp lệ" });
            
            const data = await orderModel.getByUserId(userId);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 3. TẠO ĐƠN HÀNG MỚI (Xử lý đồng thời bảng orders và orderdetails)
    createOrder: async (req, res) => {
        try {
            const { userId, totalAmount, paymentMethod, address, customerName, phone, items: clientItems } = req.body; 

            console.log("--- BẮT ĐẦU TẠO ĐƠN HÀNG ---");
            console.log("Dữ liệu nhận được:", { userId, totalAmount, paymentMethod });

            // BƯỚC 0 (MỚI): Đọc giỏ hàng thật từ Database thay vì tin client
            const cartItems = await cartModel.getByUserId(userId);
            
            if (!cartItems || cartItems.length === 0) {
                console.warn("!!! CẢNH BÁO: Giỏ hàng trống trong DB!");
                return res.status(400).json({ error: "Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi đặt hàng." });
            }

            // Log so sánh client vs server để debug
            console.log(`==> So sánh: Client gửi ${clientItems?.length || 0} items, DB có ${cartItems.length} items`);
            if (clientItems && clientItems.length !== cartItems.length) {
                console.warn(`!!! MIS-MATCH: Client (${clientItems.length} items) ≠ Server (${cartItems.length} items)`);
                console.warn("   Client items:", clientItems.map(i => `ID:${i.id}`));
                console.warn("   Server items:", cartItems.map(i => `ID:${i.product_id}`));
            }

            // Hàm tính giá sau giảm (giống logic frontend)
            const getDiscountedPrice = (price, discount) => {
                const p = Number(price);
                const d = Number(discount);
                if (!d || d <= 0) return p;
                if (d > 100) return Math.max(0, p - d);
                return Math.max(0, p * (1 - d / 100));
            };

            // Tính items từ DB (nguồn tin cậy duy nhất)
            const serverItems = cartItems.map(item => ({
                id: item.product_id,
                cartQuantity: item.quantity,
                price: getDiscountedPrice(item.price, item.discount),
                cost_price: item.cost_price, // Lấy giá vốn từ DB
                name: item.name
            }));

            // Tính lại tổng tiền từ server (nguồn sống còn)
            const serverSubTotal = serverItems.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
            
            // Lấy phí ship từ client (nếu có) hoặc tính từ chênh lệch
            const clientTotal = Number(totalAmount) || 0;
            const estimatedShipping = Math.max(0, clientTotal - (Number(req.body.subTotal) || serverSubTotal));
            const finalServerTotal = serverSubTotal + estimatedShipping;

            console.log(`==> THỐNG KÊ TIỀN:`);
            console.log(`    - Server SubTotal: ${serverSubTotal}`);
            console.log(`    - Client Total: ${clientTotal}`);
            console.log(`    - Final Server Total (Sub+Ship): ${finalServerTotal}`);

            // BƯỚC A: Tạo đơn hàng chính vào bảng 'orders'
            // QUAN TRỌNG: Ép giá server tính được để tránh lỗi 33k/46k từ client
            // Chúng ta lấy phí ship từ client nếu nó hợp lý, nếu không mặc định 30k
            const reportedTotal = Number(totalAmount) || 0;
            const finalShipping = (reportedTotal > serverSubTotal) ? (reportedTotal - serverSubTotal) : 30000;
            const forcedTotal = serverSubTotal + finalShipping;

            console.log(`[ORDER_SAFEGUARD] Client sent: ${reportedTotal}, Server calculated: ${forcedTotal}`);

            const orderPayload = { 
                ...req.body, 
                totalAmount: forcedTotal 
            };
            
            const result = await orderModel.create(orderPayload);
            const newOrderId = result.insertId;
            console.log("✅ [ORDER_SAFEGUARD] Đơn hàng đã tạo với giá chuẩn:", forcedTotal);

            // BƯỚC B: Lưu chi tiết sản phẩm từ SERVER (DB) vào bảng 'orderdetails'
            console.log("==> Bước B: Đang lưu", serverItems.length, "sản phẩm vào orderdetails...");
            const detailPromises = serverItems.map(item => {
                console.log(`----> Đang lưu SP ID: ${item.id} (${item.name}), S/L: ${item.cartQuantity}, Giá: ${item.price}`);
                return orderDetailModel.create({
                    order_id: newOrderId,
                    product_id: item.id,
                    quantity: item.cartQuantity,
                    price_at_purchase: item.price,
                    cost_at_purchase: item.cost_price // Truyền giá vốn sang orderDetailModel
                });
            });
            await Promise.all(detailPromises);
            console.log("==> Bước B thành công!");

            // BƯỚC C: Làm sạch giỏ hàng của user
            if (userId) {
                try {
                    await cartModel.clearByUserId(userId);
                    console.log(`=> Đã xóa giỏ hàng của User ID: ${userId}`);
                } catch (clearErr) {
                    console.error(`!!! Lỗi xóa giỏ hàng User ${userId}:`, clearErr.message);
                    // Không throw - đơn hàng đã tạo thành công
                }
            }

            // BƯỚC D: Tạo bản ghi theo dõi đầu tiên
            await orderTrackingModel.create({
                order_id: newOrderId,
                status: 'Pending',
                description: 'Đơn hàng đã được đặt thành công và đang chờ duyệt.'
            });

            res.status(201).json({ 
                message: "Đặt hàng thành công!", 
                orderId: newOrderId 
            });
        } catch (error) {
            console.error("🚨 [ORDER ERROR] LỖI TẠI createOrder:");
            console.error("- Message:", error.message);
            console.error("- SQL Message:", error.sqlMessage);
            console.error("- SQL State:", error.sqlState);
            console.error("- Stack:", error.stack);
            
            res.status(500).json({ 
                error: "Lỗi tạo đơn hàng", 
                detail: error.message,
                sqlMessage: error.sqlMessage || "Không có thông tin SQL cụ thể"
            });
        }
    },

    // 4. HUỶ ĐƠN HÀNG (TH1) — chỉ Pending/Confirmed, auto refund nếu đã thanh toán
    cancelOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { reason, cancelledBy } = req.body; // cancelledBy: 'user'|'admin'|'staff'
            const actor = cancelledBy || (req.user?.role_id === 1 ? 'admin' : req.user?.role_id === 2 ? 'staff' : 'user');

            const order = await orderModel.getById(orderId);
            if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });

            // Chỉ cho hủy khi Pending hoặc Confirmed
            if (!['Pending', 'Confirmed'].includes(order.status)) {
                return res.status(400).json({ 
                    error: order.status === 'Shipping' 
                        ? 'Đơn hàng đang được giao, không thể huỷ!' 
                        : `Đơn hàng đã ${order.status}, không thể huỷ!` 
                });
            }

            // Cập nhật trạng thái + lý do hủy
            await orderModel.cancelWithReason(orderId, reason, actor);

            const staffName = req.user ? req.user.full_name || `Staff #${req.user.id}` : 'System';
            await orderTrackingModel.create({
                order_id: orderId,
                status: 'Cancelled',
                description: `Đơn hàng đã bị huỷ. Lý do: ${reason || 'Không rõ'}`,
                staff_id: req.user?.id || null,
                staff_name: staffName
            });

            // Nếu đã thanh toán qua PayOS hoặc phương thức khác có is_paid = 1 → hoàn tiền vào ví
            if (order.is_paid === 1) {
                await walletModel.addBalance(
                    order.user_id,
                    order.total_amount,
                    orderId,
                    `Hoàn tiền đơn #${orderId} (${reason || 'Huỷ đơn'})`
                );
                return res.json({ 
                    message: 'Huỷ đơn thành công. Tiền đã được hoàn vào ví của bạn!',
                    refunded: true,
                    amount: order.total_amount
                });
            }

            res.json({ message: 'Huỷ đơn hàng thành công!', refunded: false });
        } catch (e) {
            console.error('cancelOrder error:', e);
            res.status(500).json({ error: e.message });
        }
    },

    // 5. THAY ĐỔI TRẠNG THÁI & TRỪ KHO (TH5: lưu staff thực hiện)
    changeStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const { orderId } = req.params;

            // 1. Kiểm tra đơn hàng có tồn tại không
            const currentOrder = await orderModel.getById(orderId);
            if (!currentOrder) return res.status(404).json({ error: "Không tìm thấy đơn hàng" });

            // 2. Chặn nếu đơn đã giao xong (tránh trừ kho 2 lần)
            if (currentOrder.status === 'Delivered') {
                return res.status(400).json({ error: "Đơn hàng này đã hoàn tất giao hàng rồi!" });
            }

            // 3. Cập nhật trạng thái mới trong DB
            await orderModel.updateStatus(orderId, status);
            console.log(`=> Đã chuyển đơn #${orderId} sang trạng thái: ${status}`);
            
            // 4. LOGIC TRỪ KHO: Chỉ chạy khi chuyển trạng thái thành 'Delivered'
            if (status === 'Delivered') {
                console.log(`=> Đang xử lý trừ kho cho đơn #${orderId}...`);
                
                // Lấy danh sách sản phẩm từ bảng orderdetails
                const items = await orderModel.getOrderItems(orderId); 

                if (items && items.length > 0) {
                    const stockUpdatePromises = items.map(item => {
                        // Gọi hàm giảm số lượng ở productModel
                        return productModel.reduceStock(item.product_id, item.quantity);
                    });

                    await Promise.all(stockUpdatePromises);
                    console.log(`=> KẾT QUẢ: Đã trừ kho thành công cho các sản phẩm của đơn #${orderId}`);
                } else {
                    console.error(`=> THẤT BẠI: Không tìm thấy sản phẩm nào trong orderdetails của đơn #${orderId} để trừ kho!`);
                }
            }

            // 5. Thêm bản ghi theo dõi + TH5: lưu nhân viên thực hiện
            const statusDescriptions = {
                'Confirmed': 'Đơn hàng đã được xác nhận.',
                'Shipping': 'Đơn hàng đã được bàn giao cho đơn vị vận chuyển.',
                'Delivered': 'Sản phẩm đã được giao thành công.',
                'Cancelled': 'Đơn hàng đã bị hủy bỏ.'
            };

            const performingStaff = req.user ? req.user.full_name || `Staff #${req.user.id}` : 'System';
            await orderTrackingModel.create({
                order_id: orderId,
                status: status,
                description: statusDescriptions[status] || `Trạng thái: ${status}`,
                staff_id: req.user?.id || null,
                staff_name: performingStaff
            });

            res.status(200).json({ 
                message: `Cập nhật đơn #${orderId} thành ${status} thành công`,
                isStockReduced: status === 'Delivered'
            });

        } catch (error) {
            console.error("🚨 [STATUS ERROR] LỖI TẠI changeStatus:", error);
            res.status(500).json({ 
                error: "Lỗi cập nhật trạng thái", 
                detail: error.message 
            });
        }
    }
};

module.exports = orderController;