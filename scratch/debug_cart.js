const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  let output = '';

  // Kiểm tra giỏ hàng hiện tại của user 30
  const [cart] = await pool.query(`
    SELECT c.*, p.name, p.price, p.discount 
    FROM cart c 
    JOIN products p ON c.product_id = p.id 
    WHERE c.user_id = 30
  `);
  output += '=== CART DATA FOR USER 30 ===\n';
  output += JSON.stringify(cart, null, 2) + '\n';

  // Kiểm tra đơn hàng mới nhất
  const [orders] = await pool.query('SELECT * FROM orders ORDER BY order_id DESC LIMIT 1');
  if (orders.length > 0) {
    output += '\n=== LATEST ORDER ===\n';
    output += JSON.stringify(orders[0], null, 2) + '\n';
    
    const [details] = await pool.query('SELECT * FROM orderdetails WHERE order_id = ?', [orders[0].order_id]);
    output += '\n=== LATEST ORDER DETAILS ===\n';
    output += JSON.stringify(details, null, 2) + '\n';
  }

  fs.writeFileSync('scratch/debug_cart.txt', output);
  console.log('Done');
  await pool.end();
}

main().catch(e => console.error(e));
