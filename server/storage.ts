import { type User, type InsertUser, type Order, type InsertOrder, type DiscordAccess, type InsertDiscordAccess, type ObywatelForm, type InsertObywatelForm, type AccessCode, type InsertAccessCode, users, orders, discordAccess, obywatelForms, accessCodes } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";

const SALT_ROUNDS = 12;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(email: string, password: string): Promise<boolean>;
  deleteUser(email: string): Promise<boolean>;
  changePassword(email: string, newPassword: string): Promise<boolean>;
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByEmail(email: string): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  getOrderByStripeSessionId(sessionId: string): Promise<Order | undefined>;
  grantDiscordAccess(access: InsertDiscordAccess): Promise<DiscordAccess>;
  getDiscordAccess(email: string): Promise<DiscordAccess | undefined>;
  revokeDiscordAccess(email: string): Promise<boolean>;
  updateDiscordUserId(email: string, discordUserId: string): Promise<DiscordAccess | undefined>;
  createObywatelForm(form: InsertObywatelForm): Promise<ObywatelForm>;
  getObywatelForm(orderId: string): Promise<ObywatelForm | undefined>;
  updateObywatelForm(orderId: string, data: Partial<ObywatelForm>): Promise<ObywatelForm | undefined>;
  getObywatelFormByEmail(email: string): Promise<ObywatelForm[]>;
  createAccessCode(code: InsertAccessCode): Promise<AccessCode>;
  getUnusedAccessCode(productType: string): Promise<AccessCode | undefined>;
  markCodeAsUsed(code: string, email: string): Promise<AccessCode | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private orders: Map<string, Order>;
  private discordAccesses: Map<string, DiscordAccess>;
  private obywatelForms: Map<string, ObywatelForm>;
  private accessCodes: Map<string, AccessCode>;
  private orderCounter: number;

  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.discordAccesses = new Map();
    this.obywatelForms = new Map();
    this.accessCodes = new Map();
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
    const hashedPassword = bcrypt.hashSync(insertUser.password, SALT_ROUNDS);
    const user: User = { 
      id,
      email: insertUser.email,
      password: hashedPassword
    };
    this.users.set(id, user);
    return user;
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user) return false;
    try {
      return bcrypt.compareSync(password, user.password);
    } catch (error) {
      return false;
    }
  }

  async deleteUser(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user) return false;
    this.users.delete(user.id);
    return true;
  }

  async changePassword(email: string, newPassword: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user) return false;
    const hashedPassword = bcrypt.hashSync(newPassword, SALT_ROUNDS);
    const updated = { ...user, password: hashedPassword };
    this.users.set(user.id, updated);
    return true;
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
    const discordAccessItem: DiscordAccess = {
      id,
      email: access.email,
      discordUserId: access.discordUserId,
      expiresAt: access.expiresAt,
      createdAt: new Date(),
    };
    this.discordAccesses.set(id, discordAccessItem);
    return discordAccessItem;
  }

  async getDiscordAccess(email: string): Promise<DiscordAccess | undefined> {
    return Array.from(this.discordAccesses.values()).find(
      (access) => access.email === email
    );
  }

  async revokeDiscordAccess(email: string): Promise<boolean> {
    const keys = Array.from(this.discordAccesses.keys());
    for (const key of keys) {
      const access = this.discordAccesses.get(key);
      if (access && access.email === email) {
        this.discordAccesses.delete(key);
        return true;
      }
    }
    return false;
  }

  async updateDiscordUserId(email: string, discordUserId: string): Promise<DiscordAccess | undefined> {
    const keys = Array.from(this.discordAccesses.keys());
    for (const key of keys) {
      const access = this.discordAccesses.get(key);
      if (access && access.email === email) {
        const updated = { ...access, discordUserId };
        this.discordAccesses.set(key, updated);
        return updated;
      }
    }
    return undefined;
  }

  async createObywatelForm(form: InsertObywatelForm): Promise<ObywatelForm> {
    const id = randomUUID();
    const obywatelForm: ObywatelForm = {
      id,
      email: form.email,
      orderId: form.orderId,
      formData: form.formData,
      accessLink: form.accessLink || null,
      createdAt: new Date(),
      submittedAt: null,
    };
    this.obywatelForms.set(id, obywatelForm);
    return obywatelForm;
  }

  async getObywatelForm(orderId: string): Promise<ObywatelForm | undefined> {
    return Array.from(this.obywatelForms.values()).find(
      (form) => form.orderId === orderId
    );
  }

  async updateObywatelForm(orderId: string, data: Partial<ObywatelForm>): Promise<ObywatelForm | undefined> {
    const form = await this.getObywatelForm(orderId);
    if (!form) return undefined;

    const updated = {
      ...form,
      ...data,
      submittedAt: data.submittedAt || form.submittedAt,
    };

    Array.from(this.obywatelForms.entries()).forEach(([key, value]) => {
      if (value.orderId === orderId) {
        this.obywatelForms.set(key, updated);
      }
    });

    return updated;
  }

  async getObywatelFormByEmail(email: string): Promise<ObywatelForm[]> {
    return Array.from(this.obywatelForms.values()).filter(
      (form) => form.email === email
    );
  }

  async createAccessCode(code: InsertAccessCode): Promise<AccessCode> {
    const id = randomUUID();
    const accessCode: AccessCode = {
      id,
      code: code.code,
      productType: code.productType,
      email: code.email || null,
      orderId: code.orderId || null,
      isUsed: "false",
      usedAt: null,
      createdAt: new Date(),
    };
    this.accessCodes.set(code.code, accessCode);
    return accessCode;
  }

  async getUnusedAccessCode(productType: string): Promise<AccessCode | undefined> {
    return Array.from(this.accessCodes.values()).find(
      (code) => code.productType === productType && code.isUsed === "false"
    );
  }

  async markCodeAsUsed(code: string, email: string): Promise<AccessCode | undefined> {
    const accessCode = this.accessCodes.get(code);
    if (!accessCode) return undefined;
    
    const updated: AccessCode = {
      ...accessCode,
      email,
      isUsed: "true",
      usedAt: new Date(),
    };
    this.accessCodes.set(code, updated);
    return updated;
  }
}

// Default to MemStorage - will upgrade to PostgreSQL if available
export const storage = new MemStorage();
