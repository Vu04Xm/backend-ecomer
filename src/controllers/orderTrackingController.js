const orderTrackingModel = require('../models/orderTrackingModel');

const orderTrackingController = {
    getTrackingHistory: async (req, res) => {
        try {
            const { orderId } = req.params;
            const history = await orderTrackingModel.getByOrderId(orderId);
            res.status(200).json(history);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = orderTrackingController;
