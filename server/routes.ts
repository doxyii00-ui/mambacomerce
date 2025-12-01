import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema } from "@shared/schema";
import { z } from "zod";

// Validate status values
const validStatuses = ["pending", "paid", "failed"];
const statusSchema = z.enum(["pending", "paid", "failed"]);

// Email validation
const emailSchema = z.string().email().toLowerCase();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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

  return httpServer;
}
