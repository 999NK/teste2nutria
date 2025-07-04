import {
  sqliteTable,
  text,
  integer,
  real,
  blob,
  index,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(), // JSON as text
    expire: integer("expire").notNull(), // Unix timestamp
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").unique().notNull(),
  password: text("password"), // null for Google login users
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  googleId: text("google_id").unique(), // for Google login
  authProvider: text("auth_provider").default("local"), // 'local' or 'google'
  weight: real("weight"),
  height: integer("height"),
  age: integer("age"),
  activityLevel: text("activity_level").default("moderate"),
  goal: text("goal").default("maintain"), // lose, gain, maintain
  dailyCalories: integer("daily_calories").default(2000),
  dailyProtein: integer("daily_protein").default(120),
  dailyCarbs: integer("daily_carbs").default(225),
  dailyFat: integer("daily_fat").default(67),
  notificationsEnabled: integer("notifications_enabled").default(1), // 1 = true, 0 = false
  isProfileComplete: integer("is_profile_complete").default(0), // 1 = true, 0 = false
  createdAt: integer("created_at").default(Date.now()),
  updatedAt: integer("updated_at").default(Date.now()),
});

export const foods = sqliteTable("foods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  usdaFdcId: integer("usda_fdc_id").unique(), // USDA Food Data Central ID
  name: text("name").notNull(),
  brand: text("brand"),
  category: text("category"),
  caloriesPer100g: real("calories_per_100g").notNull(),
  proteinPer100g: real("protein_per_100g").notNull(),
  carbsPer100g: real("carbs_per_100g").notNull(),
  fatPer100g: real("fat_per_100g").notNull(),
  fiberPer100g: real("fiber_per_100g").default(0),
  sugarPer100g: real("sugar_per_100g").default(0),
  sodiumPer100g: real("sodium_per_100g").default(0),
  isCustom: integer("is_custom").default(0), // 1 = true, 0 = false
  userId: integer("user_id").references(() => users.id),
  createdAt: integer("created_at").default(Date.now()),
});

export const mealTypes = sqliteTable("meal_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  icon: text("icon"),
  isDefault: integer("is_default").default(0), // 1 = true, 0 = false
  userId: integer("user_id").references(() => users.id),
});

export const meals = sqliteTable("meals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  mealTypeId: integer("meal_type_id").references(() => mealTypes.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  name: text("name"),
  totalCalories: integer("total_calories").default(0),
  totalProtein: real("total_protein").default(0),
  totalCarbs: real("total_carbs").default(0),
  totalFat: real("total_fat").default(0),
  createdAt: integer("created_at").default(Date.now()),
});

export const mealFoods = sqliteTable("meal_foods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mealId: integer("meal_id").references(() => meals.id).notNull(),
  foodId: integer("food_id").references(() => foods.id).notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").default("g"), // g, ml, units, spoons, cups
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
});

export const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  servings: integer("servings").default(1),
  totalCalories: integer("total_calories").default(0),
  totalProtein: real("total_protein").default(0),
  totalCarbs: real("total_carbs").default(0),
  totalFat: real("total_fat").default(0),
  isFavorite: integer("is_favorite").default(0), // 1 = true, 0 = false
  createdAt: integer("created_at").default(Date.now()),
  updatedAt: integer("updated_at").default(Date.now()),
});

export const recipeIngredients = sqliteTable("recipe_ingredients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  foodId: integer("food_id").references(() => foods.id).notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").default("g"),
});

export const dailyNutrition = sqliteTable("daily_nutrition", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  totalCalories: integer("total_calories").default(0),
  totalProtein: real("total_protein").default(0),
  totalCarbs: real("total_carbs").default(0),
  totalFat: real("total_fat").default(0),
  goalCalories: integer("goal_calories"),
  goalProtein: integer("goal_protein"),
  goalCarbs: integer("goal_carbs"),
  goalFat: integer("goal_fat"),
  updatedAt: integer("updated_at").default(Date.now()),
});

export const userPlans = sqliteTable("user_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'diet', 'workout', 'combined'
  content: text("content").notNull(), // JSON string
  dailyCalories: integer("daily_calories"),
  macroCarbs: integer("macro_carbs"), // percentage
  macroProtein: integer("macro_protein"), // percentage
  macroFat: integer("macro_fat"), // percentage
  isActive: integer("is_active").default(0), // 1 = true, 0 = false
  isCustom: integer("is_custom").default(0), // 1 = true, 0 = false
  createdAt: integer("created_at").default(Date.now()),
  updatedAt: integer("updated_at").default(Date.now()),
});

