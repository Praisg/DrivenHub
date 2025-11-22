/**
 * Generate password hash for admin user
 * Run: node scripts/generate-password-hash.js
 */

const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = process.argv[2] || 'password';
  const hash = await bcrypt.hash(password, 10);
  console.log(`\nPassword: ${password}`);
  console.log(`Hash: ${hash}\n`);
  console.log('SQL to update admin password:');
  console.log(`UPDATE members SET password_hash = '${hash}' WHERE email = 'gavipraise@gmail.com';\n`);
}

generateHash().catch(console.error);

