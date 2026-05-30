const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // ── Guard: missing URI ─────────────────────────────────────────────────────
  if (!uri) {
    console.error('\n❌  MONGODB_URI is not defined in your .env file');
    console.error('    Steps to fix:');
    console.error('    1. Copy .env.example  →  .env');
    console.error('    2. Fill in your Atlas credentials (see README)\n');
    process.exit(1);
  }

  // ── Guard: unfilled placeholders ───────────────────────────────────────────
  if (/<username>|<password>|<cluster-url>|<dbname>/.test(uri)) {
    console.error('\n❌  MONGODB_URI still contains placeholder values.');
    console.error('    Replace every <...> with your actual Atlas values.\n');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,  // give up after 10 s if Atlas unreachable
      socketTimeoutMS:          45000,
      maxPoolSize:              10,
      autoIndex:                true,
    });

    const { host, name: dbName } = conn.connection;
    console.log('\n✅  MongoDB Atlas connected');
    console.log(`    Host : ${host}`);
    console.log(`    DB   : ${dbName}\n`);

    // ── Connection-level event handlers ───────────────────────────────────────
    mongoose.connection.on('error', (err) => {
      console.error(`❌  Mongoose error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️   MongoDB disconnected — Mongoose will auto-reconnect');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅  MongoDB reconnected');
    });

  } catch (error) {
    console.error('\n❌  Could not connect to MongoDB Atlas');
    console.error(`    Reason : ${error.message}`);
    console.error('\n    Common fixes:');
    console.error('    • Check that <username> and <password> are correct');
    console.error('    • Whitelist your IP in Atlas → Network Access → Add IP Address');
    console.error('    • Make sure the cluster is not paused (free tier auto-pauses)');
    console.error('    • Try pasting the URI in MongoDB Compass to verify it works\n');
    process.exit(1);
  }
};

module.exports = connectDB;
