const Case = require("../models/Case");
const Document = require("../models/Document");
const Timeline = require("../models/Timeline");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { createNotification } = require("./notificationController");
const crypto = require("crypto");
const fs = require("fs");
const { anchorEvidence } = require("../blockchain/evidenceRegistry");

// --- Helper to save Document to DB ---
const saveDocument = async (req, caseId, type, signatureData) => {
  if (!req.file) return null;

  // Assuming Express serves the "uploads" folder statically at /uploads/
  const fileUrl = `/uploads/${req.file.filename}`;
  
  // Cryptographic Hashing
  const fileBuffer = fs.readFileSync(req.file.path);
  const documentHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  
  // Prepare digital signature data
  const sigData = signatureData || { method: "none" };
  
  // RESTRICTION: Do not allow digital signatures for TXT or Video files
  const mimeType = req.file.mimetype;
  const isVideoOrText = mimeType.startsWith("video/") || mimeType === "text/plain";

  if (isVideoOrText) {
    sigData.method = "none";
    sigData.verified = false;
    delete sigData.documentHash;
    delete sigData.cryptographicSeal;
  } else {
    sigData.documentHash = documentHash;
  }
  
  if (sigData.method !== "none") {
    // Generate server-side cryptographic seal (HMAC) proving backend verified it
    const payload = `${caseId}|${req.user.userId}|${documentHash}|${sigData.timestamp || new Date().toISOString()}`;
    const cryptographicSeal = crypto.createHmac("sha256", process.env.JWT_SECRET || "fallback_secret")
                                    .update(payload)
                                    .digest("hex");
    sigData.cryptographicSeal = cryptographicSeal;
    sigData.verified = true;
  }

  const doc = new Document({
    caseId,
    filename: req.file.originalname,
    fileUrl,
    type,
    uploadedBy: req.user.userId,
    size: req.file.size,
    digitalSignature: sigData
  });

  await doc.save();
  
  // Anchor all court documents to blockchain (like police evidence)
  try {
    const blockchainResult = await anchorEvidence(
      doc._id.toString(),
      documentHash
    );

    doc.blockchainStatus = "ANCHORED";
    doc.blockchainTxHash = blockchainResult.transactionHash;
    doc.blockchainAnchoredHash = documentHash;
    doc.blockchainAnchoredAt = new Date();

    await doc.save();
  } catch (err) {
    doc.blockchainStatus = "FAILED";
    await doc.save();
  }
  
  // Hash-Secured Audit Log for Uploads
  await AuditLog.create({
    caseId,
    userId: req.user.userId,
    action: "UPLOADED_DOCUMENT",
    details: `Uploaded ${type}: ${req.file.originalname}`,
    ipAddress: req.ip || req.headers["x-forwarded-for"] || "unknown"
  });

  return doc;
};

