const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Configure multer to save the template in the uploads folder
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // We always call it "template.pdf" to overwrite the old one
        cb(null, "template.pdf");
    },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"), false);
        }
    },
});

/**
 * POST /api/settings/template
 * @description Upload a PDF template to be used for certificates.
 */
router.post("/template", upload.single("template"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No PDF file uploaded" });
        }
        res.json({ success: true, message: "Template uploaded successfully" });
    } catch (err) {
        console.error("Template upload error:", err);
        res.status(500).json({ error: "Failed to upload template" });
    }
});

/**
 * GET /api/settings/template-info
 * @description Check if a template exists.
 */
router.get("/template-info", (req, res) => {
    const templatePath = path.join(__dirname, "../uploads/template.pdf");
    const exists = fs.existsSync(templatePath);
    res.json({ exists });
});

module.exports = router;
