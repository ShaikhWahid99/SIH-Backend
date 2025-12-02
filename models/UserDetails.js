const mongoose = require('mongoose');

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

  careerGoal: { type: String, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: null }
});

module.exports = mongoose.model('UserDetails', UserDetailsSchema);
