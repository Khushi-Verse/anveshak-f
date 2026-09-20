const mongoose = require("mongoose");

const firSchema = new mongoose.Schema(
  {
    firNumber: {
      type: String,
      unique: true,
      required: true,
    },

    complainant: {
      type: String,
      required: true,
      trim: true,
    },

    incidentDescription: {
      type: String,
      required: true,
      trim: true,
    },

    incidentDate: {
      type: Date,
      required: true,
    },

    incidentLocation: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    // Explicit citizen-selected routing flag for Women FIRs.
    isWomenSafety: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["SUBMITTED", "UNDER_REVIEW", "REGISTERED", "CLOSED"],
      default: "SUBMITTED",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FIR", firSchema);