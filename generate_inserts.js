const fs = require('fs');
const path = require('path');

const mappingFile = path.join(__dirname, 'image_mapping.json');
const outputSqlFile = path.join(__dirname, 'new_products.sql');

if (!fs.existsSync(mappingFile)) {
    console.error('Không tìm thấy tệp mapping. Vui lòng chạy upload_to_cloudinary.js trước.');
    process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));

// Định nghĩa Brand Mapping (Dạng Mảng để ưu tiên Brand dài hơn trước)
const brandList = [
    { key: 'iphone', id: 1, name: 'Apple' },
    { key: 'macbook', id: 1, name: 'Apple' },
    { key: 'ipad', id: 1, name: 'Apple' },
    { key: 'apple', id: 1, name: 'Apple' },
    { key: 'samsung', id: 2, name: 'Samsung' },
    { key: 'galaxy', id: 2, name: 'Samsung' },
    { key: 'xiaomi', id: 3, name: 'Xiaomi' },
    { key: 'mijia', id: 3, name: 'Xiaomi' },
    { key: 'redmi', id: 3, name: 'Xiaomi' },
    { key: 'poco', id: 3, name: 'Xiaomi' },
    { key: 'oppo', id: 4, name: 'OPPO' },
    { key: 'vivo', id: 5, name: 'Vivo' },
    { key: 'honor', id: 6, name: 'HONOR' },
    { key: 'realme', id: 7, name: 'realme' },
    { key: 'nokia', id: 8, name: 'Nokia' },
    { key: 'dell', id: 9, name: 'Dell' },
    { key: 'hp', id: 10, name: 'HP' },
    { key: 'asus', id: 11, name: 'ASUS' },
    { key: 'acer', id: 12, name: 'Acer' },
    { key: 'lenovo', id: 13, name: 'Lenovo' },
    { key: 'msi', id: 14, name: 'MSI' },
    { key: 'lg', id: 15, name: 'LG' },
    { key: 'benq', id: 16, name: 'BenQ' },
    { key: 'gigabyte', id: 18, name: 'GIGABYTE' },
    { key: 'sony', id: 19, name: 'Sony' },
    { key: 'jbl', id: 20, name: 'JBL' },
    { key: 'sennheiser', id: 21, name: 'Sennheiser' },
    { key: 'marshall', id: 22, name: 'Marshall' },
    { key: 'soundcore', id: 23, name: 'Soundcore' },
    { key: 'akg', id: 24, name: 'AKG' },
    { key: 'tcl', id: 25, name: 'TCL' },
    { key: 'panasonic', id: 26, name: 'Panasonic' },
    { key: 'hisense', id: 27, name: 'Hisense' },
    { key: 'casper', id: 28, name: 'Casper' },
    { key: 'toshiba', id: 29, name: 'Toshiba' },
    { key: 'hitachi', id: 30, name: 'Hitachi' },
    { key: 'sharp', id: 31, name: 'Sharp' },
    { key: 'aqua', id: 32, name: 'Aqua' },
    { key: 'electrolux', id: 33, name: 'Electrolux' },
    { key: 'midea', id: 34, name: 'Midea' },
    { key: 'daikin', id: 35, name: 'Daikin' },
    { key: 'mitsubishi', id: 36, name: 'Mitsubishi' },
    { key: 'sunhouse', id: 37, name: 'Sunhouse' },
    { key: 'kangaroo', id: 38, name: 'Kangaroo' },
    { key: 'bluestone', id: 39, name: 'BlueStone' },
    { key: 'bear', id: 40, name: 'Bear' },
    { key: 'fujihome', id: 41, name: 'Fujihome' },
    { key: 'lumias', id: 42, name: 'Lumias' },
    { key: 'roborock', id: 43, name: 'Roborock' },
    { key: 'dreame', id: 44, name: 'Dreame' },
    { key: 'tineco', id: 45, name: 'Tineco' },
    { key: 'ecovacs', id: 46, name: 'Ecovacs' },
    { key: 'shokz', id: 47, name: 'Shokz' },
    { key: 'tecno', id: 48, name: 'Tecno' },
    { key: 'nubia', id: 49, name: 'Nubia' },
    { key: 'coocaa', id: 50, name: 'Coocaa' }
];

