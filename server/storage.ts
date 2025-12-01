import { type User, type InsertUser, type Order, type InsertOrder } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByEmail(email: string): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  getOrderByStripeSessionId(sessionId: string): Promise<Order | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private orders: Map<string, Order>;
  private orderCounter: number;

  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.orderCounter = 0;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      id,
      email: insertOrder.email,
      productId: insertOrder.productId,
      productName: insertOrder.productName,
      price: insertOrder.price,
      stripeSessionId: insertOrder.stripeSessionId ?? null,
      status: "pending",
      createdAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByEmail(email: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.email === email
    );
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (order) {
      const updated = { ...order, status };
      this.orders.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async getOrderByStripeSessionId(sessionId: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      (order) => order.stripeSessionId === sessionId
    );
  }
}

export const storage = new MemStorage();
