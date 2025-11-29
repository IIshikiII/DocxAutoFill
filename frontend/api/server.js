const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// Simple CORS for local development
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Mount API router
app.use("/api", require(path.join(__dirname, "archiveModel.js")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
