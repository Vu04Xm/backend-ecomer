const db = require('../configs/db');

const walletModel = {
    // 1. Lấy ví của User (Nếu chưa có thì tự động tạo mới)
    getOrCreate: async (userId) => {
        try {
            const [rows] = await db.query('SELECT * FROM wallets WHERE user_id = ?', [userId]);
            if (rows.length > 0) return rows[0];

            // Nếu chưa có ví, tạo mới
            await db.query('INSERT INTO wallets (user_id, balance) VALUES (?, 0)', [userId]);
            const [newRows] = await db.query('SELECT * FROM wallets WHERE user_id = ?', [userId]);
            return newRows[0];
        } catch (error) {
            console.error("Lỗi getOrCreate Wallet:", error.message);
            throw error;
        }
    },

    // 2. Cộng tiền vào ví (Refund)
    addBalance: async (userId, amount, orderId = null, note = 'Hoàn tiền đơn hàng') => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Khóa hàng để tránh race condition
            const [wallets] = await connection.query('SELECT * FROM wallets WHERE user_id = ? FOR UPDATE', [userId]);
            let wallet;
            if (wallets.length === 0) {
                await connection.query('INSERT INTO wallets (user_id, balance) VALUES (?, 0)', [userId]);
                wallet = { user_id: userId, balance: 0 };
            } else {
                wallet = wallets[0];
            }

            const balanceBefore = Number(wallet.balance);
            const balanceAfter = balanceBefore + Number(amount);

            // Cập nhật số dư
            await connection.query('UPDATE wallets SET balance = ? WHERE user_id = ?', [balanceAfter, userId]);

            // Ghi log giao dịch
            await connection.query(`
                INSERT INTO wallet_transactions (user_id, order_id, type, amount, balance_before, balance_after, status, note)
                VALUES (?, ?, 'refund', ?, ?, ?, 'completed', ?)
            `, [userId, orderId, amount, balanceBefore, balanceAfter, note]);

            await connection.commit();
            return { success: true, balance: balanceAfter };
        } catch (error) {
            await connection.rollback();
            console.error("Lỗi addBalance:", error.message);
            throw error;
        } finally {
            connection.release();
        }
    },

    // 3. Trừ tiền từ ví (Thanh toán bằng ví hoặc Rút tiền)
    subtractBalance: async (userId, amount, type = 'payment', note = '', bankInfo = null) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [wallets] = await connection.query('SELECT * FROM wallets WHERE user_id = ? FOR UPDATE', [userId]);
            if (wallets.length === 0) throw new Error("Không tìm thấy ví người dùng");

            const wallet = wallets[0];
            const balanceBefore = Number(wallet.balance);
            if (balanceBefore < amount) throw new Error("Số dư ví không đủ");

            const balanceAfter = balanceBefore - Number(amount);

            // Cập nhật số dư
            await connection.query('UPDATE wallets SET balance = ? WHERE user_id = ?', [balanceAfter, userId]);

            // Ghi log giao dịch
            await connection.query(`
                INSERT INTO wallet_transactions (user_id, type, amount, balance_before, balance_after, status, note, bank_info)
                VALUES (?, ?, ?, ?, ?, 'completed', ?, ?)
            `, [userId, type, amount, balanceBefore, balanceAfter, note, bankInfo ? JSON.stringify(bankInfo) : null]);

            await connection.commit();
            return { success: true, balance: balanceAfter };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // 4. Alias cho rút tiền
    withdraw: async (userId, amount, note = '', bankInfo = null) => {
        return walletModel.subtractBalance(userId, amount, 'withdraw', note, bankInfo);
    },

    // 5. Alias cho thanh toán bằng ví
    payWithWallet: async (userId, amount, orderId, note = '') => {
        return walletModel.subtractBalance(userId, amount, 'payment', note, null);
    },

    // 6. Lấy lịch sử giao dịch
    getTransactions: async (userId) => {
        const [rows] = await db.query('SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        return rows;
    }
};

module.exports = walletModel;
