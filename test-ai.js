async function finalAttempt() {
  const apiKey = "AIzaSyAqO-UizJDrpxLEc8p9fuTTsP_Ea6GGl-E";
  // Dùng bản 1.5-flash-8b và v1beta - Đây là "cửa sáng" nhất hiện tại
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`;

  try {
    console.log("⏳ Đang thử kết nối với Gemini 1.5 Flash 8B...");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hãy trả lời ngắn: Đã thông tuyến!" }] }]
      })
    });

    const result = await response.json();
    
    if (result.candidates) {
      console.log("-----------------------------------");
      console.log("✅ THÀNH CÔNG RỒI!");
      console.log("AI trả lời:", result.candidates[0].content.parts[0].text);
      console.log("-----------------------------------");
    } else {
      console.log("❌ Lỗi chi tiết:", JSON.stringify(result.error, null, 2));
    }
  } catch (e) {
    console.log("❌ Lỗi mạng:", e.message);
  }
}
finalAttempt();