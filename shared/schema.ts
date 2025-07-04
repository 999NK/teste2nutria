import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  json,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // null for Google login users
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  googleId: varchar("google_id").unique(), // for Google login
  authProvider: varchar("auth_provider").default("local"), // 'local' or 'google'
  weight: decimal("weight", { precision: 5, scale: 2 }),
  height: integer("height"),
  age: integer("age"),
  activityLevel: varchar("activity_level").default("moderate"),
  goal: varchar("goal").default("maintain"), // lose, gain, maintain
  dailyCalories: integer("daily_calories").default(2000),
  dailyProtein: integer("daily_protein").default(120),
  dailyCarbs: integer("daily_carbs").default(225),
  dailyFat: integer("daily_fat").default(67),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  isProfileComplete: boolean("is_profile_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const foods = pgTable("foods", {
  id: serial("id").primaryKey(),
  usdaFdcId: integer("usda_fdc_id").unique(), // USDA Food Data Central ID
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 255 }),
  category: varchar("category", { length: 255 }),
  caloriesPer100g: decimal("calories_per_100g", { precision: 7, scale: 2 }).notNull(),
  proteinPer100g: decimal("protein_per_100g", { precision: 7, scale: 2 }).notNull(),
  carbsPer100g: decimal("carbs_per_100g", { precision: 7, scale: 2 }).notNull(),
  fatPer100g: decimal("fat_per_100g", { precision: 7, scale: 2 }).notNull(),
  fiberPer100g: decimal("fiber_per_100g", { precision: 7, scale: 2 }).default("0"),
  sugarPer100g: decimal("sugar_per_100g", { precision: 7, scale: 2 }).default("0"),
  sodiumPer100g: decimal("sodium_per_100g", { precision: 7, scale: 2 }).default("0"),
  isCustom: boolean("is_custom").default(false),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mealTypes = pgTable("meal_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  isDefault: boolean("is_default").default(false),
  userId: integer("user_id").references(() => users.id),
});

export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  mealTypeId: integer("meal_type_id").references(() => mealTypes.id).notNull(),
  date: date("date").notNull(),
  name: varchar("name", { length: 255 }),
  totalCalories: integer("total_calories").default(0),
  totalProtein: decimal("total_protein", { precision: 5, scale: 2 }).default("0"),
  totalCarbs: decimal("total_carbs", { precision: 5, scale: 2 }).default("0"),
  totalFat: decimal("total_fat", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mealFoods = pgTable("meal_foods", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id").references(() => meals.id, { onDelete: "cascade" }).notNull(),
  foodId: integer("food_id").references(() => foods.id, { onDelete: "cascade" }).notNull(),
  quantity: decimal("quantity", { precision: 8, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("g"), // g, ml, units, spoons, cups
  calories: decimal("calories", { precision: 7, scale: 2 }).notNull(),
  protein: decimal("protein", { precision: 7, scale: 2 }).notNull(),
  carbs: decimal("carbs", { precision: 7, scale: 2 }).notNull(),
  fat: decimal("fat", { precision: 7, scale: 2 }).notNull(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  servings: integer("servings").default(1),
  totalCalories: integer("total_calories").default(0),
  totalProtein: decimal("total_protein", { precision: 5, scale: 2 }).default("0"),
  totalCarbs: decimal("total_carbs", { precision: 5, scale: 2 }).default("0"),
  totalFat: decimal("total_fat", { precision: 5, scale: 2 }).default("0"),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  foodId: integer("food_id").references(() => foods.id).notNull(),
  quantity: decimal("quantity", { precision: 8, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("g"),
});

export const dailyNutrition = pgTable("daily_nutrition", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  totalCalories: integer("total_calories").default(0),
  totalProtein: decimal("total_protein", { precision: 5, scale: 2 }).default("0"),
  totalCarbs: decimal("total_carbs", { precision: 5, scale: 2 }).default("0"),
  totalFat: decimal("total_fat", { precision: 5, scale: 2 }).default("0"),
  goalCalories: integer("goal_calories"),
  goalProtein: integer("goal_protein"),
  goalCarbs: integer("goal_carbs"),
  goalFat: integer("goal_fat"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPlans = pgTable("user_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  type: varchar("type").notNull(), // 'diet', 'workout', 'combined'
  content: jsonb("content").notNull(), // Diet/workout structure
  dailyCalories: integer("daily_calories"),
  macroCarbs: integer("macro_carbs"), // percentage
  macroProtein: integer("macro_protein"), // percentage
  macroFat: integer("macro_fat"), // percentage
  isActive: boolean("is_active").default(false),
  isCustom: boolean("is_custom").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dailyProgress = pgTable("daily_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => userPlans.id),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  dietCompleted: boolean("diet_completed").default(false),
  workoutCompleted: boolean("workout_completed").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Keep meal_plans for backward compatibility
export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  meals: jsonb("meals"), // JSON structure with daily meal plans
  dailyCalories: integer("daily_calories").default(0),
  macroCarbs: integer("macro_carbs").default(0),
  macroProtein: integer("macro_protein").default(0),
  macroFat: integer("macro_fat").default(0),
  isActive: boolean("is_active").default(false),
  type: varchar("type", { length: 20 }).default("nutrition"), // "nutrition" or "workout"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
