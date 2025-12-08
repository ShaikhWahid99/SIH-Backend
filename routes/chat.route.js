const express = require("express");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/", authLimiter, async (req, res) => {
  try {
    const { query, thread_id } = req.body || {};

    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "query is required" });
    }

    const tid = thread_id || uuidv4();

    const hfRes = await axios.post(
      "https://imran-decoder-chatmodel.hf.space/chat",
      { query, thread_id: tid },
      { headers: { "Content-Type": "application/json" }, timeout: 120000 }
    );

    const payload = hfRes.data;
    let reply = "";
    if (payload) {
      if (typeof payload === "string") reply = payload;
      else if (Array.isArray(payload.response)) {
        const item = payload.response.find((x) => x && (x.text || x.message));
        reply = item?.text || item?.message || "";
      } else if (typeof payload.text === "string") {
        reply = payload.text;
      } else if (typeof payload.message === "string") {
        reply = payload.message;
      }
    }

    return res.json({ thread_id: tid, data: payload, reply });
  } catch (err) {
    const status = err.response?.status || 500;
    const details = err.response?.data || err.message;
    return res.status(status).json({ message: "Chat request failed", details });
  }
});

module.exports = router;

