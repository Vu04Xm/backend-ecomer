const axios = require('axios');

const GHN_TOKEN = process.env.GHN_TOKEN;
const GHN_SHOP_ID = parseInt(process.env.GHN_SHOP_ID);
const GHN_API_BASE = "https://online-gateway.ghn.vn/shiip/public-api";

console.log("--- GHN SERVICE LOADED ---");
console.log("Token:", GHN_TOKEN ? "OK" : "MISSING");
console.log("ShopID:", GHN_SHOP_ID);

const ghnAxios = axios.create({
    baseURL: GHN_API_BASE,
    headers: {
        'Token': GHN_TOKEN,
        'ShopId': GHN_SHOP_ID,
        'Content-Type': 'application/json'
    }
});

const ghnService = {
    // 1. Lấy danh sách Tỉnh/Thành
    getProvinces: async () => {
        try {
            const response = await ghnAxios.get('/master-data/province');
            return response.data.data;
        } catch (error) {
            console.error("GHN Error (Province):", error.response?.data || error.message);
            throw error;
        }
    },

    // 2. Lấy danh sách Quận/Huyện
    getDistricts: async (provinceId) => {
        try {
            const response = await ghnAxios.post('/master-data/district', {
                province_id: parseInt(provinceId)
            });
            return response.data.data;
        } catch (error) {
            console.error("GHN Error (District):", error.response?.data || error.message);
            throw error;
        }
    },

    // 3. Lấy danh sách Phường/Xã
    getWards: async (districtId) => {
        try {
            const response = await ghnAxios.post('/master-data/ward', {
                district_id: parseInt(districtId)
            });
            return response.data.data;
        } catch (error) {
            console.error("GHN Error (Ward):", error.response?.data || error.message);
            throw error;
        }
    },

    // 4. Tính phí vận chuyển
    calculateFee: async (data) => {
        try {
            const { to_district_id, to_ward_code, weight = 1000 } = data;
            
            // Cấu hình mặc định cho gói hàng (Yên Xá, Thanh Trì, Hà Nội)
            const payload = {
                "from_district_id": 1488, // Huyện Thanh Trì, Hà Nội
                "service_type_id": 2,     // Chuyển phát thương mại điện tử (Chuẩn)
                "to_district_id": parseInt(to_district_id),
                "to_ward_code": String(to_ward_code),
                "weight": weight,         // Cân nặng (gram)
                "length": 20,
                "width": 15,
                "height": 10,
                "insurance_value": 0,
                "coupon": null
            };

            const response = await ghnAxios.post('/v2/shipping-order/fee', payload);
            return response.data.data.total;
        } catch (error) {
            console.error("GHN Error (Fee):", error.response?.data || error.message);
            throw error;
        }
    }
};

module.exports = ghnService;
