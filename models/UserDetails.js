const mongoose = require("mongoose");
const QuizResponseSchema = new mongoose.Schema(
  {
    questionId: { type: Number, required: true },
    question: { type: String, required: true },
    category: { type: String, required: true },
    answer: { type: String, default: "" },
  },
  { _id: false }
);

const UserDetailsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  },

  ageRange: { type: String, default: null },
  preferredLanguage: { type: String, default: null },

  state: { type: String, default: null },
  district: { type: String, default: null },

  education: {
    highestQualification: { type: String, default: null },
    stream: { type: String, default: null },
    status: { type: String, default: null },
  },

  skills: { type: [String], default: [] },
  interestSectors: { type: [String], default: [] },

  quizResponses: {
    type: [QuizResponseSchema],
    default: [],
  },

  careerGoal: { type: String, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: null },
});

module.exports = mongoose.model("UserDetails", UserDetailsSchema);
