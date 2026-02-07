const pool = require('../configs/db');

exports.handleChat = async (req, res) => {
    const { message } = req.body;
    
    // BẢO MẬT: Ưu tiên lấy Key từ .env, nếu không có mới dùng key mặc định
    // Điều này giúp bạn không bị lộ key khi đẩy code lên GitHub
    const apiKey = process.env.OPENAI_API_KEY; 

    if (!apiKey) {
        return res.status(500).json({ success: false, error: "Thiếu API Key trong file .env" });
    }

    try {
        // --- BƯỚC 1: TỰ ĐỘNG DÒ MODEL HỢP LỆ ---
        const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listRes = await fetch(listModelsUrl);
        const listData = await listRes.json();

        if (listData.error) {
            throw new Error(`Google API Error: ${listData.error.message}`);
        }

        const selectedModel = listData.models?.find(m => m.name.includes("gemini-1.5-flash")) || 
                             listData.models?.find(m => m.supportedGenerationMethods.includes("generateContent"));

        if (!selectedModel) {
            return res.status(403).json({ success: false, error: "Key này chưa được kích hoạt cho Gemini." });
        }

        const modelName = selectedModel.name;
        console.log(`🚀 AI đang sử dụng model: ${modelName}`);

        // --- BƯỚC 2: TRUY VẤN DỮ LIỆU THÔNG MINH (GIỮ NGUYÊN LOGIC CỦA BẠN) ---
        const [rows] = await pool.execute(`
            SELECT p.name, p.price, p.discount, p.description, b.name as brand
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE p.status = 'In Stock' 
            AND (p.name LIKE ? OR b.name LIKE ? OR ? LIKE CONCAT('%', p.name, '%'))
            LIMIT 50
        `, [`%${message}%`, `%${message}%`, message]);

        let finalRows = rows;
        if (finalRows.length === 0) {
            const [fallbackRows] = await pool.execute(`
                SELECT p.name, p.price, p.discount, p.description, b.name as brand
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.id
                WHERE p.status = 'In Stock'
                ORDER BY p.id DESC LIMIT 15
            `);
            finalRows = fallbackRows;
        }

        // --- BƯỚC 3: XỬ LÝ DỮ LIỆU JSON & TẠO CONTEXT (GIỮ NGUYÊN FORMAT CỦA BẠN) ---
        const productContext = finalRows.map(p => {
            const finalPrice = (p.price - p.discount).toLocaleString();
            
            let techSpecs = "";
            try {
                const descObj = (typeof p.description === 'object' && p.description !== null) 
                    ? p.description 
                    : JSON.parse(p.description || "{}");

                techSpecs = Object.entries(descObj)
                    .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
                    .join(', ');
            } catch (e) {
                techSpecs = p.description || "Đang cập nhật";
            }

            return `SẢN PHẨM: ${p.name}
            - Thương hiệu: ${p.brand}
            - Giá bán cuối: ${finalPrice}đ
            - Thông số kỹ thuật chi tiết: ${techSpecs}
            -----------------------`;
        }).join('\n');

        // --- BƯỚC 4: GỬI DỮ LIỆU CHO AI (GIỮ NGUYÊN PHẦN TRAINING CỦA BẠN) ---
        const chatUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;
        const chatRes = await fetch(chatUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Bạn là trợ lý ảo chuyên gia công nghệ của cửa hàng Cellphones.
                        Dưới đây là thông tin thực tế từ kho hàng (đã xử lý từ dữ liệu hệ thống):
                        ${productContext}

                        YÊU CẦU TRẢ LỜI:
                        1. Tuyệt đối dựa vào "Thông số kỹ thuật chi tiết" để trả lời về RAM, CPU, SSD...
                        2. Luôn báo mức "Giá bán cuối" đã tính toán sẵn ở trên.
                        3. Nếu khách hỏi sản phẩm không có trong danh sách, hãy báo "Dạ hiện tại máy này bên em đang hết hàng" và gợi ý máy tương đương có trong danh sách.
                        4. Trả lời thân thiện, chuyên nghiệp, súc tích.
                        5. Trình bày các thông số kỹ thuật theo dạng danh sách gạch đầu dòng rõ ràng.
                        6. Mỗi thông số nằm trên một dòng riêng biệt.

                        Câu hỏi của khách: ${message}`
                    }]
                }]
            })
        });

        const chatData = await chatRes.json();

        if (chatData.candidates && chatData.candidates[0].content) {
            res.json({ success: true, reply: chatData.candidates[0].content.parts[0].text });
        } else {
            res.status(500).json({ success: false, error: "AI không thể trả lời.", detail: chatData });
        }

    } catch (error) {
        console.error("❌ LỖI HỆ THỐNG:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};