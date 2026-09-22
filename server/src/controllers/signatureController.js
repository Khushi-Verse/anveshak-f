const Case = require("../models/Case");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const {
  createSignedCopy,
} = require("../services/signatureOverlayService");

const Evidence = require("../models/Evidence");
const DigitalSignature = require("../models/DigitalSignature");

// ======================================================
// SIGN EVIDENCE
// ======================================================

const signEvidence = async (req, res) => {
  try {
    const { evidenceId } = req.params;

    // --------------------------------------------------
    // 1. Find evidence
    // --------------------------------------------------

    const evidence = await Evidence.findOne({
      evidenceId,
    });

    if (!evidence) {
      return res.status(404).json({
        message: "Evidence not found",
      });
    }

    // --------------------------------------------------
    // 2. Find linked case
    // --------------------------------------------------

    const caseData = await Case.findOne({
      caseId: evidence.caseId,
    });

    if (!caseData) {
      return res.status(404).json({
        message: "Case linked to evidence not found",
      });
    }

    // --------------------------------------------------
    // 3. Check authorized roles
    // --------------------------------------------------

    const allowedRoles = [
      "POLICE",
      "INVESTIGATING_AGENCY",
      "COURT",
      "ADMIN",
    ];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You are not authorized to sign evidence",
      });
    }

    // --------------------------------------------------
    // 4. Police assignment authorization
    // --------------------------------------------------

    if (req.user.role === "POLICE") {
      if (!caseData.assignedOfficer) {
        return res.status(403).json({
          message:
            "No officer is assigned to this case",
        });
      }

      const assignedOfficerId =
        String(caseData.assignedOfficer);

      const currentUserId =
        String(req.user.userId);

      if (assignedOfficerId !== currentUserId) {
        console.error(
          "SIGNATURE AUTHORIZATION FAILED:",
          {
            caseId: caseData.caseId,
            assignedOfficerId,
            currentUserId,
          }
        );

        return res.status(403).json({
          message:
            "You are not authorized to sign evidence for this case",
        });
      }
    }

    // --------------------------------------------------
    // 5. Check signature image
    // --------------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        message: "Signature image is required",
      });
    }

    // --------------------------------------------------
    // 6. Check signature image type
    // --------------------------------------------------

    const allowedSignatureTypes = [
      "image/png",
      "image/jpeg",
    ];

    if (
      !allowedSignatureTypes.includes(
        req.file.mimetype
      )
    ) {
      if (
        req.file.path &&
        fs.existsSync(req.file.path)
      ) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        message:
          "Signature must be a PNG or JPEG image",
      });
    }

    // --------------------------------------------------
    // 7. Check if evidence is already signed
    // --------------------------------------------------

    const existingSignature =
      await DigitalSignature.findOne({
        evidenceId,
      });

    if (existingSignature) {
      if (
        req.file.path &&
        fs.existsSync(req.file.path)
      ) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        message:
          "Evidence has already been signed",
      });
    }

    // --------------------------------------------------
    // 8. Check original evidence file
    // --------------------------------------------------

    const evidenceFilePath = path.resolve(
      evidence.filePath
    );

    if (!fs.existsSync(evidenceFilePath)) {
      if (
        req.file.path &&
        fs.existsSync(req.file.path)
      ) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(404).json({
        message: "Evidence file not found",
      });
    }

    // --------------------------------------------------
    // 9. Determine evidence type
    // --------------------------------------------------

    const evidenceExtension = path
      .extname(evidence.fileName)
      .toLowerCase();

    let evidenceMimeType = "";

    if (evidenceExtension === ".pdf") {
      evidenceMimeType = "application/pdf";
    } else if (
      evidenceExtension === ".jpg" ||
      evidenceExtension === ".jpeg"
    ) {
      evidenceMimeType = "image/jpeg";
    } else if (
      evidenceExtension === ".png"
    ) {
      evidenceMimeType = "image/png";
    }

    // --------------------------------------------------
    // 10. Block unsupported evidence
    // --------------------------------------------------

    if (!evidenceMimeType) {
      if (
        req.file.path &&
        fs.existsSync(req.file.path)
      ) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(415).json({
        message:
          "Digital signature is supported only for PDF and image evidence",
      });
    }

    // --------------------------------------------------
    // 11. Read original evidence
    // --------------------------------------------------

    const fileBuffer =
      fs.readFileSync(
        evidenceFilePath
      );

    // --------------------------------------------------
    // 12. Calculate current SHA-256
    // --------------------------------------------------

    const currentHash =
      crypto
        .createHash("sha256")
        .update(fileBuffer)
        .digest("hex");

    // --------------------------------------------------
    // 13. Verify evidence integrity
    // --------------------------------------------------

    if (
      currentHash !== evidence.fileHash
    ) {
      if (
        req.file.path &&
        fs.existsSync(req.file.path)
      ) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(409).json({
        message:
          "Evidence has been modified and cannot be signed",
      });
    }

    // --------------------------------------------------
    // 14. Create visually signed copy
    // --------------------------------------------------

    const signedFilePath =
      await createSignedCopy(
        evidenceFilePath,
        req.file.path,
        evidenceMimeType
      );

    // --------------------------------------------------
    // 15. Load private key
    // --------------------------------------------------

    // --------------------------------------------------
