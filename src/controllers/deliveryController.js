const deliveryModel = require('../models/deliveryModel');
const orderModel = require('../models/orderModel');
const auditModel = require('../models/auditModel');

const deliveryController = {
    // 1. Upload ảnh bằng chứng
    uploadPhoto: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { photoType, note } = req.body;
            
            if (!req.file) {
                return res.status(400).json({ error: "Vui lòng chọn ảnh!" });
            }

            // Giả định middleware auth đã gán req.user
            const uploadedBy = req.user?.id || 1; // Demo mặc định id 1
            const uploaderRole = req.user?.role_name?.toLowerCase() || 'admin';

            const photoUrl = `/uploads/evidence/${req.file.filename}`;

            await deliveryModel.addPhoto({
                orderId,
                uploadedBy,
                uploaderRole,
                photoUrl,
                photoType,
                note
            });

            // Ghi log vào order_tracking
            const actorName = req.user?.full_name || "Nhân viên";
            await auditModel.logOrderAction(
                orderId,
                'EvidenceUploaded',
                uploadedBy,
                actorName,
                `Đã tải lên ảnh bằng chứng (${photoType || 'Giao hàng'}). Ghi chú: ${note || 'Không'}`
            );

            res.status(200).json({
                message: "Tải ảnh thành công!",
                photoUrl
            });
        } catch (error) {
            console.error("Lỗi uploadPhoto:", error.message);
            res.status(500).json({ error: error.message });
        }
    },

    // 2. Lấy danh sách ảnh của đơn hàng
    getPhotos: async (req, res) => {
        try {
            const { orderId } = req.params;
            const photos = await deliveryModel.getPhotos(orderId);
            res.status(200).json(photos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = deliveryController;
