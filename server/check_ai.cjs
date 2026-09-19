const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });
const MONGO_URI = "mongodb://aayushich81_db_user:lNCEA93x7n9Z4EMw@ac-hq3atwl-shard-00-00.ytkevjg.mongodb.net:27017,ac-hq3atwl-shard-00-01.ytkevjg.mongodb.net:27017,ac-hq3atwl-shard-00-02.ytkevjg.mongodb.net:27017/?ssl=true&replicaSet=atlas-9zd4wa-shard-0&authSource=admin&retryWrites=true&w=majority";
mongoose.connect(MONGO_URI).then(async () => {
  const Case = require("./src/models/Case");
  const c = await Case.findOne({ caseId: "ANV-2026-358282" }).select("caseId status aiAnalysis.aiAvailable aiAnalysis.summary aiAnalysis.classification").lean();
  console.log("aiAvailable:", c.aiAnalysis && c.aiAnalysis.aiAvailable);
  console.log("classification:", c.aiAnalysis && c.aiAnalysis.classification);
  console.log("summary:", c.aiAnalysis && c.aiAnalysis.summary);
  process.exit(0);
}).catch(e => { console.log("DB Error:", e.message); process.exit(1); });
