const cartModel = require('../models/cartModel');

const cartController = {
    getCart: async (req, res) => {
        try {
            const data = await cartModel.getByUserId(req.params.userId);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    addItem: async (req, res) => {
    try {
        // 1. Lấy dữ liệu từ React (dùng đúng tên userId, productId)
        const { userId, productId, quantity } = req.body;

        // 2. Log để kiểm tra (Xóa sau khi chạy tốt)
        console.log("Dữ liệu từ Frontend:", req.body);

        // 3. Truyền dữ liệu vào Model theo đúng tên mà Model đang chờ (user_id, product_id)
        await cartModel.addToCart({
            user_id: userId,
            product_id: productId,
            quantity: quantity
        });

        res.status(201).json({ message: "Đã thêm vào giỏ hàng thành công!" });
    } catch (error) {
        console.error("Lỗi Controller:", error.message);
        res.status(500).json({ error: error.message });
    }
},

    updateItem: async (req, res) => {
        try {
            const { quantity } = req.body;
            await cartModel.updateQuantity(req.params.cartId, quantity);
            res.status(200).json({ message: "Đã cập nhật số lượng" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    deleteItem: async (req, res) => {
        try {
            await cartModel.removeFromCart(req.params.cartId);
            res.status(200).json({ message: "Đã xóa khỏi giỏ hàng" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = cartController;