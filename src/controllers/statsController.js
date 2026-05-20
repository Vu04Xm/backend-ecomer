const db = require('../configs/db');

const statsController = {
    // ─── 1. DASHBOARD OVERVIEW (KPI Cards + Charts) ───────────────────────────
    getDashboardStats: async (req, res) => {
        const { day, month, year } = req.query;
        try {
            let filterOrders = " WHERE status = 'Delivered' ";
            let params = [];
            if (year)  { filterOrders += " AND YEAR(created_at) = ? ";  params.push(parseInt(year)); }
            if (month) { filterOrders += " AND MONTH(created_at) = ? "; params.push(parseInt(month)); }
            if (day)   { filterOrders += " AND DATE(created_at) = ? ";  params.push(day); }

            const chartYear = year ? parseInt(year) : new Date().getFullYear();

            const [revenueRes, orderRes, userRes, productRes, monthly] = await Promise.all([
                db.query(`SELECT COALESCE(SUM(total_amount),0) as total FROM orders ${filterOrders}`, params),
                db.query(`SELECT COUNT(order_id) as total FROM orders ${filterOrders}`, params),
                db.query("SELECT COUNT(id) as total FROM users WHERE role_id = 3", []),
                db.query("SELECT COUNT(*) as total FROM products", []),
                db.query(`
                    SELECT MONTH(created_at) as month, SUM(total_amount) as revenue
                    FROM orders WHERE status = 'Delivered' AND YEAR(created_at) = ?
                    GROUP BY MONTH(created_at) ORDER BY month ASC
                `, [chartYear])
            ]);

            // Top sản phẩm theo doanh thu (không chỉ số lượng)
            let filterOD = " WHERE o.status = 'Delivered' ";
            let odParams = [];
            if (year)  { filterOD += " AND YEAR(o.created_at) = ? ";  odParams.push(parseInt(year)); }
            if (month) { filterOD += " AND MONTH(o.created_at) = ? "; odParams.push(parseInt(month)); }
            if (day)   { filterOD += " AND DATE(o.created_at) = ? ";  odParams.push(day); }

            const [topProducts] = await db.query(`
                SELECT p.name, p.product_image,
                    SUM(od.quantity) as totalSold,
                    SUM(od.quantity * od.price_at_purchase) as totalRevenue,
                    SUM(od.quantity * (od.price_at_purchase - COALESCE(od.cost_at_purchase, 0))) as totalProfit
                FROM orderdetails od
                JOIN orders o ON od.order_id = o.order_id
                JOIN products p ON od.product_id = p.id
                ${filterOD}
                GROUP BY p.id ORDER BY totalRevenue DESC LIMIT 10
            `, odParams);

            // Tổng lợi nhuận gộp
            const [profitRes] = await db.query(`
                SELECT COALESCE(SUM(od.quantity * (od.price_at_purchase - COALESCE(od.cost_at_purchase, 0))), 0) as total
                FROM orderdetails od
                JOIN orders o ON od.order_id = o.order_id
                ${filterOrders.replace('WHERE', 'WHERE o.')}
            `, params);

            return res.status(200).json({
                success: true,
                data: {
                    totalRevenue: revenueRes[0][0]?.total || 0,
                    totalOrders:  orderRes[0][0]?.total || 0,
                    totalCustomers: userRes[0][0]?.total || 0,
                    totalProducts:  productRes[0][0]?.total || 0,
                    totalProfit:    profitRes[0]?.total || 0,
                    topProducts:    topProducts || [],
                    monthlyRevenue: monthly[0] || [],
                    appliedFilter:  { day, month, year: chartYear }
                }
            });
        } catch (error) {
            console.error("❌ [STATS] getDashboardStats:", error.message);
            return res.status(500).json({ success: false, message: "Lỗi trích xuất dữ liệu", error: error.message });
        }
    },

    // ─── 2. PHÂN TÍCH TÀI CHÍNH (Revenue vs Cost vs Profit) ──────────────────
    getFinancialStats: async (req, res) => {
        const { year } = req.query;
        const chartYear = year ? parseInt(year) : new Date().getFullYear();
        try {
            // Doanh thu & Lợi nhuận theo tháng
            const [monthly] = await db.query(`
                SELECT 
                    MONTH(o.created_at) as month,
                    SUM(o.total_amount) as revenue,
                    SUM(od.quantity * COALESCE(od.cost_at_purchase, 0)) as cost,
                    SUM(od.quantity * (od.price_at_purchase - COALESCE(od.cost_at_purchase, 0))) as profit
                FROM orders o
                JOIN orderdetails od ON o.order_id = od.order_id
                WHERE o.status = 'Delivered' AND YEAR(o.created_at) = ?
                GROUP BY MONTH(o.created_at)
                ORDER BY month ASC
            `, [chartYear]);

            // Chi phí nhập hàng theo tháng
            const [importCosts] = await db.query(`
                SELECT MONTH(import_date) as month, SUM(total_amount) as importCost
                FROM import_receipts
                WHERE status = 'Completed' AND YEAR(import_date) = ?
                GROUP BY MONTH(import_date)
                ORDER BY month ASC
            `, [chartYear]);

            // Tổng quan tài chính
            const [[totals]] = await db.query(`
                SELECT 
                    COALESCE(SUM(o.total_amount), 0) as totalRevenue,
                    COALESCE(SUM(od.quantity * COALESCE(od.cost_at_purchase, 0)), 0) as totalCost,
                    COALESCE(SUM(od.quantity * (od.price_at_purchase - COALESCE(od.cost_at_purchase, 0))), 0) as totalProfit
                FROM orders o
                JOIN orderdetails od ON o.order_id = od.order_id
                WHERE o.status = 'Delivered' AND YEAR(o.created_at) = ?
            `, [chartYear]);

            const [[importTotal]] = await db.query(`
                SELECT COALESCE(SUM(total_amount), 0) as totalImportCost
                FROM import_receipts
                WHERE status = 'Completed' AND YEAR(import_date) = ?
            `, [chartYear]);

            return res.status(200).json({
                success: true,
                data: {
                    year: chartYear,
                    monthly: monthly || [],
                    importCosts: importCosts || [],
                    totals: {
                        ...totals,
                        totalImportCost: importTotal?.totalImportCost || 0,
                        profitMargin: totals.totalRevenue > 0
                            ? ((totals.totalProfit / totals.totalRevenue) * 100).toFixed(1)
                            : 0
                    }
                }
            });
        } catch (error) {
            console.error("❌ [STATS] getFinancialStats:", error.message);
            return res.status(500).json({ success: false, message: "Lỗi tài chính", error: error.message });
        }
    },

    // ─── 3. PHÂN TÍCH KHO HÀNG ────────────────────────────────────────────────
    getInventoryStats: async (req, res) => {
        try {
            // Tổng giá trị tồn kho
            const [[inventoryValue]] = await db.query(`
                SELECT 
                    SUM(quantity) as totalItems,
                    SUM(quantity * COALESCE(cost_price, 0)) as totalValue,
                    COUNT(*) as totalProducts,
                    SUM(CASE WHEN status = 'Out of Stock' THEN 1 ELSE 0 END) as outOfStock,
                    SUM(CASE WHEN quantity > 0 AND quantity <= 5 THEN 1 ELSE 0 END) as lowStock
                FROM products
            `);

            // Sản phẩm sắp hết hàng (quantity <= 5 và > 0)
            const [lowStockProducts] = await db.query(`
                SELECT p.id, p.name, p.product_image, p.quantity, p.cost_price,
                    c.name as category_name, b.name as brand_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN brands b ON p.brand_id = b.id
                WHERE p.quantity <= 5 AND p.quantity > 0
                ORDER BY p.quantity ASC
                LIMIT 10
            `);

            // Sản phẩm tồn kho chết (quantity > 0 nhưng 30 ngày không có đơn)
            const [deadStock] = await db.query(`
                SELECT p.id, p.name, p.product_image, p.quantity, p.cost_price,
                    p.quantity * COALESCE(p.cost_price, 0) as stockValue
                FROM products p
                WHERE p.quantity > 0
                AND p.id NOT IN (
                    SELECT DISTINCT od.product_id FROM orderdetails od
                    JOIN orders o ON od.order_id = o.order_id
                    WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                )
                ORDER BY stockValue DESC
                LIMIT 10
            `);

            // Lịch sử nhập hàng 6 tháng gần nhất
            const [importHistory] = await db.query(`
                SELECT MONTH(import_date) as month, YEAR(import_date) as year,
                    COUNT(*) as receipts, SUM(total_amount) as totalCost
                FROM import_receipts
                WHERE status = 'Completed' AND import_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                GROUP BY YEAR(import_date), MONTH(import_date)
                ORDER BY year ASC, month ASC
            `);

            // Top nhà cung cấp theo giá trị nhập
            const [topSuppliers] = await db.query(`
                SELECT s.name, COUNT(ir.id) as totalReceipts, SUM(ir.total_amount) as totalValue
                FROM import_receipts ir
                JOIN suppliers s ON ir.supplier_id = s.id
                WHERE ir.status = 'Completed'
                GROUP BY s.id ORDER BY totalValue DESC LIMIT 5
            `);

            return res.status(200).json({
                success: true,
                data: {
                    overview: inventoryValue,
                    lowStockProducts: lowStockProducts || [],
                    deadStock: deadStock || [],
                    importHistory: importHistory || [],
                    topSuppliers: topSuppliers || []
                }
            });
        } catch (error) {
            console.error("❌ [STATS] getInventoryStats:", error.message);
            return res.status(500).json({ success: false, message: "Lỗi kho hàng", error: error.message });
        }
    },

    // ─── 4. PHÂN TÍCH ĐƠN HÀNG ────────────────────────────────────────────────
    getOrderStats: async (req, res) => {
        const { year } = req.query;
        const chartYear = year ? parseInt(year) : new Date().getFullYear();
        try {
            // Phân tích trạng thái đơn hàng
            const [ordersByStatus] = await db.query(`
                SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as value
                FROM orders WHERE YEAR(created_at) = ?
                GROUP BY status
            `, [chartYear]);

            // Đơn hàng theo giờ trong ngày (heatmap)
            const [ordersByHour] = await db.query(`
                SELECT HOUR(created_at) as hour, COUNT(*) as count
                FROM orders WHERE YEAR(created_at) = ?
                GROUP BY HOUR(created_at) ORDER BY hour ASC
            `, [chartYear]);

            // Đơn hàng theo ngày trong tuần
            const [ordersByDay] = await db.query(`
                SELECT DAYOFWEEK(created_at) as dayOfWeek, COUNT(*) as count
                FROM orders WHERE YEAR(created_at) = ?
                GROUP BY DAYOFWEEK(created_at) ORDER BY dayOfWeek ASC
            `, [chartYear]);

            // Tỉ lệ chuyển đổi (hoàn thành / tổng)
            const [[conversionData]] = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
                FROM orders WHERE YEAR(created_at) = ?
            `, [chartYear]);

            return res.status(200).json({
                success: true,
                data: {
                    year: chartYear,
                    ordersByStatus: ordersByStatus || [],
                    ordersByHour: ordersByHour || [],
                    ordersByDay: ordersByDay || [],
                    conversion: {
                        total: conversionData?.total || 0,
                        completed: conversionData?.completed || 0,
                        cancelled: conversionData?.cancelled || 0,
                        rate: conversionData?.total > 0
                            ? ((conversionData.completed / conversionData.total) * 100).toFixed(1)
                            : 0
                    }
                }
            });
        } catch (error) {
            console.error("❌ [STATS] getOrderStats:", error.message);
            return res.status(500).json({ success: false, message: "Lỗi đơn hàng", error: error.message });
        }
    },

    // ─── 4.5 THỐNG KÊ LÝ DO HỦY ĐƠN (TH4) ─────────────────────────────────────
    getCancelledStats: async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT cancel_reason, COUNT(*) as count 
                FROM orders 
                WHERE status = 'Cancelled' AND cancel_reason IS NOT NULL
                GROUP BY cancel_reason 
                ORDER BY count DESC
            `);
            return res.status(200).json({ success: true, data: rows });
        } catch (error) {
            console.error("❌ [STATS] getCancelledStats:", error.message);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    // ─── 5. PHÂN TÍCH KHÁCH HÀNG ──────────────────────────────────────────────
    getCustomerStats: async (req, res) => {
        const { year } = req.query;
        const chartYear = year ? parseInt(year) : new Date().getFullYear();
        try {
            // Khách hàng mới theo tháng
            const [newCustomers] = await db.query(`
                SELECT MONTH(created_at) as month, COUNT(*) as count
                FROM users WHERE role_id = 3 AND YEAR(created_at) = ?
                GROUP BY MONTH(created_at) ORDER BY month ASC
            `, [chartYear]);

            // Top 10 khách hàng VIP (chi tiêu nhiều nhất)
            const [topCustomers] = await db.query(`
                SELECT u.id, u.email, u.fullname,
                    COUNT(o.order_id) as totalOrders,
                    COALESCE(SUM(o.total_amount), 0) as totalSpent
                FROM users u
                JOIN orders o ON u.id = o.user_id
                WHERE o.status = 'Delivered' AND u.role_id = 3
                GROUP BY u.id ORDER BY totalSpent DESC LIMIT 10
            `);

            // Khách hàng mới vs Quay lại (mua >= 2 đơn)
            const [[customerSegment]] = await db.query(`
                SELECT 
                    SUM(CASE WHEN orderCount = 1 THEN 1 ELSE 0 END) as newBuyers,
                    SUM(CASE WHEN orderCount >= 2 THEN 1 ELSE 0 END) as returningBuyers
                FROM (
                    SELECT user_id, COUNT(*) as orderCount
                    FROM orders WHERE status = 'Delivered'
                    GROUP BY user_id
                ) t
            `);

            // Giá trị đơn hàng trung bình
            const [[avgOrder]] = await db.query(`
                SELECT COALESCE(AVG(total_amount), 0) as avgOrderValue
                FROM orders WHERE status = 'Delivered' AND YEAR(created_at) = ?
            `, [chartYear]);

            return res.status(200).json({
                success: true,
                data: {
                    year: chartYear,
                    newCustomers: newCustomers || [],
                    topCustomers: topCustomers || [],
                    segment: customerSegment || { newBuyers: 0, returningBuyers: 0 },
                    avgOrderValue: avgOrder?.avgOrderValue || 0
                }
            });
        } catch (error) {
            console.error("❌ [STATS] getCustomerStats:", error.message);
            return res.status(500).json({ success: false, message: "Lỗi khách hàng", error: error.message });
        }
    },

    // ─── 6. AI CONSUMER INSIGHTS (Customer Persona & Forecasting) ──────────
    getAIInsights: async (req, res) => {
        try {
            // 1. Phân khúc khách hàng (Segmentation)
            const [loyalCount] = await db.query(`
                SELECT COUNT(*) as count FROM (
                    SELECT user_id FROM orders 
                    WHERE status = 'Delivered' 
                    GROUP BY user_id HAVING SUM(total_amount) > 20000000 OR COUNT(*) >= 3
                ) t
            `);

            const [saleHunterCount] = await db.query(`
                SELECT COUNT(DISTINCT o.user_id) as count 
                FROM orders o
                JOIN orderdetails od ON o.order_id = od.order_id
                JOIN products p ON od.product_id = p.id
                WHERE (p.discount > 0 OR p.price < p.price * 0.9) AND o.status = 'Delivered'
            `);

            const [potentialCount] = await db.query(`
                SELECT COUNT(DISTINCT f.user_id) as count
                FROM favorites f
                LEFT JOIN orders o ON f.user_id = o.user_id
                WHERE o.order_id IS NULL
            `);

            const [totalUsers] = await db.query("SELECT COUNT(*) as count FROM users WHERE role_id = 3");

            // 2. Dự báo xu hướng (Trending Products based on Interest)
            const [trendingProducts] = await db.query(`
                SELECT p.name, p.product_image, COUNT(f.id) as interestCount
                FROM products p
                JOIN favorites f ON p.id = f.product_id
                GROUP BY p.id ORDER BY interestCount DESC LIMIT 5
            `);

            // 3. Dự báo rủi ro rời bỏ (Churn Prediction - Không mua hàng > 60 ngày)
            const [churnRisk] = await db.query(`
                SELECT COUNT(DISTINCT user_id) as count
                FROM orders
                WHERE status = 'Delivered'
                AND user_id NOT IN (
                    SELECT user_id FROM orders 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
                )
            `);

            // 4. Phân tích phễu chuyển đổi (Conversion Funnel)
            const [[funnel]] = await db.query(`
                SELECT 
                    (SELECT COUNT(*) FROM users WHERE role_id = 3) as totalVisitors,
                    (SELECT COUNT(DISTINCT user_id) FROM cart) as cartAdders,
                    (SELECT COUNT(DISTINCT user_id) FROM orders) as orderPlacers,
                    (SELECT COUNT(DISTINCT user_id) FROM orders WHERE status = 'Delivered') as successfulBuyers
            `);

            // 5. GỌI GEMINI AI ĐỂ NHẬN ĐỊNH CHIẾN LƯỢC (NEW)
            const apiKey = process.env.OPENAI_API_KEY;
            let aiCommentary = "AI đang phân tích sâu dữ liệu để đưa ra lời khuyên chiến lược...";

            if (apiKey) {
                try {
                    const prompt = `
                        BẠN LÀ CHUYÊN GIA PHÂN TÍCH KINH DOANH (BUSINESS ANALYST) CHO CỬA HÀNG ĐIỆN THOẠI.
                        Dựa trên dữ liệu thực tế sau, hãy viết một bản nhận định ngắn gọn, sắc bén cho Admin:

                        THỐNG KÊ:
                        - Phân khúc: ${loyalCount[0].count} khách VIP, ${saleHunterCount[0].count} khách săn sale, ${potentialCount[0].count} khách tiềm năng chưa chốt đơn.
                        - Churn Risk: ${churnRisk[0].count} khách hàng có nguy cơ rời bỏ (im hơi lặng tiếng > 60 ngày).
                        - Phễu: ${funnel.totalVisitors} ghé thăm -> ${funnel.cartAdders} giỏ hàng -> ${funnel.orderPlacers} đơn hàng -> ${funnel.successfulBuyers} thành công.
                        - Xu hướng quan tâm: ${trendingProducts.map(p => p.name).join(', ')}.

                        YÊU CẦU:
                        1. Đưa ra 3 nhận định quan trọng nhất về tình hình kinh doanh.
                        2. Đề xuất 2 hành động cụ thể để tăng tỷ lệ chuyển đổi.
                        3. Viết bằng tiếng Việt, giọng văn chuyên nghiệp, súc tích (dùng gạch đầu dòng).
                    `;

                    const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }]
                        })
                    });
                    const aiData = await aiRes.json();
                    if (aiData.candidates?.[0]?.content?.parts?.[0]?.text) {
                        aiCommentary = aiData.candidates[0].content.parts[0].text;
                    }
                } catch (e) {
                    console.error("Lỗi gọi Gemini trong Stats:", e.message);
                }
            }

            return res.status(200).json({
                success: true,
                data: {
                    personas: {
                        loyal: loyalCount[0].count,
                        saleHunters: saleHunterCount[0].count,
                        potential: potentialCount[0].count,
                        others: Math.max(0, totalUsers[0].count - loyalCount[0].count - saleHunterCount[0].count)
                    },
                    trending: trendingProducts || [],
                    churnRisk: churnRisk[0].count,
                    funnel: {
                        visitors: funnel.totalVisitors,
                        cart: funnel.cartAdders,
                        orders: funnel.orderPlacers,
                        success: funnel.successfulBuyers
                    },
                    aiCommentary: aiCommentary
                }
            });
        } catch (error) {
            console.error("❌ [AI INSIGHTS] Error:", error.message);
            return res.status(500).json({ success: false, message: "Lỗi phân tích AI", error: error.message });
        }
    }
};

module.exports = statsController;