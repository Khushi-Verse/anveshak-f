const express = require("express");

const {
  assignCase,
} = require("../controllers/assignmentController");

const protect = require("../middleware/authMiddleware");

const allowRoles = require("../middleware/roleMiddleware");

const {
  createCaseFromFIR,
  updateStatus,
  getAllCases,
  getSingleCase,
  getAssignedCases,
  getCaseAuditLogs,
  getSystemAuditLogs,
  getCaseStats,
  getTimeline,
  addTimelineEvent,
  getWomenSafetyCases,
  analyzeCaseWithAI,
} = require("../controllers/caseController");

const router = express.Router();

// ======================================================
// CREATE CASE FROM FIR
// ======================================================

router.post(
  "/",
  protect,
  allowRoles(
    "CITIZEN",
    "POLICE",
    "ADMIN"
  ),
  createCaseFromFIR
);

// ======================================================
// ANALYZE CASE WITH AI
// ======================================================

router.post(
  "/analyze",
  protect,
  allowRoles(
    "POLICE",
    "ADMIN",
    "INVESTIGATING_AGENCY",
    "COURT"
  ),
  analyzeCaseWithAI
);

// ======================================================
router.get('/audit/all', protect, allowRoles('POLICE', 'ADMIN'), getSystemAuditLogs);

// GET ALL CASES
// ======================================================

router.get(
  "/",
  protect,
  allowRoles(
    "CITIZEN",
    "POLICE",
    "INVESTIGATING_AGENCY",
    "COURT",
    "ADMIN"
  ),
  getAllCases
);

// ======================================================
// GET ASSIGNED CASES
// ======================================================

router.get(
  "/assigned-to-me",
  protect,
  allowRoles("POLICE"),
  getAssignedCases
);

// ======================================================
// DASHBOARD STATISTICS
// ======================================================

router.get(
  "/stats",
  protect,
  allowRoles(
    "POLICE",
    "ADMIN",
    "INVESTIGATING_AGENCY"
  ),
  getCaseStats
);

// ======================================================
// UPDATE CASE STATUS
// ======================================================

router.patch(
  "/status",
  protect,
  allowRoles(
    "POLICE",
    "ADMIN"
  ),
  updateStatus
);

// ======================================================
// GET WOMEN SAFETY CASES
// ======================================================

router.get(
  "/women-safety",
  protect,
  allowRoles("POLICE"),
  getWomenSafetyCases
);

// ======================================================
// CASE TIMELINE
// ======================================================

router.get(
  "/:caseId/timeline",
  protect,
  allowRoles(
    "CITIZEN",
    "POLICE",
    "INVESTIGATING_AGENCY",
    "COURT",
    "ADMIN"
  ),
  getTimeline
);

// ======================================================
// CASE AUDIT HISTORY
// ======================================================

router.get(
  "/:caseId/audit",
  protect,
  allowRoles(
    "CITIZEN",
    "POLICE",
    "INVESTIGATING_AGENCY",
    "COURT",
    "ADMIN"
  ),
  getCaseAuditLogs
);

// ======================================================
// SINGLE CASE
// ======================================================

router.get(
  "/:caseId",
  protect,
  allowRoles(
    "CITIZEN",
    "POLICE",
    "INVESTIGATING_AGENCY",
    "COURT",
    "ADMIN"
  ),
  getSingleCase
);

// ======================================================
// SMART CASE ASSIGNMENT
// ======================================================

router.patch(
  "/assign",
  protect,
  allowRoles(
    "POLICE",
    "ADMIN"
  ),
  assignCase
);


router.post(
  "/:caseId/timeline",
  protect,
  allowRoles("POLICE", "ADMIN"),
  addTimelineEvent
);

module.exports = router;

