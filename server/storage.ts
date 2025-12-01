import { type User, type InsertUser, type Order, type InsertOrder, type DiscordAccess, type InsertDiscordAccess } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(email: string, password: string): Promise<boolean>;
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByEmail(email: string): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  getOrderByStripeSessionId(sessionId: string): Promise<Order | undefined>;
  grantDiscordAccess(access: InsertDiscordAccess): Promise<DiscordAccess>;
  getDiscordAccess(email: string): Promise<DiscordAccess | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private orders: Map<string, Order>;
  private discordAccesses: Map<string, DiscordAccess>;
  private orderCounter: number;

  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.discordAccesses = new Map();
    this.orderCounter = 0;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(insertUser.password, SALT_ROUNDS);
    const user: User = { 
      id,
      username: insertUser.username,
      password: hashedPassword
    };
    this.users.set(id, user);
    // Return user without password
    return user;
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user) return false;
    try {
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      return false;
    }
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

  async grantDiscordAccess(access: InsertDiscordAccess): Promise<DiscordAccess> {
    const id = randomUUID();
    const discordAccess: DiscordAccess = {
      id,
      email: access.email,
      discordUserId: access.discordUserId,
      expiresAt: access.expiresAt,
      createdAt: new Date(),
    };
    this.discordAccesses.set(id, discordAccess);
    return discordAccess;
  }

  async getDiscordAccess(email: string): Promise<DiscordAccess | undefined> {
    return Array.from(this.discordAccesses.values()).find(
      (access) => access.email === email
    );
  }
}

export const storage = new MemStorage();
