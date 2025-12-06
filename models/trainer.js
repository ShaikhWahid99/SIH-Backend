const mongoose = require("mongoose");

const TrainerSchema = new mongoose.Schema({
  email: {
    type: String,
    index: true,
    sparse: true,
    required: true,
    lowercase: true,
    trim: true,
  },

  emailVerified: { type: Boolean, default: false },

  passwordHash: { type: String, required: true },

  displayName: { type: String, default: "" },

  sector: {
    type: String,
    required: true, // coming from dropdown
  },

  // Trainers may also use Google login later → keep it same as user
  providers: {
    type: [
      {
        name: { type: String, required: true },
        id: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
    _id: false,
  },

  roles: { type: [String], default: ["trainer"] },

  accessToken: { type: String, default: null },
  refreshToken: { type: String, default: null },

  createdAt: { type: Date, default: Date.now },
  lastLoginAt: Date,
});

module.exports = mongoose.model("Trainer", TrainerSchema);
