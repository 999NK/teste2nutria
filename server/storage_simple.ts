import { db } from "./db";
import { users, foods, meals, mealTypes, recipes, dailyNutrition, mealPlans } from "@shared/schema";
import { eq, desc, and, or, isNull, ilike, sql } from "drizzle-orm";
import type { 
  User, UpsertUser, Food, InsertFood
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: Partial<UpsertUser>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  linkGoogleAccount(userId: number, googleId: string): Promise<User>;
  updateUserGoals(userId: number, updates: { 
    weight?: number; 
    height?: number; 
    age?: number; 
    goal?: string; 
    activityLevel?: string; 
    dailyCalories: number; 
    dailyProtein: number; 
    dailyCarbs: number; 
    dailyFat: number; 
    isProfileComplete?: boolean;
  }): Promise<User>;
  
  // Food operations
  getFoods(userId?: string, search?: string): Promise<Food[]>;
  createFood(food: InsertFood): Promise<Food>;
  updateFood(id: number, food: Partial<InsertFood>): Promise<Food>;
  deleteFood(id: number): Promise<void>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.googleId, googleId));
    return result[0];
  }

  async createUser(userData: Partial<UpsertUser>): Promise<User> {
    const result = await db.insert(users).values(userData as any).returning();
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user exists by email or googleId
    let existingUser;
    
    if (userData.email) {
      existingUser = await this.getUserByEmail(userData.email);
    }
    
    if (!existingUser && userData.googleId) {
      existingUser = await this.getUserByGoogleId(userData.googleId);
    }

    if (existingUser) {
      // Update existing user
      const result = await db.update(users)
        .set(userData)
        .where(eq(users.id, existingUser.id))
        .returning();
      return result[0];
    } else {
      // Create new user
      return await this.createUser(userData);
    }
  }

  async linkGoogleAccount(userId: number, googleId: string): Promise<User> {
    const result = await db.update(users)
      .set({ googleId })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserGoals(userId: number, updates: { 
    weight?: number; 
    height?: number; 
    age?: number; 
    goal?: string; 
    activityLevel?: string; 
    dailyCalories: number; 
    dailyProtein: number; 
    dailyCarbs: number; 
    dailyFat: number; 
    isProfileComplete?: boolean;
  }): Promise<User> {
    const result = await db.update(users)
      .set({ 
        ...(updates as any),
        isProfileComplete: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Food operations
  async getFoods(userId?: string, search?: string): Promise<Food[]> {
    const userIdNum = userId ? parseInt(userId) : undefined;
    
    let query = db.select().from(foods);
    
    if (userIdNum && search) {
      return await query
        .where(
          and(
            or(isNull(foods.userId), eq(foods.userId, userIdNum)),
            sql`LOWER(${foods.name}) LIKE LOWER(${`%${search}%`})`
          )
        )
        .orderBy(foods.name);
    } else if (userIdNum) {
      return await query
        .where(or(isNull(foods.userId), eq(foods.userId, userIdNum)))
        .orderBy(foods.name);
    } else if (search) {
      return await query
        .where(
          and(
            isNull(foods.userId),
            sql`LOWER(${foods.name}) LIKE LOWER(${`%${search}%`})`
          )
        )
        .orderBy(foods.name);
    } else {
      return await query
        .where(isNull(foods.userId))
        .orderBy(foods.name);
    }
  }

  async createFood(food: InsertFood): Promise<Food> {
    const result = await db.insert(foods).values(food).returning();
    return result[0];
  }

  async updateFood(id: number, food: Partial<InsertFood>): Promise<Food> {
    const result = await db.update(foods)
      .set(food)
      .where(eq(foods.id, id))
      .returning();
    return result[0];
  }

  async deleteFood(id: number): Promise<void> {
    await db.delete(foods).where(eq(foods.id, id));
  }
}

export const storage = new DatabaseStorage();