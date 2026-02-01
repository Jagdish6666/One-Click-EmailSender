const express = require("express");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const xlsx = require("xlsx");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
// router.use(requireAuth); // Currently disabled for project focus

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", async (req, res) => {
  try {
    const participants = await prisma.participant.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(participants);
  } catch (err) {
    console.error("Fetch participants error:", err);
    res.status(500).json({ error: "Failed to fetch participants" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, eventName } = req.body;
    if (!name || !email || !eventName) {
      return res.status(400).json({ error: "name, email, and eventName are required" });
    }
    const certificateId = uuidv4().replace(/-/g, "").slice(0, 12).toUpperCase();
    const participant = await prisma.participant.create({
      data: { name, email, eventName, certificateId, status: "PENDING" },
    });
    res.json(participant);
  } catch (err) {
    console.error("Add participant error:", err);
    res.status(500).json({ error: "Failed to add participant" });
  }
});

/**
 * POST /api/participants/bulk
 * @description Upload an Excel file to bulk add participants.
 * Expected columns: Name, Email, Event
 */
router.post("/bulk", upload.single("file"), async (req, res) => {
  try {
    console.log("--- New Bulk Upload Request ---");
    if (!req.file) {
      console.log("No file found in req.file");
      console.log("Request headers:", req.headers);
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File received:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log(`Successfully parsed ${data.length} rows from sheet: ${sheetName}`);

    if (data.length === 0) {
      console.log("Aborting: Sheet is empty");
      return res.status(400).json({ error: "Excel sheet is empty" });
    }

    const participantsData = data.map((row, index) => {
      // Helper to find a value by flexible key matching
      const findValue = (keywords) => {
        const keys = Object.keys(row);
        const match = keys.find(k =>
          keywords.some(kw => k.toLowerCase().includes(kw.toLowerCase()))
        );
        return match ? row[match] : "";
      };

      const name = findValue(["name", "full name", "student", "participant"]);
      const email = findValue(["email", "mail", "id", "address"]);
      const eventName = findValue(["event", "project", "subject", "topic", "workshop"]);

      if (!name || !email || !eventName) {
        if (index === 0) {
          console.log("Flexible mapping debug for first row. Keys:", Object.keys(row));
          console.log("Attempted mapping:", { name, email, eventName });
        }
        return null;
      }

      const certificateId = uuidv4().replace(/-/g, "").slice(0, 12).toUpperCase();

      return {
        name,
        email,
        eventName,
        certificateId,
        status: "PENDING",
      };
    }).filter(p => p !== null);

    if (participantsData.length === 0) {
      console.log("Aborting: No valid participant records after filtering");
      return res.status(400).json({ error: "No valid participant records found. Check your column headers (Name, Email, Event)." });
    }

    console.log(`Preparing to insert ${participantsData.length} records into database...`);

    // Bulk insert using Prisma
    const result = await prisma.participant.createMany({
      data: participantsData,
      skipDuplicates: true,
    });

    console.log(`Database insert successful. Count: ${result.count}. Auto-starting email process...`);

    res.json({
      success: true,
      message: `${participantsData.length} students added. Automatically sending certificates now...`,
      count: participantsData.length,
      triggerSend: true
    });

  } catch (err) {
    console.error("CRITICAL BULK UPLOAD ERROR:", err);
    res.status(500).json({ error: "Server error during file processing: " + err.message });
  }
});

module.exports = router;
