import mongoose from "mongoose";

const connectToDb = async () => {
  try {
    const res = await mongoose.connect(`${process.env.MONGO_DB_URL}`);
  } catch (err) {
    console.log("Error while connecting with DB", err);
  }
};

export { connectToDb };
