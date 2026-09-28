/**
 * InstaFlow Background Publishing Worker Daemon & Control Server
 * 
 * Periodically polls and triggers the scheduled post publisher endpoint:
 *   POST /api/cron/publish-scheduled
 * 
 * Also exposes a lightweight HTTP control server on port 3001:
 *   - GET  /health   -> Worker health status & uptime
 *   - GET  /status   -> Detailed execution statistics & queue state
 *   - POST /trigger  -> Manually triggers an immediate queue execution tick
 * 
 * Run with:
 *   npm run worker
 *   or npx tsx scripts/worker.ts
 */

import http from "http";
import fs from "fs";
import path from "path";

// 1. Load environment files in Next.js priority order (.env.local, .env)
const rootDir = process.cwd();
for (const envFile of [".env.local", ".env"]) {
  const envPath = path.resolve(rootDir, envFile);
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    } catch (e: any) {
      console.warn(`[Worker] Could not read ${envFile}:`, e.message);
    }
  }
}

const NEXT_PORT = process.env.PORT || 3000;
const BASE_APP_URL =
  process.env.APP_URL ||
  process.env.NEXTAUTH_URL ||
  `http://localhost:${NEXT_PORT}`;
const PUBLISH_ENDPOINT = `${BASE_APP_URL}/api/cron/publish-scheduled`;
const WORKER_PORT = parseInt(process.env.WORKER_PORT || "3001", 10);
const INTERVAL_SEC = parseInt(process.env.WORKER_INTERVAL_SEC || "60", 10);
const SIMULATE_MODE = process.env.SIMULATE_MODE || "RANDOM";
const CRON_SECRET = process.env.CRON_SECRET || "";

interface WorkerState {
  startedAt: string;
  intervalSeconds: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastRunAt: string | null;
  lastRunDurationMs: number;
  lastRunResult: any;
  isRunning: boolean;
}

const state: WorkerState = {
  startedAt: new Date().toISOString(),
  intervalSeconds: INTERVAL_SEC,
  totalRuns: 0,
  successfulRuns: 0,
  failedRuns: 0,
  lastRunAt: null,
  lastRunDurationMs: 0,
  lastRunResult: null,
  isRunning: false,
};

function log(msg: string, ...args: any[]) {
  const time = new Date().toLocaleTimeString();
  console.log(`[Worker ${time}] ${msg}`, ...args);
}

async function runPublishTick(triggerSource: string = "INTERVAL") {
  if (state.isRunning) {
    log(`⚠️  Previous execution still in progress. Skipping ${triggerSource} tick.`);
    return { skipped: true, reason: "Already running" };
  }

  state.isRunning = true;
  state.totalRuns += 1;
  const startTime = Date.now();
  const runTimestamp = new Date().toISOString();
  state.lastRunAt = runTimestamp;

  log(`🚀 [${triggerSource}] Checking scheduled posts queue via ${PUBLISH_ENDPOINT}...`);

  try {
    const url = new URL(PUBLISH_ENDPOINT);
    url.searchParams.set("mode", SIMULATE_MODE);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "InstaFlow-Background-Worker/1.0",
    };

    if (CRON_SECRET) {
      headers["Authorization"] = `Bearer ${CRON_SECRET}`;
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify({
        simulateMode: SIMULATE_MODE,
        source: triggerSource,
      }),
    });

    const durationMs = Date.now() - startTime;
    state.lastRunDurationMs = durationMs;

    if (!response.ok) {
      const errorText = await response.text();
      state.failedRuns += 1;
      state.lastRunResult = {
        success: false,
        status: response.status,
        error: errorText,
      };
      log(
        `❌ Queue trigger returned HTTP ${response.status} (${durationMs}ms):`,
        errorText.slice(0, 150)
      );
      return state.lastRunResult;
    }

    const result = await response.json();
    state.successfulRuns += 1;
    state.lastRunResult = {
      success: true,
      data: result,
      durationMs,
    };

    const checked = result.totalChecked ?? 0;
    const processed = result.processedCount ?? 0;
    const success = result.successCount ?? 0;
    const failures = result.failureCount ?? 0;

    log(
      `✅ Completed in ${durationMs}ms | Checked: ${checked} | Processed: ${processed} (Success: ${success}, Failures: ${failures})`
    );

    return state.lastRunResult;
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    state.lastRunDurationMs = durationMs;
    state.failedRuns += 1;

    const errMsg = err.message || String(err);
    state.lastRunResult = {
      success: false,
      error: errMsg,
      durationMs,
    };

    if (errMsg.includes("ECONNREFUSED")) {
      log(
        `⏳ Next.js server not reachable at ${BASE_APP_URL}. Waiting for Next.js app to start...`
      );
    } else {
      log(`❌ Network / Worker Error (${durationMs}ms):`, errMsg);
    }

    return state.lastRunResult;
  } finally {
    state.isRunning = false;
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        totalRuns: state.totalRuns,
        successfulRuns: state.successfulRuns,
        failedRuns: state.failedRuns,
      })
    );
    return;
  }

  if (pathname === "/status" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        {
          worker: "InstaFlow Background Publisher Daemon",
          targetEndpoint: PUBLISH_ENDPOINT,
          intervalSeconds: INTERVAL_SEC,
          simulateMode: SIMULATE_MODE,
          state,
        },
        null,
        2
      )
    );
    return;
  }

  if (pathname === "/trigger" && (req.method === "POST" || req.method === "GET")) {
    const result = await runPublishTick("MANUAL_TRIGGER");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result, null, 2));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      error: "Not Found",
      availableEndpoints: ["GET /health", "GET /status", "POST /trigger"],
    })
  );
});

export function start() {
  console.log("==================================================");
  console.log("   InstaFlow Background Publishing Worker Daemon  ");
  console.log("==================================================");
  console.log(`- Target App URL:      ${BASE_APP_URL}`);
  console.log(`- Publish Endpoint:    ${PUBLISH_ENDPOINT}`);
  console.log(`- Polling Interval:    Every ${INTERVAL_SEC} seconds`);
  console.log(`- Simulation Mode:     ${SIMULATE_MODE}`);
  console.log(`- Cron Secret Config:  ${CRON_SECRET ? "CONFIGURED" : "NONE (Demo / Open)"}`);
  console.log(`- Control Server:      http://localhost:${WORKER_PORT}`);
  console.log("--------------------------------------------------");

  server.listen(WORKER_PORT, () => {
    log(`🛰️  Worker control server listening on http://localhost:${WORKER_PORT}`);
    log(`👉 Endpoints: /health (GET), /status (GET), /trigger (POST)`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      log(`⚠️  Port ${WORKER_PORT} is in use; worker will continue without control server.`);
    } else {
      log(`⚠️  Control server error:`, err.message);
    }
  });

  // Run initial tick after 3-second startup grace period
  setTimeout(() => {
    runPublishTick("STARTUP");
  }, 3000);

  const timer = setInterval(() => {
    runPublishTick("INTERVAL");
  }, INTERVAL_SEC * 1000);

  const shutdown = () => {
    log("🛑 Shutting down background worker daemon...");
    clearInterval(timer);
    server.close(() => {
      log("👋 Control server closed. Exiting process.");
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 1000);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

// Auto-run if executed directly
if (require.main === module) {
  start();
}
