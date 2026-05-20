const favoriteModel = require('../models/favoriteModel');

const favoriteController = {
    getFavorites: async (req, res) => {
        try {
            const userId = req.user.id;
            const data = await favoriteModel.getByUserId(userId);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    toggleFavorite: async (req, res) => {
        try {
            const userId = req.user.id;
            const { productId } = req.body;

            const isFav = await favoriteModel.isFavorite(userId, productId);
            
            if (isFav) {
                await favoriteModel.remove(userId, productId);
                res.status(200).json({ message: "Đã xóa khỏi yêu thích", status: 'removed' });
            } else {
                await favoriteModel.add(userId, productId);
                res.status(200).json({ message: "Đã thêm vào yêu thích", status: 'added' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    checkStatus: async (req, res) => {
        try {
            const userId = req.user.id;
            const { productId } = req.params;
            const isFav = await favoriteModel.isFavorite(userId, productId);
            res.status(200).json({ isFavorite: isFav });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = favoriteController;
