const orderModel = require('../models/orderModel');
const orderDetailModel = require('../models/orderDetailModel');
const productModel = require('../models/productModel');
const cartModel = require('../models/cartModel');

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
            const { userId, items, totalAmount } = req.body; 

            console.log("--- BẮT ĐẦU TẠO ĐƠN HÀNG ---");
            console.log("Dữ liệu nhận được:", { userId, totalItems: items?.length, totalAmount });

            // BƯỚC A: Tạo đơn hàng chính vào bảng 'orders'
            const result = await orderModel.create(req.body);
            const newOrderId = result.insertId;

            // BƯỚC B: Lưu chi tiết sản phẩm vào bảng 'orderdetails'
            // Nếu Frontend gửi mảng 'items', chúng ta sẽ lặp để lưu từng món
            if (items && items.length > 0) {
                const detailPromises = items.map(item => {
                    return orderDetailModel.create({
                        order_id: newOrderId,
                        product_id: item.id,
                        quantity: item.cartQuantity,
                        price_at_purchase: item.price
                    });
                });
                await Promise.all(detailPromises);
                console.log(`=> Đã lưu thành công ${items.length} món vào orderdetails cho đơn #${newOrderId}`);
            } else {
                console.warn("!!! CẢNH BÁO: Đơn hàng được tạo nhưng không có sản phẩm kèm theo (items rỗng)");
            }

            // BƯỚC C: Làm sạch giỏ hàng của user
            if (userId) {
                await cartModel.clearByUserId(userId);
                console.log(`=> Đã xóa giỏ hàng của User ID: ${userId}`);
            }

            res.status(201).json({ 
                message: "Đặt hàng thành công!", 
                orderId: newOrderId 
            });
        } catch (error) {
            console.error("LỖI NGHIÊM TRỌNG TẠI createOrder:", error.message);
            res.status(500).json({ error: error.message });
        }
    },

    // 4. THAY ĐỔI TRẠNG THÁI & TRỪ KHO
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

            res.status(200).json({ 
                message: `Cập nhật đơn #${orderId} thành ${status} thành công`,
                isStockReduced: status === 'Delivered'
            });

        } catch (error) {
            console.error("LỖI TẠI changeStatus:", error.message);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = orderController;