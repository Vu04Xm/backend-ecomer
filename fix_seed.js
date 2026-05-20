const fs = require('fs');

const unsplash = {
  1: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800', // Điện thoại
  2: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800', // Laptop
  3: 'https://images.unsplash.com/photo-1527443224154-c4a573d5b434?auto=format&fit=crop&q=80&w=800', // Màn hình
  4: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800', // Tai nghe
  5: 'https://images.unsplash.com/photo-1593359677879-a4bb92f4e64c?auto=format&fit=crop&q=80&w=800', // Tivi
  6: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&q=80&w=800', // Gia dụng
};

let script = fs.readFileSync('seed.js', 'utf8');

script = script.replace(/cat:(\d+).*?img:'https:\/\/cdn\.tgdd\.vn\/[^']+'/g, (match, cat) => {
  return match.replace(/img:'https:\/\/cdn\.tgdd\.vn\/[^']+/, `img:'${unsplash[cat]}'`);
});

fs.writeFileSync('seed.js', script);
console.log('Fixed img URLs in seed.js to Unsplash!');
