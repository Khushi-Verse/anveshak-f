const FIR = require("../models/FIR");
const Case = require("../models/Case");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const Evidence = require("../models/Evidence");

const generateCaseId = require("../services/caseIdService");
const { updateCaseStatus } = require("../services/caseLifecycleService");

const {
  getCaseTimeline,
  createTimelineEvent,
} = require("../services/timelineService");

const { analyzeFIR } = require("../services/aiService");

const {
  findBestOfficer,
  normalizeJurisdiction,
} = require("../services/assignmentService");

// ======================================================
// CREATE CASE FROM FIR
// ======================================================

const createCaseFromFIR = async (req, res) => {
  try {
    const { firId } = req.body;

    if (!firId) {
      return res.status(400).json({
        message: "FIR ID is required",
      });
    }

    const fir = await FIR.findById(firId);

    if (!fir) {
      return res.status(404).json({
        message: "FIR not found",
      });
    }

    // Citizen can create case only from their own FIR
    if (
      req.user.role === "CITIZEN" &&
      fir.createdBy.toString() !== req.user.userId.toString()
    ) {
      return res.status(403).json({
        message: "You are not authorized to create a case from this FIR",
      });
    }

    // Prevent duplicate case
    const existingCase = await Case.findOne({ firId });

    if (existingCase) {
      return res.status(409).json({
        message: "Case already exists for this FIR",
        case: existingCase,
      });
    }

    const caseId = await generateCaseId();

    // Normalize FIR location into jurisdiction
    const jurisdiction = normalizeJurisdiction(
      fir.incidentLocation
    );

    // Create Case
    const newCase = await Case.create({
      caseId,
      firId,
      citizenId: fir.createdBy,
      jurisdiction,
      status: "FIR_REGISTERED",
    });

    // Audit: case created
    await AuditLog.create({
      userId: req.user.userId,
      caseId,
      action: "CASE_CREATED",
      description: "Case created from FIR",
      verificationStatus: "VERIFIED",
    });

    // ==================================================
    // AUTO ASSIGN CASE
    // ==================================================

    const officer = await findBestOfficer(
      jurisdiction,
      null
    );

    if (officer) {
      newCase.assignedOfficer = officer._id;
      newCase.status = "ASSIGNED";

      await newCase.save();

      // Increase officer workload
      officer.workload = (officer.workload || 0) + 1;
      await officer.save();

      // Timeline event
      await createTimelineEvent({
        caseId: newCase.caseId,
        status: "ASSIGNED",
        action: "CASE_ASSIGNED",
        performedBy: req.user.userId,
        description: `Case automatically assigned to ${officer.name}`,
      });

      // Assignment audit
      await AuditLog.create({
        userId: req.user.userId,
        caseId: newCase.caseId,
        action: "CASE_ASSIGNED",
        description: `Case automatically assigned to ${officer.name}`,
        verificationStatus: "VERIFIED",
      });

      console.log(
        `Case ${newCase.caseId} automatically assigned to ${officer.name}`
      );
    } else {
      console.log(
        `No available officer found for jurisdiction: ${jurisdiction}`
      );
    }

    return res.status(201).json({
      message: "Case created successfully",
      case: newCase,
    });
  } catch (error) {
    console.error("Case creation failed:", error);

    return res.status(500).json({
      message: "Failed to create case",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE CASE STATUS
// ======================================================

const updateStatus = async (req, res) => {
  try {
    const { caseId, status } = req.body;
    const userId = req.user.userId;

    if (!caseId || !status) {
      return res.status(400).json({
        message: "Case ID and status are required",
      });
    }

    const caseData = await Case.findOne({ caseId });

    if (!caseData) {
      return res.status(404).json({
        message: "Case not found",
      });
    }

    // POLICE can update only assigned cases
    if (req.user.role === "POLICE") {
      if (
        !caseData.assignedOfficer ||
        caseData.assignedOfficer.toString() !== userId.toString()
      ) {
        return res.status(403).json({
          message: "You can only update cases assigned to you",
        });
      }
    }

    // Lifecycle service handles:
    // 1. Transition validation
    // 2. Case status update
    // 3. Timeline entry
    // 4. Audit log

    const updatedCase = await updateCaseStatus(
      caseId,
      status,
      userId
    );

    return res.status(200).json({
      message: "Case status updated successfully",
      case: updatedCase,
    });
  } catch (error) {
    console.error(
      "Case status update failed:",
      error
    );

    return res.status(500).json({
      message: "Failed to update case status",
      error: error.message,
    });
  }
};

// ======================================================
// ASSIGN CASE
// ======================================================

const assignCase = async (req, res) => {
  try {
    const { caseId, officerId } = req.body;

    if (!caseId || !officerId) {
      return res.status(400).json({
        message: "Case ID and officer ID are required",
      });
    }

    const caseData = await Case.findOne({ caseId });

    if (!caseData) {
      return res.status(404).json({
        message: "Case not found",
      });
    }

    const officer = await User.findOne({
      _id: officerId,
      role: "POLICE",
    });

    if (!officer) {
      return res.status(404).json({
        message: "Police officer not found",
      });
    }

    // Police cannot assign outside their jurisdiction
    if (
      req.user.role === "POLICE" &&
      req.user.jurisdiction &&
      caseData.jurisdiction &&
      req.user.jurisdiction.toLowerCase().trim() !==
        caseData.jurisdiction.toLowerCase().trim()
    ) {
      return res.status(403).json({
        message: "You cannot assign cases outside your jurisdiction",
      });
    }

    caseData.assignedOfficer = officer._id;

    if (caseData.status === "FIR_REGISTERED") {
      caseData.status = "ASSIGNED";
    }

    await caseData.save();

    await AuditLog.create({
      userId: req.user.userId,
      caseId,
      action: "CASE_ASSIGNED",
      description: `Case assigned to ${officer.name}`,
      verificationStatus: "VERIFIED",
    });

    return res.status(200).json({
      message: "Case assigned successfully",
      case: caseData,
    });
  } catch (error) {
    console.error(
      "Case assignment failed:",
      error
    );

    return res.status(500).json({
      message: "Failed to assign case",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL CASES
// ======================================================

const getAllCases = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let query = {};

    // Citizen → only their cases
    if (role === "CITIZEN") {
      query.citizenId = userId;
    }

    // Police → only assigned cases
    if (role === "POLICE") {
      query.assignedOfficer = userId;
    }

    const cases = await Case.find(query)
      .populate("citizenId", "name email")
      .populate(
        "assignedOfficer",
        "name email role"
      )
      .populate("firId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: cases.length,
      cases,
    });
  } catch (error) {
    console.error(
      "Failed to fetch cases:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch cases",
      error: error.message,
    });
  }
};

// ======================================================
// GET SINGLE CASE
// ======================================================

const getSingleCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    const caseData = await Case.findOne({ caseId })
      .populate("citizenId", "name email")
      .populate(
        "assignedOfficer",
        "name email role"
      )
      .populate("firId");

    if (!caseData) {
      return res.status(404).json({
        message: "Case not found",
      });
    }

    // Citizen → own cases only
    if (
      role === "CITIZEN" &&
      caseData.citizenId._id.toString() !==
        userId.toString()
    ) {
      return res.status(403).json({
        message: "You are not authorized to access this case",
      });
    }

    // Police → assigned cases only
    if (
      role === "POLICE" &&
      (
        !caseData.assignedOfficer ||
        caseData.assignedOfficer._id.toString() !==
          userId.toString()
      )
    ) {
      return res.status(403).json({
        message: "You are not authorized to access this case",
      });
    }

    // ==================================================
    // FETCH EVIDENCE FOR THIS CASE
    // ==================================================

    const evidence = await Evidence.find({
      caseId: caseData.caseId,
    }).populate(
      "uploadedBy",
      "name email role"
    );

    // Convert mongoose document to normal object
    // and attach evidence to response
    const caseResponse = caseData.toObject();

    caseResponse.evidence = evidence;

    return res.status(200).json({
      case: caseResponse,
    });
  } catch (error) {
    console.error(
      "Failed to fetch case:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch case",
      error: error.message,
    });
  }
};

// ======================================================
// GET ASSIGNED CASES
// ======================================================

const getAssignedCases = async (req, res) => {
  try {
    const cases = await Case.find({
      assignedOfficer: req.user.userId,
    })
      .populate("citizenId", "name email")
      .populate(
        "assignedOfficer",
        "name email role"
      )
      .populate("firId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: cases.length,
      cases,
    });
  } catch (error) {
    console.error(
      "Failed to fetch assigned cases:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch assigned cases",
      error: error.message,
    });
  }
};

