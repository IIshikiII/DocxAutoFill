// Express.js mock API endpoint — return model from a local JSON snapshot
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const SNAPSHOT_PATH = path.join(__dirname, "archiveModel.json");

// New endpoint: return archive model read from nearby JSON snapshot file
router.post("/archive-model", async (req, res) => {
  try {
    const raw = await fs.promises.readFile(SNAPSHOT_PATH, "utf-8");
    const model = JSON.parse(raw);
    return res.json(model);
  } catch (err) {
    console.error("Failed to read archive snapshot:", err);
    return res.status(500).json({ error: "Failed to read archive snapshot" });
  }
});

// Endpoint: accept uploaded files (FormData) and return mock nodes/edges
router.post("/import-nodes", async (req, res) => {
  try {
    // Read mock node files located next to this router
    const blueRaw = await fs.promises.readFile(
      path.join(__dirname, "blueNodes.json"),
      "utf-8"
    );
    const greenRaw = await fs.promises.readFile(
      path.join(__dirname, "greenNodes.json"),
      "utf-8"
    );
    const violetRaw = await fs.promises.readFile(
      path.join(__dirname, "violetNodes.json"),
      "utf-8"
    );
    const orangeRaw = await fs.promises.readFile(
      path.join(__dirname, "orangeNode.json"),
      "utf-8"
    );

    const blues = JSON.parse(blueRaw);
    const greens = JSON.parse(greenRaw);
    const violets = JSON.parse(violetRaw);
    const orange = JSON.parse(orangeRaw);

    // Return combined nodes. The frontend will set positions.
    const nodes = [...violets, orange, ...blues, ...greens];
    const edges = [];

    return res.json({ nodes, edges });
  } catch (err) {
    console.error("Failed to read mock nodes for import:", err);
    return res.status(500).json({ error: "Failed to read mock nodes" });
  }
});

// Keep the original generator route for compatibility (optional)
// For backward compatibility: also serve the snapshot for the original route
router.post("/generate-archive-model", async (req, res) => {
  try {
    const raw = await fs.promises.readFile(SNAPSHOT_PATH, "utf-8");
    const model = JSON.parse(raw);
    return res.json(model);
  } catch (err) {
    console.error(
      "Failed to read archive snapshot for generate-archive-model:",
      err
    );
    return res.status(500).json({ error: "Failed to read archive snapshot" });
  }
});

module.exports = router;
