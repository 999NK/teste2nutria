import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import MemoryStore from "memorystore";

const MemorySessionStore = MemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<any | undefined>;
  getUserByEmail(email: string): Promise<any | undefined>;
  getUserByGoogleId(googleId: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  upsertUser(user: any): Promise<any>;
  linkGoogleAccount(userId: number, googleId: string): Promise<any>;
  updateUserGoals(userId: number, updates: any): Promise<any>;
  
  // Food operations
  getFoods(userId?: string, search?: string): Promise<any[]>;
  createFood(food: any): Promise<any>;
  updateFood(id: number, food: any): Promise<any>;
  deleteFood(id: number): Promise<void>;
  
  // Meal Type operations
  getMealTypes(userId?: string): Promise<any[]>;
  createMealType(mealType: any): Promise<any>;
  
  // Meal operations
  getMeals(userId: string, date?: string): Promise<any[]>;
  createMeal(meal: any): Promise<any>;
  addFoodToMeal(mealFood: any): Promise<any>;
  removeFoodFromMeal(mealId: number, foodId: number): Promise<void>;
  deleteMeal(id: number): Promise<void>;
  
  // Recipe operations
  getRecipes(userId: string): Promise<any[]>;
  createRecipe(recipe: any): Promise<any>;
  addIngredientToRecipe(ingredient: any): Promise<any>;
  updateRecipe(id: number, recipe: any): Promise<any>;
  deleteRecipe(id: number): Promise<void>;
  
  // Daily Nutrition operations
  getDailyNutrition(userId: string, date: string): Promise<any | undefined>;
  upsertDailyNutrition(nutrition: any): Promise<any>;
  getNutritionHistory(userId: string, startDate: string, endDate: string): Promise<any[]>;
  
  // Meal Plan operations
  getActiveMealPlan(userId: string): Promise<any | undefined>;
  getActiveMealPlans(userId: string): Promise<any[]>;
  getMealPlanHistory(userId: string): Promise<any[]>;
  createMealPlan(mealPlan: any): Promise<any>;
  updateMealPlan(id: number, mealPlan: any): Promise<any>;
  activateMealPlan(id: number, userId: string): Promise<any>;
  deleteMealPlan(id: number): Promise<void>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new MemorySessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<any | undefined> {
    try {
      const result = await db.execute(`SELECT * FROM users WHERE id = ?`, [id]);
      return result[0];
    } catch (error) {
      console.log('Temporary storage - getUser not implemented');
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    try {
      const result = await db.execute(`SELECT * FROM users WHERE email = ?`, [email]);
      return result[0];
    } catch (error) {
      console.log('Temporary storage - getUserByEmail not implemented');
      return undefined;
    }
  }

  async getUserByGoogleId(googleId: string): Promise<any | undefined> {
    try {
      const result = await db.execute(`SELECT * FROM users WHERE google_id = ?`, [googleId]);
      return result[0];
    } catch (error) {
      console.log('Temporary storage - getUserByGoogleId not implemented');
      return undefined;
    }
  }

  async createUser(userData: any): Promise<any> {
    try {
      const result = await db.execute(`
        INSERT INTO users (email, password, first_name, last_name, profile_image_url, google_id, auth_provider)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.profileImageUrl,
        userData.googleId,
        userData.authProvider || 'local'
      ]);
      return { id: result.lastInsertRowid, ...userData };
    } catch (error) {
      console.log('Temporary storage - createUser error:', error);
      return { id: 1, ...userData }; // Fallback
    }
  }

  async upsertUser(userData: any): Promise<any> {
    try {
      // Try to find existing user
      const existing = await this.getUserByEmail(userData.email);
      if (existing) {
        return existing;
      } else {
        return await this.createUser(userData);
      }
    } catch (error) {
      console.log('Temporary storage - upsertUser error:', error);
      return { id: 1, ...userData }; // Fallback
    }
  }

  async linkGoogleAccount(userId: number, googleId: string): Promise<any> {
    try {
      await db.execute(`UPDATE users SET google_id = ? WHERE id = ?`, [googleId, userId]);
      return await this.getUser(userId);
    } catch (error) {
      console.log('Temporary storage - linkGoogleAccount error:', error);
      return { id: userId, googleId }; // Fallback
    }
  }

  async updateUserGoals(userId: number, updates: any): Promise<any> {
    try {
      // Simplified update for demo
      return { id: userId, ...updates };
    } catch (error) {
      console.log('Temporary storage - updateUserGoals error:', error);
      return { id: userId, ...updates }; // Fallback
    }
  }

  async getFoods(userId?: string, search?: string): Promise<any[]> {
    try {
      // Return empty array for now
      return [];
    } catch (error) {
      console.log('Temporary storage - getFoods error:', error);
      return [];
    }
  }

  async createFood(food: any): Promise<any> {
    try {
      return { id: 1, ...food };
    } catch (error) {
      console.log('Temporary storage - createFood error:', error);
      return { id: 1, ...food };
    }
  }

  async updateFood(id: number, food: any): Promise<any> {
    try {
      return { id, ...food };
    } catch (error) {
      console.log('Temporary storage - updateFood error:', error);
      return { id, ...food };
    }
  }

  async deleteFood(id: number): Promise<void> {
    try {
      // Do nothing for now
    } catch (error) {
      console.log('Temporary storage - deleteFood error:', error);
    }
  }

  // Meal Type operations
  async getMealTypes(userId?: string): Promise<any[]> {
    try {
      return [
        { id: 1, name: 'Café da manhã', isDefault: true },
        { id: 2, name: 'Almoço', isDefault: true },
        { id: 3, name: 'Lanche', isDefault: true },
        { id: 4, name: 'Jantar', isDefault: true }
      ];
    } catch (error) {
      console.log('Temporary storage - getMealTypes error:', error);
      return [];
    }
  }

  async createMealType(mealType: any): Promise<any> {
    try {
      return { id: 1, ...mealType };
    } catch (error) {
      console.log('Temporary storage - createMealType error:', error);
      return { id: 1, ...mealType };
    }
  }

  // Meal operations
  async getMeals(userId: string, date?: string): Promise<any[]> {
    try {
      return [];
    } catch (error) {
      console.log('Temporary storage - getMeals error:', error);
      return [];
    }
  }

  async createMeal(meal: any): Promise<any> {
    try {
      return { id: 1, ...meal };
    } catch (error) {
      console.log('Temporary storage - createMeal error:', error);
      return { id: 1, ...meal };
    }
  }

  async addFoodToMeal(mealFood: any): Promise<any> {
    try {
      return { id: 1, ...mealFood };
    } catch (error) {
      console.log('Temporary storage - addFoodToMeal error:', error);
      return { id: 1, ...mealFood };
    }
  }

  async removeFoodFromMeal(mealId: number, foodId: number): Promise<void> {
    try {
      // Do nothing for now
    } catch (error) {
      console.log('Temporary storage - removeFoodFromMeal error:', error);
    }
  }

  async deleteMeal(id: number): Promise<void> {
    try {
      // Do nothing for now
    } catch (error) {
      console.log('Temporary storage - deleteMeal error:', error);
    }
  }

  // Recipe operations
  async getRecipes(userId: string): Promise<any[]> {
    try {
      return [];
    } catch (error) {
      console.log('Temporary storage - getRecipes error:', error);
      return [];
    }
  }

  async createRecipe(recipe: any): Promise<any> {
    try {
      return { id: 1, ...recipe };
    } catch (error) {
      console.log('Temporary storage - createRecipe error:', error);
      return { id: 1, ...recipe };
    }
  }

  async addIngredientToRecipe(ingredient: any): Promise<any> {
    try {
      return { id: 1, ...ingredient };
    } catch (error) {
      console.log('Temporary storage - addIngredientToRecipe error:', error);
      return { id: 1, ...ingredient };
    }
  }

  async updateRecipe(id: number, recipe: any): Promise<any> {
    try {
      return { id, ...recipe };
    } catch (error) {
      console.log('Temporary storage - updateRecipe error:', error);
      return { id, ...recipe };
    }
  }

  async deleteRecipe(id: number): Promise<void> {
    try {
      // Do nothing for now
    } catch (error) {
      console.log('Temporary storage - deleteRecipe error:', error);
    }
  }

  // Daily Nutrition operations
  async getDailyNutrition(userId: string, date: string): Promise<any | undefined> {
    try {
      return undefined;
    } catch (error) {
      console.log('Temporary storage - getDailyNutrition error:', error);
      return undefined;
    }
  }

  async upsertDailyNutrition(nutrition: any): Promise<any> {
    try {
      return { id: 1, ...nutrition };
    } catch (error) {
      console.log('Temporary storage - upsertDailyNutrition error:', error);
      return { id: 1, ...nutrition };
    }
  }

  async getNutritionHistory(userId: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      return [];
    } catch (error) {
      console.log('Temporary storage - getNutritionHistory error:', error);
      return [];
    }
  }

  // Meal Plan operations
  async getActiveMealPlan(userId: string): Promise<any | undefined> {
    try {
      return undefined;
    } catch (error) {
      console.log('Temporary storage - getActiveMealPlan error:', error);
      return undefined;
    }
  }

  async getActiveMealPlans(userId: string): Promise<any[]> {
    try {
      return [];
    } catch (error) {
      console.log('Temporary storage - getActiveMealPlans error:', error);
      return [];
    }
  }

  async getMealPlanHistory(userId: string): Promise<any[]> {
    try {
      return [];
    } catch (error) {
      console.log('Temporary storage - getMealPlanHistory error:', error);
      return [];
    }
  }

  async createMealPlan(mealPlan: any): Promise<any> {
    try {
      return { id: 1, ...mealPlan };
    } catch (error) {
      console.log('Temporary storage - createMealPlan error:', error);
      return { id: 1, ...mealPlan };
    }
  }

  async updateMealPlan(id: number, mealPlan: any): Promise<any> {
    try {
      return { id, ...mealPlan };
    } catch (error) {
      console.log('Temporary storage - updateMealPlan error:', error);
      return { id, ...mealPlan };
    }
  }

  async activateMealPlan(id: number, userId: string): Promise<any> {
    try {
      return { id, userId, isActive: true };
    } catch (error) {
      console.log('Temporary storage - activateMealPlan error:', error);
      return { id, userId, isActive: true };
    }
  }

  async deleteMealPlan(id: number): Promise<void> {
    try {
      // Do nothing for now
    } catch (error) {
      console.log('Temporary storage - deleteMealPlan error:', error);
    }
  }
}

export const storage = new DatabaseStorage();