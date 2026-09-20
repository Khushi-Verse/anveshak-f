const FIR = require("../models/FIR");
const { createNotification } = require("./notificationController");

// ===============================
// CREATE FIR
// ===============================
const createFIR = async (req, res) => {
  try {
    const {
      complainant,
      incidentDescription,
      incidentDate,
      incidentLocation,
      category,
      isWomenSafety,
    } = req.body;

    // Generate FIR number automatically
    const firNumber = `FIR-${new Date().getFullYear()}-${Date.now()
      .toString()
      .slice(-6)}`;

    // Validate required details
    if (
      !complainant ||
      !incidentDescription ||
      !incidentDate ||
      !incidentLocation ||
      !category
    ) {
      return res.status(400).json({
        message: "Please provide all FIR details",
      });
    }

    // Check duplicate FIR number
    const existingFIR = await FIR.findOne({ firNumber });

    if (existingFIR) {
      return res.status(400).json({
        message: "FIR number already exists",
      });
    }

    // Create FIR
    const fir = await FIR.create({
      firNumber,
      complainant,
      incidentDescription,
      incidentDate,
      incidentLocation,
      category,
      isWomenSafety: Boolean(isWomenSafety),
      createdBy: req.user.userId,
    });

    try {
      await createNotification({
        userId: req.user.userId,
        caseId: fir.firNumber, // placeholder for UI
        type: "FIR_SUBMITTED",
        message: `Your FIR ${fir.firNumber} has been submitted successfully and is pending review.`,
      });
    } catch (e) {}

    res.status(201).json({
      message: "FIR created successfully",
      fir,
    });
  } catch (error) {
    console.error("CREATE FIR ERROR:", error);

    res.status(500).json({
      message: "Failed to create FIR",
      error: error.message,
    });
  }
};


// ===============================
// GET SINGLE FIR
// ===============================
const getFIR = async (req, res) => {
  try {
    const fir = await FIR.findById(req.params.firId)
      .populate("createdBy", "name email role");

    if (!fir) {
      return res.status(404).json({
        message: "FIR not found",
      });
    }

    const userRole = req.user.role;
    const userId = req.user.userId.toString();

    // Citizen can access only their own FIR
    if (userRole === "CITIZEN") {
      if (
        !fir.createdBy ||
        fir.createdBy._id.toString() !== userId
      ) {
        return res.status(403).json({
          message: "You can only access your own FIR",
        });
      }
    }

    res.status(200).json({
      fir,
    });
  } catch (error) {
    console.error("GET FIR ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch FIR",
      error: error.message,
    });
  }
};


// ===============================
// GET MY FIRs
// ===============================
const getMyFIRs = async (req, res) => {
  try {
    const firs = await FIR.find({
      createdBy: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      count: firs.length,
      firs,
    });
  } catch (error) {
    console.error("GET MY FIRs ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch FIRs",
      error: error.message,
    });
  }
};


// ===============================
// EXPORTS
// ===============================
module.exports = {
  createFIR,
  getFIR,
  getMyFIRs,
};