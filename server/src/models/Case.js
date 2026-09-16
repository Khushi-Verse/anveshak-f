const mongoose = require("mongoose");

const caseSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      unique: true,
      required: true,
    },

    firId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FIR",
      required: true,
    },

    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "CREATED",
        "FIR_REGISTERED",
        "UNDER_REVIEW",
        "ASSIGNED",
        "INVESTIGATION",
        "EVIDENCE_COLLECTION",
        "FORENSIC_REVIEW",
        "CHARGE_SHEET",
        "COURT_PROCEEDINGS",
        "RESOLVED",
        "DISPOSED",
      ],
      default: "FIR_REGISTERED",
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },

    aiAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    courtProceedings: {
      type: Array,
      default: [],
    },

    nextHearingDate: {
      type: Date,
      default: null,
    },

    jurisdiction: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Case", caseSchema);