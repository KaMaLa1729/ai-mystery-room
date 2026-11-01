const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "AI Mystery Room API is running!" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    project: "AI Mystery Room",
  });
});

app.use("/api/cases", require("./routes/cases"));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({
    message: "An unexpected server error occurred.",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});