// Cấu trúc Categories
const CATEGORY_PHONE = 1;
const CATEGORY_LAPTOP = 2;
const CATEGORY_MONITOR = 3;
const CATEGORY_HEADPHONE = 4;
const CATEGORY_TIVI = 5;
const CATEGORY_APPLIANCE = 6;

function getCategory(filename) {
    const low = filename.toLowerCase();
    // Ưu tiên đồ gia dụng
    if (low.includes('tu-lanh') || low.includes('may-giat') || low.includes('robot-hut-bui') || low.includes('bep-tu') || low.includes('bep-dien-tu') || low.includes('may-hut-bui')) return CATEGORY_APPLIANCE;
    if (low.includes('tivi') || low.includes('tv')) return CATEGORY_TIVI;
    if (low.includes('man-hinh') || low.includes('monitor')) return CATEGORY_MONITOR;
    if (low.includes('tai-nghe') || low.includes('headphone')) return CATEGORY_HEADPHONE;
    if (low.includes('laptop') || low.includes('macbook') || low.includes('nitro') || low.includes('victus') || low.includes('vivobook') || low.includes('thinkpad')) return CATEGORY_LAPTOP;
    if (low.includes('iphone') || low.includes('samsung') || low.includes('oppo') || low.includes('vivo') || low.includes('xiaomi') || low.includes('honor') || low.includes('realme') || low.includes('tecno') || low.includes('nubia') || low.includes('pad') || low.includes('tablet')) return CATEGORY_PHONE;
    return CATEGORY_PHONE;
}

function getBrandInfo(filename) {
    const low = filename.toLowerCase();
    // Sắp xếp theo độ dài keyword giảm dần để tránh nhầm (vd: macbook trước apple)
    const sortedBrands = [...brandList].sort((a, b) => b.key.length - a.key.length);
    for (const b of sortedBrands) {
        if (low.includes(b.key)) return b;
    }
    return { id: 3, name: 'Xiaomi' }; // Default
}

function formatName(filename) {
    let name = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '').replace(/_/g, ' ').replace(/-/g, ' ');
    // Loại bỏ các hậu tố CDN thừa
    name = name.replace(/\d+x\d+$/, '').replace(/\d+\s\d+$/, '').trim();
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function generateDescription(category, brandName, filename) {
    const low = filename.toLowerCase();
    let desc = {};
    if (category === CATEGORY_PHONE) {
        desc = { "hang": brandName, "man_hinh": "6.7 inch Super Retina XDR", "chip": "A18 Bionic / Snapdragon 8 Gen 3", "ram": "8GB LPDDR5X", "rom": "256GB UFS 4.0", "pin": "5000mAh, Sac nhanh 80W", "camera": "50MP Chinh, 12MP Goc rong", "he_dieu_hanh": brandName === 'APPLE' ? 'iOS 18' : 'Android 15' };
    } else if (category === CATEGORY_LAPTOP) {
        desc = { "hang": brandName, "cpu": "Intel Core i7 13700H / Ryzen 7", "ram": "16GB DDR5 5200MHz", "o_cung": "512GB SSD NVMe Gen 4", "man_hinh": "15.6 inch QHD 165Hz", "card_do_hoa": "NVIDIA RTX 4060 8GB", "pin": "4-cell, 90Wh", "trong_luong": "2.1kg" };
    } else if (category === CATEGORY_APPLIANCE) {
        if (low.includes('tu-lanh')) {
            desc = { "hang": brandName, "dung_tich": "450 Lit", "kieu_tu": "Multi Door / Side by Side", "cong_nghe": "Inverter tiet kiem dien", "khang_khuan": "Nano Ag+", "kich_thuoc": "180 x 75 x 70 cm", "nam_ra_mat": "2025", "bao_hanh": "24 thang" };
        } else if (low.includes('may-giat')) {
            desc = { "hang": brandName, "khoi_luong": "10.5 kg", "kieu_dong_co": "Truyen dong truc tiep Inverter", "cong_nghe": "Giat hoi nuoc Steam", "tien_ich": "Tu khoi dong lai khi co dien", "kich_thuoc": "85 x 60 x 58 cm", "nam_ra_mat": "2025", "bao_hanh": "24 thang" };
        } else if (low.includes('robot')) {
            desc = { "hang": brandName, "luc_hut": "6000Pa", "pin": "5200mAh", "tinh_nang": "Tu dong do rac, Ve sinh de lau", "cam_bien": "Lidar Navigation", "thoi_gian_chay": "180 phut", "do_on": "65dB", "bao_hanh": "12 thang" };
        } else {
            desc = { "hang": brandName, "loai_bep": "Bep dien tu", "cong_suat": "2200W", "mat_bep": "Kinh Ceramic cao cap", "bang_dieu_khien": "Cam ung thong minh", "hen_gio": "Co", "tu_ngat": "Khi qua nhiet", "bao_hanh": "12 thang" };
        }
    } else if (category === CATEGORY_MONITOR) {
        desc = { "hang": brandName, "kich_thuoc": "27 inch", "do_phan_giai": "2K (2560 x 1440)", "tam_nen": "IPS Fast", "tan_so_quet": "180Hz", "thoi_gian_phan_hoi": "0.5ms (GtG)", "do_sang": "400 cd/m2", "cong_ket_noi": "2x HDMI, 1x DisplayPort, 1x Type-C" };
    } else if (category === CATEGORY_HEADPHONE) {
        desc = { "hang": brandName, "loai_tai_nghe": "True Wireless / Over-ear", "ket_noi": "Bluetooth 5.4, ho tro LDAC", "pin": "Dung 10h (Anc off), Dock sac 40h", "chong_on": "ANC Thich ung", "micro": "6 Micro Beamforming", "chong_nuoc": "IPX4", "bao_hanh": "12 thang" };
    } else if (category === CATEGORY_TIVI) {
        desc = { "hang": brandName, "kich_thuoc": "65 inch", "do_phan_giai": "4K Ultra HD", "loai_tivi": "Mini LED / QLED", "tan_so_quet": "120Hz Fast Motion", "am_thanh": "Dolby Atmos 40W", "he_dieu_hanh": "Google TV", "nam_ra_mat": "2025" };
    }
    return JSON.stringify(desc);
}

