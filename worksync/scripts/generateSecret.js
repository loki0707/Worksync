/**
 * scripts/generateSecret.js
 * Run: node scripts/generateSecret.js
 * Generates a secure random JWT_SECRET for your .env
 */
const crypto = require('crypto');
const secret = crypto.randomBytes(48).toString('hex');
console.log('\nYour JWT_SECRET (copy this into .env):\n');
console.log(secret);
console.log('');
