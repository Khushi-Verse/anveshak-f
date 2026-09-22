const express = require("express");
const protect = require("../middleware/authMiddleware");
const upload = require("../config/upload");
const {
  signEvidence,
  verifySignature,
  getSignedEvidence
} = require("../controllers/signatureController");
const router = express.Router();

router.post(
  "/:evidenceId/sign",
  (req, res, next) => {
    console.log("=== SIGN ROUTE HIT ===");
    console.log("Evidence ID:", req.params.evidenceId);
    console.log("Authorization exists:", !!req.headers.authorization);
    next();
  },
  protect,
  (req, res, next) => {
    console.log("=== AUTH PASSED ===");
    console.log("User:", req.user);
    next();
  },
  (req, res, next) => {
    console.log("=== BEFORE MULTER ===");

    upload.single("signature")(req, res, (err) => {
      if (err) {
        console.error("=== MULTER ERROR ===");
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);

        return res.status(500).json({
          message: "Signature upload failed",
          error: err.message,
        });
      }

      console.log("=== MULTER PASSED ===");
      console.log("Uploaded file:", req.file);

      next();
    });
  },
  signEvidence
);
router.get(
  "/:evidenceId/signature/verify",
  protect,
  verifySignature
);
router.get(
  "/:evidenceId/signed",
  protect,
  getSignedEvidence
);

module.exports = router;