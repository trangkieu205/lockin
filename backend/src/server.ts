// backend/src/server.ts
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = await createApp();

// Render sẽ set PORT, local vẫn chạy theo env.port hoặc 5179
const port = Number(process.env.PORT ?? env.port ?? 5179);

app.listen(port, "0.0.0.0", () => {
  console.log(`[backend] listening on port ${port}`);
  console.log(`[backend] dataDir: ${env.dataDir}`);
});
