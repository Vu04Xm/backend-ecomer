const db = require('../configs/db');

const statsController = {
    getDashboardStats: async (req, res) => {
        const { day, month, year } = req.query;
        const startTime = Date.now();

        try {
            // 1. Xây dựng bộ lọc cho Orders (Dùng created_at, status='Delivered')
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

            // 2. Chạy đa truy vấn (Parallel Queries)
            // Khớp với schema: orders.order_id, users.role_id, users.id
            const [revenueRes, orderRes, userRes, productRes] = await Promise.all([
                db.query(`SELECT SUM(total_amount) as total FROM orders ${filterOrders}`, params),
                db.query(`SELECT COUNT(order_id) as total FROM orders ${filterOrders}`, params),
                db.query("SELECT COUNT(id) as total FROM users WHERE role_id = 3", []),
                db.query("SELECT COUNT(*) as total FROM products", [])
            ]);

            // 3. Truy vấn Top 5 Sản phẩm bán chạy
            // Lọc theo order_details.status = 'delivered'
            let filterOD = " WHERE o.status = 'Delivered' ";
            let odParams = [];
            if (year) { filterOD += " AND YEAR(o.created_at) = ? "; odParams.push(parseInt(year)); }
            if (month) { filterOD += " AND MONTH(o.created_at) = ? "; odParams.push(parseInt(month)); }
            if (day) { filterOD += " AND DATE(o.created_at) = ? "; odParams.push(day); }

            const [topProducts] = await db.query(`
                SELECT p.name, SUM(od.quantity) as totalSold 
                FROM orderdetails od 
                JOIN orders o ON od.order_id = o.order_id
                JOIN products p ON od.product_id = p.id 
                ${filterOD}
                GROUP BY p.id 
                ORDER BY totalSold DESC 
                LIMIT 5
            `, odParams);

            // 4. Doanh thu theo tháng (Mặc định năm 2026 như trong dữ liệu của bạn)
            const chartYear = year ? parseInt(year) : 2026;
            const [monthly] = await db.query(`
                SELECT MONTH(created_at) as month, SUM(total_amount) as revenue 
                FROM orders 
                WHERE status = 'Delivered' AND YEAR(created_at) = ?
                GROUP BY MONTH(created_at)
                ORDER BY month ASC
            `, [chartYear]);

            // Ghi log để bẫy lỗi nhanh trong Terminal
            console.log(`✅ [STATS] Success in ${Date.now() - startTime}ms`);

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
            console.error("🚨 [STATS ERROR]:", error.message);
            return res.status(500).json({ 
                success: false, 
                message: "Lỗi hệ thống khi lấy dữ liệu thống kê.",
                error: error.message 
            });
        }
    }
};

module.exports = statsController;