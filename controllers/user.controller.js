const User = require("../models/User");
const UserDetails = require("../models/UserDetails");

async function getProfile(req, res) {
  const user = await User.findById(req.userId).lean();
  const details = await UserDetails.findOne({ user: req.userId }).lean();

  res.json({
    id: user._id,
    email: user.email,
    displayName: user.displayName,
    onboarded: user.onboarded,
    quizCompleted: user.quizCompleted,
    userDetails: details || null,
  });
}

async function upsertProfile(req, res) {
  const payload = req.body;

  // 1) Save user details
  const doc = await UserDetails.findOneAndUpdate(
    { user: req.userId },
    { ...payload, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  // 2) Mark onboarding as completed
  const updateUser = {
    onboarded: true,
  };

  if (payload.quizAnswers) {
    updateUser.quizCompleted = true;
  }

  await User.findByIdAndUpdate(req.userId, updateUser);

  res.json({ data: doc });
}

module.exports = { getProfile, upsertProfile };
