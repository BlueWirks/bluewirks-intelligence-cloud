import express from "express";
import { requestId } from "./middleware/requestId.js";
import { auth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/error.js";

import { healthRouter } from "./routes/health.js";
import { assetsRouter } from "./routes/assets.js";
import { chatRouter } from "./routes/chat.js";

export function createServer() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "10mb" }));

  app.use(requestId);

  // Auth middleware (stubbed; validates token later)
  app.use(auth);

  app.use("/health", healthRouter);
  app.use("/v1/assets", assetsRouter);
  app.use("/v1/chat", chatRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
