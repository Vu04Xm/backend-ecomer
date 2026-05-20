const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const deliveryPhotoModel = require('../models/deliveryPhotoModel');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Dùng memoryStorage để upload thẳng lên Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Chỉ được upload file ảnh!'));
    }
    cb(null, true);
  }
});

const deliveryPhotoController = {
  // Middleware multer (single file field 'photo')
  uploadMiddleware: upload.single('photo'),

  // POST /orders/:orderId/photos
  uploadPhoto: async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn ảnh để upload' });

      const { orderId } = req.params;
      const { note, photoType } = req.body;
      const userId = req.user.id;
      const roleId = req.user.role_id;
      const uploaderRole = roleId === 1 ? 'admin' : roleId === 2 ? 'staff' : 'user';

      // Upload lên Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'delivery_photos', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      await deliveryPhotoModel.add({
        orderId,
        uploadedBy: userId,
        uploaderRole,
        photoUrl: uploadResult.secure_url,
        photoType,
        note,
      });

      res.status(201).json({
        message: 'Upload ảnh thành công',
        photoUrl: uploadResult.secure_url,
      });
    } catch (e) {
      console.error('Upload photo error:', e);
      res.status(500).json({ error: e.message });
    }
  },

  // GET /orders/:orderId/photos
  getPhotos: async (req, res) => {
    try {
      const { orderId } = req.params;
      const photos = await deliveryPhotoModel.getByOrder(orderId);
      res.json(photos);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};

module.exports = deliveryPhotoController;
