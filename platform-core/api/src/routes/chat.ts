import { Router } from "express";
import { z } from "zod";

export const chatRouter = Router();

const ChatReq = z.object({
  threadId: z.string().optional(),
  message: z.string().min(1)
});

chatRouter.post("/", async (req, res) => {
  const body = ChatReq.parse(req.body);

  // Placeholder response; swap for retrieval + Gemini later
  res.json({
    threadId: body.threadId ?? "thread_dev",
    response: {
      text: `stub: received "${body.message}"`,
      citations: []
    }
  });
});
