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
    dynamicQuizCompleted: user.dynamicQuizCompleted,
    userDetails: details || null,
  });
}

async function upsertProfile(req, res) {
  const payload = req.body;

  const existing = await UserDetails.findOne({ user: req.userId }).lean();
  const existingResponses = Array.isArray(existing?.quizResponses)
    ? existing.quizResponses
    : [];

  const staticResponses = Array.isArray(payload.quizResponses)
    ? payload.quizResponses
    : [];

  const normalizedStatic = staticResponses.map((r, idx) => ({
    questionId: Number(r.questionId ?? idx + 1),
    question: r.question,
    category: r.category || "static",
    answer: r.answer ?? "",
  }));

  const dynamicAnswers = Array.isArray(payload.dynamicQuizAnswers)
    ? payload.dynamicQuizAnswers
    : [];

  const baseOffset = (() => {
    const ids = normalizedStatic
      .map((x) => Number(x.questionId))
      .filter((n) => Number.isFinite(n));
    if (ids.length) return Math.max(...ids);
    return 30;
  })();

  const normalizedDynamic = dynamicAnswers.map((d, idx) => ({
    questionId: baseOffset + idx + 1,
    question: d.question,
    // category: "dynamic",
    answer: d.answer,
  }));

  const byId = new Map();
  for (const r of existingResponses) {
    if (Number.isFinite(r.questionId)) {
      byId.set(Number(r.questionId), r);
    }
  }
  for (const r of [...normalizedStatic, ...normalizedDynamic]) {
    if (Number.isFinite(r.questionId)) {
      byId.set(Number(r.questionId), r);
    }
  }
  const mergedQuizResponses = Array.from(byId.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);

  payload.quizResponses = mergedQuizResponses;
  if (dynamicAnswers.length) {
    payload.dynamicQuizAnswers = [];
    payload.dynamicQuizCompletedAt = new Date();
  }

  const doc = await UserDetails.findOneAndUpdate(
    { user: req.userId },
    { ...payload, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  const updateUser = {
    onboarded: true,
  };

  if (Array.isArray(mergedQuizResponses) && mergedQuizResponses.length >= 30) {
    updateUser.quizCompleted = true;
  }
  if (dynamicAnswers.length) {
    updateUser.dynamicQuizCompleted = true;
  }

  await User.findByIdAndUpdate(req.userId, updateUser);

  res.json({ data: doc });
}

module.exports = { getProfile, upsertProfile };
