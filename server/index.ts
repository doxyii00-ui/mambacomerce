import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { startDiscordBot } from "./discord-bot";
import { storage } from "./storage";
import { ALL_ACCESS_CODES } from "./access-codes";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { accessCodes } from "@shared/schema";
import { randomUUID } from "crypto";
import { setupStripeWebhook } from "./stripe-webhook";

const app = express();
const httpServer = createServer(app);

// --- Middleware JSON/URLencoded ---
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

// --- Logger ---
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      log(logLine);
    }
  });

  next();
});

// --- Test endpoint ---
app.get("/ping", (_req: Request, res: Response) => res.send("pong"));

// --- Database initialization ---
async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log("⚠️ DATABASE_URL not set");
    return null;
  }

  try {
    console.log("🔧 Initializing database...");
    const sqlConnection = postgres(process.env.DATABASE_URL);
    const db = drizzle(sqlConnection);

    // --- Create tables if not exist ---
    await sqlConnection`
      CREATE TABLE IF NOT EXISTS access_codes (
        id varchar PRIMARY KEY,
        code text NOT NULL UNIQUE,
        product_type text NOT NULL,
        email text,
        order_id text,
        is_used text NOT NULL DEFAULT 'false',
        used_at timestamp,
        created_at timestamp NOT NULL DEFAULT NOW()
      );
    `;
    console.log("✅ Database tables ready");

    // Seed access codes if empty
    const existingCodes = await sqlConnection`SELECT COUNT(*) as count FROM access_codes`;
    const codeCount = parseInt(existingCodes[0]?.count as string || "0", 10);

    if (codeCount === 0) {
      console.log(`🌱 Seeding ${ALL_ACCESS_CODES.length} access codes...`);
      for (let i = 0; i < ALL_ACCESS_CODES.length; i += 50) {
        const batch = ALL_ACCESS_CODES.slice(i, i + 50);
        await db.insert(accessCodes).values(
          batch.map((code: string, idx: number) => ({
            id: randomUUID(),
            code,
            productType: i + idx < 200 ? "obywatel" : "receipts",
            isUsed: "false",
          }))
        ).onConflictDoNothing();
        console.log(`✅ ${Math.min(i + 50, ALL_ACCESS_CODES.length)}/${ALL_ACCESS_CODES.length}`);
      }
      console.log("✨ Seeding complete!");
    } else {
      console.log(`✅ Already have ${codeCount} codes`);
    }

    await sqlConnection.end();
  } catch (error) {
    console.error("❌ Init failed:", error);
  }
}

async function initializeAccessCodes() {
  console.log(`[init] Access codes pre-loaded from database`);
}

// --- SETUP STRIPE WEBHOOK ---
setupStripeWebhook(app);
console.log("✅ Stripe webhook endpoints mounted:");
console.log(" - POST /api/webhooks/stripe");
console.log(" - POST /api/test/webhook");

// --- Register other API routes ---
(async () => {
  await initializeDatabase();
  await initializeAccessCodes();
  await registerRoutes(httpServer, app);

  try {
    await startDiscordBot();
  } catch (error) {
    console.warn("Discord bot failed to start (optional):", error);
  }

  // --- Error handler ---
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // --- Serve frontend (React) AFTER /api ---
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // --- Start server ---
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${port}`);
  });
})();
