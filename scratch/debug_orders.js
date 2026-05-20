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

  // Check product 197 details
  const [product197] = await pool.query('SELECT * FROM products WHERE id = 197');
  output += '=== PRODUCT 197 ===\n';
  output += JSON.stringify(product197[0], null, 2) + '\n';

  // Check user 30 info
  const [user30] = await pool.query('SELECT id, full_name, email, role_id FROM users WHERE id = 30');
  output += '\n=== USER 30 ===\n';
  output += JSON.stringify(user30[0], null, 2) + '\n';

  // Check ALL order details for user 30 orders
  const [allOrders] = await pool.query('SELECT order_id, total_amount, status, created_at FROM orders WHERE user_id = 30 ORDER BY order_id DESC');
  output += '\n=== ALL ORDERS for USER 30 ===\n';
  allOrders.forEach(o => output += `  #${o.order_id} | total: ${o.total_amount} | status: ${o.status} | created: ${o.created_at}\n`);

  // Check if there's something wrong with how cart items get mapped
  // Let's look at products 78, 79 (washing machines)
  const [washers] = await pool.query('SELECT id, name, price, discount FROM products WHERE id IN (78, 79)');
  output += '\n=== WASHING MACHINE PRODUCTS ===\n';
  washers.forEach(w => output += `  id: ${w.id} | name: ${w.name} | price: ${w.price} | discount: ${w.discount}\n`);

  // Check current cart for user 30
  const [cart30] = await pool.query('SELECT c.*, p.name, p.price FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = 30');
  output += '\n=== CURRENT CART for USER 30 ===\n';
  if (cart30.length === 0) output += '  (empty - cleared after last order)\n';
  cart30.forEach(c => output += `  cart_id: ${c.cart_id} | product_id: ${c.product_id} | name: ${c.name} | qty: ${c.quantity}\n`);

  fs.writeFileSync('scratch/debug_output2.txt', output);
  console.log('Done');
  await pool.end();
}

main().catch(e => console.error(e));
