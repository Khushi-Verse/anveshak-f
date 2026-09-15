const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const http = require("http");

const connectDB = require("./config/db");
const socketUtil = require("./utils/socket");
const chatRoutes = require("./routes/chatRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const authRoutes = require("./routes/authRoutes");
const firRoutes = require("./routes/firRoutes");
const caseRoutes = require("./routes/caseRoutes");
const evidenceRoutes = require("./routes/evidenceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const signatureRoutes = require("./routes/signatureRoutes");
const custodyRoutes = require("./routes/custodyRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/fir", firRoutes);
app.use("/api/case", caseRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/evidence", signatureRoutes);
app.use("/api/evidence", custodyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

app.get("/", (req, res) => {
  res.send("Anveshak Backend is running");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ANVESHAK backend"
  });
});

const PORT = process.env.PORT || 5003;

const server = http.createServer(app);

socketUtil.init(server);

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();