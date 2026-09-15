const mongoose = require('./server/node_modules/mongoose');
const fs = require('fs');

const env = fs.readFileSync('server/.env', 'utf8');
const uri = env.match(/MONGO_URI=(.*)/)[1].trim();

async function test() {
  try {
    console.log("Connecting to:", uri.replace(/:[^:]*@/, ':***@'));
    await mongoose.connect(uri);
    console.log("Connected successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }
}
test();
