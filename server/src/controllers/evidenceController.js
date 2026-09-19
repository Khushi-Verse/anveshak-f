const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const Case = require("../models/Case");
const Evidence = require("../models/Evidence");
const generateEvidenceId = require("../services/evidenceIdService");

const {
  anchorEvidence,
} = require("../blockchain/evidenceRegistry");

const uploadEvidence = async (req, res) => {
  try {
    const { caseId, description } = req.body;

    // Check whether file was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "Evidence file is required",
      });
    }

    // Check whether caseId was provided
    if (!caseId) {
      // Remove uploaded file because caseId is missing
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        message: "Case ID is required",
      });
    }

    // Check whether the Case actually exists
    const existingCase = await Case.findOne({ caseId });

    if (!existingCase) {
      // Remove uploaded file because Case doesn't exist
      fs.unlinkSync(req.file.path);

      return res.status(404).json({
        message: "Case not found",
      });
    }

    // Read the uploaded file
    const fileBuffer = fs.readFileSync(req.file.path);

    // Generate SHA-256 hash
    const fileHash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    // Generate unique Evidence ID
    const evidenceId = await generateEvidenceId();

    // Save evidence metadata in MongoDB
    const evidence = await Evidence.create({
      evidenceId,
      caseId,
      uploadedBy: req.user.userId,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileHash,
      custodyStatus: "IN_CUSTODY",
      verificationStatus: "PENDING",
      blockchainStatus: "NOT_ANCHORED",
    });

    // Anchor evidence hash on blockchain
    try {
      const blockchainResult = await anchorEvidence(
        evidence.evidenceId,
        evidence.fileHash
      );

      evidence.blockchainStatus = "ANCHORED";
      evidence.blockchainTxHash =
        blockchainResult.transactionHash;
      evidence.blockchainAnchoredHash =
        evidence.fileHash;
      evidence.blockchainAnchoredAt = new Date();

      await evidence.save();
      
      const AuditLog = require('../models/AuditLog');
      await AuditLog.create({
        userId: req.user.userId,
        caseId: caseId,
        action: 'EVIDENCE_UPLOADED',
        description: `Uploaded evidence file: ${req.file.originalname}`
      });

    } catch (blockchainError) {
      // Evidence is already safely stored in MongoDB.
      // Blockchain anchoring failed, so mark it accordingly.
      evidence.blockchainStatus = "FAILED";

      await evidence.save();

      console.error(
        "Blockchain anchoring failed:",
        blockchainError.message
      );
    }

    res.status(201).json({
      message: "Evidence uploaded successfully",
      evidence: {
        evidenceId: evidence.evidenceId,
        caseId: evidence.caseId,
        fileName: evidence.fileName,
        fileHash: evidence.fileHash,
        uploadedBy: evidence.uploadedBy,
        custodyStatus: evidence.custodyStatus,
        verificationStatus: evidence.verificationStatus,

        blockchainStatus: evidence.blockchainStatus,
        blockchainTxHash: evidence.blockchainTxHash,
        blockchainAnchoredHash:
          evidence.blockchainAnchoredHash,
        blockchainAnchoredAt:
          evidence.blockchainAnchoredAt,
      },
    });
  } catch (error) {
    // If something goes wrong, remove the uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Evidence upload failed",
      error: error.message,
    });
  }
};

const verifyEvidence = async (req, res) => {
  try {
    const { evidenceId } = req.params;

    // Check whether a file was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "File is required for verification",
      });
    }

    // Find the original evidence or document
    let evidence = await Evidence.findOne({ evidenceId });
    if (!evidence && evidenceId.length === 24) {
      const Document = require("../models/Document");
      evidence = await Document.findById(evidenceId);
    }

    if (!evidence) {
      return res.status(404).json({
        message: "Evidence/Document not found",
      });
    }

    const originalHash = evidence.fileHash || evidence.digitalSignature?.documentHash || evidence.blockchainAnchoredHash;
    if (!originalHash) {
       return res.status(400).json({ message: "No hash found on record for this file to verify against." });
    }

    // Read the file being verified
    const fileBuffer = fs.readFileSync(req.file.path);

    // Generate SHA-256 hash of current file
    const currentHash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    // Compare hashes
    const isVerified = currentHash === originalHash;

    // Update verification status
    // Note: Document model doesn't have verificationStatus but it doesn't hurt to set it, or we can just ignore saving it if it's a Document.
    if (evidence.verificationStatus !== undefined) {
       evidence.verificationStatus = isVerified ? "VERIFIED" : "TAMPERED";
       await evidence.save();
    }

    // Delete temporary verification file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      message: isVerified ? "Evidence verified successfully" : "Evidence integrity check failed",
      verified: isVerified,
      originalHash: originalHash,
      currentHash,
      verificationStatus: isVerified ? "VERIFIED" : "TAMPERED",
    });
  } catch (error) {
    // Remove temporary file if something goes wrong
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Evidence verification failed",
      error: error.message,
    });
  }
};

module.exports = {
  uploadEvidence,
  verifyEvidence,
};