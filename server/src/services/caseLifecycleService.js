const Case = require("../models/Case");
const { createNotification } = require("../controllers/notificationController");

const {
  createTimelineEvent,
} = require("./timelineService");

const {
  createAuditLog,
} = require("./auditService");

// ======================================================
// ALLOWED CASE STATUS TRANSITIONS
// ======================================================

const allowedTransitions = {
  FIR_REGISTERED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["ASSIGNED"],
  ASSIGNED: ["INVESTIGATION"],
  INVESTIGATION: ["EVIDENCE_COLLECTION"],
  EVIDENCE_COLLECTION: ["FORENSIC_REVIEW"],
  FORENSIC_REVIEW: ["CHARGE_SHEET"],
  CHARGE_SHEET: ["COURT_PROCEEDINGS"],
  COURT_PROCEEDINGS: ["RESOLVED"],
  RESOLVED: [],
};

// ======================================================
// NORMALIZE STATUS
// ======================================================

const normalizeStatus = (status) => {
  if (!status) {
    return null;
  }

  return String(status)
    .trim()
    .toUpperCase();
};

// ======================================================
// CHECK STATUS TRANSITION
// ======================================================

const canTransition = (
  currentStatus,
  nextStatus
) => {
  const current = normalizeStatus(
    currentStatus
  );

  const next = normalizeStatus(
    nextStatus
  );

  const allowedStatuses =
    allowedTransitions[current];

  if (!allowedStatuses) {
    return false;
  }

  return allowedStatuses.includes(next);
};

// ======================================================
// UPDATE CASE STATUS
// ======================================================

const updateCaseStatus = async (
  caseId,
  nextStatus,
  performedBy
) => {
  try {
    console.log(
      "=========================================="
    );

    console.log(
      "CASE STATUS UPDATE REQUEST"
    );

    console.log(
      "Case ID:",
      caseId
    );

    console.log(
      "Requested Status:",
      nextStatus
    );

    console.log(
      "Performed By:",
      performedBy
    );

    // ==================================================
    // NORMALIZE STATUS
    // ==================================================

    const normalizedNextStatus =
      normalizeStatus(nextStatus);

    if (!normalizedNextStatus) {
      throw new Error(
        "Next status is required"
      );
    }

    // ==================================================
    // FIND CASE
    // ==================================================

    const caseData =
      await Case.findOne({
        caseId,
      });

    if (!caseData) {
      throw new Error(
        "Case not found"
      );
    }

    // ==================================================
    // CURRENT STATUS
    // ==================================================

    const currentStatus =
      normalizeStatus(
        caseData.status
      );

    console.log(
      "Current Status:",
      currentStatus
    );

    console.log(
      "Next Status:",
      normalizedNextStatus
    );

    // ==================================================
    // VALIDATE TRANSITION
    // ==================================================

    if (
      !canTransition(
        currentStatus,
        normalizedNextStatus
      )
    ) {
      throw new Error(
        `Invalid status transition: ${currentStatus} → ${normalizedNextStatus}`
      );
    }

    // ==================================================
    // UPDATE CASE
    // ==================================================

    caseData.status =
      normalizedNextStatus;

    await caseData.save();

    console.log(
      "CASE STATUS SAVED TO DATABASE:",
      caseData.status
    );

    // ==================================================
    // CREATE TIMELINE ENTRY
    // ==================================================

    try {
      await createTimelineEvent({
        caseId: caseData.caseId,
        status: normalizedNextStatus,
        action: "CASE_STATUS_UPDATED",
        performedBy,
        description: `Case status changed from ${currentStatus} to ${normalizedNextStatus}`,
      });

      console.log(
        "Timeline entry created successfully"
      );
    } catch (timelineError) {
      console.error(
        "Timeline creation failed:",
        timelineError.message
      );
    }

    // ==================================================
    // CREATE AUDIT ENTRY
    // ==================================================

    try {
      await createAuditLog({
        userId: performedBy,
        caseId: caseData.caseId,
        action: "CASE_STATUS_CHANGED",
        oldValue: currentStatus,
        newValue: normalizedNextStatus,
        description: `Case status changed from ${currentStatus} to ${normalizedNextStatus}`,
      });

      console.log(
        "Audit log created successfully"
      );
    } catch (auditError) {
      console.error(
        "Audit log creation failed:",
        auditError.message
      );
    }

    console.log(
      "FINAL CASE STATUS:",
      caseData.status
    );

    console.log(
      "=========================================="
    );

    // Trigger notifications for status change
    try {
      if (caseData.citizenId) {
        await createNotification({
          userId: caseData.citizenId,
          caseId: caseData.caseId,
          type: "STATUS_CHANGED",
          message: `Case ${caseData.caseId} status updated to ${caseData.status}`
        });
      }
      if (caseData.assignedOfficer) {
        await createNotification({
          userId: caseData.assignedOfficer,
          caseId: caseData.caseId,
          type: "STATUS_CHANGED",
          message: `Case ${caseData.caseId} status updated to ${caseData.status}`
        });
      }
    } catch(notifError) {
       console.error("Failed to send status update notification", notifError);
    }

    return caseData;
  } catch (error) {
    console.error(
      "Lifecycle status update failed:",
      error.message
    );

    throw error;
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  allowedTransitions,
  normalizeStatus,
  canTransition,
  updateCaseStatus,
};