/**
 * @file pdfGenerator.js
 * @description Logic for generating personalized PDF certificates using pdf-lib.
 */

const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

/**
 * Generates a PDF certificate in-memory as a buffer.
 * If a custom template.pdf exists in the uploads folder, it uses it as a background.
 * Otherwise, it generates a premium default certificate.
 * @param {string} data.name - The name of the participant.
 * @param {string} data.eventName - The name of the event.
 * @param {string} data.certificateId - Unique identifier for the certificate.
 * @returns {Promise<Uint8Array>} The generated PDF bytes.
 */
async function generateCertificatePDF({ name, eventName, certificateId }) {
  const templatePath = path.join(__dirname, "../uploads/template.pdf");
  let pdfDoc;
  let page;
  let width, height;

  const hasTemplate = fs.existsSync(templatePath);

  if (hasTemplate) {
    // Load existing PDF template
    const templateBytes = fs.readFileSync(templatePath);
    pdfDoc = await PDFDocument.load(templateBytes);

    // Get the first page
    const pages = pdfDoc.getPages();
    page = pages[0];
    const size = page.getSize();
    width = size.width;
    height = size.height;
  } else {
    // Generate from scratch (Premium Default)
    pdfDoc = await PDFDocument.create();
    page = pdfDoc.addPage([841.89, 595.28]); // Landscape A4
    const size = page.getSize();
    width = size.width;
    height = size.height;
  }

  // Embed fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const gold = rgb(0.83, 0.68, 0.21);
  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);

  if (!hasTemplate) {
    // ONLY draw the backgrounds/borders if we DON'T have a template
    page.drawRectangle({
      x: 20, y: 20,
      width: width - 40, height: height - 40,
      borderWidth: 5, borderColor: gold,
    });
    page.drawRectangle({
      x: 40, y: 40,
      width: width - 80, height: height - 80,
      borderWidth: 1, borderColor: gold,
    });

    // Default Title
    const title = "CERTIFICATE OF PARTICIPATION";
    const titleSize = 36;
    const titleWidth = fontBold.widthOfTextAtSize(title, titleSize);
    page.drawText(title, {
      x: (width - titleWidth) / 2, y: height - 150,
      size: titleSize, font: fontBold, color: black,
    });

    // Certify text
    const context = "This is to certify that";
    const contextSize = 16;
    const contextWidth = fontItalic.widthOfTextAtSize(context, contextSize);
    page.drawText(context, {
      x: (width - contextWidth) / 2, y: height - 220,
      size: contextSize, font: fontItalic, color: gray,
    });
  }

  // ALWAYS draw the dynamic data (Name, Event, ID)
  // We placement is tuned for standard portrait/landscape templates.

  // 1. Participant Name
  const nameSize = hasTemplate ? 26 : 48; // Smaller for templates
  const nameWidth = fontBold.widthOfTextAtSize(name, nameSize);

  // Vertical alignment Adjustment:
  // Based on the user's photo, the name was overlapping the title at 0.43.
  // We're moving it down significantly to hit the "This Is To Certify That" line.
  const nameY = hasTemplate ? height * 0.34 : height - 300;

  page.drawText(name, {
    x: (width - nameWidth) / 2,
    y: nameY,
    size: nameSize,
    font: fontBold,
    color: black,
  });

  if (!hasTemplate) {
    const eventDesc = `has successfully participated in the event`;
    const eventDescSize = 16;
    const eventDescWidth = fontRegular.widthOfTextAtSize(eventDesc, eventDescSize);
    page.drawText(eventDesc, {
      x: (width - eventDescWidth) / 2, y: height - 350,
      size: eventDescSize, font: fontRegular, color: gray,
    });

    const eventNameSize = 24;
    const eventNameWidth = fontBold.widthOfTextAtSize(eventName, eventNameSize);
    page.drawText(eventName, {
      x: (width - eventNameWidth) / 2, y: height - 400,
      size: eventNameSize, font: fontBold, color: black,
    });
  }

  // Footer data (Date & ID)
  // Adjusted to be lower but still within the design area (near the signatures)
  const footerY = hasTemplate ? height * 0.28 : 80;
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  page.drawText(`Date: ${today}`, {
    x: 100, y: footerY, size: 10, font: fontRegular, color: gray,
  });

  const certText = `Certificate ID: ${certificateId}`;
  const certWidth = fontRegular.widthOfTextAtSize(certText, 10);
  page.drawText(certText, {
    x: width - 100 - certWidth, y: footerY,
    size: 10, font: fontRegular, color: gray,
  });

  return pdfDoc.save();
}

/**
 * Converts PDF bytes to a Base64 string for SendGrid attachment.
 * @param {Uint8Array} pdfBytes 
 * @returns {string} Base64 encoded string.
 */
function pdfToBase64(pdfBytes) {
  return Buffer.from(pdfBytes).toString("base64");
}

module.exports = { generateCertificatePDF, pdfToBase64 };
