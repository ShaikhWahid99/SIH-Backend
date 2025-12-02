const mongoose = require("mongoose");

const ProviderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // google, github, etc.
    id: { type: String, required: true }, // provider user ID
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema({
  email: { type: String, index: true, sparse: true },
  emailVerified: { type: Boolean, default: false },

  passwordHash: String,
  displayName: String,

  providers: { type: [ProviderSchema], default: [] },

  roles: { type: [String], default: ["user"] },
  accessToken: { type: String, default:null },
  refreshToken: { type: String, default: null }, 
  onboarded: { type: Boolean, default: false },
  quizCompleted: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  lastLoginAt: Date,
});

// Avoid duplicate google providers
UserSchema.index(
  { "providers.name": 1, "providers.id": 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("User", UserSchema);
