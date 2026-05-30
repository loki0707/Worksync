/**
 * scripts/testConnection.js
 * Run: node scripts/testConnection.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const URI = process.env.MONGODB_URI;

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  WorkSync — MongoDB Atlas Connection Test');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!URI) {
  console.error('FAIL: MONGODB_URI not found in .env');
  console.error('Fix : copy .env.example to .env and fill in your Atlas URI');
  process.exit(1);
}

if (/<username>|<password>|<cluster>/.test(URI)) {
  console.error('FAIL: URI still has placeholder text');
  process.exit(1);
}

const maskedURI = URI.replace(/:([^@]+)@/, ':****@');
console.log(`URI  : ${maskedURI}`);
console.log('Connecting...\n');

mongoose
  .connect(URI, { serverSelectionTimeoutMS: 10000 })
  .then(async (conn) => {
    const { host, name: db } = conn.connection;
    console.log('SUCCESS: MongoDB Atlas connected');
    console.log(`Host : ${host}`);
    console.log(`DB   : ${db}`);

    const cols = await conn.connection.db.listCollections().toArray();
    if (cols.length === 0) {
      console.log('Collections: (none yet - will be created on first write)');
    } else {
      console.log('Collections:');
      cols.forEach(c => console.log(`  - ${c.name}`));
    }
    console.log('\nAll good! Run: npm run dev\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('FAIL: ' + err.message + '\n');
    if (err.message.includes('ENOTFOUND'))      console.error('Tip: Wrong hostname — copy URI directly from Atlas Connect dialog');
    if (err.message.includes('Authentication')) console.error('Tip: Wrong password — check Atlas > Database Access');
    if (err.message.includes('ECONNREFUSED'))   console.error('Tip: IP not whitelisted — Atlas > Network Access > Allow 0.0.0.0/0');
    if (err.message.includes('timed out'))      console.error('Tip: IP not allowed or cluster is paused — check Network Access');
    process.exit(1);
  });
