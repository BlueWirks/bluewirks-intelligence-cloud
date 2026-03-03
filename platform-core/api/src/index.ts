import express from "express";
import { healthRouter } from "./routes/health.js";
import { uploadRouter } from "./routes/upload.js";
import { commitRouter } from "./routes/commit.js";
import { chatRouter } from "./routes/chat.js";
import { authMiddleware } from "./middleware/auth.js";
import { orgBoundaryMiddleware } from "./middleware/org-boundary.js";
import { requestLogger } from "./middleware/request-logger.js";

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);

// Global middleware
app.use(express.json());
app.use(requestLogger);

// Health check (no auth)
app.use("/health", healthRouter);

// Protected routes
app.use("/api", authMiddleware, orgBoundaryMiddleware);
app.use("/api/upload", uploadRouter);
app.use("/api/commit", commitRouter);
app.use("/api/chat", chatRouter);

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});

export { app };
