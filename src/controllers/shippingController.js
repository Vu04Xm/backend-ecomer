const ghnService = require('../services/ghnService');

const shippingController = {
    getProvinces: async (req, res) => {
        try {
            const data = await ghnService.getProvinces();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi lấy danh sách tỉnh thành", error: error.message });
        }
    },

    getDistricts: async (req, res) => {
        try {
            const { provinceId } = req.params;
            const data = await ghnService.getDistricts(parseInt(provinceId));
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi lấy danh sách quận huyện", error: error.message });
        }
    },

    getWards: async (req, res) => {
        try {
            const { districtId } = req.params;
            const data = await ghnService.getWards(parseInt(districtId));
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi lấy danh sách phường xã", error: error.message });
        }
    },

    calculateFee: async (req, res) => {
        try {
            const fee = await ghnService.calculateFee(req.body);
            res.status(200).json({ fee });
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi tính phí vận chuyển", error: error.message });
        }
    }
};

module.exports = shippingController;
