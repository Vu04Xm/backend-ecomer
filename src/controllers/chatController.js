const pool = require('../configs/db');

exports.handleChat = async (req, res) => {
    const { message } = req.body;
    const apiKey = process.env.OPENAI_API_KEY; 

    if (!apiKey) {
        return res.status(500).json({ success: false, error: "Thiếu API Key trong file .env" });
    }

    try {
        // --- BƯỚC 1: DÒ MODEL ---
        const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listRes = await fetch(listModelsUrl);
        const listData = await listRes.json();

        if (listData.error) {
            if (listData.error.message.includes("high demand")) {
                return res.json({ success: true, reply: "Dạ AI đang bận chút, bạn hỏi lại sau 10 giây nhé! 🙏" });
            }
            throw new Error(listData.error.message);
        }

        let selectedModel = listData.models?.find(m => m.name.includes("gemini-1.5-flash")) || 
                           listData.models?.find(m => m.name.includes("gemini-1.0-pro")) ||
                           listData.models?.find(m => m.supportedGenerationMethods.includes("generateContent"));

        if (!selectedModel) return res.status(403).json({ success: false, error: "Tài khoản không đủ quyền." });

        const modelName = selectedModel.name;

        // --- BƯỚC 2: TRUY VẤN KHO HÀNG THÔNG MINH ---
        // Tách từ khóa để tìm kiếm linh hoạt (Ví dụ: "Xiaomi Pad 7 4 1" -> tìm "Xiaomi" hoặc "Pad" hoặc "7")
        const keywords = message.split(' ').filter(k => k.length > 1);
        const searchConditions = keywords.map(() => `p.name LIKE ?`).join(' OR ');
        const searchValues = keywords.map(k => `%${k}%`);

        const [rows] = await pool.execute(`
            SELECT p.id, p.name, p.price, p.discount, p.description, p.status, b.name as brand
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE (${searchConditions} OR p.name LIKE ? OR ? LIKE CONCAT('%', p.name, '%'))
            LIMIT 20
        `, [...searchValues, `%${message}%`, message]);

        let productList = rows;
        // Nếu không tìm thấy gì theo từ khóa, lấy top 10 sản phẩm mới nhất làm gợi ý
        if (productList.length === 0) {
            const [latest] = await pool.execute(`
                SELECT p.id, p.name, p.price, p.discount, p.description, p.status, b.name as brand
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.id
                ORDER BY p.id DESC LIMIT 10
            `);
            productList = latest;
        }

        // --- BƯỚC 3: TẠO CONTEXT ---
        const context = productList.map(p => {
            const pPrice = Math.round(Number(p.price || 0) - Number(p.discount || 0)).toLocaleString();
            let specsStr = "";
            try {
                const specs = (typeof p.description === 'object') ? p.description : JSON.parse(p.description || "{}");
                specsStr = Object.entries(specs).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(', ');
            } catch (e) { specsStr = p.description || "Máy chính hãng"; }

            return `[SẢN PHẨM]: ${p.name} | [GIÁ]: ${pPrice}đ | [TRẠNG THÁI]: ${p.status} | [SPECS]: ${specsStr}`;
        }).join('\n');

        // --- BƯỚC 4: TRAINING AI CỰC KỲ LINH HOẠT ---
        const chatUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;
        const chatRes = await fetch(chatUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `BẠN LÀ CHUYÊN GIA TƯ VẤN SẢN PHẨM CỦA CELLPHONES.
                        
                        NHIỆM VỤ:
                        1. Dựa vào DANH SÁCH KHO HÀNG bên dưới để trả lời.
                        2. NẾU KHÁCH HỎI TÊN SẢN PHẨM KHÔNG KHỚP 100%, hãy tìm sản phẩm có tên GẦN GIỐNG NHẤT trong danh sách để giới thiệu. TUYỆT ĐỐI KHÔNG báo "không tìm thấy" nếu có sản phẩm tương tự.
                        3. Nếu sản phẩm trong kho ghi "Out of Stock", hãy báo là "Dạ mẫu này hiện đang tạm hết, anh/chị tham khảo mẫu tương đương nhé".
                        4. Trả lời thân thiện, tư vấn nhiệt tình như nhân viên bán hàng.

                        DANH SÁCH KHO HÀNG THỰC TẾ:
                        ${context || "Hiện kho đang cập nhật thêm sản phẩm mới."}

                        CÂU HỎI KHÁCH HÀNG: ${message}`
                    }]
                }]
            })
        });

        const chatData = await chatRes.json();
        
        if (chatData.error) {
            if (chatData.error.message.includes("high demand")) return res.json({ success: true, reply: "AI đang quá tải, bạn hỏi lại sau 10 giây nhé! 🙏" });
            throw new Error(chatData.error.message);
        }

        if (chatData.candidates && chatData.candidates[0].content) {
            res.json({ success: true, reply: chatData.candidates[0].content.parts[0].text });
        } else {
            res.json({ success: true, reply: "Dạ, hiện tại em chưa tìm được thông tin chính xác, anh/chị muốn tìm dòng máy của hãng nào để em hỗ trợ tốt hơn ạ?" });
        }

    } catch (error) {
        console.error("🔥 ERROR:", error.stack);
        res.status(500).json({ success: false, error: "Hệ thống AI đang bảo trì, vui lòng thử lại sau." });
    }
};