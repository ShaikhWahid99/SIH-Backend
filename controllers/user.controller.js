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
    userDetails: details || null,
  });
}

async function upsertProfile(req, res) {
  try {
    const payload = req.body;
    const userId = req.userId;

    // 1. First, save/update the user details (Skills, Education, etc.)
    let doc = await UserDetails.findOneAndUpdate(
      { user: userId },
      { ...payload, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    // 2. Trigger the new Dynamic Question Generator API
    // We only do this if it's an onboarding save (checking if skills/education exist)
    if (payload.skills || payload.education) {
      try {
        console.log("Triggering external quiz API for user:", userId);
        
        const apiResponse = await fetch("https://imran-decoder-quizz.hf.space/api/ikigai-quiz", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId.toString(),
            current_stage: "START",
            answers: []
          }),
        });

        if (apiResponse.ok) {
          const quizData = await apiResponse.json();
          
          // 3. Save the generated questions into the DB
          doc = await UserDetails.findOneAndUpdate(
            { user: userId },
            { dynamicQuizData: quizData },
            { new: true }
          );
          console.log("Quiz data generated and saved successfully.");
        } else {
          console.error("External Quiz API failed:", await apiResponse.text());
        }
      } catch (apiError) {
        console.error("Error connecting to external Quiz API:", apiError);
        // We don't fail the request here, we just log it. 
        // The user can try fetching questions later if needed.
      }
    }

    // 4. Update User flag
    await User.findByIdAndUpdate(userId, { onboarded: true });

    res.json({ data: doc });

  } catch (error) {
    console.error("Upsert Profile Error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
}

module.exports = { getProfile, upsertProfile };