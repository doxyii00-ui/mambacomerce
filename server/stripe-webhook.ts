import type { Express } from "express";
import { storage } from "./storage";
import { sendAccessCodeEmail, sendReceiptsEmail, sendTicketEmail } from "./email-service";
import { grantDiscordRole } from "./discord-bot";

let stripe: any = null;

function getStripe() {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    const Stripe = require("stripe").default || require("stripe");
    stripe = new Stripe(apiKey, {
      apiVersion: "2024-11-20",
    });
  }
  return stripe;
}

// Mapping linków Stripe do produktów
const STRIPE_LINK_MAPPING: {
  [key: string]: {
    type: "obywatel" | "receipts";
    tier?: "basic" | "premium";
    duration?: number;
  };
} = {
  // Live links
  "6oU28s5Fo3PjaHLfRCgEg06": { type: "obywatel", tier: "premium" },
  "28E4gA0l499Dg25eNygEg00": { type: "obywatel", tier: "basic" },
  "9B600k7NwbhLdTXdJugEg02": { type: "receipts", duration: 31 },
  "5kQ00k8RA5Xr2bfdJugEg03": { type: "receipts", duration: 999 },

  // Test link
  "6oU28r2O8f6v3eI0C9cEw00": { type: "obywatel", tier: "premium" },
};



// --------------------------------------
// MAIN HANDLER — przetwarza zweryfikowany event
// --------------------------------------

async function processStripeEvent(event: any) {
  if (event.type !== "checkout.session.completed") return;

  const session = event.data.object;

  const email = session.customer_email?.toLowerCase();
  const paymentLink = session.payment_link;
  const sessionId = session.id;

  console.log(`🟢 [Stripe] checkout.session.completed for ${email}, session ${sessionId}`);

  if (!email) {
    console.warn("⚠️ No email in checkout session!");
    return;
  }

  // 1. Spróbuj znaleźć produkt po payment link
  let config = STRIPE_LINK_MAPPING[paymentLink];

  // 2. Jeśli paymentLink == null → Fallback (np. niestandardowy Checkout)  
  if (!config) {
    console.warn("⚠️ No matching payment_link — fallback attempt");
    console.warn("Got payment_link:", paymentLink);
    console.warn("Available keys:", Object.keys(STRIPE_LINK_MAPPING));
    return; // Na razie nie obsługujemy bez payment_link
  }

  console.log(`🟢 Detected product: ${config.type}, tier: ${config.tier || "n/a"}`);

  // ----------------------------------------------------
  //  RECEIPTS (abonament do logów)
  // ----------------------------------------------------
  if (config.type === "receipts") {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (config.duration || 31));

    await storage.grantDiscordAccess({
      email,
      discordUserId: "pending",
      expiresAt,
    });

    await sendReceiptsEmail(email, expiresAt);

    console.log(`🟢 Granted Discord access to ${email} until ${expiresAt}`);
  }

  // ----------------------------------------------------
  //  OBYWATEL — premium ticket albo kod dostępu
  // ----------------------------------------------------
  if (config.type === "obywatel") {
    if (config.tier === "premium") {
      await sendTicketEmail(email);
      console.log(`🟢 Sent TICKET email to ${email}`);
    } else {
      const code = await storage.getUnusedAccessCode("obywatel");
      if (!code) {
        console.warn("⚠️ No available Obywatel access codes!");
        return;
      }

      const generatorLink = "https://mambagen.up.railway.app/gen.html";

      await storage.markCodeAsUsed(code.code, email);
      await sendAccessCodeEmail(email, code.code, generatorLink);

      console.log(`🟢 Sent ACCESS CODE to ${email}`);
    }
  }
}



// --------------------------------------
// SETUP WEBHOOK ENDPOINT
// --------------------------------------

export function setupStripeWebhook(app: Express): void {
  const stripe = getStripe();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is missing!");
  }

  // *** VERY IMPORTANT ***
  // Stripe webhook requires RAW BODY
  app.post(
    "/api/webhooks/stripe",
    // Ten middleware MUSI być tutaj — tylko dla tego endpointu
    require("express").raw({ type: "application/json" }),

    async (req, res) => {
      console.log("🔔 [Stripe] Incoming webhook");
      const signature = req.headers["stripe-signature"];

      let event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,        // RAW buffer
          signature,
          endpointSecret
        );
      } catch (err: any) {
        console.error("❌ Stripe signature verification failed:", err.message);
        return res.status(400).send("Invalid signature");
      }

      console.log(`🟢 Verified Stripe event: ${event.type}`);

      try {
        await processStripeEvent(event);
      } catch (err) {
        console.error("❌ Error while processing event:", err);
        return res.status(500).send("Webhook error");
      }

      return res.status(200).send("OK");
    }
  );



  // -----------------------------
  // TEST endpoint (lokalnie / debug)
  // -----------------------------
  app.post("/api/test/webhook", async (req, res) => {
    const testEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_" + Date.now(),
          customer_email: req.body.email || "test@example.com",
          payment_link: req.body.linkId || "6oU28r2O8f6v3eI0C9cEw00",
        },
      },
    };

    console.log("🧪 Simulated webhook event:", testEvent);

    try {
      await processStripeEvent(testEvent);
      res.json({ ok: true });
    } catch (err) {
      console.error("❌ Simulated event failed:", err);
      res.status(500).json({ error: "Simulation failed" });
    }
  });
}

