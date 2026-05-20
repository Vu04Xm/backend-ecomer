require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const os = require('os');

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const sourceDir = path.join(os.homedir(), 'Downloads', 'anhcuatoi');
const mappingFile = path.join(__dirname, 'image_mapping.json');

async function uploadImages() {
    if (!fs.existsSync(sourceDir)) {
        console.error('Không tìm thấy thư mục nguồn:', sourceDir);
        return;
    }

    const files = fs.readdirSync(sourceDir).filter(file => 
        ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(file).toLowerCase())
    );

    console.log(`Tìm thấy ${files.length} ảnh trong thư mục. Bắt đầu upload lên Cloudinary...`);

    let mapping = {};
    if (fs.existsSync(mappingFile)) {
        mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
    }

    let successCount = 0;

    for (const file of files) {
        if (mapping[file]) {
            console.log(`Đã tồn tại trên máy chủ, bỏ qua: ${file}`);
            continue;
        }

        const filePath = path.join(sourceDir, file);
        try {
            console.log(`Đang upload: ${file}...`);
            const result = await cloudinary.uploader.upload(filePath, {
                folder: 'DA_Ecomer/products',
                use_filename: true,
                unique_filename: false
            });
            
            mapping[file] = result.secure_url;
            successCount++;
            
            // Lưu mapping sau mỗi lần upload thành công để tránh mất dữ liệu nếu lỗi
            fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
            console.log(`Thành công: ${file} -> ${result.secure_url}`);
        } catch (err) {
            console.error(`Lỗi khi upload ${file}:`, err.message);
        }
    }

    console.log(`\nXong! Đã upload thành công ${successCount} ảnh mới.`);
    console.log(`Tổng cộng có ${Object.keys(mapping).length} ảnh trong hệ thống Cloudinary.`);
    console.log(`Dữ liệu mapping được lưu tại: ${mappingFile}`);
}

uploadImages();
