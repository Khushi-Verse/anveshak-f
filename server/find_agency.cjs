const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const MONGO_URI = "mongodb://aayushich81_db_user:lNCEA93x7n9Z4EMw@ac-hq3atwl-shard-00-00.ytkevjg.mongodb.net:27017,ac-hq3atwl-shard-00-01.ytkevjg.mongodb.net:27017,ac-hq3atwl-shard-00-02.ytkevjg.mongodb.net:27017/?ssl=true&replicaSet=atlas-9zd4wa-shard-0&authSource=admin&retryWrites=true&w=majority";
mongoose.connect(MONGO_URI).then(async () => {
  const User = require("./src/models/User");
  const users = await User.find({}).select("name email role").lean();
  users.forEach(u => { if(u.role !== "CITIZEN") console.log(u.role + " | " + u.email + " | " + u.name); });
  const agencyUsers = users.filter(u => u.role === "INVESTIGATING_AGENCY");
  if (agencyUsers.length === 0) {
    console.log("No INVESTIGATING_AGENCY user found - creating one...");
    const hash = await bcrypt.hash("Agency@123", 10);
    await User.create({ name: "CBI Investigation Agency", email: "agency@anveshak.com", password: hash, role: "INVESTIGATING_AGENCY" });
    console.log("Created: agency@anveshak.com / Agency@123");
  } else {
    const hash = await bcrypt.hash("Agency@123", 10);
    for (const u of agencyUsers) { await User.updateOne({ _id: u._id }, { password: hash }); console.log("Password reset: " + u.email + " -> Agency@123"); }
  }
  process.exit(0);
}).catch(e => { console.log("Error:", e.message); process.exit(1); });
