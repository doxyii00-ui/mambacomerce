import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { accessCodes } from "@shared/schema";
import { ALL_ACCESS_CODES } from "./access-codes";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function initializeDatabase() {
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