// ======================================================
// GET CASE AUDIT LOGS
// ======================================================

const getCaseAuditLogs = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    const caseData = await Case.findOne({ caseId });

    if (!caseData) {
      return res.status(404).json({
        message: "Case not found",
      });
    }

    // Citizen → own case only
    if (
      role === "CITIZEN" &&
      caseData.citizenId.toString() !==
        userId.toString()
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to access audit logs of this case",
      });
    }

    // Police → assigned cases only
    if (
      role === "POLICE" &&
      (
        !caseData.assignedOfficer ||
        caseData.assignedOfficer.toString() !==
          userId.toString()
      )
    ) {
      return res.status(403).json({
        message:
          "You can only access audit logs of cases assigned to you",
      });
    }

    const auditLogs = await AuditLog.find({ caseId })
      .populate(
        "userId",
        "name email role"
      )
      .sort({ createdAt: 1 });

    return res.status(200).json({
      caseId,
      count: auditLogs.length,
      auditLogs,
    });
  } catch (error) {
    console.error(
      "Failed to fetch audit logs:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch audit logs",
      error: error.message,
    });
  }
};

// ======================================================
// GET CASE STATS
// ======================================================

const getCaseStats = async (req, res) => {
  try {
    const totalCases =
      await Case.countDocuments();

    const assignedCases =
      await Case.countDocuments({
        assignedOfficer: { $ne: null },
      });

    const pendingAssignment =
      await Case.countDocuments({
        assignedOfficer: null,
      });

    const resolvedCases =
      await Case.countDocuments({
        status: "RESOLVED",
      });

    return res.status(200).json({
      totalCases,
      assignedCases,
      pendingAssignment,
      resolvedCases,
    });
  } catch (error) {
    console.error(
      "Failed to fetch case stats:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch case statistics",
      error: error.message,
    });
  }
};

