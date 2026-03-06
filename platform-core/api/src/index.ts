import { env } from "./env.js";
import { createServer } from "./server.js";
import { validateApiRuntimeConfig } from "./config.js";

validateApiRuntimeConfig(process.env);

const app = createServer();

const port = Number(env.PORT || "8080");
app.listen(port, () => {
  // Cloud Run logs
  console.log(JSON.stringify({ msg: "api_started", port }));
});
