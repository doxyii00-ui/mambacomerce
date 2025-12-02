import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { startDiscordBot } from "./discord-bot";
import { storage } from "./storage";
import { ALL_ACCESS_CODES } from "./access-codes";
import { setupStripeWebhook } from "./stripe-webhook";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { accessCodes } from "@shared/schema";
import { randomUUID } from "crypto";

const app = express();
const httpServer = createServer(app);

// Database initialization function (inlined from init-db.ts)
async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log("⚠️  DATABASE_URL not set");
    return null;
  }

  try {
    console.log("🔧 Initializing database...");
    
    const sqlConnection = postgres(process.env.DATABASE_URL);
    const db = drizzle(sqlConnection);

    // Create tables - EACH STATEMENT SEPARATELY
    console.log("📝 Creating database tables...");
    
    await sqlConnection`
      CREATE TABLE IF NOT EXISTS users (
        id varchar PRIMARY KEY,
        email text NOT NULL UNIQUE,
        password text NOT NULL
      );
    `;
    
    await sqlConnection`
      CREATE TABLE IF NOT EXISTS orders (
        id varchar PRIMARY KEY,
        email text NOT NULL,
        product_id text NOT NULL,
        product_name text NOT NULL,
        price text NOT NULL,
        stripe_session_id text UNIQUE,
        status text NOT NULL DEFAULT 'pending',
        created_at timestamp NOT NULL DEFAULT NOW()
      );
    `;
    
    await sqlConnection`
      CREATE TABLE IF NOT EXISTS discord_access (
        id varchar PRIMARY KEY,
        email text NOT NULL,
        discord_user_id text NOT NULL,
        expires_at timestamp NOT NULL,
        created_at timestamp NOT NULL DEFAULT NOW()
      );
    `;
    
    await sqlConnection`
      CREATE TABLE IF NOT EXISTS obywatel_forms (
        id varchar PRIMARY KEY,
        email text NOT NULL,
        order_id text NOT NULL,
        form_data jsonb NOT NULL,
        access_link text,
        created_at timestamp NOT NULL DEFAULT NOW(),
        submitted_at timestamp
      );
    `;
    
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

    console.log("✅ Database tables created");

    // Check if codes already exist
    const existingCodes = await sqlConnection`SELECT COUNT(*) as count FROM access_codes`;
    const codeCount = parseInt(existingCodes[0]?.count as string || "0", 10);

    if (codeCount === 0) {
      console.log(`🌱 Seeding ${ALL_ACCESS_CODES.length} access codes...`);
      
      for (let i = 0; i < ALL_ACCESS_CODES.length; i += 50) {
        const batch = ALL_ACCESS_CODES.slice(i, i + 50);
        
        try {
          await db.insert(accessCodes).values(
            batch.map((code: string, idx: number) => ({
              id: randomUUID(),
              code,
              productType: i + idx < 200 ? "obywatel" : "receipts",
              isUsed: "false",
            }))
          ).onConflictDoNothing();
          
          console.log(`✅ ${Math.min(i + 50, ALL_ACCESS_CODES.length)}/${ALL_ACCESS_CODES.length}`);
        } catch (err) {
          console.error(`Batch ${i}:`, err);
        }
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

// Note: Access codes are now seeded in initializeDatabase
async function initializeAccessCodes() {
  console.log(`[init] Access codes pre-loaded from database`);
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

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
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database (creates tables and seeds codes if needed)
  await initializeDatabase();
  
  await initializeAccessCodes();
  
  // Setup Stripe webhook endpoints BEFORE registerRoutes
  setupStripeWebhook(app);
  console.log("✅ Stripe webhook endpoints mounted:");
  console.log("   - POST /api/webhooks/stripe");
  console.log("   - POST /api/test/webhook");
  
  await registerRoutes(httpServer, app);

  // Start Discord bot if configured
  try {
    await startDiscordBot();
  } catch (error) {
    console.warn("Discord bot failed to start (optional):", error);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