export const dailyProgress = sqliteTable("daily_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => userPlans.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  dietCompleted: integer("diet_completed").default(0), // 1 = true, 0 = false
  workoutCompleted: integer("workout_completed").default(0), // 1 = true, 0 = false
  notes: text("notes"),
  createdAt: integer("created_at").default(Date.now()),
});

// Keep meal_plans for backward compatibility
export const mealPlans = sqliteTable("meal_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  meals: text("meals"), // JSON string
  dailyCalories: integer("daily_calories").default(0),
  macroCarbs: integer("macro_carbs").default(0),
  macroProtein: integer("macro_protein").default(0),
  macroFat: integer("macro_fat").default(0),
  isActive: integer("is_active").default(0), // 1 = true, 0 = false
  type: text("type").default("nutrition"), // "nutrition" or "workout"
  createdAt: integer("created_at").default(Date.now()),
  updatedAt: integer("updated_at").default(Date.now()),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  foods: many(foods),
  meals: many(meals),
  recipes: many(recipes),
  mealTypes: many(mealTypes),
  dailyNutrition: many(dailyNutrition),
  mealPlans: many(mealPlans),
  userPlans: many(userPlans),
  dailyProgress: many(dailyProgress),
}));

export const foodsRelations = relations(foods, ({ one, many }) => ({
  user: one(users, { fields: [foods.userId], references: [users.id] }),
  mealFoods: many(mealFoods),
  recipeIngredients: many(recipeIngredients),
}));

export const mealTypesRelations = relations(mealTypes, ({ one, many }) => ({
  user: one(users, { fields: [mealTypes.userId], references: [users.id] }),
  meals: many(meals),
}));

export const mealsRelations = relations(meals, ({ one, many }) => ({
  user: one(users, { fields: [meals.userId], references: [users.id] }),
  mealType: one(mealTypes, { fields: [meals.mealTypeId], references: [mealTypes.id] }),
  mealFoods: many(mealFoods),
}));

export const mealFoodsRelations = relations(mealFoods, ({ one }) => ({
  meal: one(meals, { fields: [mealFoods.mealId], references: [meals.id] }),
  food: one(foods, { fields: [mealFoods.foodId], references: [foods.id] }),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  user: one(users, { fields: [recipes.userId], references: [users.id] }),
  ingredients: many(recipeIngredients),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeIngredients.recipeId], references: [recipes.id] }),
  food: one(foods, { fields: [recipeIngredients.foodId], references: [foods.id] }),
}));

export const dailyNutritionRelations = relations(dailyNutrition, ({ one }) => ({
  user: one(users, { fields: [dailyNutrition.userId], references: [users.id] }),
}));

export const mealPlansRelations = relations(mealPlans, ({ one }) => ({
  user: one(users, { fields: [mealPlans.userId], references: [users.id] }),
}));

export const userPlansRelations = relations(userPlans, ({ one, many }) => ({
  user: one(users, { fields: [userPlans.userId], references: [users.id] }),
  dailyProgress: many(dailyProgress),
}));

export const dailyProgressRelations = relations(dailyProgress, ({ one }) => ({
  user: one(users, { fields: [dailyProgress.userId], references: [users.id] }),
  plan: one(userPlans, { fields: [dailyProgress.planId], references: [userPlans.id] }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertFoodSchema = createInsertSchema(foods).omit({
  id: true,
  createdAt: true,
});

export const insertMealTypeSchema = createInsertSchema(mealTypes).omit({
  id: true,
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
  createdAt: true,
});

export const insertMealFoodSchema = createInsertSchema(mealFoods).omit({
  id: true,
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({
  id: true,
});

export const insertDailyNutritionSchema = createInsertSchema(dailyNutrition).omit({
  id: true,
  updatedAt: true,
});

export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPlanSchema = createInsertSchema(userPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyProgressSchema = createInsertSchema(dailyProgress).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Food = typeof foods.$inferSelect;
export type InsertFood = z.infer<typeof insertFoodSchema>;
export type MealType = typeof mealTypes.$inferSelect;
export type InsertMealType = z.infer<typeof insertMealTypeSchema>;
export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type MealFood = typeof mealFoods.$inferSelect;
export type InsertMealFood = z.infer<typeof insertMealFoodSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;
export type DailyNutrition = typeof dailyNutrition.$inferSelect;
export type InsertDailyNutrition = z.infer<typeof insertDailyNutritionSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type UserPlan = typeof userPlans.$inferSelect;
export type InsertUserPlan = z.infer<typeof insertUserPlanSchema>;
export type DailyProgress = typeof dailyProgress.$inferSelect;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;