// 15. Load private key
// --------------------------------------------------

let privateKey;

// Use Render environment variable in production
if (process.env.PRIVATE_KEY) {
  privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, "\n");
} else {
  // Use local key file during development
  const privateKeyPath = path.join(
    __dirname,
    "../../keys/private.pem"
  );

  if (!fs.existsSync(privateKeyPath)) {
    if (
      req.file.path &&
      fs.existsSync(req.file.path)
    ) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      message: "Signing key not found",
    });
  }

  privateKey = fs.readFileSync(
    privateKeyPath,
    "utf8"
  );
}

    // --------------------------------------------------
    // 16. Prepare data
    // --------------------------------------------------

    const dataToSign =
      `${evidence.evidenceId}:${evidence.fileHash}`;

    // --------------------------------------------------
    // 17. Create RSA digital signature
    // --------------------------------------------------

    const signer =
      crypto.createSign("SHA256");

    signer.update(dataToSign);
    signer.end();

    const digitalSignature =
      signer.sign(
        privateKey,
        "base64"
      );

    // --------------------------------------------------
    // 18. Save signature record
    // --------------------------------------------------

    const signatureRecord =
      await DigitalSignature.create({
        evidenceId:
          evidence.evidenceId,

        evidenceHash:
          evidence.fileHash,

        signatureImage:
          req.file.path,

        signedFilePath:
          signedFilePath,

        signedBy:
          req.user.userId,

        signedAt:
          new Date(),

        digitalSignature:
          digitalSignature,

        verificationStatus:
          "VALID",
      });

    // --------------------------------------------------
    // 19. Response
    // --------------------------------------------------

    return res.status(201).json({
      message:
        "Evidence signed successfully",

      signature: {
        evidenceId:
          signatureRecord.evidenceId,

        evidenceHash:
          signatureRecord.evidenceHash,

        signatureImage:
          signatureRecord.signatureImage,

        signedFilePath:
          signatureRecord.signedFilePath,

        signedBy:
          signatureRecord.signedBy,

        signedAt:
          signatureRecord.signedAt,

        verificationStatus:
          signatureRecord.verificationStatus,
      },
    });

  } catch (error) {
    if (
      req.file &&
      req.file.path &&
      fs.existsSync(req.file.path)
    ) {
      fs.unlinkSync(req.file.path);
    }

    console.error(
      "Digital signature error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to sign evidence",

      error:
        error.message,
    });
  }
};

// ======================================================
// VERIFY DIGITAL SIGNATURE
// ======================================================

