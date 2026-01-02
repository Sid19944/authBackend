import { connectToDb } from "./db/db.connect.js";
import dotenv from "dotenv";
import { app } from "./app.js";
dotenv.config("./.env");

const PORT = process.env.PORT;

connectToDb()
  .then(() => {
    console.log("Connectios successfully with MONGODB");
    app.listen(PORT, () => {
      console.log("server listing on PORT", PORT);
    });
  })
  .catch((err) => {
    console.log("Error while connecting with MONGO DB", err);
  });