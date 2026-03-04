import express from "express";
import cors from "cors";

import authRouter from "./routes/auth";
import studentRouter from "./routes/student";
import electivesRouter from "./routes/electives";
import adminRouter from "./routes/admin";
import allocationRouter from "./routes/allocation";
import facultyRouter from "./routes/faculty";
import aiRouter from "./routes/ai"; // AI feature – added

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "elective-harmony-backend" });
});

app.use("/auth", authRouter);
app.use("/student", studentRouter);
app.use("/electives", electivesRouter);
app.use("/admin", adminRouter);
app.use("/allocation", allocationRouter);
app.use("/faculty", facultyRouter);
app.use("/ai", aiRouter); // AI endpoints – added

export default app;

