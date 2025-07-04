import {
  users,
  foods,
  mealTypes,
  meals,
  mealFoods,
  recipes,
  recipeIngredients,
  dailyNutrition,
  mealPlans,
  userPlans,
  dailyProgress,
  type User,
  type UpsertUser,
  type Food,
  type InsertFood,
  type MealType,
  type InsertMealType,
  type Meal,
  type InsertMeal,
  type MealFood,
  type InsertMealFood,
  type Recipe,
  type InsertRecipe,
  type RecipeIngredient,
  type InsertRecipeIngredient,
  type DailyNutrition,
  type InsertDailyNutrition,
  type MealPlan,
  type InsertMealPlan,
  type UserPlan,
  type InsertUserPlan,
  type DailyProgress,
  type InsertDailyProgress,
} from "@shared/schema_sqlite";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte, or, isNull, ne } from "drizzle-orm";

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
  
  // Meal Type operations
  getMealTypes(userId?: string): Promise<MealType[]>;
  createMealType(mealType: InsertMealType): Promise<MealType>;
  
  // Meal operations
  getMeals(userId: string, date?: string): Promise<(Meal & { mealType: MealType; mealFoods: (MealFood & { food: Food })[] })[]>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  addFoodToMeal(mealFood: InsertMealFood): Promise<MealFood>;
  removeFoodFromMeal(mealId: number, foodId: number): Promise<void>;
  deleteMeal(id: number): Promise<void>;
  
  // Recipe operations
  getRecipes(userId: string): Promise<(Recipe & { ingredients: (RecipeIngredient & { food: Food })[] })[]>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  addIngredientToRecipe(ingredient: InsertRecipeIngredient): Promise<RecipeIngredient>;
  updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe>;
  deleteRecipe(id: number): Promise<void>;
  
  // Daily Nutrition operations
  getDailyNutrition(userId: string, date: string): Promise<DailyNutrition | undefined>;
  upsertDailyNutrition(nutrition: InsertDailyNutrition): Promise<DailyNutrition>;
  getNutritionHistory(userId: string, startDate: string, endDate: string): Promise<DailyNutrition[]>;
  
  // Meal Plan operations
  getActiveMealPlan(userId: string): Promise<MealPlan | undefined>;
  getActiveMealPlans(userId: string): Promise<MealPlan[]>;
  getMealPlanHistory(userId: string): Promise<MealPlan[]>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlan(id: number, mealPlan: Partial<InsertMealPlan>): Promise<MealPlan>;
  activateMealPlan(id: number, userId: string): Promise<MealPlan>;
  deleteMealPlan(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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
    const updateData: any = {
      dailyCalories: updates.dailyCalories,
      dailyProtein: updates.dailyProtein,
      dailyCarbs: updates.dailyCarbs,
      dailyFat: updates.dailyFat,
      updatedAt: new Date(),
    };

    if (updates.weight !== undefined) updateData.weight = updates.weight.toString();
    if (updates.height !== undefined) updateData.height = updates.height;
    if (updates.age !== undefined) updateData.age = updates.age;
    if (updates.goal !== undefined) updateData.goal = updates.goal;
    if (updates.activityLevel !== undefined) updateData.activityLevel = updates.activityLevel;
    if (updates.isProfileComplete !== undefined) updateData.isProfileComplete = updates.isProfileComplete;

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData as any)
      .returning();
    return user;
  }

  async linkGoogleAccount(userId: number, googleId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        googleId, 
        authProvider: "google",
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Food operations
  async getFoods(userId?: string, search?: string): Promise<Food[]> {
    const userIdNum = userId ? parseInt(userId) : undefined;
    if (userIdNum && search) {
      return await db.select().from(foods)
        .where(
          and(
            or(isNull(foods.userId), eq(foods.userId, userIdNum)),
            sql`LOWER(${foods.name}) LIKE LOWER(${'%' + search + '%'})`
          )
        )
        .orderBy(foods.name);
    } else if (userIdNum) {
      return await db.select().from(foods)
        .where(or(isNull(foods.userId), eq(foods.userId, userIdNum)))
        .orderBy(foods.name);
    } else if (search) {
      return await db.select().from(foods)
        .where(sql`LOWER(${foods.name}) LIKE LOWER(${'%' + search + '%'})`)
        .orderBy(foods.name);
    }
    
    return await db.select().from(foods).orderBy(foods.name);
  }

  async createFood(food: InsertFood): Promise<Food> {
    const [newFood] = await db.insert(foods).values(food).returning();
    return newFood;
  }

  async updateFood(id: number, food: Partial<InsertFood>): Promise<Food> {
    const [updatedFood] = await db
      .update(foods)
      .set(food)
      .where(eq(foods.id, id))
      .returning();
    return updatedFood;
  }

  async deleteFood(id: number): Promise<void> {
    await db.delete(foods).where(eq(foods.id, id));
  }

  // Meal Type operations
  async getMealTypes(userId?: string): Promise<MealType[]> {
    if (userId) {
      return db.select().from(mealTypes).where(
        sql`${mealTypes.isDefault} = true OR ${mealTypes.userId} = ${userId}`
      );
    }
    return db.select().from(mealTypes).where(eq(mealTypes.isDefault, true));
  }

  async createMealType(mealType: InsertMealType): Promise<MealType> {
    const [newMealType] = await db.insert(mealTypes).values(mealType).returning();
    return newMealType;
  }

  // Meal operations
  async getMeals(userId: string, date?: string): Promise<(Meal & { mealType: MealType; mealFoods: (MealFood & { food: Food })[] })[]> {
    let query = db
      .select({
        meal: meals,
        mealType: mealTypes,
        mealFood: mealFoods,
        food: foods,
      })
      .from(meals)
      .leftJoin(mealTypes, eq(meals.mealTypeId, mealTypes.id))
      .leftJoin(mealFoods, eq(meals.id, mealFoods.mealId))
      .leftJoin(foods, eq(mealFoods.foodId, foods.id))
      .where(eq(meals.userId, userId));

    if (date) {
      const baseConditions = [eq(meals.userId, userId), eq(meals.date, date)];
      query = db
        .select({
          meal: meals,
          mealType: mealTypes,
          mealFood: mealFoods,
          food: foods,
        })
        .from(meals)
        .leftJoin(mealTypes, eq(meals.mealTypeId, mealTypes.id))
        .leftJoin(mealFoods, eq(meals.id, mealFoods.mealId))
        .leftJoin(foods, eq(mealFoods.foodId, foods.id))
        .where(and(...baseConditions));
    }

    const results = await query.orderBy(desc(meals.createdAt));

    // Group results by meal
    const mealMap = new Map();
    
    results.forEach(row => {
      if (!mealMap.has(row.meal.id)) {
        mealMap.set(row.meal.id, {
          ...row.meal,
          mealType: row.mealType!,
          mealFoods: []
        });
      }
      
      if (row.mealFood && row.food) {
        mealMap.get(row.meal.id).mealFoods.push({
          ...row.mealFood,
          food: row.food
        });
      }
    });

    return Array.from(mealMap.values());
  }

  async createMeal(meal: InsertMeal): Promise<Meal> {
    const [newMeal] = await db.insert(meals).values(meal).returning();
    return newMeal;
  }

  async addFoodToMeal(mealFood: InsertMealFood): Promise<MealFood> {
    const [newMealFood] = await db.insert(mealFoods).values(mealFood).returning();
    
    // Update meal totals
    await this.updateMealTotals(mealFood.mealId);
    
    return newMealFood;
  }

  async removeFoodFromMeal(mealId: number, foodId: number): Promise<void> {
    await db.delete(mealFoods).where(
      and(eq(mealFoods.mealId, mealId), eq(mealFoods.foodId, foodId))
    );
    
    // Update meal totals
    await this.updateMealTotals(mealId);
  }

  async deleteMeal(id: number): Promise<void> {
    await db.delete(mealFoods).where(eq(mealFoods.mealId, id));
    await db.delete(meals).where(eq(meals.id, id));
  }

  private async updateMealTotals(mealId: number): Promise<void> {
    const mealFoodTotals = await db
      .select({
        totalCalories: sql<number>`COALESCE(SUM(CAST(${mealFoods.calories} AS NUMERIC)), 0)`,
        totalProtein: sql<number>`COALESCE(SUM(CAST(${mealFoods.protein} AS NUMERIC)), 0)`,
        totalCarbs: sql<number>`COALESCE(SUM(CAST(${mealFoods.carbs} AS NUMERIC)), 0)`,
        totalFat: sql<number>`COALESCE(SUM(CAST(${mealFoods.fat} AS NUMERIC)), 0)`,
      })
      .from(mealFoods)
      .where(eq(mealFoods.mealId, mealId));

    const totals = mealFoodTotals[0];
    
    await db
      .update(meals)
      .set({
        totalCalories: Math.round(Number(totals.totalCalories) || 0),
        totalProtein: (Number(totals.totalProtein) || 0).toFixed(1),
        totalCarbs: (Number(totals.totalCarbs) || 0).toFixed(1),
        totalFat: (Number(totals.totalFat) || 0).toFixed(1),
      })
      .where(eq(meals.id, mealId));
  }

  // Recipe operations
  async getRecipes(userId: string): Promise<(Recipe & { ingredients: (RecipeIngredient & { food: Food })[] })[]> {
    const results = await db
      .select({
        recipe: recipes,
        ingredient: recipeIngredients,
        food: foods,
      })
      .from(recipes)
      .leftJoin(recipeIngredients, eq(recipes.id, recipeIngredients.recipeId))
      .leftJoin(foods, eq(recipeIngredients.foodId, foods.id))
      .where(eq(recipes.userId, userId))
      .orderBy(desc(recipes.createdAt));

    // Group results by recipe
    const recipeMap = new Map();
    
    results.forEach(row => {
      if (!recipeMap.has(row.recipe.id)) {
        recipeMap.set(row.recipe.id, {
          ...row.recipe,
          ingredients: []
        });
      }
      
      if (row.ingredient && row.food) {
        recipeMap.get(row.recipe.id).ingredients.push({
          ...row.ingredient,
          food: row.food
        });
      }
    });

    return Array.from(recipeMap.values());
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [newRecipe] = await db.insert(recipes).values(recipe).returning();
    return newRecipe;
  }

  async addIngredientToRecipe(ingredient: InsertRecipeIngredient): Promise<RecipeIngredient> {
    const [newIngredient] = await db.insert(recipeIngredients).values(ingredient).returning();
    
    // Update recipe totals
    await this.updateRecipeTotals(ingredient.recipeId);
    
    return newIngredient;
  }

  async updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe> {
    const [updatedRecipe] = await db
      .update(recipes)
      .set({
        ...recipe,
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, id))
      .returning();
    return updatedRecipe;
  }

  async deleteRecipe(id: number): Promise<void> {
    await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  private async updateRecipeTotals(recipeId: number): Promise<void> {
    const ingredientTotals = await db
      .select({
        totalCalories: sql<number>`SUM((${foods.caloriesPer100g} * ${recipeIngredients.quantity}) / 100)`,
        totalProtein: sql<number>`SUM((${foods.proteinPer100g} * ${recipeIngredients.quantity}) / 100)`,
        totalCarbs: sql<number>`SUM((${foods.carbsPer100g} * ${recipeIngredients.quantity}) / 100)`,
        totalFat: sql<number>`SUM((${foods.fatPer100g} * ${recipeIngredients.quantity}) / 100)`,
      })
      .from(recipeIngredients)
      .leftJoin(foods, eq(recipeIngredients.foodId, foods.id))
      .where(eq(recipeIngredients.recipeId, recipeId));

    const totals = ingredientTotals[0];
    
    await db
      .update(recipes)
      .set({
        totalCalories: Math.round(totals.totalCalories || 0),
        totalProtein: totals.totalProtein?.toFixed(2) || "0",
        totalCarbs: totals.totalCarbs?.toFixed(2) || "0",
        totalFat: totals.totalFat?.toFixed(2) || "0",
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, recipeId));
  }

  // Daily Nutrition operations
  async getDailyNutrition(userId: string, date: string): Promise<DailyNutrition | undefined> {
    const [nutrition] = await db
      .select()
      .from(dailyNutrition)
      .where(and(eq(dailyNutrition.userId, userId), eq(dailyNutrition.date, date)));
    return nutrition;
  }

  async upsertDailyNutrition(nutrition: InsertDailyNutrition): Promise<DailyNutrition> {
    // Check if record exists
    const existing = await this.getDailyNutrition(nutrition.userId, nutrition.date);
    
    if (existing) {
      // Update existing record
      const [result] = await db
        .update(dailyNutrition)
        .set({
          ...nutrition,
          updatedAt: new Date(),
        })
        .where(and(eq(dailyNutrition.userId, nutrition.userId), eq(dailyNutrition.date, nutrition.date)))
        .returning();
      return result;
    } else {
      // Insert new record
      const [result] = await db
        .insert(dailyNutrition)
        .values(nutrition)
        .returning();
      return result;
    }
  }

  async getNutritionHistory(userId: string, startDate: string, endDate: string): Promise<DailyNutrition[]> {
    return db
      .select()
      .from(dailyNutrition)
      .where(
        and(
          eq(dailyNutrition.userId, userId),
          gte(dailyNutrition.date, startDate),
          lte(dailyNutrition.date, endDate)
        )
      )
      .orderBy(desc(dailyNutrition.date));
  }

  // Meal Plan operations
  async getActiveMealPlan(userId: string): Promise<MealPlan | undefined> {
    const [plan] = await db
      .select()
      .from(mealPlans)
      .where(and(eq(mealPlans.userId, userId), eq(mealPlans.isActive, true)))
      .orderBy(desc(mealPlans.createdAt));
    return plan;
  }

  async getActiveMealPlans(userId: string): Promise<MealPlan[]> {
    return db
      .select()
      .from(mealPlans)
      .where(and(eq(mealPlans.userId, userId), eq(mealPlans.isActive, true)))
      .orderBy(desc(mealPlans.createdAt));
  }

  async getMealPlanHistory(userId: string): Promise<MealPlan[]> {
    return db
      .select()
      .from(mealPlans)
      .where(and(eq(mealPlans.userId, userId), eq(mealPlans.isActive, false)))
      .orderBy(desc(mealPlans.createdAt));
  }

  async createMealPlan(mealPlan: InsertMealPlan & { type?: string }): Promise<MealPlan> {
    // First, deactivate any existing active plan of the same type
    if (mealPlan.isActive) {
      const planType = mealPlan.type || 'nutrition';
      await db
        .update(mealPlans)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(
          eq(mealPlans.userId, mealPlan.userId),
          eq(mealPlans.type, planType)
        ));
    }

    const [result] = await db
      .insert(mealPlans)
      .values(mealPlan)
      .returning();
    return result;
  }

  async updateMealPlan(id: number, mealPlan: Partial<InsertMealPlan>): Promise<MealPlan> {
    const [result] = await db
      .update(mealPlans)
      .set({
        ...mealPlan,
        updatedAt: new Date(),
      })
      .where(eq(mealPlans.id, id))
      .returning();
    return result;
  }

  async activateMealPlan(id: number, userId: string): Promise<MealPlan> {
    // First get the plan to activate to know its type
    const [planToActivate] = await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.id, id));
    
    if (!planToActivate) {
      throw new Error('Plan not found');
    }

    const planType = planToActivate.type || 'nutrition';

    // Deactivate all other plans of the same type for this user
    await db
      .update(mealPlans)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(mealPlans.userId, userId),
        eq(mealPlans.type, planType),
        sql`${mealPlans.id} != ${id}`
      ));

    // Activate the target plan
    const [result] = await db
      .update(mealPlans)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(mealPlans.id, id))
      .returning();
    
    return result;
  }

  async deleteMealPlan(id: number): Promise<void> {
    await db.delete(mealPlans).where(eq(mealPlans.id, id));
  }
}

export const storage = new DatabaseStorage();