// ======================================================
// GET CASE TIMELINE
// ======================================================

const getTimeline = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    const caseData = await Case.findOne({ caseId });

    if (!caseData) {
      return res.status(404).json({
        message: "Case not found",
      });
    }

    // Citizen → own case only
    if (
      role === "CITIZEN" &&
      caseData.citizenId.toString() !==
        userId.toString()
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to access this case timeline",
      });
    }

    // Police → assigned cases only
    if (
      role === "POLICE" &&
      (
        !caseData.assignedOfficer ||
        caseData.assignedOfficer.toString() !==
          userId.toString()
      )
    ) {
      return res.status(403).json({
        message:
          "You can only access timeline of cases assigned to you",
      });
    }

    const timeline =
      await getCaseTimeline(caseId);

    return res.status(200).json({
      caseId,
      count: timeline.length,
      timeline,
    });
  } catch (error) {
    console.error(
      "Failed to fetch case timeline:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch case timeline",
      error: error.message,
    });
  }
};

// ======================================================
// AI CASE ANALYSIS
// ======================================================

const analyzeCaseWithAI = async (req, res) => {
  try {
    const { caseId } = req.body;

    if (!caseId) {
      return res.status(400).json({
        message: "Case ID is required",
      });
    }

    const existingCase = await Case.findOne({
      caseId,
    }).populate("firId");

    if (!existingCase) {
      return res.status(404).json({
        message: "Case not found",
      });
    }

    const fir = existingCase.firId;

    if (!fir) {
      return res.status(404).json({
        message:
          "Case exists, but related FIR was not found",
      });
    }

    // ==================================================
    // CHECK IF REAL AI ANALYSIS ALREADY EXISTS
    // ==================================================

    const hasRealAIAnalysis =
      existingCase.aiAnalysis &&
      existingCase.aiAnalysis.aiAvailable === true &&
      existingCase.aiAnalysis.classification &&
      existingCase.aiAnalysis.summary;

    if (hasRealAIAnalysis) {
      return res.status(200).json({
        aiAnalysis: existingCase.aiAnalysis,
        cached: true,
        source: "mongodb",
      });
    }

    // ==================================================
    // RUN GEMINI AI
    // ==================================================

    console.log(
      `Running Gemini AI analysis for case: ${caseId}`
    );

    const aiAnalysis = await analyzeFIR({
      incidentDescription:
        fir.incidentDescription,

      category:
        fir.category,

      incidentLocation:
        fir.incidentLocation,

      incidentDate:
        fir.incidentDate,
    });

    // ==================================================
    // SAVE REAL AI RESULT
    // ==================================================

    if (aiAnalysis.aiAvailable !== false) {
      existingCase.aiAnalysis = aiAnalysis;

      existingCase.priority =
        aiAnalysis.severity || "MEDIUM";

      await existingCase.save();

      console.log(
        "AI analysis generated and saved:",
        caseId
      );
    } else {
      console.log(
        "AI unavailable. MongoDB case was not updated:",
        caseId
      );
    }

    return res.status(200).json({
      caseId,
      aiAnalysis,
      cached: false,
      source: "gemini",
    });
  } catch (error) {
    console.error(
      "AI case analysis failed:",
      error
    );

    return res.status(500).json({
      message: "Failed to analyze case with AI",
      error: error.message,
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================


// ======================================================
// ADD CUSTOM TIMELINE EVENT
// ======================================================

const addTimelineEvent = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { action, description } = req.body;
    const userId = req.user.userId;

    const caseData = await Case.findOne({ caseId });
    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    if (req.user.role === "POLICE" && (!caseData.assignedOfficer || caseData.assignedOfficer.toString() !== userId.toString())) {
      return res.status(403).json({ message: "You can only update cases assigned to you" });
    }

    const { createTimelineEvent } = require("../services/timelineService");
    const newEvent = await createTimelineEvent({
      caseId,
      status: caseData.status,
      action: action || "CASE_UPDATED",
      performedBy: userId,
      description: description || "Custom timeline event added",
    });

    const { createAuditLog } = require("../services/auditService");
    await createAuditLog({
      userId: userId,
      caseId: caseId,
      action: "TIMELINE_UPDATED",
      description: `Custom timeline event added: ${action}`,
    });

    return res.status(201).json({ message: "Timeline event added successfully", event: newEvent });
  } catch (error) {
    console.error("Failed to add timeline event:", error);
    return res.status(500).json({ message: "Failed to add timeline event", error: error.message });
  }
};

const getSystemAuditLogs = async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');
    let query = {};
    if (req.user.role === 'POLICE') {
      // In a real app we'd filter to assigned cases, but for this demo police see all
      query = {};
    }
    const logs = await AuditLog.find(query).populate('userId', 'name email role').sort({ createdAt: -1 }).limit(200);
    return res.status(200).json(logs);
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching logs', error: err.message });
  }
};

module.exports = {
  addTimelineEvent,
  createCaseFromFIR,
  updateStatus,
  assignCase,
  getAllCases,
  getSingleCase,
  getAssignedCases,
  getCaseAuditLogs,
  getSystemAuditLogs,
  getCaseStats,
  getTimeline,
  analyzeCaseWithAI,
};
