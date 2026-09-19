const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });
const MONGO_URI = "mongodb://aayushich81_db_user:lNCEA93x7n9Z4EMw@ac-hq3atwl-shard-00-00.ytkevjg.mongodb.net:27017,ac-hq3atwl-shard-00-01.ytkevjg.mongodb.net:27017,ac-hq3atwl-shard-00-02.ytkevjg.mongodb.net:27017/?ssl=true&replicaSet=atlas-9zd4wa-shard-0&authSource=admin&retryWrites=true&w=majority";
mongoose.connect(MONGO_URI).then(async () => {
  const Case = require("./src/models/Case");
  // Check COURT_IN_PROGRESS or cases that went to court
  const courtCases = await Case.find({ status: { $in: ["COURT", "COURT_IN_PROGRESS", "DISPOSED", "CHARGE_SHEET_FILED"] } }).select("caseId status aiAnalysis").lean().limit(5);
  courtCases.forEach(c => {
    console.log("Case:", c.caseId, "| Status:", c.status, "| aiAnalysis.summary:", c.aiAnalysis && c.aiAnalysis.summary ? c.aiAnalysis.summary.substring(0, 60) : "NONE");
  });
  if (courtCases.length === 0) { console.log("No court cases found."); }
  process.exit(0);
}).catch(e => { console.log("DB Error:", e.message); process.exit(1); });
