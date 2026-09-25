import mongoose from "mongoose";

/**
 * Connects to MongoDB using the URI from environment variables.
 * Exits the process on failure so the server never starts in a broken state.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host} — DB: ${conn.connection.name}`
    );
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
