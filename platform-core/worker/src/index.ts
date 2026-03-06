import express from "express";
import { handleIngestionMessage } from "./handler.js";
import { validateWorkerEnv } from "./env.js";

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);
const HOST = "0.0.0.0";
const SERVICE = process.env.WORKER_SERVICE_NAME || "worker";

validateWorkerEnv(process.env);

app.use(express.json());

/**
 * Pub/Sub push endpoint.
 * Cloud Run receives HTTP POST with Pub/Sub message payload.
 */
app.post("/", async (req, res) => {
  const requestId = req.header("x-request-id") || undefined;
  try {
    const message = req.body?.message;
    if (!message?.data) {
      res.status(400).json({ error: "Invalid Pub/Sub message" });
      return;
    }

    const data = JSON.parse(Buffer.from(message.data, "base64").toString());
    const deliveryAttempt = Number(req.body?.deliveryAttempt || message.deliveryAttempt || 1);
    const messageId = String(message.messageId || "unknown-message-id");
    const traceId = typeof data?.traceId === "string" ? data.traceId : undefined;

    console.log(JSON.stringify({
      severity: "INFO",
      service: SERVICE,
      stage: "ingestion_message_received",
      status: "received",
      timestamp: new Date().toISOString(),
      requestId,
      traceId,
      deliveryAttempt,
      messageId,
    }));

    await handleIngestionMessage(data, {
      deliveryAttempt,
      messageId,
      requestId,
    });

    res.status(200).json({ status: "processed" });
  } catch (err) {
    console.error(JSON.stringify({
      severity: "ERROR",
      service: SERVICE,
      stage: "ingestion_http_handler",
      status: "failed",
      timestamp: new Date().toISOString(),
      requestId,
      error: String(err),
    }));
    res.status(500).json({ error: "Processing failed" });
  }
});

app.listen(PORT, HOST, () => {
  console.log(JSON.stringify({
    severity: "INFO",
    service: SERVICE,
    stage: "startup",
    status: "ready",
    timestamp: new Date().toISOString(),
    host: HOST,
    port: PORT,
  }));
});

export { app };
