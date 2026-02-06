const promotionModel = require('../models/promotionModel');

const promotionController = {
    // 1. Lấy danh sách
    getPromotions: async (req, res) => {
        try {
            const data = await promotionModel.getAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 2. Xóa khuyến mãi
    deletePromotion: async (req, res) => {
        try {
            const { id } = req.params;
            await promotionModel.delete(id);
            res.status(200).json({ message: "Xóa thành công" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 3. Kiểm tra Voucher
   checkVoucher: async (req, res) => {
    try {
        // IN RA ĐỂ XEM FRONTEND GỬI GÌ LÊN
        console.log("Body nhận được từ Frontend:", req.body);

        const { code } = req.body;
        const voucher = await promotionModel.checkCoupon(code);

        if (voucher) {
            console.log("=> Kết quả: Hợp lệ");
            res.status(200).json({ success: true, ...voucher });
        } else {
            console.log("=> Kết quả: Không tìm thấy hoặc hết hạn");
            res.status(404).json({ success: false, message: "Mã không hợp lệ" });
        }
    } catch (error) {
        console.error("Lỗi tại Controller:", error);
        res.status(500).json({ error: error.message });
    }
},

    // 4. Thêm khuyến mãi (Hàm này trước đó bị nằm ngoài object)
    addPromotion: async (req, res) => {
        try {
            await promotionModel.create(req.body);
            res.status(201).json({ message: "Thêm khuyến mãi thành công" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = promotionController;