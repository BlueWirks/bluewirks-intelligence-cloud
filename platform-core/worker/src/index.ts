import express from "express";
import { handleIngestionMessage } from "./handler.js";

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);
const HOST = "0.0.0.0";

app.use(express.json());

/**
 * Pub/Sub push endpoint.
 * Cloud Run receives HTTP POST with Pub/Sub message payload.
 */
app.post("/", async (req, res) => {
  try {
    const message = req.body?.message;
    if (!message?.data) {
      res.status(400).json({ error: "Invalid Pub/Sub message" });
      return;
    }

    const data = JSON.parse(Buffer.from(message.data, "base64").toString());
    console.log(JSON.stringify({ severity: "INFO", message: "Ingestion message received", data }));

    await handleIngestionMessage(data);

    res.status(200).json({ status: "processed" });
  } catch (err) {
    console.error(JSON.stringify({ severity: "ERROR", message: "Ingestion failed", error: String(err) }));
    res.status(500).json({ error: "Processing failed" });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Worker listening on http://${HOST}:${PORT}`);
});

export { app };
