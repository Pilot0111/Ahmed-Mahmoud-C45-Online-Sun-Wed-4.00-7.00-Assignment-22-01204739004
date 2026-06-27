import mongoose from "mongoose";


export const checkConnectionDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log(`Connected to MongoDB successfully with URI: ${process.env.MONGO_URI}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};