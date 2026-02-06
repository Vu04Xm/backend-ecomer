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
            const { rating } = req.body;
            if (rating < 1 || rating > 5) {
                return res.status(400).json({ message: "Số sao phải từ 1 đến 5" });
            }
            await reviewModel.create(req.body);
            res.status(201).json({ message: "Đánh giá của bạn đã được gửi!" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = reviewController;