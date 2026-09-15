const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const Case = require("../models/Case");

let io;

module.exports = {
  init: (server) => {
    io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  },
});

    // Socket authentication
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(
          new Error("Authentication error: Token missing")
        );
      }

      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        );

        socket.user = decoded;
        next();
      } catch (err) {
        next(
          new Error(
            "Authentication error: Invalid token"
          )
        );
      }
    });

    io.on("connection", (socket) => {
      console.log(
        `Socket connected: ${socket.id} (User: ${socket.user.userId})`
      );

      // Personal notification room
      socket.join(
        socket.user.userId.toString()
      );

      // Secure case room joining
      socket.on("joinCase", async (caseData) => {
        try {
          // Support both:
          // joinCase("ANV-2026-897171")
          // and
          // joinCase({ caseId: "ANV-2026-897171" })

          const caseId =
            typeof caseData === "string"
              ? caseData
              : caseData?.caseId;

          if (!caseId) {
            return socket.emit("chatError", {
              message: "Case ID is required",
            });
          }

          const caseRecord =
            await Case.findOne({ caseId });

          if (!caseRecord) {
            return socket.emit("chatError", {
              message: "Case not found",
            });
          }

          const { role, userId } = socket.user;

          const INTERNAL_ROLES = [
            "POLICE",
            "INVESTIGATING_AGENCY",
            "COURT",
            "ADMIN",
          ];

          const allowed =
            INTERNAL_ROLES.includes(role) &&
            (
              role === "ADMIN" ||
              role !== "POLICE" ||
              (
                caseRecord.assignedOfficer &&
                caseRecord.assignedOfficer.toString() ===
                  userId.toString()
              )
            );

          if (!allowed) {
            return socket.emit("chatError", {
              message:
                "You are not authorized to access this case",
            });
          }

          socket.join(`case_${caseId}`);

          console.log(
            `User ${userId} joined room case_${caseId}`
          );
        } catch (error) {
          console.error(
            "joinCase error:",
            error.message
          );

          socket.emit("chatError", {
            message: "Unable to join case",
          });
        }
      });

      // Leave case room
      socket.on("leaveCase", (caseData) => {
        const caseId =
          typeof caseData === "string"
            ? caseData
            : caseData?.caseId;

        if (!caseId) return;

        socket.leave(`case_${caseId}`);

        console.log(
          `User ${socket.user.userId} left room case_${caseId}`
        );
      });

      // Disconnect
      socket.on("disconnect", () => {
        console.log(
          `Socket disconnected: ${socket.id}`
        );
      });
    });

    return io;
  },

  getIo: () => {
    if (!io) {
      throw new Error(
        "Socket.io not initialized"
      );
    }

    return io;
  },
};