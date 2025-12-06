const express = require("express");
const router = express.Router();

const {
  loginTrainer,
  refreshTrainer,
  logoutTrainer,
  getTrainerProfile
} = require("../controllers/trainer.controller");

const { verifyTrainerToken } = require("../middleware/verifyTrainerToken");

router.post("/login", loginTrainer);
router.post("/refresh", refreshTrainer);
router.post("/logout", logoutTrainer);

router.get("/me", verifyTrainerToken, getTrainerProfile);

module.exports = router;
