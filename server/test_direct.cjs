const mongoose = require("mongoose");
const uri = "mongodb://aayushich81_db_user:lNCEA93x7n9Z4EMw@ac-hq3atwl-shard-00-00.ytkevjg.mongodb.net:27017,ac-hq3atwl-shard-00-01.ytkevjg.mongodb.net:27017,ac-hq3atwl-shard-00-02.ytkevjg.mongodb.net:27017/?ssl=true&replicaSet=atlas-9zd4wa-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }).then(() => {
    console.log("Connected directly successfully!");
    process.exit(0);
}).catch(e => {
    console.error("Direct connection failed:", e.message);
    process.exit(1);
});
