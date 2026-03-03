import { Router, Request, Response } from "express";

export const chatRouter = Router();

/**
 * POST /api/chat
 * Body: { threadId?: string, message: string }
 * Returns: { threadId: string, response: object }
 *
 * TODO: Wire up RAG pipeline (Phase 2)
 */
chatRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { threadId, message } = req.body;

    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    // Placeholder — will be replaced by RAG pipeline in Phase 2
    res.json({
      threadId: threadId || crypto.randomUUID(),
      response: {
        content: "RAG chat coming in Phase 2.",
        citations: [],
      },
      promptId: "rag-chat-v1",
      promptVersion: "0.0.0",
    });
  } catch (err) {
    console.error("Chat error", err);
    res.status(500).json({ error: "Chat processing failed" });
  }
});
