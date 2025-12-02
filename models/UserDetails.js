const mongoose = require('mongoose');

const DynamicQuizAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    answer: { type: String, required: true },
  },
  { _id: false }
);

// Store each quiz response with full context
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
    ref: 'User', 
    required: true, 
    unique: true,
    index: true,   // faster lookups in getProfile()
  },

  ageRange: { type: String, default: null },
  preferredLanguage: { type: String, default: null },

  state: { type: String, default: null },
  district: { type: String, default: null },

  education: {
    highestQualification: { type: String, default: null },
    stream: { type: String, default: null },
    status: { type: String, default: null }
  },

  skills: { type: [String], default: [] },
  interestSectors: { type: [String], default: [] },

  // Full quiz responses with question, category and answer
  quizResponses: {
    type: [QuizResponseSchema],
    default: [],
  },

  careerGoal: { type: String, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: null },

   dynamicQuizAnswers: {
    type: [DynamicQuizAnswerSchema],
    default: [],
  },
  dynamicQuizCompletedAt: { type: Date, default: null },
});

module.exports = mongoose.model('UserDetails', UserDetailsSchema);
