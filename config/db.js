const mongoose = require("mongoose");
const config = require("./env");

mongoose.set("strictQuery", true);

async function connectDB() {
  try {
    if (!config.mongoUri) {
      throw new Error("MONGO_URI is missing in environment variables.");
    }

    await mongoose.connect(config.mongoUri);

    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

async function closeDB() {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (err) {
    console.error("Error closing DB:", err);
  }
}

module.exports = { connectDB, closeDB, mongoose };
