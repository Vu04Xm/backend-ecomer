/**
 * Script seed 100 sản phẩm - ảnh từ cdn.tgdd.vn
 * Chạy: node seed.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function seed() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });
  console.log('✅ Kết nối DB thành công. Bắt đầu seed 100 sản phẩm...\n');

  try {
    // ── Clear ──
    const tables = ['order_details','orders','cart_items','products','brands','categories'];
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of tables) {
      try { await db.query(`TRUNCATE TABLE ${t}`); console.log(`  🗑️  ${t}`); }
      catch { console.log(`  ⚠️  ${t} bỏ qua.`); }
    }
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('');

    // ── CATEGORIES ──
    await db.query(`INSERT INTO categories (id, name, description, status) VALUES
      (1,'Điện thoại','Điện thoại thông minh chính hãng','active'),
      (2,'Laptop','Máy tính xách tay','active'),
      (3,'Màn hình','Màn hình máy tính','active'),
      (4,'Tai nghe','Tai nghe các loại','active'),
      (5,'Tivi','Smart TV các hãng','active'),
      (6,'Đồ gia dụng điện tử','Tủ lạnh, máy giặt, máy lạnh...','active')`);
    console.log('✅ 6 danh mục.\n');

    // ── BRANDS ──
    await db.query(`INSERT INTO brands (id, name, status) VALUES
      (1,'Apple','active'),(2,'Samsung','active'),(3,'Xiaomi','active'),
      (4,'OPPO','active'),(5,'Vivo','active'),(6,'HONOR','active'),
      (7,'realme','active'),(8,'Nokia','active'),(9,'Dell','active'),
      (10,'HP','active'),(11,'ASUS','active'),(12,'Acer','active'),
      (13,'Lenovo','active'),(14,'MSI','active'),(15,'LG','active'),
      (16,'BenQ','active'),(17,'MSI Monitor','active'),(18,'GIGABYTE','active'),
      (19,'Sony','active'),(20,'JBL','active'),(21,'Sennheiser','active'),
      (22,'Marshall','active'),(23,'Soundcore','active'),(24,'AKG','active'),
      (25,'TCL','active'),(26,'Panasonic','active'),(27,'Hisense','active'),
      (28,'Casper','active'),(29,'Toshiba','active'),(30,'Hitachi','active'),
      (31,'Sharp','active'),(32,'Aqua','active'),(33,'Electrolux','active'),
      (34,'Midea','active'),(35,'Daikin','active'),(36,'Mitsubishi','active')`);
    console.log('✅ 36 thương hiệu.\n');

    // ── JSON templates ──
    const phone = (o) => JSON.stringify({
      hang: o.hang, mau_sac: o.mau||'Đen', bo_nho_trong_gb: o.rom, ram_gb: o.ram,
      man_hinh_inch: o.inch, do_phan_giai: o.res, cong_nghe_man_hinh: o.panel,
      chip: o.chip, pin_mah: o.pin, sac_nhanh_w: o.sac||20, ho_tro_5g: o['5g']!==false,
      camera_sau: o.cam, camera_truoc: o.front||'16MP',
      he_dieu_hanh: o.os, ket_noi: o.usb||'USB-C',
      chong_nuoc: o.ip||'IP68', trong_luong_g: o.kg||200,
      tinh_nang_noi_bat: o.feat||[],
    });

    const laptop = (o) => JSON.stringify({
      hang: o.hang, cpu: o.cpu, ram_gb: o.ram, ram_loai: o.ramtype||'DDR5',
      o_cung_gb: o.ssd, o_cung_loai: o.ssdtype||'NVMe PCIe Gen 4',
      man_hinh_inch: o.inch, do_phan_giai: o.res, tan_so_quet_hz: o.hz||60,
      gpu: o.gpu||'Tích hợp', pin_wh: o.pin, trong_luong_kg: o.kg,
      he_dieu_hanh: o.os, wifi: o.wifi||'Wi-Fi 6E', bluetooth: o.bt||'5.3',
      ket_noi: o.ports||['USB-C','USB-A','HDMI'],
      tinh_nang_noi_bat: o.feat||[],
    });

    const monitor = (o) => JSON.stringify({
      hang: o.hang, kich_thuoc_inch: o.inch, do_phan_giai: o.res, to_le: o.ratio||'16:9',
      cong_nghe: o.panel, tan_so_quet_hz: o.hz, phan_hoi_ms: o.ms||1,
      do_sang_nit: o.nit, gamut: o.gamut||'sRGB 99%',
      ket_noi: o.ports||['HDMI','DisplayPort'],
      chuc_nang: o.feat||[], bao_ve_mat: o.eye||['Flicker-Free','Low Blue Light'],
    });

    const headphone = (o) => JSON.stringify({
      hang: o.hang, loai: o.type, anc: o.anc||false, the_he_anc: o.ancType||'',
      bluetooth: o.bt||'5.3', codec: o.codec||['SBC','AAC'],
      pin_gio: o.pin, sac_nhanh: o.quick||'', da_diem: o.multi||1,
      co_day: o.wired||true, chong_nuoc: o.ip||'',
      trong_luong_g: o.kg, tinh_nang: o.feat||[],
    });

    const tv = (o) => JSON.stringify({
      hang: o.hang, kich_co_inch: o.inch, do_phan_giai: o.res,
      cong_nghe: o.panel, tan_so_hz: o.hz||60,
      hdr: o.hdr||['HDR10'], he_dieu_hanh: o.os,
      chip: o.chip||'AI Processor', am_thanh_w: o.watt, am_thanh: o.sound||'Dolby Atmos',
      ket_noi: o.ports||['HDMI x3','USB x2','Wi-Fi','Bluetooth'],
      smart: o.apps||['Netflix','YouTube','Google Play'],
      noi_bat: o.feat||[],
    });

    const fridge = (o) => JSON.stringify({
      hang: o.hang, dung_tich_lit: o.lit, kieu: o.type,
      cong_nghe: o.tech, ngan_dong_lit: o.freeze, ngan_mat_lit: o.cool,
      nhiet_do_dong: o.tempFreeze||'-18°C đến -22°C',
      nhiet_do_mat: o.tempCool||'2°C đến 5°C',
      kwh_nam: o.kwh, lam_lanh: o.flow||'Multi Air Flow',
      bao_quan: o.feat||[], chong_dong_da: o.noFrost!==false,
      mau: o.color||'Bạc', bao_hanh: { may_nen_nam: o.warranty||10, linh_kien_nam: 2 },
    });

    const ac = (o) => JSON.stringify({
      hang: o.hang, loai: 'Máy lạnh', cong_suat_hp: o.hp, btu: o.btu,
      cong_nghe: o.tech||'Inverter', dien_tich_m2: o.area,
      tiet_kiem: o.star||'5 sao', gas: o.gas||'R-32',
      loc_khi: o.filter||['Bộ lọc bụi PM2.5'], suoi_am: o.heat||false,
      wifi: o.wifi||false, do_on_db: o.db||21,
      bao_hanh: { may_nen_nam: o.warranty||5, linh_kien_nam: 2 },
    });

    const washer = (o) => JSON.stringify({
      hang: o.hang, loai: 'Máy giặt', dung_tich_kg: o.kg, kieu: o.type||'Cửa trước',
      cong_nghe: o.tech||'Inverter', toc_do_vat_rpm: o.rpm||1200,
      so_chuong_trinh: o.programs||16, tiet_kiem_nuoc_lit: o.water,
      do_on_db: o.db||49, wifi: o.wifi||false,
      tinh_nang: o.feat||[], bao_hanh: { dong_co_nam: 10, linh_kien_nam: 2 },
    });

    // ══════════════════════════════════════════════════════╗
    //  100 SẢN PHẨM                                        ║
    // ══════════════════════════════════════════════════════╝
    const products = [

      /* ─── ĐIỆN THOẠI (20 SP) ─── */
      {cat:1,br:1, name:'iPhone 16 Pro Max 256GB',               price:36990000, disc:5,  qty:50,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/iphone-16-pro-max-gold-thumb-600x600.jpg',
       desc: phone({hang:'Apple',rom:256,ram:8,inch:6.9,res:'2868×1320',panel:'Super Retina XDR OLED 120Hz',chip:'A18 Pro',pin:4685,sac:30,cam:'48MP+48MP UW+12MP Tele 5×',front:'12MP',os:'iOS 18',ip:'IP68',feat:['Action Button','Camera Control','ProRes 4K@120fps','Apple Intelligence']})},

      {cat:1,br:1, name:'iPhone 16 128GB',                       price:22990000, disc:3,  qty:80,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/iphone-16-thumb-600x600.jpg',
       desc: phone({hang:'Apple',rom:128,ram:6,inch:6.1,res:'2556×1179',panel:'Super Retina XDR OLED 60Hz',chip:'A16 Bionic',pin:3349,sac:20,cam:'48MP+12MP UW',front:'12MP',os:'iOS 18',feat:['Dynamic Island','USB-C']})},

      {cat:1,br:1, name:'iPhone 15 Plus 128GB',                  price:19990000, disc:8,  qty:60,
       img:'https://cdn.tgdd.vn/Products/Images/42/303191/iphone-15-plus-pink-thumb-1-600x600.jpg',
       desc: phone({hang:'Apple',rom:128,ram:6,inch:6.7,res:'2796×1290',panel:'Super Retina XDR OLED 60Hz',chip:'A16 Bionic',pin:4383,sac:20,cam:'48MP+12MP UW',os:'iOS 17',feat:['Dynamic Island','Crash Detection']})},

      {cat:1,br:2, name:'Samsung Galaxy S25 Ultra 512GB',         price:37990000, disc:6,  qty:40,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/samsung-galaxy-s25-ultra-512gb-thumb-600x600.jpg',
       desc: phone({hang:'Samsung',rom:512,ram:12,inch:6.9,res:'3088×1440',panel:'Dynamic AMOLED 2X 120Hz',chip:'Snapdragon 8 Elite',pin:5000,sac:45,cam:'200MP+50MP UW+10MP Tele+50MP Periscope 5×',front:'12MP',os:'Android 15/One UI 7',feat:['S Pen','Galaxy AI','7 năm update']})},

      {cat:1,br:2, name:'Samsung Galaxy Z Fold 6 256GB',          price:45990000, disc:5,  qty:20,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/samsung-galaxy-z-fold6-thumb-600x600.jpg',
       desc: phone({hang:'Samsung',rom:256,ram:12,inch:7.6,res:'2160×1856',panel:'Dynamic AMOLED 2X 120Hz (gập)',chip:'Snapdragon 8 Gen 3',pin:4400,sac:25,cam:'50MP+10MP Tele+12MP UW',os:'Android 14',feat:['Màn hình gập','S Pen Slim','Galaxy AI','FlexMode']})},

      {cat:1,br:2, name:'Samsung Galaxy A56 5G 128GB',            price:9990000, disc:10, qty:100,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/samsung-galaxy-a56-thumb-600x600.jpg',
       desc: phone({hang:'Samsung',rom:128,ram:8,inch:6.7,res:'2340×1080',panel:'Super AMOLED 120Hz',chip:'Exynos 1580',pin:5000,sac:45,cam:'50MP+12MP UW+5MP Macro',front:'12MP',os:'Android 15',feat:['IP67','Samsung Knox','Video 4K@30fps']})},

      {cat:1,br:3, name:'Xiaomi 15 Ultra 512GB',                  price:28990000, disc:8,  qty:30,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/xiaomi-15-ultra-thumb-600x600.jpg',
       desc: phone({hang:'Xiaomi',rom:512,ram:16,inch:6.73,res:'3200×1440',panel:'LTPO AMOLED 120Hz',chip:'Snapdragon 8 Elite',pin:5000,sac:90,cam:'50MP Leica+50MP UW+50MP Periscope 5×',os:'Android 15/HyperOS 2',feat:['Leica Optics','Sạc 90W','Sạc KD 80W','IP68']})},

      {cat:1,br:3, name:'Xiaomi Redmi Note 14 Pro 256GB',         price:8490000, disc:12,  qty:90,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/xiaomi-redmi-note-14-pro-thumb-600x600.jpg',
       desc: phone({hang:'Xiaomi',rom:256,ram:8,inch:6.67,res:'2712×1220',panel:'AMOLED 120Hz',chip:'Dimensity 8300 Ultra',pin:5110,sac:45,cam:'200MP+8MP UW+2MP Macro',os:'Android 14/HyperOS',feat:['200MP Camera','IP68','Sạc 45W Turbo']})},

      {cat:1,br:4, name:'OPPO Reno 13 Pro 512GB',                 price:17490000, disc:7,  qty:45,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/oppo-reno-13-pro-thumb-600x600.jpg',
       desc: phone({hang:'OPPO',rom:512,ram:12,inch:6.83,res:'2772×1240',panel:'AMOLED LTPO 120Hz',chip:'Dimensity 8350',pin:5600,sac:80,cam:'50MP Sony LYT-600+8MP UW+50MP Tele',os:'Android 15/ColorOS 15',feat:['IP66','Sạc 80W SuperVOOC','AI Eraser']})},

      {cat:1,br:4, name:'OPPO A3 Pro 5G 256GB',                   price:6790000, disc:5,  qty:80,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/oppo-a3-pro-thumb-600x600.jpg',
       desc: phone({hang:'OPPO',rom:256,ram:8,inch:6.7,res:'2400×1080',panel:'AMOLED 90Hz',chip:'Dimensity 6300',pin:5100,sac:45,cam:'50MP+2MP Macro',os:'Android 14/ColorOS 14',ip:'IP69',feat:['IP69 chống bụi nước','Kính cường lực Gorilla Glass 7i']})},

      {cat:1,br:5, name:'Vivo V40 Lite 5G 256GB',                 price:7590000, disc:8,  qty:60,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/vivo-v40-lite-thumb-600x600.jpg',
       desc: phone({hang:'Vivo',rom:256,ram:8,inch:6.78,res:'2392×1080',panel:'AMOLED 90Hz',chip:'Snapdragon 4 Gen 2',pin:5500,sac:44,cam:'50MP+2MP',os:'Android 14/Funtouch OS 14',feat:['Funtouch OS 14','Ổn định video OIS']})},

      {cat:1,br:6, name:'HONOR 200 Pro 5G 512GB',                 price:16990000, disc:10, qty:35,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/honor-200-pro-thumb-600x600.jpg',
       desc: phone({hang:'HONOR',rom:512,ram:12,inch:6.78,res:'2800×1264',panel:'LTPO OLED 120Hz',chip:'Snapdragon 8s Gen 3',pin:5200,sac:100,cam:'50MP+50MP Periscope 3×+12MP UW',os:'Android 14/MagicOS 8',feat:['Harcourt Portrait Mode','Sạc 100W','MagicRing ecosystem','IP65']})},

      {cat:1,br:7, name:'realme GT 7 Pro 5G 256GB',               price:13990000, disc:5,  qty:40,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/realme-gt7-pro-thumb-600x600.jpg',
       desc: phone({hang:'realme',rom:256,ram:12,inch:6.78,res:'2780×1264',panel:'ProXDR AMOLED 120Hz',chip:'Snapdragon 8 Elite',pin:6500,sac:80,cam:'50MP LYT-600+8MP UW+50MP Tele',os:'Android 15/realme UI 6',feat:['Pin 6500mAh lớn nhất tầm giá','Snapdragon 8 Elite rẻ nhất','IP69']})},

      {cat:1,br:8, name:'Nokia G42 5G 128GB',                     price:3990000, disc:5,  qty:150,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/nokia-g42-thumb-600x600.jpg',
       desc: phone({hang:'Nokia',rom:128,ram:6,inch:6.56,res:'1612×720',panel:'LCD 90Hz',chip:'Snapdragon 480+',pin:5000,sac:20,cam:'50MP+2MP UW+2MP Macro',os:'Android 13','5g':true,feat:['Sửa chữa được bởi người dùng','Android One','3 năm update OS','4 năm bảo mật']})},

      {cat:1,br:1, name:'iPhone SE 3rd Gen 64GB',                 price:11990000, disc:5,  qty:40,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/iphone-se3-starlight-thumb-600x600.jpg',
       desc: phone({hang:'Apple',rom:64,ram:4,inch:4.7,res:'1334×750',panel:'Retina HD LCD',chip:'A15 Bionic',pin:2018,sac:20,cam:'12MP Wide',os:'iOS 17',feat:['Touch ID','Nhỏ gọn dễ cầm','Hiệu năng A15 Bionic','MagSafe']})},

      {cat:1,br:2, name:'Samsung Galaxy Z Flip 6 256GB',          price:27490000, disc:5,  qty:25,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/samsung-galaxy-z-flip6-thumb-600x600.jpg',
       desc: phone({hang:'Samsung',rom:256,ram:12,inch:6.7,res:'2640×1080',panel:'Dynamic AMOLED 2X 120Hz (gập)',chip:'Snapdragon 8 Gen 3',pin:4000,sac:25,cam:'50MP+12MP UW',os:'Android 14',feat:['FlexCam tự chụp','FlexMode','Vỏ ngoài nhỏ gọn 3.4 inch','Galaxy AI']})},

      {cat:1,br:3, name:'Xiaomi POCO X7 Pro 5G 256GB',            price:9990000, disc:8,  qty:70,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/xiaomi-poco-x7-pro-thumb-600x600.jpg',
       desc: phone({hang:'Xiaomi',rom:256,ram:8,inch:6.67,res:'2712×1220',panel:'AMOLED 120Hz',chip:'Dimensity 9300+',pin:6000,sac:90,cam:'50MP OIS+8MP UW+2MP',os:'Android 14/MIUI',feat:['Pin 6000mAh','Sạc 90W Turbo','IP68 giá rẻ']})},

      {cat:1,br:4, name:'OPPO Find X8 Pro 256GB',                 price:27990000, disc:6,  qty:30,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/oppo-find-x8-pro-thumb-600x600.jpg',
       desc: phone({hang:'OPPO',rom:256,ram:16,inch:6.78,res:'2780×1264',panel:'Dual LTPO AMOLED 120Hz',chip:'Dimensity 9400',pin:5910,sac:80,cam:'50MP Hasselblad+50MP UW+50MP Periscope 6×',os:'Android 15/ColorOS 15',ip:'IP69',feat:['Hasselblad Tuning','Pin 5910mAh','IP69']})},

      {cat:1,br:5, name:'Vivo X200 Pro 256GB',                     price:24990000, disc:5,  qty:25,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/vivo-x200-pro-thumb-600x600.jpg',
       desc: phone({hang:'Vivo',rom:256,ram:16,inch:6.78,res:'2800×1260',panel:'LTPO AMOLED 120Hz',chip:'Dimensity 9400',pin:6000,sac:90,cam:'50MP Sony LYT818+50MP UW+200MP Periscope Zeiss 8×',os:'Android 15/OriginOS 5',feat:['Zeiss 200MP Tele','Pin 6000mAh','Sạc 90W']})},

      {cat:1,br:6, name:'HONOR Magic 7 Pro 5G 512GB',             price:22990000, disc:8,  qty:30,
       img:'https://cdn.tgdd.vn/Products/Images/42/329149/honor-magic7-pro-thumb-600x600.jpg',
       desc: phone({hang:'HONOR',rom:512,ram:16,inch:6.8,res:'2800×1280',panel:'LTPO OLED 120Hz',chip:'Kirin 9020',pin:5270,sac:80,cam:'50MP Aperture+40MP UW+200MP Periscope',os:'Android 14/MagicOS 9',ip:'IP68',feat:['AI SuperZoom 200MP','Sạc KD 80W','Kirin 9020 AI Chip']})},

      /* ─── LAPTOP (20 SP) ─── */
      {cat:2,br:1,  name:'MacBook Pro M4 Pro 14 inch 24GB/512GB', price:54990000, disc:3, qty:15,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/macbook-pro-m4-pro-14-inch-thumb-600x600.jpg',
       desc: laptop({hang:'Apple',cpu:'Apple M4 Pro (12 nhân)',ram:24,ramtype:'LPDDR5 Unified',ssd:512,ssdtype:'Apple SSD',inch:14.2,res:'3024×1964 Liquid Retina XDR',hz:120,gpu:'20-core GPU',pin:72,kg:1.61,os:'macOS Sequoia',ports:['Thunderbolt 4 ×3','HDMI 2.1','SD Card','MagSafe 3'],feat:['ProMotion 120Hz','Notch ProMotion','M4 Pro Neural Engine','Fan hoạt động êm']})},

      {cat:2,br:1,  name:'MacBook Air M3 13 inch 16GB/512GB',     price:34990000, disc:5, qty:25,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/macbook-air-m3-13-midnight-thumb-600x600.jpg',
       desc: laptop({hang:'Apple',cpu:'Apple M3 (8 nhân)',ram:16,ramtype:'Unified Memory',ssd:512,ssdtype:'Apple SSD',inch:13.6,res:'2560×1664 Liquid Retina',hz:60,gpu:'10-core GPU',pin:52,kg:1.24,os:'macOS Sonoma',ports:['Thunderbolt 3 ×2','MagSafe 3'],feat:['Không quạt siêu yên tĩnh','18 giờ pin','Skylight architecture M3']})},

      {cat:2,br:9,  name:'Dell XPS 16 9640 Core Ultra 7 165H RTX 4070', price:52990000, disc:4, qty:10,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/dell-xps-16-9640-thumb-600x600.jpg',
       desc: laptop({hang:'Dell',cpu:'Intel Core Ultra 7 165H (22 nhân)',ram:32,ssd:1024,inch:16.3,res:'3840×2400 OLED',hz:120,gpu:'NVIDIA RTX 4070 8GB',pin:99.5,kg:1.86,os:'Windows 11 Pro',wifi:'Wi-Fi 6E',feat:['OLED 4K+ siêu đẹp','Thunderbolt 4','Thiết kế mỏng nhẹ cao cấp']})},

      {cat:2,br:9,  name:'Dell Inspiron 16 5630 Core i7-1360P',   price:22990000, disc:8, qty:30,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/dell-inspiron-16-5630-thumb-600x600.jpg',
       desc: laptop({hang:'Dell',cpu:'Intel Core i7-1360P (12 nhân, 5.0GHz)',ram:16,ssd:512,inch:16,res:'1920×1200 IPS',hz:120,gpu:'Intel Iris Xe',pin:54,kg:1.88,os:'Windows 11',feat:['Màn hình 16:10 rộng thoải mái','Comfortview Plus giảm ánh sáng xanh']})},

      {cat:2,br:10, name:'HP Pavilion 15 Core i7-11th RTX 3050',  price:18990000, disc:10, qty:20,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/hp-pavilion-15-2023-thumb-600x600.jpg',
       desc: laptop({hang:'HP',cpu:'Intel Core i7-1255U (10 nhân)',ram:16,ssd:512,inch:15.6,res:'1920×1080 IPS',hz:60,gpu:'NVIDIA GTX 1650 4GB',pin:41,kg:1.75,os:'Windows 11',feat:['RTX 3050 Gaming entry','HP Fast Charge 50% trong 45 phút']})},

      {cat:2,br:10, name:'HP Envy x360 14 Core Ultra 7 155U OLED', price:29990000, disc:7, qty:18,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/hp-envy-x360-14-thumb-600x600.jpg',
       desc: laptop({hang:'HP',cpu:'Intel Core Ultra 7 155U (12 nhân)',ram:32,ssd:1024,inch:14,res:'2880×1800 OLED',hz:90,gpu:'Intel Arc Graphics',pin:66,kg:1.5,os:'Windows 11',feat:['OLED 2.8K cảm ứng 90Hz','Xoay gập 360°','Bút HP MPP 2.0']})},

      {cat:2,br:11, name:'ASUS Zenbook 14 OLED UX3405 Core Ultra 9', price:36990000, disc:5, qty:15,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/asus-zenbook-14-oled-ux3405-thumb-600x600.jpg',
       desc: laptop({hang:'ASUS',cpu:'Intel Core Ultra 9 185H (22 nhân)',ram:32,ssd:1024,inch:14,res:'2880×1800 OLED',hz:120,gpu:'NVIDIA RTX 4070',pin:75,kg:1.45,os:'Windows 11',feat:['Màn OLED 120Hz mỏng nhất','ASUS AI AiSense camera','MIL-SPEC túi đồng tốt']})},

      {cat:2,br:11, name:'ASUS TUF Gaming F15 i7-12700H RTX 4060', price:28990000, disc:8, qty:25,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/asus-tuf-gaming-f15-rtx4060-thumb-600x600.jpg',
       desc: laptop({hang:'ASUS',cpu:'Intel Core i7-12700H (14 nhân)',ram:16,ssd:512,inch:15.6,res:'1920×1080 IPS',hz:144,gpu:'NVIDIA RTX 4060 8GB',pin:90,kg:2.2,os:'Windows 11',feat:['RTX 4060 gaming tầm trung','TUF Cooling siêu bền','MIL-SPEC 810H 7 tiêu chuẩn']})},

      {cat:2,br:12, name:'Acer Aspire 5 A515 Core i5-1235U MX550', price:17490000, disc:10, qty:35,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/acer-aspire-5-a515-thumb-600x600.jpg',
       desc: laptop({hang:'Acer',cpu:'Intel Core i5-1235U (10 nhân)',ram:8,ssd:512,inch:15.6,res:'1920×1080 IPS',hz:60,gpu:'NVIDIA MX550 2GB',pin:57,kg:1.8,os:'Windows 11',feat:['Giá phổ thông tốt nhất','Thunderbolt 4','OAK-D Lite Webcam HD']})},

      {cat:2,br:12, name:'Acer Nitro 17 AN517 i7-13700HX RTX 4060', price:32990000, disc:6, qty:20,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/acer-nitro-17-rtx4060-thumb-600x600.jpg',
       desc: laptop({hang:'Acer',cpu:'Intel Core i7-13700HX (16 nhân)',ram:16,ssd:512,inch:17.3,res:'1920×1080 IPS',hz:165,gpu:'NVIDIA RTX 4060 8GB',pin:90,kg:2.9,os:'Windows 11',feat:['Màn 165Hz gaming','Bàn phím đèn RGB 4 vùng','NitroSense thermal management']})},

      {cat:2,br:13, name:'Lenovo IdeaPad Slim 5 Core Ultra 5 125H OLED', price:21990000, disc:7, qty:28,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/lenovo-ideapad-slim-5-oled-thumb-600x600.jpg',
       desc: laptop({hang:'Lenovo',cpu:'Intel Core Ultra 5 125H (14 nhân)',ram:16,ssd:512,inch:14,res:'2880×1800 OLED',hz:60,gpu:'Intel Arc Graphics',pin:70,kg:1.46,os:'Windows 11',feat:['OLED 2.8K sắc nét vượt trội','Siêu mỏng 1.46kg','AI PC hỗ trợ Copilot']})},

      {cat:2,br:13, name:'Lenovo LOQ 15 i7-13650HX RTX 4060',     price:25990000, disc:8, qty:22,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/lenovo-loq-15-rtx4060-thumb-600x600.jpg',
       desc: laptop({hang:'Lenovo',cpu:'Intel Core i7-13650HX (14 nhân)',ram:16,ssd:512,inch:15.6,res:'1920×1080 IPS',hz:144,gpu:'NVIDIA RTX 4060 8GB',pin:80,kg:2.4,os:'Windows 11',feat:['LOQ Coldfront 5.0 tản nhiệt','Hybrid Mode pin','Game mượt RTX 4060']})},

      {cat:2,br:14, name:'MSI Raider GE78 HX i9-14900HX RTX 4080', price:72990000, disc:3, qty:8,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/msi-raider-ge78-hx-thumb-600x600.jpg',
       desc: laptop({hang:'MSI',cpu:'Intel Core i9-14900HX (24 nhân)',ram:32,ssd:2048,inch:17,res:'2560×1600 QHD IPS',hz:240,gpu:'NVIDIA RTX 4080 16GB',pin:99.9,kg:3.1,os:'Windows 11 Pro',feat:['QHD 240Hz gaming đỉnh cao','RTX 4080 full power','RGB SteelSeries keyboard']})},

      {cat:2,br:14, name:'MSI Cyborg 15 A12VF Core i7-12650H RTX 4060', price:24990000, disc:6, qty:18,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/msi-cyborg-15-thumb-600x600.jpg',
       desc: laptop({hang:'MSI',cpu:'Intel Core i7-12650H (10 nhân)',ram:16,ssd:512,inch:15.6,res:'1920×1080 IPS',hz:144,gpu:'NVIDIA RTX 4060 8GB',pin:53.5,kg:2.15,os:'Windows 11',feat:['Thiết kế trong suốt độc lạ','MSI Center AI','Phím tắt tùy chỉnh']})},

      {cat:2,br:1,  name:'MacBook Air M2 15 inch 8GB/256GB',      price:28990000, disc:7, qty:20,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/macbook-air-m2-15-starlight-thumb-600x600.jpg',
       desc: laptop({hang:'Apple',cpu:'Apple M2 (8 nhân)',ram:8,ramtype:'Unified Memory',ssd:256,ssdtype:'Apple SSD',inch:15.3,res:'2880×1864 Liquid Retina',hz:60,gpu:'10-core GPU',pin:66,kg:1.51,os:'macOS Sonoma',feat:['15 inch không quạt đầu tiên','18 giờ pin','Không gian 6 loa phong phú']})},

      {cat:2,br:9,  name:'Dell Vostro 3530 Core i7-1355U',        price:16990000, disc:12, qty:30,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/dell-vostro-3530-thumb-600x600.jpg',
       desc: laptop({hang:'Dell',cpu:'Intel Core i7-1355U (10 nhân)',ram:16,ssd:512,inch:15.6,res:'1920×1080 IPS',hz:120,gpu:'NVIDIA MX550 2GB',pin:41,kg:1.86,os:'Windows 11 Pro',feat:['Dành cho doanh nghiệp vừa/nhỏ','Dell Optimizer AI','Bảo hành 3 năm tận nơi']})},

      {cat:2,br:11, name:'ASUS ExpertBook B9 OLED Core Ultra 7 165U', price:42990000, disc:4, qty:10,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/asus-expertbook-b9-oled-thumb-600x600.jpg',
       desc: laptop({hang:'ASUS',cpu:'Intel Core Ultra 7 165U (12 nhân)',ram:32,ssd:1024,inch:14,res:'2880×1800 OLED',hz:60,gpu:'Intel Graphics',pin:63,kg:0.98,os:'Windows 11 Pro',feat:['Siêu nhẹ chỉ 0.98kg','OLED 2.8K ProArt','Bảo mật IR Camera + Fingerprint']})},

      {cat:2,br:13, name:'Lenovo ThinkBook 14 G6 Core Ultra 5 125U', price:18990000, disc:8, qty:25,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/lenovo-thinkbook-14-g6-thumb-600x600.jpg',
       desc: laptop({hang:'Lenovo',cpu:'Intel Core Ultra 5 125U (12 nhân)',ram:16,ssd:512,inch:14,res:'1920×1200 IPS',hz:60,gpu:'Intel Graphics',pin:60,kg:1.46,os:'Windows 11',feat:['ThinkShutter webcam bảo mật','Wi-Fi 6E kết nối nhanh','Backlit keyboard']})},

      {cat:2,br:10, name:'HP Victus 16 Core i7-13700H RTX 4060',  price:24490000, disc:5, qty:22,
       img:'https://cdn.tgdd.vn/Products/Images/44/329149/hp-victus-16-rtx4060-thumb-600x600.jpg',
       desc: laptop({hang:'HP',cpu:'Intel Core i7-13700H (14 nhân)',ram:16,ssd:512,inch:16.1,res:'1920×1080 IPS',hz:144,gpu:'NVIDIA RTX 4060 8GB',pin:70,kg:2.29,os:'Windows 11',feat:['HP ThermalSense AI tản nhiệt','OMEN Gaming Hub','Phím tắt game nhanh']})},

      /* ─── MÀN HÌNH (15 SP) ─── */
      {cat:3,br:2,  name:'Samsung Odyssey OLED G8 34" 175Hz 0.03ms', price:18990000, disc:8, qty:15,
       img:'https://cdn.tgdd.vn/Products/Images/522/329149/samsung-odyssey-oled-g8-34-thumb-600x600.jpg',
       desc: monitor({hang:'Samsung',inch:34,res:'3440×1440 UWQHD OLED',ratio:'21:9',panel:'OLED QD Cong 1800R',hz:175,ms:0.03,nit:250,gamut:'DCI-P3 99.3%',ports:['HDMI 2.1','DP 1.4','USB-C 90W','Thunderbolt 4'],feat:['QD-OLED tự phát sáng','0.03ms tốc độ cực nhanh','G-Sync Compatible','Quantum HDR OLED']})},

      {cat:3,br:2,  name:'Samsung ViewFinity S9 27" 4K UHD',       price:14990000, disc:7, qty:12,
       img:'https://cdn.tgdd.vn/Products/Images/522/329149/samsung-viewfinity-s9-27-thumb-600x600.jpg',
       desc: monitor({hang:'Samsung',inch:27,res:'3840×2160 4K UHD',ratio:'16:9',panel:'IPS Phẳng',hz:60,ms:5,nit:600,gamut:'DCI-P3 99%',ports:['HDMI 2.0 ×2','DP 1.4','USB-C 90W'],feat:['4K Creative Profesional','Thunderbolt 4 Hub','Calman Verified']})},

      {cat:3,br:9,  name:'Dell UltraSharp U2723QE 27" 4K USB-C Hub', price:13990000, disc:5, qty:15,
       img:'https://cdn.tgdd.vn/Products/Images/522/329149/dell-ultrasharp-u2723qe-thumb-600x600.jpg',
       desc: monitor({hang:'Dell',inch:27,res:'3840×2160 4K UHD',ratio:'16:9',panel:'IPS Black Phẳng',hz:60,ms:5,nit:400,gamut:'DCI-P3 95%',ports:['HDMI 2.0','DP 1.4','USB-C 90W','USB-A ×4'],feat:['IPS Black độ tương phản cao 2000:1','Calman Verified màu sắc thật','Tích hợp USB Hub 7 cổng']})},

      {cat:3,br:11, name:'ASUS ROG Swift OLED PG34WCDM 34" 240Hz', price:19990000, disc:6, qty:10,
       img:'https://cdn.tgdd.vn/Products/Images/522/329149/asus-rog-swift-oled-pg34wcdm-thumb-600x600.jpg',
       desc: monitor({hang:'ASUS',inch:34,res:'3440×1440 QD-OLED',ratio:'21:9',panel:'QD-OLED Cong 1800R',hz:240,ms:0.03,nit:1000,gamut:'DCI-P3 99.3%',ports:['HDMI 2.1','DP 1.4','USB-C','USB Hub'],feat:['240Hz QD-OLED siêu mượt','G-SYNC Ultimate','Heatsink ROG tản nhiệt','DisplayHDR 1000']})},

      {cat:3,br:11, name:'ASUS ProArt Display PA32UCG-K 32" 4K 144Hz', price:24990000, disc:5, qty:8,
       img:'https://cdn.tgdd.vn/Products/Images/522/329149/asus-proart-pa32ucg-k-thumb-600x600.jpg',
       desc: monitor({hang:'ASUS',inch:32,res:'3840×2160 4K UHD IPS',ratio:'16:9',panel:'IPS Mini LED',hz:144,ms:1,nit:1200,gamut:'DCI-P3 99%, Adobe RGB 95%',ports:['HDMI 2.1 ×2','DP 1.4','Thunderbolt 3 ×2','USB-A ×4'],feat:['Mini LED 1152 vùng','DisplayHDR 1400','Hardware Calibration','Calman Verified']})},

      {cat:3,br:11, name:'ASUS TUF Gaming VG27AQ3A 27" QHD 180Hz', price:7990000, disc:10, qty:30,
       img:'https://cdn.tgdd.vn/Products/Images/522/329149/asus-tuf-gaming-vg27aq3a-thumb-600x600.jpg',
       desc: monitor({hang:'ASUS',inch:27,res:'2560×1440 QHD',ratio:'16:9',panel:'IPS Phẳng',hz:180,ms:1,nit:350,gamut:'sRGB 99%',ports:['HDMI 2.0 ×2','DP 1.2'],feat:['180Hz gaming tầm trung','ELMB-Sync chống mờ','AMD FreeSync Premium Pro']})},

      {cat:3,br:14, name:'MSI MAG 274QRF QD 27" QHD 165Hz QD',    price:9490000, disc:8, qty:20,
       img:'https://cdn.tgdd.vn/Products/Images/522/329149/msi-mag-274qrf-qd-thumb-600x600.jpg',
       desc: monitor({hang:'MSI Monitor',inch:27,res:'2560×1440 QHD',ratio:'16:9',panel:'Rapid IPS QD',hz:165,ms:1,nit:400,gamut:'DCI-P3 97%',ports:['HDMI 2.0 ×2','DP 1.2a','USB Hub'],feat:['Quantum Dot màu sắc sống động','Night Vision chỉnh màu tối','MSI Center OSD']})},

      {cat:3,br:18, name:'GIGABYTE AORUS FO32U2P 32" 4K OLED 240Hz', price:21990000, disc:5, qty:8,
       img:'https://cdn.tgdd.vn/Products/Images/522/329149/gigabyte-aorus-fo32u2p-thumb-600x600.jpg',
       desc: monitor({hang:'GIGABYTE',inch:32,res:'3840×2160 4K QD-OLED',ratio:'16:9',panel:'QD-OLED Phẳng',hz:240,ms:0.03,nit:800,gamut:'DCI-P3 99%',ports:['HDMI 2.1 ×2','DP 2.1','USB-C 90W','USB-A ×3'],feat:['4K OLED 240Hz duy nhất thị trường','DisplayHDR 800','G-SYNC Compatible + FreeSync']})},

      {cat:3,br:16, name:'BenQ PD3220U 32" 4K Designer',           price:16490000, disc:5, qty:10,
       img:'https://cdn.tgdd.vn/Products/Images/522/329149/benq-pd3220u-thumb-600x600.jpg',
       desc: monitor({hang:'BenQ',inch:32,res:'3840×2160 4K UHD',ratio:'16:9',panel:'IPS Phẳng',hz:60,ms:5,nit:350,gamut:'DCI-P3 95%',ports:['HDMI 2.0 ×2','DP 1.4','Thunderbolt 3 ×2','USB-A ×4'],feat:['Calman Verified Factory','KVM Switch 2 PC','Darkroom Mode thiết kế']})},

      {cat:3,br:12, name:'Acer Nitro XV322QK V3 32" 4K 160Hz',     price:8990000, disc:7, qty:20,
       img:'https://cdn.tgdd.vn/Products/Images/522/329149/acer-nitro-xv322qk-v3-thumb-600x600.jpg',
       desc: monitor({hang:'Acer',inch:32,res:'3840×2160 4K UHD',ratio:'16:9',panel:'IPS Phẳng',hz:160,ms:1,nit:400,gamut:'sRGB 99%, DCI-P3 90%',ports:['HDMI 2.0 ×2','DP 1.4','USB Hub'],feat:['4K 160Hz gaming giá tốt','AMD FreeSync Premium','VESA DisplayHDR 400']})},

      {cat:3,br:12, name:'Acer Predator XB323U GX 32" QHD 270Hz',  price:12990000, disc:6, qty:12,
       img:'https://cdn.tgdd.vn/Products/Images/522/329149/acer-predator-xb323u-gx-thumb-600x600.jpg',
       desc: monitor({hang:'Acer',inch:32,res:'2560×1440 QHD IPS',ratio:'16:9',panel:'IPS Phẳng Fast',hz:270,ms:0.5,nit:600,gamut:'DCI-P3 95%',ports:['HDMI 2.0 ×2','DP 1.4','USB-C','USB Hub'],feat:['270Hz gaming siêu mượt','NVIDIA G-Sync Compatible','HDR600']})},

      {cat:3,br:2,  name:'Samsung Odyssey G5 S34AG55 34" UWQHD 165Hz', price:9990000, disc:10, qty:20,
       img:'https://cdn.tgdd.vn/Products/Images/522/329149/samsung-odyssey-g5-34-s34ag55-thumb-600x600.jpg',
       desc: monitor({hang:'Samsung',inch:34,res:'3440×1440 UWQHD',ratio:'21:9',panel:'VA Cong 1000R',hz:165,ms:1,nit:350,gamut:'sRGB 99%',ports:['HDMI 2.0','DP 1.2'],feat:['1000R Cong cực mạnh','AMD FreeSync Premium','HDR10 tối ưu']})},

      {cat:3,br:16, name:'BenQ EX3210U 32" 4K 144Hz',               price:14990000, disc:6, qty:12,
       img:'https://cdn.tgdd.vn/Products/Images/522/329149/benq-ex3210u-thumb-600x600.jpg',
       desc: monitor({hang:'BenQ',inch:32,res:'3840×2160 4K UHD',ratio:'16:9',panel:'IPS Phẳng',hz:144,ms:1,nit:600,gamut:'DCI-P3 95%',ports:['HDMI 2.1 ×2','DP 1.4','USB-C 65W'],feat:['144Hz 4K gaming','VESA HDR 600','Brightness Intelligence+']})},

      {cat:3,br:11, name:'ASUS VG279QM 27" FHD 280Hz G-Sync',       price:6990000, disc:8, qty:30,
       img:'https://cdn.tgdd.vn/Products/Images/522/329149/asus-vg279qm-thumb-600x600.jpg',
       desc: monitor({hang:'ASUS',inch:27,res:'1920×1080 FHD',ratio:'16:9',panel:'IPS Fast Phẳng',hz:280,ms:1,nit:400,gamut:'sRGB 99%',ports:['HDMI 2.0 ×2','DP 1.2'],feat:['280Hz tốc độ gaming cao nhất tầm giá','ELMB+G-Sync Compatible','HDR10']})},

      {cat:3,br:9,  name:'Dell Alienware AW3423DW 34" QD-OLED 175Hz', price:28990000, disc:5, qty:8,
       img:'https://cdn.tgdd.vn/Products/Images/522/329149/dell-alienware-aw3423dw-thumb-600x600.jpg',
       desc: monitor({hang:'Dell',inch:34,res:'3440×1440 QD-OLED Cong 1800R',ratio:'21:9',panel:'QD-OLED Cong',hz:175,ms:0.1,nit:1000,gamut:'DCI-P3 99.3%',ports:['HDMI 2.0 ×2','DP 1.4','USB-C','USB Hub'],feat:['NVIDIA G-Sync Ultimate','AlienVision Cheat Sheet','DisplayHDR 1000']})},

      /* ─── TAI NGHE (15 SP) ─── */
      {cat:4,br:1,  name:'AirPods Pro 2nd Gen USB-C',               price:6990000, disc:5, qty:60,
       img:'https://cdn.tgdd.vn/Products/Images/54/329149/airpods-pro-2nd-gen-usbc-thumb-600x600.jpg',
       desc: headphone({hang:'Apple',type:'In-ear TWS',anc:true,ancType:'Adaptive ANC thế hệ 2',bt:'5.3',codec:['AAC','Apple Lossless'],pin:6,pinCase:30,quick:'5 phút = 1.5 giờ',multi:2,ip:'IP54',kg:5.3,feat:['Personalized Spatial Audio','Adaptive Transparency','Find My','USB-C MagSafe Case']})},

      {cat:4,br:20, name:'JBL Live Pro 2 TWS ANC',                  price:2990000, disc:8, qty:80,
       img:'https://cdn.tgdd.vn/Products/Images/54/329149/jbl-live-pro-2-tws-thumb-600x600.jpg',
       desc: headphone({hang:'JBL',type:'In-ear TWS',anc:true,ancType:'True Adaptive ANC 4 mic',bt:'5.3',codec:['SBC','AAC'],pin:10,pinCase:30,quick:'10 phút = 2 giờ',multi:2,ip:'IPX5',kg:6.1,feat:['JBL Spatial Sound','6 mic Voice Focus','Auto-play/pause khi tháo']})},

      {cat:4,br:19, name:'Sony WH-1000XM5 Over-ear ANC',            price:7990000, disc:10, qty:45,
       img:'https://cdn.tgdd.vn/Products/Images/54/329149/sony-wh-1000xm5-black-thumb-600x600.jpg',
       desc: headphone({hang:'Sony',type:'Over-ear không dây',anc:true,ancType:'QN1e + HD QN1 8 mic',bt:'5.2',codec:['SBC','AAC','LDAC'],pin:30,quick:'3 phút = 3 giờ',multi:2,wired:true,ip:'',kg:250,feat:['Speak-to-Chat','Ambient Sound','DSEE Extreme Hi-Res','Adaptive Equalizer']})},

      {cat:4,br:19, name:'Sony WF-1000XM5 TWS ANC',                 price:5490000, disc:8, qty:55,
       img:'https://cdn.tgdd.vn/Products/Images/54/329149/sony-wf-1000xm5-black-thumb-600x600.jpg',
       desc: headphone({hang:'Sony',type:'In-ear TWS',anc:true,ancType:'QN2e Processor V2',bt:'5.3',codec:['SBC','AAC','LDAC','LC3'],pin:8,pinCase:24,quick:'5 phút = 60 phút',multi:2,ip:'IPX4',kg:5.9,feat:['ANC tốt nhất TWS','LDAC Hi-Res Wireless','Speak-to-Chat','Tiny form factor']})},

      {cat:4,br:21, name:'Sennheiser Momentum 4 ANC 60 giờ',        price:8490000, disc:7, qty:25,
       img:'https://cdn.tgdd.vn/Products/Images/54/329149/sennheiser-momentum-4-thumb-600x600.jpg',
       desc: headphone({hang:'Sennheiser',type:'Over-ear không dây',anc:true,ancType:'Adaptive Noise Cancelling',bt:'5.2',codec:['SBC','AAC','aptX','aptX Adaptive'],pin:60,quick:'10 phút = 4 giờ',multi:2,wired:true,ip:'',kg:293,feat:['Pin 60 giờ dài nhất','aptX Adaptive chất lượng cao','Smart Pause khi tháo ra','Vật liệu da cao cấp']})},

      {cat:4,br:21, name:'Sennheiser IE 300 IEM Hi-Fi',             price:5990000, disc:5, qty:20,
       img:'https://cdn.tgdd.vn/Products/Images/54/329149/sennheiser-ie-300-thumb-600x600.jpg',
       desc: headphone({hang:'Sennheiser',type:'In-ear có dây IEM',anc:false,ancType:'',bt:'',codec:['3.5mm + 4.4mm'],pin:0,quick:'',multi:1,wired:true,ip:'',kg:18,feat:['Driver XWB 7mm Premium','Resonance Damping','Chi tiết âm thanh audiophile','Khử méo thấp 0.08%']})},

      {cat:4,br:22, name:'Marshall Motif II ANC TWS',               price:3490000, disc:6, qty:40,
       img:'https://cdn.tgdd.vn/Products/Images/54/329149/marshall-motif-ii-anc-thumb-600x600.jpg',
       desc: headphone({hang:'Marshall',type:'In-ear TWS',anc:true,ancType:'Hybrid ANC 2 mic',bt:'5.3',codec:['SBC','AAC','aptX'],pin:6,pinCase:24,quick:'',multi:2,ip:'IPX5',kg:5.4,feat:['Guitar-inspired design','Marshall Signature Sound','Customizable EQ in app']})},

      {cat:4,br:22, name:'Marshall Major V On-ear 100 giờ',          price:3190000, disc:5, qty:35,
       img:'https://cdn.tgdd.vn/Products/Images/54/329149/marshall-major-v-thumb-600x600.jpg',
       desc: headphone({hang:'Marshall',type:'On-ear không dây',anc:false,ancType:'',bt:'5.3',codec:['SBC','AAC'],pin:100,quick:'',multi:2,wired:true,ip:'',kg:213,feat:['Pin 100 giờ kỷ lục','Fold-flat thiết kế','Custom EQ','Marshall Classic Sound']})},

      {cat:4,br:23, name:'Soundcore Liberty 4 NC TWS ANC',           price:1890000, disc:10, qty:90,
       img:'https://cdn.tgdd.vn/Products/Images/54/329149/soundcore-liberty-4-nc-thumb-600x600.jpg',
       desc: headphone({hang:'Soundcore',type:'In-ear TWS',anc:true,ancType:'ACAA 2 Platform ANC 98.5%',bt:'5.3',codec:['SBC','AAC','LDAC'],pin:9,pinCase:41,quick:'8 phút = 4 giờ',multi:2,ip:'IP55',kg:5,feat:['ANC 98.5% mạnh nhất tầm giá','LDAC Hi-Res Wireless','HearID AI cá nhân hóa âm thanh','Giá phải chăng nhất với LDAC']})},

      {cat:4,br:23, name:'Soundcore Q45 Over-ear ANC 50 giờ',        price:1490000, disc:8, qty:100,
       img:'https://cdn.tgdd.vn/Products/Images/54/329149/soundcore-q45-thumb-600x600.jpg',
       desc: headphone({hang:'Soundcore',type:'Over-ear không dây',anc:true,ancType:'Adaptive ANC 4-mic Wind Noise',bt:'5.3',codec:['SBC','AAC'],pin:50,quick:'5 phút = 4 giờ',multi:2,wired:true,ip:'',kg:250,feat:['Pin 50 giờ với ANC tốt nhất tầm giá','ANC có thể tùy chỉnh','Hi-Res Audio Certified']})},

      {cat:4,br:24, name:'AKG K92 Over-ear Studio Monitor',          price:1290000, disc:5, qty:40,
       img:'https://cdn.tgdd.vn/Products/Images/54/329149/akg-k92-thumb-600x600.jpg',
       desc: headphone({hang:'AKG',type:'Over-ear có dây Studio',anc:false,ancType:'',bt:'',codec:['3.5mm'],pin:0,multi:1,wired:true,ip:'',kg:190,feat:['Driver 40mm vòm lớn','Monitortesting studio chuyên nghiệp','Fold-flat portable','AKG Reference Class Sound']})},

      {cat:4,br:19, name:'Sony LinkBuds S WF-LS900N',                price:3490000, disc:7, qty:50,
       img:'https://cdn.tgdd.vn/Products/Images/54/329149/sony-linkbuds-s-thumb-600x600.jpg',
       desc: headphone({hang:'Sony',type:'In-ear TWS Hybrid',anc:true,ancType:'LinkBuds S ANC 5 mic',bt:'5.2',codec:['SBC','AAC','LDAC'],pin:6,pinCase:14,quick:'5 phút = 60 phút',multi:2,ip:'IPX4',kg:4.8,feat:['Siêu nhẹ 4.8g đội cả ngày','LDAC Hi-Res','V1 Integrated Processor','Ambient Sound+Speak-to-Chat']})},

      {cat:4,br:20, name:'JBL Club 950NC Over-ear ANC 55 giờ',      price:4990000, disc:8, qty:30,
       img:'https://cdn.tgdd.vn/Products/Images/54/329149/jbl-club-950nc-thumb-600x600.jpg',
       desc: headphone({hang:'JBL',type:'Over-ear không dây',anc:true,ancType:'ANC Adaptive 3-mic',bt:'5.0',codec:['SBC','AAC'],pin:55,quick:'5 phút = 2 giờ',multi:2,wired:true,ip:'',kg:280,feat:['Amazon Alexa / Google built-in','Sidetone cho call','JBL Personi-Fi cá nhân hóa','VoiceAware tự nghe giọng mình']})},

      {cat:4,br:21, name:'Sennheiser HD 560S Open-back',             price:3190000, disc:5, qty:20,
       img:'https://cdn.tgdd.vn/Products/Images/54/329149/sennheiser-hd-560s-thumb-600x600.jpg',
       desc: headphone({hang:'Sennheiser',type:'Over-ear có dây Open-back',anc:false,bt:'',codec:['3.5mm + 6.3mm'],pin:0,multi:1,wired:true,ip:'',kg:240,feat:['Soundstage mở tuyệt hảo','Driver 38mm neodymium','Đánh giá audiophile A+','Âm thanh tự nhiên nhất tầm giá']})},

      {cat:4,br:1,  name:'AirPods Max USB-C Space Black',            price:15990000, disc:3, qty:15,
       img:'https://cdn.tgdd.vn/Products/Images/54/329149/airpods-max-usbc-thumb-600x600.jpg',
       desc: headphone({hang:'Apple',type:'Over-ear không dây',anc:true,ancType:'Adaptive ANC Computational H1 chip',bt:'5.0',codec:['AAC'],pin:20,quick:'5 phút = 1.5 giờ',multi:2,wired:false,ip:'',kg:385,feat:['Personalized Spatial Audio 3D','Adaptive Transparency','Ultra-premium build aluminum','lossless với Apple TV 4K']})},

      /* ─── TIVI (15 SP) ─── */
      {cat:5,br:2,  name:'Samsung MicroLED 4K 110" The Wall ML110CB', price:279000000, disc:0, qty:2,
       img:'https://cdn.tgdd.vn/Products/Images/1942/329149/samsung-microled-110-thumb-600x600.jpg',
       desc: tv({hang:'Samsung',inch:110,res:'3840×2160 4K',panel:'MicroLED Tự phát sáng',hz:120,hdr:['HDR10+'],os:'Tizen OS',chip:'Samsung Processor',watt:320,apps:['Premium SmartThings Hub'],feat:['Thiên hà điểm ảnh MicroLED','Không viền bezeless','Tuổi thọ 100.000 giờ','Modular cho kích thước tùy biến']})},

      {cat:5,br:2,  name:'Samsung OLED S95D 65" 4K 120Hz 2024',      price:34990000, disc:8, qty:8,
       img:'https://cdn.tgdd.vn/Products/Images/1942/329149/samsung-oled-s95d-65-thumb-600x600.jpg',
       desc: tv({hang:'Samsung',inch:65,res:'3840×2160 4K',panel:'QD-OLED (tự phát sáng)',hz:120,hdr:['HDR10+','HLG'],os:'Tizen OS 8',chip:'Neural Quantum Processor 4K',watt:60,sound:'Object Tracking Sound+',apps:['Gaming Hub','TV Plus','SmartThings','AirPlay 2'],feat:['Đen tuyệt đối OLED','Màu QLED chói lọi','Motion Xcelerator 120Hz']})},

      {cat:5,br:19, name:'Sony Bravia 9 QLED 4K 75" 2024',           price:68990000, disc:5, qty:5,
       img:'https://cdn.tgdd.vn/Products/Images/1942/329149/sony-bravia-9-75-thumb-600x600.jpg',
       desc: tv({hang:'Sony',inch:75,res:'3840×2160 4K',panel:'QLED Mini LED (Backlit XR)',hz:120,hdr:['Dolby Vision IQ','HDR10','HLG'],os:'Google TV',chip:'XR Cognitive Processor',watt:100,sound:'Acoustic Multi-Audio (Dolby Atmos)',apps:['Google Assistant','Netflix','YouTube','Apple AirPlay 2'],feat:['XR Backlight Master Drive','Bravia Cam AI','PS5 Game Mode','NETFLIX CALIBRATED MODE']})},

      {cat:5,br:15, name:'LG QNED99 8K MiniLED 75" 2024',            price:79990000, disc:3, qty:3,
       img:'https://cdn.tgdd.vn/Products/Images/1942/329149/lg-qned99-8k-75-thumb-600x600.jpg',
       desc: tv({hang:'LG',inch:75,res:'7680×4320 8K UHD',panel:'QNED Mini LED',hz:120,hdr:['Dolby Vision IQ','HDR10 Pro','HLG'],os:'webOS 24',chip:'α9 AI Processor Gen7 8K',watt:120,sound:'Dolby Atmos 3.2.2ch 60W',apps:['ThinQ AI','Google','Alexa','AirPlay 2'],feat:['8K AI Upscaling','FILMMAKER MODE','8K Real Color']})},

      {cat:5,br:15, name:'LG OLED evo B4 55" 4K 120Hz 2024',         price:22990000, disc:8, qty:12,
       img:'https://cdn.tgdd.vn/Products/Images/1942/329149/lg-oled-b4-55-thumb-600x600.jpg',
       desc: tv({hang:'LG',inch:55,res:'3840×2160 4K',panel:'OLED evo (tự phát sáng)',hz:120,hdr:['Dolby Vision IQ','HDR10','HLG','FILMMAKER MODE'],os:'webOS 24',chip:'α7 AI Gen7',watt:40,sound:'Dolby Atmos 2.2ch',apps:['ThinQ AI','Google','Alexa','AirPlay 2'],feat:['FILMMAKER MODE chính xác màu','G-SYNC + FreeSync Premium + VRR','1ms input lag gaming','Đen tuyệt đối mỗi pixel tắt hoàn toàn']})},

      {cat:5,br:25, name:'TCL QLED Mini LED 4K 65" C855 2024',       price:15990000, disc:10, qty:15,
       img:'https://cdn.tgdd.vn/Products/Images/1942/329149/tcl-c855-65-thumb-600x600.jpg',
       desc: tv({hang:'TCL',inch:65,res:'3840×2160 4K',panel:'QLED Mini LED OD Zero',hz:144,hdr:['HDR10+','Dolby Vision','HLG'],os:'Google TV',chip:'AiPQ Gen3 Pro',watt:75,sound:'Dolby Atmos 2.1.2ch 40W',apps:['Google Assistant','Chromecast','Netflix','Disney+'],feat:['OD Zero Mini LED khoảng cách 0','144Hz Hz native','HDMI 2.1×4 cho PS5/Xbox']})},

      {cat:5,br:26, name:'Panasonic OLED Z95 Series 65" 2024',       price:45990000, disc:4, qty:6,
       img:'https://cdn.tgdd.vn/Products/Images/1942/329149/panasonic-oled-z95-65-thumb-600x600.jpg',
       desc: tv({hang:'Panasonic',inch:65,res:'3840×2160 4K',panel:'OLED Master (tự phát sáng)',hz:100,hdr:['Dolby Vision IQ Precision','HDR10+','HLG'],os:'My Home Screen 8',chip:'HCX Pro AI MK2',watt:80,sound:'Dolby Atmos 2.1.2 360° Soundscape',apps:['Netflix Calibrated','Prime Video','Disney+','AirPlay 2'],feat:['Filmmaker Mode chính xác nhất thế giới','Calman Ready','360° Soundscape Cinema Sound']})},

      {cat:5,br:27, name:'Hisense ULED X Series 85" 4K 120Hz',      price:22990000, disc:5, qty:8,
       img:'https://cdn.tgdd.vn/Products/Images/1942/329149/hisense-uled-x-85-thumb-600x600.jpg',
       desc: tv({hang:'Hisense',inch:85,res:'3840×2160 4K',panel:'ULED Mini LED 2000 vùng',hz:120,hdr:['HDR10+','Dolby Vision','HLG'],os:'VIDAA U7',chip:'Hi-View Engine Pro',watt:110,sound:'Dolby Atmos 4.1ch 60W',apps:['Prime Video','Netflix','YouTube','Disney+'],feat:['2000 Local Dimming Zones','Quantum Dot 96% DCI-P3','Game Bar 4.0 Gaming Mode']})},

      {cat:5,br:29, name:'Toshiba QLED 4K 55" 2024 C450ME',          price:9990000, disc:12, qty:20,
       img:'https://cdn.tgdd.vn/Products/Images/1942/329149/toshiba-c450me-55-thumb-600x600.jpg',
       desc: tv({hang:'Toshiba',inch:55,res:'3840×2160 4K',panel:'QLED Quantum Dot',hz:60,hdr:['HDR10+','Dolby Vision','HLG'],os:'Google TV',chip:'Regza Engine EX',watt:30,sound:'Dolby Atmos 2ch 30W',apps:['Google Assistant','Netflix','YouTube','Disney+'],feat:['Regza Pure Color Plus','CEVO 4K Engine','Dolby Vision + HDR10+']})},

      {cat:5,br:3,  name:'Xiaomi TV A Pro 55" 4K 120Hz QLED',        price:8490000, disc:8, qty:25,
       img:'https://cdn.tgdd.vn/Products/Images/1942/329149/xiaomi-tv-a-pro-55-thumb-600x600.jpg',
       desc: tv({hang:'Xiaomi',inch:55,res:'3840×2160 4K',panel:'QLED Quantum Dot',hz:120,hdr:['HDR10+','Dolby Vision','HLG'],os:'Google TV',chip:'Cortex-A73',watt:30,apps:['Google Assistant','Chromecast','Netflix','Disney+'],feat:['QLED 120Hz giá tốt nhất','Dolby Atmos sound built-in','Mi Remote cùng cài đặt']})},

      {cat:5,br:28, name:'Casper 4K QLED 50" CU50QB6600',            price:5990000, disc:10, qty:30,
       img:'https://cdn.tgdd.vn/Products/Images/1942/329149/casper-50-qled-thumb-600x600.jpg',
       desc: tv({hang:'Casper',inch:50,res:'3840×2160 4K',panel:'QLED',hz:60,hdr:['HDR10'],os:'Android TV',chip:'Cortex-A55',watt:20,apps:['Google Play Store','Netflix','YouTube'],feat:['Giá phổ thông tốt nhất Việt Nam','Android TV dễ sử dụng','Dolby Audio giá rẻ']})},

      {cat:5,br:19, name:'Sony Bravia 7 4K Mini LED 55" 2024',       price:25990000, disc:5, qty:10,
       img:'https://cdn.tgdd.vn/Products/Images/1942/329149/sony-bravia-7-miniled-55-thumb-600x600.jpg',
       desc: tv({hang:'Sony',inch:55,res:'3840×2160 4K',panel:'Mini LED (XR Backlight)',hz:120,hdr:['Dolby Vision IQ','HDR10','HLG'],os:'Google TV',chip:'XR Processor',watt:60,sound:'Acoustic Multi-Audio',apps:['Google','Netflix','YouTube','AirPlay'],feat:['Bravia Cam 3 AI hoạt động','XR Cognitive Processor','PS5 Game Mode']})},

      {cat:5,br:2,  name:'Samsung Frame 4K QLED 55" LS03BD 2024',    price:19990000, disc:7, qty:15,
       img:'https://cdn.tgdd.vn/Products/Images/1942/329149/samsung-frame-55-2024-thumb-600x600.jpg',
       desc: tv({hang:'Samsung',inch:55,res:'3840×2160 4K',panel:'QLED',hz:60,hdr:['HDR10+'],os:'Tizen OS',chip:'Quantum Processor 4K',watt:30,sound:'OTS',apps:['Art Mode','SmartThings','AirPlay 2','Samsung TV Plus'],feat:['The Frame Art Mode hiển thị tác phẩm nghệ thuật','Matte Display không phản sáng','Customizable bezel','Nhà thiết kế yêu thích']})},

      {cat:5,br:27, name:'Hisense 4K Smart TV 43" 43A3N',            price:4990000, disc:5, qty:50,
       img:'https://cdn.tgdd.vn/Products/Images/1942/329149/hisense-4k-43a3n-thumb-600x600.jpg',
       desc: tv({hang:'Hisense',inch:43,res:'3840×2160 4K',panel:'LED Panel',hz:60,hdr:['HDR10'],os:'VIDAA OS',chip:'Cortex-A55',watt:20,apps:['Netflix','YouTube','Prime Video'],feat:['Giá rẻ 4K dưới 5 triệu','HDR10 tiêu chuẩn','VIDAA UI tinh gọn']})},

      {cat:5,br:25, name:'TCL 8K Mini LED 75" X955 2024',            price:49990000, disc:5, qty:4,
       img:'https://cdn.tgdd.vn/Products/Images/1942/329149/tcl-x955-8k-75-thumb-600x600.jpg',
       desc: tv({hang:'TCL',inch:75,res:'7680×4320 8K',panel:'QLED Mini LED OD Zero 8K',hz:120,hdr:['HDR10+','Dolby Vision IQ','HLG'],os:'Google TV',chip:'AiPQ Gen2',watt:100,apps:['Google','Netflix','Disney+'],feat:['8K Mini LED siêu phân giải','Onkyo Atmos system','144 local dimming zones 8K']})},

      /* ─── ĐỒ GIA DỤNG ĐIỆN TỬ (15 SP) ─── */
      {cat:6,br:30, name:'Tủ lạnh Hitachi 569L Side-by-Side R-MX800GVTH9', price:28990000, disc:5, qty:12,
       img:'https://cdn.tgdd.vn/Products/Images/194/329149/hitachi-r-mx800gvth9-thumb-600x600.jpg',
       desc: fridge({hang:'Hitachi',lit:569,type:'Side-by-Side',tech:'Inverter AI Fan Cooling',freeze:170,cool:399,kwh:480,feat:['Lấy nước ngoài','Vacuum Insulation Panel','Air Fresh Nano Titanium khử mùi'],color:'Gương đen',warranty:10})},

      {cat:6,br:2,  name:'Tủ lạnh Samsung Bespoke 4 cánh RF60A91R1AP', price:38990000, disc:6, qty:8,
       img:'https://cdn.tgdd.vn/Products/Images/194/329149/samsung-bespoke-4-canh-thumb-600x600.jpg',
       desc: fridge({hang:'Samsung',lit:605,type:'4 cánh French Door',tech:'SpaceMax Technology',freeze:80,cool:525,kwh:430,feat:['Bespoke thiết kế tùy chỉnh màu sắc','Twin Cooling Plus 2 dàn lạnh riêng biệt','Food Showcase Door kính trong suốt'],color:'Trắng hoàng kim',warranty:10})},

      {cat:6,br:26, name:'Tủ lạnh Panasonic Inverter 380L NR-BX421WKVN', price:13490000, disc:8, qty:15,
       img:'https://cdn.tgdd.vn/Products/Images/194/329149/panasonic-nr-bx421wkvn-thumb-600x600.jpg',
       desc: fridge({hang:'Panasonic',lit:380,type:'2 cánh ngăn đá trên',tech:'Inverter ECONAVI',freeze:75,cool:305,kwh:280,feat:['ECONAVI tự điều chỉnh thông minh','nanoe™ X khử khuẩn','Vệ sinh filter dễ dàng'],color:'Bạc',warranty:10})},

      {cat:6,br:31, name:'Tủ lạnh Sharp Inverter 362L SJ-XP382PH-SL', price:12990000, disc:7, qty:18,
       img:'https://cdn.tgdd.vn/Products/Images/194/329149/sharp-sj-xp382ph-sl-thumb-600x600.jpg',
       desc: fridge({hang:'Sharp',lit:362,type:'2 cánh',tech:'Inverter J-Tech',freeze:90,cool:272,kwh:270,feat:['Plasmacluster Ion khử khuẩn 99.9%','Pure Nanotechnology khử mùi','J-Tech Inverter siêu bền'],color:'Bạc',warranty:10})},

      {cat:6,br:15, name:'Tủ lạnh LG InstaView door-in-door 635L GN-X245MC', price:42990000, disc:5, qty:6,
       img:'https://cdn.tgdd.vn/Products/Images/194/329149/lg-gn-x245mc-thumb-600x600.jpg',
       desc: fridge({hang:'LG',lit:635,type:'Side-by-Side InstaView',tech:'Inverter Linear',freeze:215,cool:420,kwh:580,feat:['InstaView gõ 2 lần xem trong','Craft Ice viên đá cầu tự động','Door-in-Door tiết kiệm điện mở cửa'],color:'Bạc Satin',warranty:10})},

      {cat:6,br:33, name:'Máy giặt Electrolux 10kg EWF1042Q7WB',     price:10490000, disc:8, qty:20,
       img:'https://cdn.tgdd.vn/Products/Images/1164/329149/electrolux-ewf1042q7wb-thumb-600x600.jpg',
       desc: washer({hang:'Electrolux',kg:10,type:'Cửa trước',tech:'Inverter UltraCare',rpm:1200,programs:16,water:55,db:47,wifi:true,feat:['UltraMix hoà tan bột giặt 100%','TimeManager tùy chọn thời gian','Vapour Care hơi nước 99.9% khuẩn']})},

      {cat:6,br:2,  name:'Máy giặt Samsung AI EcoBubble 10kg WW10CG600DLH', price:9990000, disc:10, qty:22,
       img:'https://cdn.tgdd.vn/Products/Images/1164/329149/samsung-ww10cg600dlh-thumb-600x600.jpg',
       desc: washer({hang:'Samsung',kg:10,type:'Cửa trước',tech:'AI EcoBubble Inverter',rpm:1400,programs:21,water:50,db:48,wifi:true,feat:['AI Wash nhận diện tự động chăm sóc','EcoBubble bong bóng thấm sâu 40°C hiệu quả như 60°C','Auto Dispense 5 lần đổ 1 lần']})},

      {cat:6,br:15, name:'Máy giặt LG AI DD 12kg FV1412S3P',         price:13490000, disc:7, qty:16,
       img:'https://cdn.tgdd.vn/Products/Images/1164/329149/lg-fv1412s3p-thumb-600x600.jpg',
       desc: washer({hang:'LG',kg:12,type:'Cửa trước',tech:'AI DD Inverter Direct Drive',rpm:1200,programs:14,water:56,db:46,wifi:true,feat:['AI DD nhận diện chất liệu vải tự điều chỉnh','TurboWash 360 giặt sạch 39 phút','Steam+ giảm nhăn 30%']})},

      {cat:6,br:35, name:'Máy lạnh Daikin Inverter 2HP FTKB50XVMV', price:18990000, disc:5, qty:15,
       img:'https://cdn.tgdd.vn/Products/Images/2068/329149/daikin-ftkb50xvmv-thumb-600x600.jpg',
       desc: ac({hang:'Daikin',hp:2,btu:18000,tech:'Inverter Cao Cấp',area:'25-30m²',star:'5 sao CSPF 6.07',gas:'R-32',filter:['Streamer Discharge diệt virus','Flash Streamer','PM2.5'],heat:true,wifi:true,db:19,warranty:5})},

      {cat:6,br:35, name:'Máy lạnh Daikin Inverter 1HP FTKB25XVMV', price:10990000, disc:6, qty:25,
       img:'https://cdn.tgdd.vn/Products/Images/2068/329149/daikin-ftkb25xvmv-thumb-600x600.jpg',
       desc: ac({hang:'Daikin',hp:1,btu:9000,tech:'Inverter',area:'10-14m²',star:'5 sao',gas:'R-32',filter:['Streamer Discharge','Titanium Apatite khử mùi'],heat:false,wifi:true,db:19,warranty:5})},

      {cat:6,br:36, name:'Máy lạnh Mitsubishi Heavy 1.5HP SRK13CX-S5', price:13990000, disc:4, qty:18,
       img:'https://cdn.tgdd.vn/Products/Images/2068/329149/mitsubishi-srk13cx-s5-thumb-600x600.jpg',
       desc: ac({hang:'Mitsubishi',hp:1.5,btu:12000,tech:'Inverter DC',area:'18-22m²',star:'5 sao',gas:'R-32',filter:['FP Ti Filter kháng khuẩn','Premuim Auto Cleaning tự rửa'],heat:false,wifi:false,db:21,warranty:5})},

      {cat:6,br:34, name:'Máy lạnh Midea Inverter 1HP MSAGA-09CRDN8', price:7990000, disc:8, qty:30,
       img:'https://cdn.tgdd.vn/Products/Images/2068/329149/midea-msaga-09crdn8-thumb-600x600.jpg',
       desc: ac({hang:'Midea',hp:1,btu:9000,tech:'Inverter',area:'10-14m²',star:'5 sao',gas:'R-32',filter:['Bộ lọc 3M Electrostatic'],heat:false,wifi:true,db:22,warranty:5})},

      {cat:6,br:34, name:'Lò vi sóng Midea Inverter 28L MG925L4QW',  price:2490000, disc:8, qty:60,
       img:'https://cdn.tgdd.vn/Products/Images/4183/329149/midea-mg925l4qw-thumb-600x600.jpg',
       desc: JSON.stringify({hang:'Midea',loai:'Lò vi sóng Inverter',dung_tich_lit:28,cong_suat_w:900,kieu:'Vi sóng + Nướng Grill',cong_suat_nuong_w:1100,so_muc_cong_suat:5,chuc_nang:['Vi sóng','Nướng Grill','Vi sóng + Nướng kết hợp','Hâm nóng','Rã đông'],hen_gio:99,giai_dong_tu_dong:true,mam_xoay_cm:28,wifi:false,mau:'Trắng bạc',bao_hanh:{thiet_bi_nam:2}})},

      {cat:6,br:32, name:'Tủ lạnh Aqua 240L 2 cánh ngăn đá trên AQR-I240EN', price:6990000, disc:10, qty:35,
       img:'https://cdn.tgdd.vn/Products/Images/194/329149/aqua-aqr-i240en-thumb-600x600.jpg',
       desc: fridge({hang:'Aqua',lit:240,type:'2 cánh ngăn đá trên',tech:'Inverter tiết kiệm điện',freeze:58,cool:182,kwh:210,feat:['VitaVeg ngăn rau củ giữ vitamin','Crisper giữ độ ẩm tối ưu','Tự làm sạch bộ lọc'],color:'Bạc ngọc trai',warranty:10})},

      {cat:6,br:31, name:'Máy giặt Sharp Inverter 10.5kg ES-FK1054SV-S', price:9490000, disc:7, qty:20,
       img:'https://cdn.tgdd.vn/Products/Images/1164/329149/sharp-es-fk1054sv-s-thumb-600x600.jpg',
       desc: washer({hang:'Sharp',kg:10.5,type:'Cửa trước',tech:'Inverter tiết kiệm điện',rpm:1000,programs:12,water:52,db:52,wifi:false,feat:['Plasmacluster Ion diệt khuẩn','TurboDrum Motor giặt sạch 360°','Hơi nước diệt khuẩn 99.9%']})},
    ];

    // Insert all
    for (const p of products) {
      await db.query(
        `INSERT INTO products (category_id, brand_id, name, price, discount, quantity, status, product_image, description) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        [p.cat, p.br, p.name, p.price, p.disc, p.qty, p.img, p.desc]
      );
    }

    console.log(`✅ Đã thêm ${products.length} sản phẩm!\n`);
    console.log('📊 Tóm tắt:');
    console.log('   📱 Điện thoại        : 20 SP');
    console.log('   💻 Laptop            : 20 SP');
    console.log('   🖥️  Màn hình           : 15 SP');
    console.log('   🎧 Tai nghe           : 15 SP');
    console.log('   📺 Tivi               : 15 SP');
    console.log('   🏠 Đồ gia dụng        : 15 SP');
    console.log('   ═══════════════════════════');
    console.log(`   TỔNG               : ${products.length} SP`);

  } catch (err) {
    console.error('❌ Lỗi seed:', err.message);
    console.error(err.stack);
  } finally {
    await db.end();
    console.log('\n🔌 Đã đóng kết nối DB.');
  }
}

seed();
