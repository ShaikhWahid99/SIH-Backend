const express = require("express");
const axios = require("axios");

const router = express.Router();

// ✅ Language mapping for your frontend -> HF NLLB codes
const LANG_MAP = {
  en: "eng_Latn",
  hi: "hin_Deva",
  mr: "mar_Deva",
};

router.post("/", async (req, res) => {
  const { text, targetLang } = req.body;

  if (!text || !targetLang) {
    return res.status(400).json({
      error: "text and targetLang are required",
    });
  }

  try {
    const response = await axios.post(
      "https://impu1s3e-translate.hf.space/translate", // ✅ YOUR HF API
      {
        text: text,                                   // ✅ REQUIRED
        source_lang: "eng_Latn",                      // ✅ REQUIRED
        target_lang: LANG_MAP[targetLang],           // ✅ REQUIRED
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 120000,
      }
    );

    // ✅ MATCHING EXACT RESPONSE SCHEMA FROM OPENAPI
    res.json({
      originalText: response.data.original_text,
      translatedText: response.data.translated_text,
      sourceLang: response.data.source_lang,
      targetLang: response.data.target_lang,
    });
  } catch (error) {
    console.error("HF Translate Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Translation failed",
      details: error.response?.data,
    });
  }
});

module.exports = router;