const verifySignature = async (
  req,
  res
) => {
  try {
    const { evidenceId } =
      req.params;

    // --------------------------------------------------
    // 1. Find evidence
    // --------------------------------------------------

    const evidence =
      await Evidence.findOne({
        evidenceId,
      });

    if (!evidence) {
      return res.status(404).json({
        message:
          "Evidence not found",
      });
    }

    // --------------------------------------------------
    // 2. Find signature
    // --------------------------------------------------

    const signature =
      await DigitalSignature.findOne({
        evidenceId,
      });

    if (!signature) {
      return res.status(404).json({
        message:
          "Digital signature not found",
      });
    }

    // --------------------------------------------------
    // 3. Check evidence file
    // --------------------------------------------------

    const evidenceFilePath =
      path.resolve(
        evidence.filePath
      );

    if (
      !fs.existsSync(
        evidenceFilePath
      )
    ) {
      return res.status(404).json({
        message:
          "Evidence file not found",
      });
    }

    // --------------------------------------------------
    // 4. Calculate current hash
    // --------------------------------------------------

    const fileBuffer =
      fs.readFileSync(
        evidenceFilePath
      );

    const currentHash =
      crypto
        .createHash("sha256")
        .update(fileBuffer)
        .digest("hex");

    // --------------------------------------------------
    // 5. Compare evidence hash
    // --------------------------------------------------

    if (
      currentHash !==
      signature.evidenceHash
    ) {
      signature.verificationStatus =
        "INVALID";

      await signature.save();

      return res.status(200).json({
        evidenceId,

        originalHash:
          signature.evidenceHash,

        currentHash,

        verificationStatus:
          "INVALID",

        verified: false,

        message:
          "Evidence has been modified after signing",
      });
    }

    // --------------------------------------------------
    // 6. Load public key
    // --------------------------------------------------

    // --------------------------------------------------
// 6. Load public key
// --------------------------------------------------

let publicKey;

// Use Render environment variable in production
if (process.env.PUBLIC_KEY) {
  publicKey = process.env.PUBLIC_KEY.replace(/\\n/g, "\n");
} else {
  // Use local key file during development
  const publicKeyPath = path.join(
    __dirname,
    "../../keys/public.pem"
  );

  if (!fs.existsSync(publicKeyPath)) {
    return res.status(500).json({
      message: "Public key not found",
    });
  }

  publicKey = fs.readFileSync(
    publicKeyPath,
    "utf8"
  );
}

    // --------------------------------------------------
    // 7. Prepare verification data
    // --------------------------------------------------

    const dataToVerify =
      `${evidence.evidenceId}:${signature.evidenceHash}`;

    // --------------------------------------------------
    // 8. Verify RSA signature
    // --------------------------------------------------

    const verifier =
      crypto.createVerify(
        "SHA256"
      );

    verifier.update(
      dataToVerify
    );

    verifier.end();

    const isValid =
      verifier.verify(
        publicKey,
        signature.digitalSignature,
        "base64"
      );

    // --------------------------------------------------
    // 9. Update status
    // --------------------------------------------------

    signature.verificationStatus =
      isValid
        ? "VALID"
        : "INVALID";

    await signature.save();

    // --------------------------------------------------
    // 10. Response
    // --------------------------------------------------

    return res.status(200).json({
      evidenceId,

      originalHash:
        signature.evidenceHash,

      currentHash,

      verificationStatus:
        signature.verificationStatus,

      verified:
        isValid,
    });

  } catch (error) {
    console.error(
      "Signature verification error:",
      error
    );

    return res.status(500).json({
      message:
        "Signature verification failed",

      error:
        error.message,
    });
  }
};

// ======================================================
// GET SIGNED EVIDENCE
// ======================================================

const getSignedEvidence = async (
  req,
  res
) => {
  try {
    const { evidenceId } =
      req.params;

    // --------------------------------------------------
    // 1. Find signature
    // --------------------------------------------------

    const signature =
      await DigitalSignature.findOne({
        evidenceId,
      });

    if (!signature) {
      return res.status(404).json({
        message:
          "Digital signature not found",
      });
    }

    // --------------------------------------------------
    // 2. Check signed file path
    // --------------------------------------------------

    if (
      !signature.signedFilePath
    ) {
      return res.status(404).json({
        message:
          "No visually signed file available for this evidence",
      });
    }

    // --------------------------------------------------
    // 3. Resolve signed file
    // --------------------------------------------------

    const signedFilePath =
      path.resolve(
        signature.signedFilePath
      );

    // --------------------------------------------------
    // 4. Check file exists
    // --------------------------------------------------

    if (
      !fs.existsSync(
        signedFilePath
      )
    ) {
      return res.status(404).json({
        message:
          "Signed evidence file not found",
      });
    }

    // --------------------------------------------------
    // 5. Send signed file
    // --------------------------------------------------

    return res.sendFile(
      signedFilePath
    );

  } catch (error) {
    console.error(
      "Get signed evidence error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to retrieve signed evidence",

      error:
        error.message,
    });
  }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
  signEvidence,
  verifySignature,
  getSignedEvidence,
};