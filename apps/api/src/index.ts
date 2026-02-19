import express from "express";
import { userSchema } from "@repo/validators";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use(express.json());

// ─── Health Check ───────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "API is running 🚀" });
});

// ─── POST /users — Validate using shared Zod schema ────
app.post("/users", (req, res) => {
  // Parse the request body against the shared schema
  const result = userSchema.safeParse(req.body);

  if (!result.success) {
    // Validation failed — return structured errors
    res.status(400).json({
      success: false,
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  // Validation passed — return the validated data
  res.status(200).json({
    success: true,
    message: "User validated successfully ✅",
    data: result.data,
  });
});

// ─── Start Server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🔥 API server running at http://localhost:${PORT}`);
});