const sqlLines = [];
sqlLines.push('-- Xóa dữ liệu cũ');
sqlLines.push('SET FOREIGN_KEY_CHECKS = 0;');
sqlLines.push('TRUNCATE TABLE products;');
sqlLines.push('SET FOREIGN_KEY_CHECKS = 1;');
sqlLines.push('');

// Brands logic
sqlLines.push('-- Dam bao du brands');
brandList.forEach(b => {
    if (b.id > 36) { // Brand moi
        sqlLines.push(`INSERT IGNORE INTO brands (id, name, status) VALUES (${b.id}, '${b.name}', 'active');`);
    }
});
sqlLines.push('');

sqlLines.push('INSERT INTO products (category_id, brand_id, name, price, discount, quantity, status, product_image, description) VALUES');

const items = Object.entries(mapping);
items.forEach(([filename, cloudinaryUrl], index) => {
    const categoryId = getCategory(filename);
    const brand = getBrandInfo(filename);
    const name = formatName(filename);
    const description = generateDescription(categoryId, brand.name.toUpperCase(), filename);
    
    // Giá ngẫu nhiên hợp lý
    let minPrice = 3000000;
    if (categoryId === CATEGORY_PHONE) minPrice = 8000000;
    if (categoryId === CATEGORY_LAPTOP) minPrice = 12000000;
    if (categoryId === CATEGORY_TIVI) minPrice = 9000000;
    if (categoryId === CATEGORY_APPLIANCE) minPrice = 5000000;
    
    const price = minPrice + (Math.floor(Math.random() * 20) * 1000000) + 190000;
    const discount = [0, 5, 10, 15, 20][Math.floor(Math.random() * 5)];
    const quantity = 30 + Math.floor(Math.random() * 70);

    const isLast = (index === items.length - 1);
    sqlLines.push(`(${categoryId}, ${brand.id}, '${name}', ${price}, ${discount}, ${quantity}, 'active', '${cloudinaryUrl}', '${description}')${isLast ? ';' : ','}`);
});

fs.writeFileSync(outputSqlFile, sqlLines.join('\n'));
console.log(`Đã tạo xong tệp SQL: ${outputSqlFile} với ${items.length} sản phẩm.`);
