const walletModel = require('../models/walletModel');

const walletController = {
  // GET /wallet — lấy ví + số dư của user đang đăng nhập
  getWallet: async (req, res) => {
    try {
      const userId = req.user.id;
      const wallet = await walletModel.getOrCreate(userId);
      const transactions = await walletModel.getTransactions(userId);
      res.json({ wallet, transactions });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // POST /wallet/withdraw — Demo rút tiền
  withdraw: async (req, res) => {
    try {
      const userId = req.user.id;
      const { amount, bankNote } = req.body;
      const withdrawAmount = Number(amount);
      if (!withdrawAmount || withdrawAmount <= 0) {
        return res.status(400).json({ error: 'Số tiền rút không hợp lệ' });
      }
      if (withdrawAmount < 10000) {
        return res.status(400).json({ error: 'Số tiền rút tối thiểu là 10.000đ' });
      }
      const note = bankNote ? `Rút tiền: ${bankNote}` : 'Yêu cầu rút tiền (Demo Sandbox)';
      await walletModel.withdraw(userId, withdrawAmount, note);
      res.json({ message: `Đã gửi yêu cầu rút ${withdrawAmount.toLocaleString('vi-VN')}đ thành công (Demo Mode)` });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  // GET /wallet/transactions
  getTransactions: async (req, res) => {
    try {
      const userId = req.user.id;
      const txns = await walletModel.getTransactions(userId);
      res.json(txns);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
};

module.exports = walletController;
