const express = require("express");
const router = express.Router();

const {
  loginTrainer,
  refreshTrainer,
  logoutTrainer,
  getTrainerProfile,
  getLearnersBySector
} = require("../controllers/trainer.controller");

const { verifyTrainerToken } = require("../middleware/verifyTrainerToken");

router.post("/login", loginTrainer);
router.post("/refresh", refreshTrainer);
router.post("/logout", logoutTrainer);

router.get("/me", verifyTrainerToken, getTrainerProfile);

// Learners mapped to trainer's sector
router.get("/learners", verifyTrainerToken, getLearnersBySector);

module.exports = router;