// --- Record Hearing Order ---
exports.addHearingOrder = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { hearingDate, note, nextHearingDate, signatureData } = req.body;
    let parsedSignature = null;
    
    if (signatureData) {
      try { 
        let raw = JSON.parse(signatureData); 
        parsedSignature = {
          method: String(raw.method || 'none'),
          officerName: String(raw.officerName || ''),
          timestamp: raw.timestamp || new Date().toISOString()
        };
      } catch (e) { parsedSignature = null; }
    }

    const caseIdStr = String(caseId);
    if (caseIdStr.length > 50) return res.status(400).json({ message: "Invalid case ID" });

    const user = await User.findById(req.user.userId);

    // 1. Save uploaded file if any
    const savedDoc = await saveDocument(req, caseIdStr, "Court Order", parsedSignature);

    // 2. Update Case
    const caseRecord = await Case.findOne({ caseId: caseIdStr });
    if (!caseRecord) return res.status(404).json({ message: "Case not found" });

    if (!caseRecord.courtProceedings) {
      caseRecord.courtProceedings = [];
    }

    const newOrder = {
      hearingDate,
      note,
      nextHearingDate: nextHearingDate || null,
      documentId: savedDoc ? savedDoc._id : null,
      signedBy: parsedSignature ? parsedSignature.officerName : (user ? user.name : "Hon. Judge"),
      signedAt: parsedSignature ? parsedSignature.timestamp : new Date()
    };

    caseRecord.courtProceedings.push(newOrder);
    if (nextHearingDate) {
      caseRecord.nextHearingDate = nextHearingDate;
    }
    await caseRecord.save();

    // 3. Update Timeline
    const timelineEntry = await Timeline.create({
      caseId,
      status: caseRecord.status,
      action: "COURT_ORDER_ADDED",
      performedBy: req.user.userId,
      description: `Hearing order recorded for ${hearingDate}.`
    });

    // 4. Send Notifications
    if (caseRecord.citizenId) {
      await createNotification({ userId: caseRecord.citizenId, caseId, type: "COURT_UPDATE", message: `A new court order was added for your case ${caseId}.` });
    }
    if (caseRecord.assignedOfficer) {
      await createNotification({ userId: caseRecord.assignedOfficer, caseId, type: "COURT_UPDATE", message: `A new court order was added for assigned case ${caseId}.` });
    }

    res.status(201).json({ message: "Order recorded successfully", order: newOrder, document: savedDoc, timeline: timelineEntry });
  } catch (error) {
    console.error("addHearingOrder error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- Upload Final Judgment ---
exports.uploadFinalJudgment = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { remarks, signatureData } = req.body;
    let parsedSignature = null;
    
    if (signatureData) {
      try { 
        let raw = JSON.parse(signatureData); 
        parsedSignature = {
          method: String(raw.method || 'none'),
          officerName: String(raw.officerName || ''),
          timestamp: raw.timestamp || new Date().toISOString()
        };
      } catch (e) { parsedSignature = null; }
    }

    if (!req.file) {
      return res.status(400).json({ message: "Final judgment PDF is required" });
    }

    const caseIdStr = String(caseId);
    if (caseIdStr.length > 50) return res.status(400).json({ message: "Invalid case ID" });

    // 1. Save Document
    const savedDoc = await saveDocument(req, caseIdStr, "Final Judgment", parsedSignature);

    // 2. Update Case Status
    const caseRecord = await Case.findOne({ caseId: caseIdStr });
    if (!caseRecord) return res.status(404).json({ message: "Case not found" });

    caseRecord.status = "DISPOSED";
    await caseRecord.save();

    // 3. Update Timeline
    const timelineEntry = await Timeline.create({
      caseId,
      status: "DISPOSED",
      action: "FINAL_JUDGMENT_UPLOADED",
      performedBy: req.user.userId,
      description: `Final judgment uploaded and case disposed. Remarks: ${remarks || 'None'}`
    });

    // 4. Send Notifications
    if (caseRecord.citizenId) {
      await createNotification({ userId: caseRecord.citizenId, caseId, type: "STATUS_CHANGED", message: `Your case ${caseId} has been DISPOSED by the court.` });
    }
    if (caseRecord.assignedOfficer) {
      await createNotification({ userId: caseRecord.assignedOfficer, caseId, type: "STATUS_CHANGED", message: `Assigned case ${caseId} has been DISPOSED by the court.` });
    }

    res.status(201).json({ message: "Final judgment uploaded. Case disposed.", document: savedDoc, timeline: timelineEntry });
  } catch (error) {
    console.error("uploadFinalJudgment error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- Upload General Court Document ---
exports.uploadCourtDocument = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { type, signatureData } = req.body;
    let parsedSignature = null;
    
    if (signatureData) {
      try { 
        let raw = JSON.parse(signatureData); 
        parsedSignature = {
          method: String(raw.method || 'none'),
          officerName: String(raw.officerName || ''),
          timestamp: raw.timestamp || new Date().toISOString()
        };
      } catch (e) { parsedSignature = null; }
    }

    if (!req.file) {
      return res.status(400).json({ message: "Document file is required" });
    }

    const caseIdStr = String(caseId);
    if (caseIdStr.length > 50) return res.status(400).json({ message: "Invalid case ID" });

    const allowedDocTypes = ["Court Order", "Judicial Notice", "Bail Order", "Witness Summons", "Miscellaneous", "Supporting Document", "Charge Sheet", "Forensic", "Medical", "Statement"];
    const docType = allowedDocTypes.includes(type) ? type : "Supporting Document";

    const savedDoc = await saveDocument(req, caseIdStr, docType, parsedSignature);

    // Timeline entry
    await Timeline.create({
      caseId,
      status: "COURT_PROCEEDINGS",
      action: "DOCUMENT_UPLOADED",
      performedBy: req.user.userId,
      description: `${type || 'Document'} uploaded to case file.`
    });

    res.status(201).json({ message: "Document uploaded successfully", document: savedDoc });
  } catch (error) {
    console.error("uploadCourtDocument error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- Get Case Documents ---
exports.getCaseDocuments = async (req, res) => {
  try {
    const { caseId } = req.params;
    const documents = await Document.find({ caseId }).sort({ createdAt: -1 }).populate('uploadedBy', 'name role');
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


// --- Add Audit Log ---
exports.addAuditLog = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { action, details } = req.body;
    
    const log = await AuditLog.create({
      caseId,
      userId: req.user.userId,
      action: action || "VIEWED_CASE",
      details: details || `Viewed case ${caseId} dashboard`,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "unknown"
    });
    
    res.status(201).json({ message: "Audit log recorded securely", log });
  } catch (error) {
    console.error("addAuditLog error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// --- Get Audit Logs ---
exports.getAuditLogs = async (req, res) => {
  try {
    const { caseId } = req.params;
    const logs = await AuditLog.find({ caseId }).sort({ createdAt: -1 }).populate("userId", "name role");
    res.status(200).json(logs);
  } catch (error) {
    console.error("getAuditLogs error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

