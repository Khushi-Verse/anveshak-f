const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { PDFDocument } = require("pdf-lib");

const createSignedImage = async (evidencePath, signaturePath) => {
  const signedDirectory = path.join(
    process.cwd(),
    "uploads",
    "signed"
  );

  if (!fs.existsSync(signedDirectory)) {
    fs.mkdirSync(signedDirectory, { recursive: true });
  }

  const outputPath = path.join(
    signedDirectory,
    `signed-${Date.now()}${path.extname(evidencePath)}`
  );

  await sharp(evidencePath)
    .composite([
      {
        input: signaturePath,
        gravity: "southeast",
      },
    ])
    .toFile(outputPath);

  return outputPath;
};

const createSignedPdf = async (evidencePath, signaturePath) => {
  const signedDirectory = path.join(
    process.cwd(),
    "uploads",
    "signed"
  );

  if (!fs.existsSync(signedDirectory)) {
    fs.mkdirSync(signedDirectory, { recursive: true });
  }

  const outputPath = path.join(
    signedDirectory,
    `signed-${Date.now()}.pdf`
  );

  const pdfBytes = fs.readFileSync(evidencePath);

  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Convert the signature image to a real PNG
  // before embedding it into the PDF.
  const signatureBytes = await sharp(signaturePath)
    .png()
    .toBuffer();

  const signatureImage = await pdfDoc.embedPng(signatureBytes);

  const pages = pdfDoc.getPages();

  const lastPage = pages[pages.length - 1];

  const { width } = lastPage.getSize();

  const signatureWidth = 120;

  const signatureHeight =
    (signatureImage.height / signatureImage.width) *
    signatureWidth;

  lastPage.drawImage(signatureImage, {
    x: width - signatureWidth - 40,
    y: 40,
    width: signatureWidth,
    height: signatureHeight,
  });

  const signedPdfBytes = await pdfDoc.save({
    useObjectStreams: false,
  });

  fs.writeFileSync(outputPath, signedPdfBytes);

  return outputPath;
};

const createSignedCopy = async (
  evidencePath,
  signaturePath,
  mimeType
) => {
  if (mimeType === "application/pdf") {
    return await createSignedPdf(
      evidencePath,
      signaturePath
    );
  }

  if (mimeType.startsWith("image/")) {
    return await createSignedImage(
      evidencePath,
      signaturePath
    );
  }

  // Video, text and other files don't get a visible signature.
  return null;
};

module.exports = {
  createSignedCopy,
};