require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const participantsRoutes = require("./routes/participants");
const sendCertificatesRoutes = require("./routes/send-certificates");
const settingsRoutes = require("./routes/settings");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/participants", participantsRoutes);
app.use("/api/send-certificates", sendCertificatesRoutes);
app.use("/api/settings", settingsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Something went wrong" });
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
