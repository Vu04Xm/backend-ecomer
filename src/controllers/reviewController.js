const reviewModel = require('../models/reviewModel');

const reviewController = {
    getProductReviews: async (req, res) => {
        try {
            const data = await reviewModel.getByProductId(req.params.productId);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    addReview: async (req, res) => {
        try {
            const { product_id, rating, comment } = req.body;
            const user_id = req.user.id; 

            // Kiểm tra mua hàng trước khi cho phép đánh giá
            const hasPurchased = await reviewModel.checkPurchase(user_id, product_id);
            if (!hasPurchased) {
                return res.status(403).json({ message: "Bạn chỉ có thể đánh giá sản phẩm sau khi đã nhận được hàng!" });
            }

            if (!product_id || !rating) {
                return res.status(400).json({ message: "Thiếu thông tin đánh giá" });
            }

            if (rating < 1 || rating > 5) {
                return res.status(400).json({ message: "Số sao phải từ 1 đến 5" });
            }

            await reviewModel.create({ product_id, user_id, rating, comment });
            res.status(201).json({ message: "Đánh giá của bạn đã được gửi!" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    checkCanReview: async (req, res) => {
        try {
            const user_id = req.user.id;
            const { productId } = req.params;
            const canReview = await reviewModel.checkPurchase(user_id, productId);
            res.status(200).json({ canReview });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = reviewController;