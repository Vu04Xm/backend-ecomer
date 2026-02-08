const db = require('../configs/db');

const statsController = {
    getDashboardStats: async (req, res) => {
        const { day, month, year } = req.query;

        try {
            // 1. Bộ lọc cho bảng orders (Dùng created_at, status='Delivered')
            let filterOrders = " WHERE status = 'Delivered' ";
            let params = [];

            if (year) {
                filterOrders += " AND YEAR(created_at) = ? ";
                params.push(parseInt(year));
            }
            if (month) {
                filterOrders += " AND MONTH(created_at) = ? ";
                params.push(parseInt(month));
            }
            if (day) {
                filterOrders += " AND DATE(created_at) = ? ";
                params.push(day);
            }

            // 2. Truy vấn dữ liệu Overview (Doanh thu, Đơn hàng, Khách hàng, Sản phẩm)
            const [revenueRes, orderRes, userRes, productRes] = await Promise.all([
                db.query(`SELECT SUM(total_amount) as total FROM orders ${filterOrders}`, params),
                db.query(`SELECT COUNT(order_id) as total FROM orders ${filterOrders}`, params),
                db.query("SELECT COUNT(id) as total FROM users WHERE role_id = 3", []),
                db.query("SELECT COUNT(*) as total FROM products", [])
            ]);

            // 3. Truy vấn Top 5 Sản phẩm bán chạy (Dùng status_time và status='delivered')
            let filterOD = " WHERE od.status = 'delivered' ";
            let odParams = [];
            if (year) { filterOD += " AND YEAR(od.status_time) = ? "; odParams.push(parseInt(year)); }
            if (month) { filterOD += " AND MONTH(od.status_time) = ? "; odParams.push(parseInt(month)); }
            if (day) { filterOD += " AND DATE(od.status_time) = ? "; odParams.push(day); }

            const [topProducts] = await db.query(`
                SELECT p.name, SUM(od.quantity) as totalSold 
                FROM orderdetails od 
                JOIN products p ON od.product_id = p.id 
                ${filterOD}
                GROUP BY p.id 
                ORDER BY totalSold DESC 
                LIMIT 5
            `, odParams);

            // 4. Dữ liệu biểu đồ doanh thu hàng tháng
            const chartYear = year ? parseInt(year) : 2026;
            const [monthly] = await db.query(`
                SELECT MONTH(created_at) as month, SUM(total_amount) as revenue 
                FROM orders 
                WHERE status = 'Delivered' AND YEAR(created_at) = ?
                GROUP BY MONTH(created_at)
                ORDER BY month ASC
            `, [chartYear]);

            return res.status(200).json({
                success: true,
                data: {
                    totalRevenue: revenueRes[0][0]?.total || 0,
                    totalOrders: orderRes[0][0]?.total || 0,
                    totalCustomers: userRes[0][0]?.total || 0,
                    totalProducts: productRes[0][0]?.total || 0,
                    topProducts: topProducts || [],
                    monthlyRevenue: monthly || [],
                    appliedFilter: { day, month, year: chartYear }
                }
            });

        } catch (error) {
            console.error("Lỗi SQL:", error.message);
            return res.status(500).json({ 
                success: false, 
                message: "Lỗi trích xuất dữ liệu", 
                error: error.message 
            });
        }
    }
};

module.exports = statsController;