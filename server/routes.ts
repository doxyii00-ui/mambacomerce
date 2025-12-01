import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertDiscordAccessSchema } from "@shared/schema";
import { grantDiscordRole } from "./discord-bot";
import { z } from "zod";

// Validate status values
const validStatuses = ["pending", "paid", "failed"];
const statusSchema = z.enum(["pending", "paid", "failed"]);

// Email validation
const emailSchema = z.string().email().toLowerCase();
const authSchema = z.object({
  email: z.string().email("Invalid email").toLowerCase(),
  password: z.string().min(6, "Password must be 6+ characters"),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth endpoints
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password } = authSchema.parse(req.body);
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        res.status(400).json({ error: "Email już istnieje" });
        return;
      }
      const user = await storage.createUser({ email, password });
      res.status(201).json({ id: user.id, email: user.email });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Błąd rejestracji" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = authSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: "Niepoprawny email lub hasło" });
        return;
      }
      const valid = await storage.verifyPassword(email, password);
      if (!valid) {
        res.status(401).json({ error: "Niepoprawny email lub hasło" });
        return;
      }
      res.json({ id: user.id, email: user.email });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Błąd logowania" });
    }
  });
  // Create order endpoint
  app.post("/api/orders", async (req, res) => {
    try {
      // Validate email first
      if (!req.body.email || typeof req.body.email !== "string") {
        res.status(400).json({ error: "Valid email required" });
        return;
      }

      // Validate product ID
      if (!req.body.productId || typeof req.body.productId !== "string") {
        res.status(400).json({ error: "Valid product ID required" });
        return;
      }

      // Validate all order data
      const orderData = insertOrderSchema.parse({
        email: req.body.email.trim().toLowerCase(),
        productId: req.body.productId.trim(),
        productName: String(req.body.productName || "").substring(0, 255),
        price: String(req.body.price || "").substring(0, 50),
      });

      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Order creation error:", error);
      res.status(400).json({ error: error.message || "Invalid order data" });
    }
  });

  // Get user orders
  app.get("/api/orders/:email", async (req, res) => {
    try {
      const email = emailSchema.parse(req.params.email);
      const orders = await storage.getOrderByEmail(email);
      res.json(orders);
    } catch (error) {
      res.status(400).json({ error: "Invalid email format" });
    }
  });

  // Check payment status
  app.get("/api/orders/:email/paid", async (req, res) => {
    try {
      const email = emailSchema.parse(req.params.email);
      const orders = await storage.getOrderByEmail(email);
      const paid = orders.some(o => o.status === "paid");
      res.json({ 
        paid, 
        orders: orders.filter(o => o.status === "paid"),
        count: orders.length 
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid email format" });
    }
  });

  // Update order status (with validation)
  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const { status } = req.body;
      
      // Validate status
      if (!status) {
        res.status(400).json({ error: "Status required" });
        return;
      }

      const validatedStatus = statusSchema.parse(status);
      
      // Validate order ID format
      if (!req.params.id || typeof req.params.id !== "string" || req.params.id.length === 0) {
        res.status(400).json({ error: "Invalid order ID" });
        return;
      }

      const updated = await storage.updateOrderStatus(req.params.id, validatedStatus);
      if (!updated) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      res.json(updated);
    } catch (error: any) {
      console.error("Order update error:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Grant Discord access endpoint
  app.post("/api/discord/grant-access", async (req, res) => {
    try {
      const { email, discordUserId, orderId, durationDays } = req.body;

      if (!email || !discordUserId || !orderId || !durationDays) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      // Get the order to verify it's for MambaReceipts and is paid
      const order = await storage.getOrder(orderId);
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      if (!order.productId.includes("receipts")) {
        res.status(400).json({ error: "This product does not grant Discord access" });
        return;
      }

      if (order.status !== "paid") {
        res.status(400).json({ error: "Order is not paid" });
        return;
      }

      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      // Grant Discord access
      const discordAccess = await storage.grantDiscordAccess({
        email: email.toLowerCase(),
        discordUserId,
        expiresAt,
      });

      // Grant Discord role (optional - if role IDs are configured)
      const guildId = process.env.DISCORD_GUILD_ID;
      const roleId = process.env.DISCORD_RECEIPTS_ROLE_ID;

      if (guildId && roleId) {
        const roleGranted = await grantDiscordRole(discordUserId, guildId, roleId);
        if (!roleGranted) {
          console.warn("Failed to grant Discord role, but access recorded");
        }
      }

      res.json({
        success: true,
        accessId: discordAccess.id,
        expiresAt: discordAccess.expiresAt,
        message: `Access granted until ${expiresAt.toLocaleDateString()}`,
      });
    } catch (error: any) {
      console.error("Discord access grant error:", error);
      res.status(400).json({ error: error.message || "Failed to grant access" });
    }
  });

  // Check Discord access
  app.get("/api/discord/access/:email", async (req, res) => {
    try {
      const email = emailSchema.parse(req.params.email);
      const access = await storage.getDiscordAccess(email);

      if (!access) {
        res.json({ hasAccess: false, expiresAt: null });
        return;
      }

      const now = new Date();
      const hasAccess = access.expiresAt > now;

      res.json({
        hasAccess,
        expiresAt: access.expiresAt,
        daysRemaining: hasAccess
          ? Math.ceil(
              (access.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
          : 0,
      });
    } catch (error: any) {
      res.status(400).json({ error: "Invalid email format" });
    }
  });

  return httpServer;
}
