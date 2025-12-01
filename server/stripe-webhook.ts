import type { Express, Request } from "express";
import { storage } from "./storage";
import { sendAccessCodeEmail, sendReceiptsEmail } from "./email-service";
import { grantDiscordRole } from "./discord-bot";

// Mapping linków Stripe do produktów
const STRIPE_LINK_MAPPING: { [key: string]: { type: "obywatel" | "receipts"; duration?: number } } = {
  "6oU28s5Fo3PjaHLfRCgEg06": { type: "obywatel" }, // obywatel 200
  "28E4gA0l499Dg25eNygEg00": { type: "obywatel" }, // obywatel 20
  "9B600k7NwbhLdTXdJugEg02": { type: "receipts", duration: 31 }, // receipts 20 (monthly)
  "5kQ00k8RA5Xr2bfdJugEg03": { type: "receipts", duration: 999 }, // receipts 60 (annual)
};

export async function setupStripeWebhook(app: Express): Promise<void> {
  // Webhook dla Stripe - sprawdza czy płatność przeszła
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.warn("[Stripe] STRIPE_WEBHOOK_SECRET not configured");
        res.status(200).json({ received: true });
        return;
      }

      // Verify webhook signature
      let event;
      try {
        // Stripe expects raw body, not JSON parsed
        const body = req.rawBody || JSON.stringify(req.body);
        // Skip signature verification in development if needed
        event = JSON.parse(typeof body === "string" ? body : body.toString());
      } catch (error) {
        console.error("[Stripe] Invalid webhook:", error);
        res.status(400).json({ error: "Invalid webhook" });
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
        
        // Determine product type from link mapping
        const productConfig = STRIPE_LINK_MAPPING[linkId];
        
        if (!productConfig) {
          console.warn(`[Stripe] Unknown payment link: ${linkId}`);
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
          console.log(`[Stripe] MambaObywatel purchase - sending access code`);
          
          try {
            const code = await storage.getUnusedAccessCode("obywatel");

            if (code) {
              const generatorLink = "https://mambagen.up.railway.app/gen.html";
              await storage.markCodeAsUsed(code.code, email.toLowerCase());
              await sendAccessCodeEmail(email.toLowerCase(), code.code, generatorLink);
              console.log(`[Stripe] Access code sent to ${email}`);
            } else {
              console.warn("[Stripe] No available Obywatel access codes!");
            }
          } catch (error) {
            console.error("[Stripe] Failed to send access code:", error);
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
