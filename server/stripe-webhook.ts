import type { Express } from "express";
import { storage } from "./storage";
import { sendAccessCodeEmail, sendReceiptsEmail, sendTicketEmail } from "./email-service";

let stripe: any = null;

function getStripe() {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const Stripe = require("stripe").default || require("stripe");
    stripe = new Stripe(apiKey, { apiVersion: "2024-11-20" });
  }
  return stripe;
}

const STRIPE_LINK_MAPPING: { [key: string]: { type: "obywatel" | "receipts"; tier?: "basic" | "premium"; duration?: number } } = {
  "6oU28s5Fo3PjaHLfRCgEg06": { type: "obywatel", tier: "premium" },
  "28E4gA0l499Dg25eNygEg00": { type: "obywatel", tier: "basic" },
  "9B600k7NwbhLdTXdJugEg02": { type: "receipts", duration: 31 },
  "5kQ00k8RA5Xr2bfdJugEg03": { type: "receipts", duration: 999 },
  "6oU28r2O8f6v3eI0C9cEw00": { type: "obywatel", tier: "premium" }, // test link
};

async function processStripeEvent(event: any) {
  if (event.type !== "checkout.session.completed") return;

  const session = event.data.object;
  const email = session.customer_email?.toLowerCase();
  const paymentLink = session.payment_link;
  const sessionId = session.id;

  if (!email) return console.warn("⚠️ No email in checkout session!");

  console.log(`🟢 Stripe checkout.session.completed: ${email}, session ${sessionId}`);

  const config = STRIPE_LINK_MAPPING[paymentLink];
  if (!config) {
    console.warn("⚠️ No matching payment_link:", paymentLink);
    return;
  }

  if (config.type === "receipts") {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (config.duration || 31));
    await storage.grantDiscordAccess({ email, discordUserId: "pending", expiresAt });
    await sendReceiptsEmail(email, expiresAt);
    console.log(`🟢 Granted Discord access to ${email} until ${expiresAt}`);
  }

  if (config.type === "obywatel") {
    if (config.tier === "premium") {
      await sendTicketEmail(email);
      console.log(`🟢 Sent TICKET email to ${email}`);
    } else {
      const code = await storage.getUnusedAccessCode("obywatel");
      if (!code) return console.warn("⚠️ No available Obywatel access codes!");
      const generatorLink = "https://mambagen.up.railway.app/gen.html";
      await storage.markCodeAsUsed(code.code, email);
      await sendAccessCodeEmail(email, code.code, generatorLink);
      console.log(`🟢 Sent ACCESS CODE to ${email}`);
    }
  }
}

export function setupStripeWebhook(app: Express) {
  const stripe = getStripe();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) throw new Error("STRIPE_WEBHOOK_SECRET is missing!");

  // STRIPE webhook — RAW body
  app.post(
    "/api/webhooks/stripe",
    require("express").raw({ type: "application/json" }),
    async (req, res) => {
      const signature = req.headers["stripe-signature"];
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
      } catch (err: any) {
        console.error("❌ Stripe signature verification failed:", err.message);
        return res.status(400).send("Invalid signature");
      }
      console.log(`🟢 Verified Stripe event: ${event.type}`);
      try {
        await processStripeEvent(event);
        res.status(200).send("OK");
      } catch (err) {
        console.error("❌ Error processing event:", err);
        res.status(500).send("Webhook error");
      }
    }
  );

  // TEST endpoint — JSON
  app.post("/api/test/webhook", express.json(), async (req, res) => {
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
    console.log("🧪 Test webhook event:", testEvent);
    try {
      await processStripeEvent(testEvent);
      res.json({ ok: true });
    } catch (err) {
      console.error("❌ Test webhook failed:", err);
      res.status(500).json({ error: "Simulation failed" });
    }
  });
}
