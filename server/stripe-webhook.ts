import type { Express, Request } from "express";
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
    // Use require to avoid build-time resolution
    const Stripe = require("stripe").default || require("stripe");
    stripe = new Stripe(apiKey, {
      apiVersion: "2024-11-20",
    });
  }
  return stripe;
}

// Mapping linków Stripe do produktów
const STRIPE_LINK_MAPPING: { [key: string]: { type: "obywatel" | "receipts"; tier?: "basic" | "premium"; duration?: number } } = {
  // Live links
  "6oU28s5Fo3PjaHLfRCgEg06": { type: "obywatel", tier: "premium" }, // obywatel 200 - ticket
  "28E4gA0l499Dg25eNygEg00": { type: "obywatel", tier: "basic" }, // obywatel 20 - kod
  "9B600k7NwbhLdTXdJugEg02": { type: "receipts", duration: 31 }, // receipts 20 (monthly)
  "5kQ00k8RA5Xr2bfdJugEg03": { type: "receipts", duration: 999 }, // receipts 60 (annual)
  // Test links
  "6oU28r2O8f6v3eI0C9cEw00": { type: "obywatel", tier: "premium" }, // test: obywatel 200 - ticket
};

export async function setupStripeWebhook(app: Express): Promise<void> {
  // Webhook dla Stripe - sprawdza czy płatność przeszła
  app.post("/api/webhooks/stripe", async (req, res) => {
    console.log("[Stripe] Webhook received!");
    try {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      console.log("[Stripe] Signature:", sig ? "present" : "missing");
      console.log("[Stripe] Secret configured:", webhookSecret ? "yes" : "no");

      if (!sig || !webhookSecret) {
        console.error("[Stripe] Missing signature or secret");
        res.status(400).json({ error: "Missing signature or secret" });
        return;
      }

      // Construct event with proper signature verification
      let event;
      try {
        const body = req.rawBody as Buffer;
        const stripeClient = getStripe();
        event = stripeClient.webhooks.constructEvent(body, sig, webhookSecret);
        console.log("[Stripe] Event verified, type:", event.type);
      } catch (error) {
        console.error("[Stripe] Signature verification failed:", error);
        res.status(400).json({ error: "Signature verification failed" });
        return;
      }

      // Handle checkout.session.completed event
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const sessionId = session.id;
        const email = session.customer_email;
        const paymentLinkId = session.payment_link; // Stripe payment link ID

        console.log(`[Stripe] Payment completed for session ${sessionId}, email: ${email}, link: ${paymentLinkId}`);

        if (!email) {
          console.warn("[Stripe] No email in session");
          res.status(200).json({ received: true });
          return;
        }

        // Extract link ID from payment_link (it's just an ID, not a full URL)
        const linkId = paymentLinkId?.split('/').pop() || paymentLinkId;
        
        console.log(`[Stripe] Looking up payment link ID: ${linkId}`);
        
        // Determine product type from link mapping
        let productConfig = STRIPE_LINK_MAPPING[linkId];
        
        // If not found, log all available IDs for debugging
        if (!productConfig) {
          console.warn(`[Stripe] Unknown payment link: ${linkId}`);
          console.warn(`[Stripe] Available links:`, Object.keys(STRIPE_LINK_MAPPING));
          res.status(200).json({ received: true });
          return;
        }

        console.log(`[Stripe] Detected product type: ${productConfig.type}`);

        // Handle Receipts
        if (productConfig.type === "receipts") {
          console.log(`[Stripe] MambaReceipts purchase - setting up Discord access`);
          
          try {
            const expiresAt = new Date();
            const days = productConfig.duration || 31;
            expiresAt.setDate(expiresAt.getDate() + days);

            await storage.grantDiscordAccess({
              email: email.toLowerCase(),
              discordUserId: "pending", // Will be filled when user connects Discord
              expiresAt: expiresAt,
            });

            // Send email with Discord /polacz instruction
            await sendReceiptsEmail(email.toLowerCase(), expiresAt);

            console.log(`[Stripe] Discord access granted for ${email} until ${expiresAt}`);
          } catch (error) {
            console.error("[Stripe] Failed to grant Discord access:", error);
          }
        } 
        // Handle Obywatel
        else if (productConfig.type === "obywatel") {
          console.log(`[Stripe] MambaObywatel purchase - tier: ${productConfig.tier}`);
          
          try {
            // Premium tier (200 PLN) - send ticket email
            if (productConfig.tier === "premium") {
              await sendTicketEmail(email.toLowerCase());
              console.log(`[Stripe] Ticket email sent to ${email}`);
            } 
            // Basic tier (20 PLN) - send access code
            else {
              const code = await storage.getUnusedAccessCode("obywatel");

              if (code) {
                const generatorLink = "https://mambagen.up.railway.app/gen.html";
                await storage.markCodeAsUsed(code.code, email.toLowerCase());
                await sendAccessCodeEmail(email.toLowerCase(), code.code, generatorLink);
                console.log(`[Stripe] Access code sent to ${email}`);
              } else {
                console.warn("[Stripe] No available Obywatel access codes!");
              }
            }
          } catch (error) {
            console.error("[Stripe] Failed to process Obywatel purchase:", error);
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("[Stripe Webhook] Error:", error);
      res.status(200).json({ received: true });
    }
  });
}
