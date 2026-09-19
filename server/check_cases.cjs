const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

const MONGO_URI = "mongodb://aayushich81_db_user:lNCEA93x7n9Z4EMw@ac-hq3atwl-shard-00-00.ytkevjg.mongodb.net:27017,ac-hq3atwl-shard-00-01.ytkevjg.mongodb.net:27017,ac-hq3atwl-shard-00-02.ytkevjg.mongodb.net:27017/?ssl=true&replicaSet=atlas-9zd4wa-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(MONGO_URI).then(async () => {
  const Case = require("./src/models/Case");
  const cases = await Case.find({}).select("caseId firId aiAnalysis status").lean().limit(5);
  cases.forEach(c => {
    console.log("Case:", c.caseId, "| firId:", c.firId ? c.firId.toString() : "NULL", "| hasAI:", !!(c.aiAnalysis && c.aiAnalysis.summary), "| status:", c.status);
  });
  process.exit(0);
}).catch(e => { console.log("DB Error:", e.message); process.exit(1); });
