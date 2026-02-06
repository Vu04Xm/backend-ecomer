const orderDetailModel = require('../models/orderDetailModel');

const orderDetailController = {
    getDetailsByOrder: async (req, res) => {
        try {
            const data = await orderDetailModel.getByOrderId(req.params.orderId);
            if (data.length === 0) {
                return res.status(404).json({ message: "Không tìm thấy chi tiết cho đơn hàng này" });
            }
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = orderDetailController;