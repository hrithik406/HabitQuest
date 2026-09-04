import "dotenv/config";
import express, { Application, Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import habitRoutes from "./routes/habitRoutes";
import rewardRoutes from "./routes/rewardRoutes";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

const app: Application = express();

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000", credentials: true }));
app.use(express.json());

app.use("/api/habits", habitRoutes);
app.use("/api/users",  userRoutes);
app.use("/api/rewards",  rewardRoutes);
app.use("/api/auth", authRoutes); 

app.get("/api/health", (_req: Request, res: Response) => res.json({ status: "ok" }));

const PORT      = Number(process.env.PORT ?? 5000);
const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/habitquest";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err: Error) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

export default app;