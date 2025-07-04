import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage_temp";
import { setupAuth, isAuthenticated } from "./auth";
import { insertFoodSchema, insertMealTypeSchema, insertMealSchema, insertMealFoodSchema, insertRecipeSchema, insertRecipeIngredientSchema, meals, mealTypes } from "@shared/schema";
import { aiService } from "./services/aiService";
import { pdfService } from "./services/pdfService";
import { notificationService } from "./services/notificationService";
import { db } from "./db";
import { eq, and, sql, gte, lt } from "drizzle-orm";
import { z } from "zod";

// Chat history types and storage
type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

const chatHistory = new Map<string, ChatMessage[]>();

function getUserChatHistory(userId: string): ChatMessage[] {
  return chatHistory.get(userId) || [];
}

function addToChatHistory(userId: string, role: 'user' | 'model', content: string): void {
  const userHistory = getUserChatHistory(userId);
  userHistory.push({ role, content });
  
  // Keep only last 20 messages to prevent token limit issues
  if (userHistory.length > 20) {
    userHistory.splice(0, userHistory.length - 20);
  }
  
  chatHistory.set(userId, userHistory);
}

// Utility functions for nutritional day calculation (5AM to 5AM)
function getNutritionalDay(date: Date): string {
  const nutritionalDate = new Date(date);
  
  // If it's before 5 AM, it belongs to the previous day
  if (date.getHours() < 5) {
    nutritionalDate.setDate(nutritionalDate.getDate() - 1);
  }
  
  return nutritionalDate.toISOString().split('T')[0];
}

function getNutritionalDayRange(dateString: string): { start: Date, end: Date } {
  const baseDate = new Date(dateString + 'T00:00:00Z');
  
  // Start at 5 AM of the given date
  const start = new Date(baseDate);
  start.setUTCHours(5, 0, 0, 0);
  
  // End at 5 AM of the next date  
  const end = new Date(baseDate);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCHours(5, 0, 0, 0);
  
  return { start, end };
}

function generateNutritionResponse(message: string): string {
  const lowerMessage = message.toLowerCase().trim();
  
  // Greetings and casual conversation
  if (lowerMessage.includes('oi') || lowerMessage.includes('olá') || lowerMessage.includes('boa tarde') || 
      lowerMessage.includes('bom dia') || lowerMessage.includes('boa noite') || lowerMessage.includes('e aí') ||
      lowerMessage === 'oi' || lowerMessage === 'olá' || lowerMessage === 'hello' || lowerMessage === 'hi') {
    return `Olá! Como vai? Sou seu assistente nutricional e estou aqui para ajudar com suas dúvidas sobre alimentação saudável. No que posso te auxiliar hoje? Posso sugerir receitas, explicar sobre nutrientes, dar dicas de substituições ou qualquer outra questão nutricional!`;
  }
  
  // Protein-related questions
  if (lowerMessage.includes('proteína') || lowerMessage.includes('protein')) {
    return `Excelente pergunta sobre proteína! As melhores fontes incluem: frango, peixe, ovos, feijões, lentilhas, quinoa e iogurte grego. Distribua o consumo ao longo do dia (20-30g por refeição) para melhor absorção. Qual é seu objetivo com a proteína?`;
  }
  
  // Sugar substitution
  if (lowerMessage.includes('açúcar') || lowerMessage.includes('substituir') || lowerMessage.includes('doce')) {
    return `Ótima iniciativa reduzir o açúcar! Alternativas naturais: banana amassada, tâmaras, mel, xilitol, stevia. Use frutas secas em receitas e experimente chocolate 70%+ cacau. Reduza gradualmente para adaptar o paladar.`;
  }
  
  // Water intake
  if (lowerMessage.includes('água') || lowerMessage.includes('hidrat')) {
    return `A hidratação é fundamental! Recomendação: 35ml por kg de peso corporal (pessoa de 70kg = 2,5L/dia). Beba um copo ao acordar, mantenha garrafa sempre à vista. Sinais de boa hidratação: urina amarelo claro e energia estável.`;
  }
  
  // Healthy snacks
  if (lowerMessage.includes('lanche') || lowerMessage.includes('snack') || lowerMessage.includes('beliscar')) {
    return `Lanches saudáveis essenciais! Opções: mix de oleaginosas, maçã com pasta de amendoim, vegetais com húmus, iogurte grego com frutas. Para levar: barrinhas caseiras de aveia, ovos cozidos. Timing ideal: a cada 3-4 horas.`;
  }
  
  // Weight loss
  if (lowerMessage.includes('emagrec') || lowerMessage.includes('peso') || lowerMessage.includes('dieta')) {
    return `Perda de peso saudável: déficit calórico moderado (300-500 kcal), alimentos integrais, hidratação, exercícios. Prato ideal: 50% vegetais, 25% proteína, 25% carboidratos complexos. Evite dietas extremas. Ritmo saudável: 0,5-1kg/semana.`;
  }
  
  // General nutrition
  if (lowerMessage.includes('alimentação') || lowerMessage.includes('nutrição') || lowerMessage.includes('saudável')) {
    return `Alimentação equilibrada: variedade de cores no prato, 5-6 refeições menores, alimentos minimamente processados, água como bebida principal. Estrutura: café da manhã com proteína + carboidrato + fruta. Cozinhe mais em casa e leia rótulos.`;
  }
  
  // Default response
  return `Sou especializado em orientações nutricionais. Posso ajudar com planejamento alimentar, informações nutricionais, dicas práticas e sugestões de receitas. Poderia ser mais específico? Ex: "Como aumentar proteína?", "Substitutos para doces", "Lanches para trabalho". Para orientações médicas, consulte um profissional.`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize default meal types
  const initializeMealTypes = async () => {
    const defaultMealTypes = [
      { name: "Café da Manhã", icon: "coffee", isDefault: true },
      { name: "Almoço", icon: "utensils", isDefault: true },
      { name: "Lanche", icon: "cookie-bite", isDefault: true },
      { name: "Jantar", icon: "bowl-food", isDefault: true },
      { name: "Ceia", icon: "moon", isDefault: true },
    ];

    // Check if meal types already exist
    const existingMealTypes = await storage.getMealTypes();
    if (existingMealTypes.length === 0) {
      for (const mealType of defaultMealTypes) {
        try {
          await storage.createMealType(mealType);
        } catch (error) {
          console.error("Error creating meal type:", error);
        }
      }
    }
  };
  
  await initializeMealTypes();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.patch('/api/user/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updateSchema = z.object({
        weight: z.number().min(30).max(300).optional(),
        height: z.number().min(100).max(250).optional(),
        age: z.number().min(13).max(120).optional(),
        goal: z.enum(["lose", "gain", "maintain"]).optional(),
        activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional(),
        dailyCalories: z.number().min(1200).max(5000),
        dailyProtein: z.number().min(50).max(300),
        dailyCarbs: z.number().min(100).max(600),
        dailyFat: z.number().min(20).max(200),
        isProfileComplete: z.boolean().optional(),
      });

      const updateData = updateSchema.parse(req.body);
      const user = await storage.updateUserGoals(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(400).json({ message: "Invalid profile data" });
    }
  });

  // Food routes
  app.get('/api/foods', async (req, res) => {
    try {
      const search = req.query.search as string;
      const userId = req.isAuthenticated() ? (req.user as any).id : undefined;
      const foods = await storage.getFoods(userId, search);
      res.json(foods);
    } catch (error) {
      console.error("Error fetching foods:", error);
      res.status(500).json({ message: "Failed to fetch foods" });
    }
  });

  // USDA food search
  app.get('/api/foods/search', async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string' || query.trim().length < 3) {
        return res.status(400).json({ message: "Search query must be at least 3 characters" });
      }
      
      const { usdaFoodService } = await import("./services/usdaFoodService");
      const foods = await usdaFoodService.searchFoods(query.trim());
      res.json(foods);
    } catch (error) {
      console.error("Error searching USDA foods:", error);
      res.status(500).json({ message: "Failed to search foods" });
    }
  });

  // Add USDA food to user's foods
  app.post('/api/foods/from-usda', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { usdaFood } = req.body;
      
      const foodData = {
        name: usdaFood.name,
        brand: usdaFood.brand,
        category: usdaFood.category,
        usdaFdcId: usdaFood.usdaFdcId,
        caloriesPer100g: usdaFood.caloriesPer100g,
        proteinPer100g: usdaFood.proteinPer100g,
        carbsPer100g: usdaFood.carbsPer100g,
        fatPer100g: usdaFood.fatPer100g,
        fiberPer100g: usdaFood.fiberPer100g,
        sugarPer100g: usdaFood.sugarPer100g,
        sodiumPer100g: usdaFood.sodiumPer100g,
        userId,
        isCustom: false,
      };
      
      const food = await storage.createFood(foodData);
      res.json(food);
    } catch (error) {
      console.error("Error adding USDA food:", error);
      res.status(400).json({ message: "Failed to add food" });
    }
  });

  app.post('/api/foods', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const foodData = insertFoodSchema.parse({ ...req.body, userId });
      const food = await storage.createFood(foodData);
      res.json(food);
    } catch (error) {
      console.error("Error creating food:", error);
      res.status(400).json({ message: "Invalid food data" });
    }
  });

  // Meal Type routes
  app.get('/api/meal-types', async (req, res) => {
    try {
      const userId = req.isAuthenticated() ? (req.user as any).id : undefined;
      const mealTypes = await storage.getMealTypes(userId);
      res.json(mealTypes);
    } catch (error) {
      console.error("Error fetching meal types:", error);
      res.status(500).json({ message: "Failed to fetch meal types" });
    }
  });

  app.post('/api/meal-types', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const mealTypeData = insertMealTypeSchema.parse({ ...req.body, userId });
      const mealType = await storage.createMealType(mealTypeData);
      res.json(mealType);
    } catch (error) {
      console.error("Error creating meal type:", error);
      res.status(400).json({ message: "Invalid meal type data" });
    }
  });

  // Meal routes
  app.get('/api/meals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const date = req.query.date as string;
      const meals = await storage.getMeals(userId, date);
      res.json(meals);
    } catch (error) {
      console.error("Error fetching meals:", error);
      res.status(500).json({ message: "Failed to fetch meals" });
    }
  });

  app.post('/api/meals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const mealData = insertMealSchema.parse({ ...req.body, userId });
      const meal = await storage.createMeal(mealData);
      res.json(meal);
    } catch (error) {
      console.error("Error creating meal:", error);
      res.status(400).json({ message: "Invalid meal data" });
    }
  });

  app.post('/api/meals/:mealId/foods', isAuthenticated, async (req: any, res) => {
    try {
      const { mealId } = req.params;
      const userId = req.user.id;
      let foodId = req.body.foodId;

      // If foodId is from AI analysis or USDA (large number), create a proper food record first
      if (!foodId || foodId > 2147483647 || typeof foodId === 'string') {
        const foodData = {
          userId,
          name: req.body.name || 'Alimento Personalizado',
          brand: req.body.brand || null,
          category: req.body.category || 'Personalizado',
          caloriesPer100g: (parseFloat(req.body.caloriesPer100g) || (parseFloat(req.body.calories) / parseFloat(req.body.quantity)) * 100).toString(),
          proteinPer100g: (parseFloat(req.body.proteinPer100g) || (parseFloat(req.body.protein) / parseFloat(req.body.quantity)) * 100).toString(),
          carbsPer100g: (parseFloat(req.body.carbsPer100g) || (parseFloat(req.body.carbs) / parseFloat(req.body.quantity)) * 100).toString(),
          fatPer100g: (parseFloat(req.body.fatPer100g) || (parseFloat(req.body.fat) / parseFloat(req.body.quantity)) * 100).toString(),
          fiberPer100g: (parseFloat(req.body.fiberPer100g) || 0).toString(),
          sugarPer100g: (parseFloat(req.body.sugarPer100g) || 0).toString(),
          sodiumPer100g: (parseFloat(req.body.sodiumPer100g) || 0).toString(),
          usdaFdcId: req.body.usdaFdcId || null,
        };

        const newFood = await storage.createFood(foodData);
        foodId = newFood.id;
      }
      
      // Create meal food record
      const mealFoodData = {
        mealId: parseInt(mealId),
        foodId: parseInt(foodId),
        quantity: req.body.quantity.toString(),
        unit: req.body.unit,
        calories: req.body.calories.toString(),
        protein: req.body.protein.toString(),
        carbs: req.body.carbs.toString(),
        fat: req.body.fat.toString(),
      };
      
      const mealFood = await storage.addFoodToMeal(mealFoodData);
      res.json(mealFood);
    } catch (error) {
      console.error("Error adding food to meal:", error);
      res.status(400).json({ message: "Invalid meal food data" });
    }
  });

  app.delete('/api/meals/:mealId/foods/:foodId', isAuthenticated, async (req: any, res) => {
    try {
      const { mealId, foodId } = req.params;
      await storage.removeFoodFromMeal(parseInt(mealId), parseInt(foodId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing food from meal:", error);
      res.status(500).json({ message: "Failed to remove food from meal" });
    }
  });

  app.delete('/api/meals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMeal(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting meal:", error);
      res.status(500).json({ message: "Failed to delete meal" });
    }
  });

  // Recipe routes
  app.get('/api/recipes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const recipes = await storage.getRecipes(userId);
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.post('/api/recipes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const recipeData = insertRecipeSchema.parse({ ...req.body, userId });
      const recipe = await storage.createRecipe(recipeData);
      res.json(recipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      res.status(400).json({ message: "Invalid recipe data" });
    }
  });

  app.post('/api/recipes/:recipeId/ingredients', isAuthenticated, async (req: any, res) => {
    try {
      const { recipeId } = req.params;
      const ingredientData = insertRecipeIngredientSchema.parse({ ...req.body, recipeId: parseInt(recipeId) });
      const ingredient = await storage.addIngredientToRecipe(ingredientData);
      res.json(ingredient);
    } catch (error) {
      console.error("Error adding ingredient to recipe:", error);
      res.status(400).json({ message: "Invalid ingredient data" });
    }
  });

  app.delete('/api/recipes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRecipe(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // Daily Nutrition routes
  app.get('/api/nutrition/daily', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requestedDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
      
      // Get the nutritional day range (5AM to 5AM)
      const { start, end } = getNutritionalDayRange(requestedDate);
      
      // Get all meals within the nutritional day range
      const dayMeals = await db
        .select({
          id: meals.id,
          totalCalories: meals.totalCalories,
          totalProtein: meals.totalProtein,
          totalCarbs: meals.totalCarbs,
          totalFat: meals.totalFat,
          createdAt: meals.createdAt
        })
        .from(meals)
        .where(
          and(
            eq(meals.userId, userId),
            gte(meals.createdAt, start),
            lt(meals.createdAt, end)
          )
        );
      
      // Calculate total nutrition from all meals in the nutritional day
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      
      for (const meal of dayMeals) {
        totalCalories += parseFloat(meal.totalCalories?.toString() || "0");
        totalProtein += parseFloat(meal.totalProtein?.toString() || "0");
        totalCarbs += parseFloat(meal.totalCarbs?.toString() || "0");
        totalFat += parseFloat(meal.totalFat?.toString() || "0");
      }
      
      const nutrition = {
        date: requestedDate,
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat),
      };
      
      // Save to daily nutrition table for historical tracking
      try {
        await storage.upsertDailyNutrition({
          userId,
          date: requestedDate,
          totalCalories: nutrition.calories,
          totalProtein: nutrition.protein.toString(),
          totalCarbs: nutrition.carbs.toString(),
          totalFat: nutrition.fat.toString(),
        });
      } catch (upsertError) {
        console.error("Error saving daily nutrition:", upsertError);
      }
      
      res.json(nutrition);
    } catch (error) {
      console.error("Error calculating daily nutrition:", error);
      res.status(500).json({ message: "Failed to calculate daily nutrition" });
    }
  });

  app.get('/api/nutrition/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const period = (req.query.period as string) || 'week';
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      
      let startDate: string;
      let endDate: string;
      
      const baseDate = new Date(date);
      
      switch (period) {
        case 'day':
          startDate = date;
          endDate = date;
          break;
        case 'week':
          const weekStart = new Date(baseDate);
          weekStart.setDate(baseDate.getDate() - baseDate.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          startDate = weekStart.toISOString().split('T')[0];
          endDate = weekEnd.toISOString().split('T')[0];
          break;
        case 'month':
          const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
          const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
          startDate = monthStart.toISOString().split('T')[0];
          endDate = monthEnd.toISOString().split('T')[0];
          break;
        default:
          startDate = date;
          endDate = date;
      }

      const history = await storage.getNutritionHistory(userId, startDate, endDate);
      res.json({ period, startDate, endDate, data: history });
    } catch (error) {
      console.error("Error fetching nutrition history:", error);
      res.status(500).json({ message: "Failed to fetch nutrition history" });
    }
  });

  // Real-time progress tracking endpoints
  app.get('/api/progress/hourly', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      
      // Get the nutritional day range (5AM to 5AM)
      const { start, end } = getNutritionalDayRange(date);
      
      // Get meals within the nutritional day range
      const dayMeals = await db
        .select({
          id: meals.id,
          mealTypeId: meals.mealTypeId,
          totalCalories: meals.totalCalories,
          totalProtein: meals.totalProtein,
          totalCarbs: meals.totalCarbs,
          totalFat: meals.totalFat,
          createdAt: meals.createdAt,
          mealType: {
            name: mealTypes.name,
            icon: mealTypes.icon
          }
        })
        .from(meals)
        .leftJoin(mealTypes, eq(meals.mealTypeId, mealTypes.id))
        .where(
          and(
            eq(meals.userId, userId),
            gte(meals.createdAt, start),
            lt(meals.createdAt, end)
          )
        )
        .orderBy(meals.createdAt);

      // Group by hour (adjusted for nutritional day)
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        meals: [] as any[]
      }));

      dayMeals.forEach(meal => {
        if (meal.createdAt) {
          const mealDate = new Date(meal.createdAt);
          const hour = mealDate.getHours();
          hourlyData[hour].calories += parseFloat(meal.totalCalories?.toString() || "0");
          hourlyData[hour].protein += parseFloat(meal.totalProtein?.toString() || "0");
          hourlyData[hour].carbs += parseFloat(meal.totalCarbs?.toString() || "0");
          hourlyData[hour].fat += parseFloat(meal.totalFat?.toString() || "0");
          hourlyData[hour].meals.push({
            id: meal.id,
            type: meal.mealType?.name,
            icon: meal.mealType?.icon,
            calories: meal.totalCalories
          });
        }
      });

      res.json(hourlyData);
    } catch (error) {
      console.error("Error fetching hourly progress:", error);
      res.status(500).json({ message: "Failed to fetch hourly progress" });
    }
  });

  app.get('/api/progress/weekly', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      
      const baseDate = new Date(date);
      const weekStart = new Date(baseDate);
      weekStart.setDate(baseDate.getDate() - baseDate.getDay());
      
      const weeklyData = [];
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Get nutritional day range (5AM to 5AM)
        const { start, end } = getNutritionalDayRange(dateStr);
        
        const dayMeals = await db
          .select({
            totalCalories: sql<number>`COALESCE(SUM(${meals.totalCalories}), 0)`,
            totalProtein: sql<number>`COALESCE(SUM(CAST(${meals.totalProtein} AS NUMERIC)), 0)`,
            totalCarbs: sql<number>`COALESCE(SUM(CAST(${meals.totalCarbs} AS NUMERIC)), 0)`,
            totalFat: sql<number>`COALESCE(SUM(CAST(${meals.totalFat} AS NUMERIC)), 0)`,
            mealCount: sql<number>`COUNT(${meals.id})`
          })
          .from(meals)
          .where(
            and(
              eq(meals.userId, userId),
              gte(meals.createdAt, start),
              lt(meals.createdAt, end)
            )
          );

        weeklyData.push({
          date: dateStr,
          dayName: currentDate.toLocaleDateString('pt-BR', { weekday: 'short' }),
          calories: dayMeals[0].totalCalories,
          protein: Math.round(dayMeals[0].totalProtein),
          carbs: Math.round(dayMeals[0].totalCarbs),
          fat: Math.round(dayMeals[0].totalFat),
          mealCount: dayMeals[0].mealCount
        });
      }

      res.json(weeklyData);
    } catch (error) {
      console.error("Error fetching weekly progress:", error);
      res.status(500).json({ message: "Failed to fetch weekly progress" });
    }
  });

  app.get('/api/progress/monthly', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      
      const baseDate = new Date(date);
      const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
      
      const monthlyData = [];
      
      // Group by weeks within the month
      let currentWeekStart = new Date(monthStart);
      currentWeekStart.setDate(monthStart.getDate() - monthStart.getDay());
      
      while (currentWeekStart <= monthEnd) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);
        
        const weekStartStr = currentWeekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];
        
        const weekMeals = await db
          .select({
            totalCalories: sql<number>`COALESCE(SUM(${meals.totalCalories}), 0)`,
            totalProtein: sql<number>`COALESCE(SUM(CAST(${meals.totalProtein} AS NUMERIC)), 0)`,
            totalCarbs: sql<number>`COALESCE(SUM(CAST(${meals.totalCarbs} AS NUMERIC)), 0)`,
            totalFat: sql<number>`COALESCE(SUM(CAST(${meals.totalFat} AS NUMERIC)), 0)`,
            mealCount: sql<number>`COUNT(${meals.id})`
          })
          .from(meals)
          .where(
            and(
              eq(meals.userId, userId),
              sql`${meals.date} >= ${weekStartStr}`,
              sql`${meals.date} <= ${weekEndStr}`
            )
          );

        monthlyData.push({
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          calories: weekMeals[0].totalCalories,
          protein: Math.round(weekMeals[0].totalProtein),
          carbs: Math.round(weekMeals[0].totalCarbs),
          fat: Math.round(weekMeals[0].totalFat),
          mealCount: weekMeals[0].mealCount
        });
        
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }

      res.json(monthlyData);
    } catch (error) {
      console.error("Error fetching monthly progress:", error);
      res.status(500).json({ message: "Failed to fetch monthly progress" });
    }
  });

  // AI routes
  app.post('/api/ai/analyze-meal', isAuthenticated, async (req: any, res) => {
    try {
      const { description } = req.body;
      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }

      const analysis = await aiService.analyzeMealDescription(description);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing meal:", error);
      res.status(500).json({ message: "Failed to analyze meal description" });
    }
  });

  app.post('/api/ai/suggest-recipes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { availableIngredients } = req.body;
      
      const suggestions = await aiService.suggestRecipes(availableIngredients);
      res.json(suggestions);
    } catch (error) {
      console.error("Error suggesting recipes:", error);
      res.status(500).json({ message: "Failed to suggest recipes" });
    }
  });

  // Personalized recipe recommendations based on nutrition goals
  app.post('/api/ai/personalized-recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { availableIngredients } = req.body;
      
      // Get user's nutrition goals
      const user = await storage.getUser(userId);
      if (!user || !user.isProfileComplete) {
        return res.status(400).json({ message: "Complete your profile to get personalized recommendations" });
      }

      // Get current daily nutrition
      const today = getNutritionalDay(new Date());
      const currentNutrition = await storage.getDailyNutrition(userId, today);
      
      const nutritionGoals = {
        dailyCalories: user.dailyCalories || 2000,
        dailyProtein: user.dailyProtein || 150,
        dailyCarbs: user.dailyCarbs || 250,
        dailyFat: user.dailyFat || 67
      };

      const currentValues = {
        calories: currentNutrition?.totalCalories || 0,
        protein: parseFloat(currentNutrition?.totalProtein || '0'),
        carbs: parseFloat(currentNutrition?.totalCarbs || '0'),
        fat: parseFloat(currentNutrition?.totalFat || '0')
      };

      const recommendations = await aiService.getPersonalizedRecommendations(
        currentValues,
        nutritionGoals,
        availableIngredients
      );
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating personalized recommendations:", error);
      res.status(500).json({ message: "Failed to generate personalized recommendations" });
    }
  });

  // AI Chat endpoint
  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { message } = req.body;
      
      // Get user's chat history
      const userHistory = getUserChatHistory(userId);
      
      // Add current user message to history
      addToChatHistory(userId, 'user', message);
      
      // Detect plan creation intent
      const lowerMessage = message.toLowerCase();
      const isWorkoutPlan = /\b(treino|exerc[ií]cio|muscula[çc][ãa]o|push\s*pull\s*legs|ppl|academia|malha[çc][ãa]o|hipertrofia|for[çc]a|supino|agachamento|leg\s*press|barra|halter)\b/i.test(lowerMessage);
      const isDietPlan = /\b(dieta|alimenta[çc][ãa]o|nutri[çc][ãa]o|cardápio|menu|refei[çc][ãa]o|comida|prote[íi]na|carboidrato|gordura|caloria|massa\s*magra|emagre[çc]er|emagrecer|perder\s*peso|ganhar\s*peso)\b/i.test(lowerMessage) && !isWorkoutPlan;
      const isPlanCreation = /\b(criar|gerar|montar|fazer|desenvolver|elaborar|sugerir|preciso\s*de|quero|gostaria)\b/i.test(lowerMessage) && /\b(plano|programa|rotina|cronograma)\b/i.test(lowerMessage);
      
      let response: string | string[];
      
      if (isPlanCreation && isWorkoutPlan) {
        // Auto-generate workout plan
        try {
          console.log("=== AUTO WORKOUT PLAN GENERATION ===");
          console.log("User message:", message);
          
          const user = await storage.getUser(userId);
          const enhancedDescription = `
            CARACTERÍSTICAS DO USUÁRIO:
            - Peso: ${user?.weight || 'não informado'} kg
            - Altura: ${user?.height || 'não informado'} cm
            - Idade: ${user?.age || 'não informado'} anos
            - Objetivo: ${user?.goal || 'não informado'}
            - Nível de atividade: ${user?.activityLevel || 'não informado'}
            
            DESCRIÇÃO: ${message}
            
            Crie um plano de treino detalhado baseado nessas informações.
          `;
          
          const aiPlan = await aiService.generateWorkoutPlan(enhancedDescription);
          
          const workoutPlan = await storage.createMealPlan({
            userId,
            name: aiPlan.name,
            description: aiPlan.description,
            meals: aiPlan.workouts,
            dailyCalories: 0,
            macroCarbs: 0,
            macroProtein: 0,
            macroFat: 0,
            isActive: true,
            type: "workout",
          });
          
          response = [`Plano de Treino Criado com Sucesso! ${aiPlan.name}.`, `${aiPlan.description}`, `Seu plano de treino personalizado foi criado e ativado automaticamente!`, `Você pode visualizá-lo na seção Meu Plano para ver todos os exercícios detalhados.`, `Dica: Consulte sempre um profissional de educação física antes de iniciar qualquer rotina de exercícios.`];
          
          console.log("Auto workout plan created successfully:", workoutPlan.id);
        } catch (error) {
          console.error("Error creating auto workout plan:", error);
          response = await aiService.getChatResponse(message, userHistory);
        }
      } else if (isPlanCreation && isDietPlan) {
        // Auto-generate meal plan
        try {
          console.log("=== AUTO MEAL PLAN GENERATION ===");
          console.log("User message:", message);
          
          const user = await storage.getUser(userId);
          const enhancedDescription = `
            CARACTERÍSTICAS DO USUÁRIO:
            - Peso: ${user?.weight || 'não informado'} kg
            - Altura: ${user?.height || 'não informado'} cm
            - Idade: ${user?.age || 'não informado'} anos
            - Objetivo: ${user?.goal || 'não informado'}
            - Nível de atividade: ${user?.activityLevel || 'não informado'}
            - Meta calórica diária: ${user?.dailyCalories || 2000} kcal
            - Meta de proteína: ${user?.dailyProtein || 120}g
            - Meta de carboidratos: ${user?.dailyCarbs || 250}g
            - Meta de gordura: ${user?.dailyFat || 67}g
            
            DESCRIÇÃO: ${message}
            
            Crie um plano alimentar detalhado baseado nessas informações.
          `;
          
          const aiPlan = await aiService.generateMealPlan(enhancedDescription);
          
          const mealPlan = await storage.createMealPlan({
            userId,
            name: aiPlan.name,
            description: aiPlan.description,
            meals: aiPlan.meals,
            dailyCalories: aiPlan.dailyCalories,
            macroCarbs: aiPlan.macroCarbs,
            macroProtein: aiPlan.macroProtein,
            macroFat: aiPlan.macroFat,
            isActive: true,
            type: "nutrition",
          });
          
          response = [`Plano Alimentar Criado com Sucesso! ${aiPlan.name}.`, `${aiPlan.description}`, `Metas Diárias: Calorias ${aiPlan.dailyCalories} kcal.`, `Proteínas ${aiPlan.macroProtein}g, Carboidratos ${aiPlan.macroCarbs}g, Gorduras ${aiPlan.macroFat}g.`, `Seu plano alimentar personalizado foi criado e ativado!`, `Visite Meu Plano para ver todas as refeições detalhadas.`, `Dica: Sempre consulte um nutricionista para orientações personalizadas.`];
          
          console.log("Auto meal plan created successfully:", mealPlan.id);
        } catch (error) {
          console.error("Error creating auto meal plan:", error);
          const user = await storage.getUser(userId);
          const userContext = `
PERFIL DO USUÁRIO:
- Peso: ${user?.weight || 'não informado'} kg
- Altura: ${user?.height || 'não informado'} cm
- Idade: ${user?.age || 'não informado'} anos
- Objetivo: ${user?.goal || 'não informado'}
- Nível de atividade: ${user?.activityLevel || 'não informado'}
- Meta diária de calorias: ${user?.dailyCalories || 'não definida'} kcal
- Meta diária de proteína: ${user?.dailyProtein || 'não definida'}g
- Meta diária de carboidratos: ${user?.dailyCarbs || 'não definida'}g
- Meta diária de gordura: ${user?.dailyFat || 'não definida'}g

PERGUNTA DO USUÁRIO: ${message}`;

          response = await aiService.getChatResponse(userContext, userHistory);
        }
      } else {
        // Normal chat response with user profile context
        const user = await storage.getUser(userId);
        const userContext = `
PERFIL DO USUÁRIO:
- Peso: ${user?.weight || 'não informado'} kg
- Altura: ${user?.height || 'não informado'} cm
- Idade: ${user?.age || 'não informado'} anos
- Objetivo: ${user?.goal || 'não informado'}
- Nível de atividade: ${user?.activityLevel || 'não informado'}
- Meta diária de calorias: ${user?.dailyCalories || 'não definida'} kcal
- Meta diária de proteína: ${user?.dailyProtein || 'não definida'}g
- Meta diária de carboidratos: ${user?.dailyCarbs || 'não definida'}g
- Meta diária de gordura: ${user?.dailyFat || 'não definida'}g

PERGUNTA DO USUÁRIO: ${message}`;

        response = await aiService.getChatResponse(userContext, userHistory);
      }
      
      // Add AI response to history - handle both string and array responses
      const responseText = Array.isArray(response) ? response.join(' ') : response;
      addToChatHistory(userId, 'model', responseText);
      
      res.json({ response });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // PDF Export routes
  app.post('/api/export/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { startDate, endDate, type } = req.body;
      
      const user = await storage.getUser(userId);
      const nutritionHistory = await storage.getNutritionHistory(userId, startDate, endDate);
      
      const pdfBuffer = await pdfService.generateNutritionReport({
        user: user!,
        nutritionHistory,
        startDate,
        endDate,
        type,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="nutrition-report-${startDate}-${endDate}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF report" });
    }
  });

  // Notification routes
  app.post('/api/notifications/schedule-daily', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await notificationService.scheduleDailyNotification(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error scheduling notification:", error);
      res.status(500).json({ message: "Failed to schedule notification" });
    }
  });

  // PDF Report generation endpoint
  app.get('/api/reports/nutrition-pdf', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { period = 'daily', date = new Date().toISOString().split('T')[0] } = req.query;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let nutritionHistory: any[] = [];
      let startDate: string;
      let endDate: string;

      switch (period) {
        case 'daily':
          startDate = endDate = date;
          const dailyNutrition = await storage.getDailyNutrition(userId, date);
          if (dailyNutrition) {
            nutritionHistory = [dailyNutrition];
          }
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          startDate = weekStart.toISOString().split('T')[0];
          endDate = weekEnd.toISOString().split('T')[0];
          nutritionHistory = await storage.getNutritionHistory(userId, startDate, endDate);
          break;
        case 'monthly':
          const monthStart = new Date(date);
          monthStart.setDate(1);
          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthEnd.getMonth() + 1);
          monthEnd.setDate(0);
          startDate = monthStart.toISOString().split('T')[0];
          endDate = monthEnd.toISOString().split('T')[0];
          nutritionHistory = await storage.getNutritionHistory(userId, startDate, endDate);
          break;
        default:
          return res.status(400).json({ message: "Invalid period" });
      }

      const reportData = {
        user,
        nutritionHistory,
        startDate,
        endDate,
        type: period as 'daily' | 'weekly' | 'monthly'
      };

      const pdfBuffer = await pdfService.generateNutritionReport(reportData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-nutricional-${period}-${date}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      res.status(500).json({ message: "Failed to generate PDF report" });
    }
  });

  // User Plans endpoints (diet, workout, combined)
  app.get('/api/user-plans/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      // Return all active plans (both nutrition and workout)
      const activePlans = await storage.getActiveMealPlans(userId);
      res.json(activePlans || []);
    } catch (error) {
      console.error("Error fetching active plans:", error);
      res.status(500).json({ message: "Failed to fetch active plans" });
    }
  });

  app.get('/api/user-plans/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      // For now, use meal plan history until we implement userPlans in storage
      const history = await storage.getMealPlanHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching plan history:", error);
      res.status(500).json({ message: "Failed to fetch plan history" });
    }
  });

  // Test endpoint for Gemini API
  app.post('/api/test-gemini', isAuthenticated, async (req: any, res) => {
    try {
      const testResponse = await aiService.getChatResponse("Olá, você está funcionando?");
      res.json({ success: true, response: testResponse });
    } catch (error) {
      console.error("Gemini test failed:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.post('/api/generate-meal-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { description } = req.body;

      console.log("=== MEAL PLAN GENERATION START ===");
      console.log("User ID:", userId);
      console.log("Description:", description);

      if (!description || description.trim().length === 0) {
        return res.status(400).json({ message: "Description is required" });
      }

      // Get user characteristics for personalized plan generation
      const user = await storage.getUser(userId);
      
      // Enhance description with user characteristics
      const enhancedDescription = `
        CARACTERÍSTICAS DO USUÁRIO:
        - Peso: ${user?.weight || 'não informado'} kg
        - Altura: ${user?.height || 'não informado'} cm
        - Idade: ${user?.age || 'não informado'} anos
        - Objetivo: ${user?.goal || 'não informado'}
        - Nível de atividade: ${user?.activityLevel || 'não informado'}
        - Meta calórica diária: ${user?.dailyCalories || 2000} kcal
        - Meta de proteína: ${user?.dailyProtein || 120}g
        - Meta de carboidratos: ${user?.dailyCarbs || 250}g
        - Meta de gordura: ${user?.dailyFat || 67}g
        
        DESCRIÇÃO PERSONALIZADA: ${description}
        
        Por favor, crie um plano alimentar detalhado considerando essas informações e use refeições típicas brasileiras.
      `;

      // Generate meal plan using Gemini AI with enhanced description
      console.log("Calling AI service to generate meal plan with user characteristics...");
      const aiPlan = await aiService.generateMealPlan(enhancedDescription);
      console.log("AI plan generated successfully:", aiPlan?.name || 'No name');

      // Create a simplified meal plan for testing
      const simplePlan = {
        userId,
        name: aiPlan?.name || `Plano para ${description.substring(0, 50)}`,
        description: aiPlan?.description || `Plano personalizado baseado em: ${description}`,
        meals: aiPlan?.meals || {
          "segunda": {
            "breakfast": {"name": "Café da manhã", "description": "Exemplo", "calories": 400}
          }
        },
        dailyCalories: aiPlan?.dailyCalories || 2000,
        macroCarbs: aiPlan?.macroCarbs || 50,
        macroProtein: aiPlan?.macroProtein || 25,
        macroFat: aiPlan?.macroFat || 25,
        isActive: true,
      };

      console.log("Creating meal plan in database...");
      const mealPlan = await storage.createMealPlan({
        ...simplePlan,
        type: "nutrition"
      });
      console.log("Meal plan saved successfully with ID:", mealPlan.id);
      console.log("=== MEAL PLAN GENERATION SUCCESS ===");

      res.json(mealPlan);
    } catch (error) {
      console.error("=== MEAL PLAN GENERATION ERROR ===");
      console.error("Error generating meal plan:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';
      console.error("Error message:", errorMessage);
      console.error("Error stack:", errorStack);
      console.error("=== END ERROR LOG ===");
      res.status(500).json({ 
        message: "Failed to generate meal plan",
        error: errorMessage 
      });
    }
  });

  app.post('/api/generate-workout-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { description } = req.body;

      console.log("Generating workout plan for user:", userId, "with description:", description);

      if (!description || description.trim().length === 0) {
        return res.status(400).json({ message: "Description is required" });
      }

      // Get user characteristics for personalized workout plan generation
      const user = await storage.getUser(userId);
      
      // Enhance description with user characteristics
      const enhancedDescription = `
        CARACTERÍSTICAS DO USUÁRIO:
        - Peso: ${user?.weight || 'não informado'} kg
        - Altura: ${user?.height || 'não informado'} cm
        - Idade: ${user?.age || 'não informado'} anos
        - Objetivo: ${user?.goal || 'não informado'}
        - Nível de atividade: ${user?.activityLevel || 'não informado'}
        
        DESCRIÇÃO PERSONALIZADA: ${description}
        
        Por favor, crie um plano de treino detalhado considerando essas informações, adequado para o biotipo e objetivos do usuário.
      `;

      // Generate workout plan using Gemini AI with enhanced description
      console.log("Calling AI service to generate workout plan with user characteristics...");
      const aiPlan = await aiService.generateWorkoutPlan(enhancedDescription);
      console.log("AI workout plan generated successfully:", aiPlan.name);

      // Create workout plan as meal plan for now (until userPlans is implemented)
      console.log("Saving workout plan to database...");
      const workoutPlan = await storage.createMealPlan({
        userId,
        name: aiPlan.name,
        description: aiPlan.description,
        meals: aiPlan.workouts, // Store workouts in meals field temporarily
        dailyCalories: 0,
        macroCarbs: 0,
        macroProtein: 0,
        macroFat: 0,
        isActive: true,
        type: "workout",
      });
      console.log("Workout plan saved successfully with ID:", workoutPlan.id);

      res.json(workoutPlan);
    } catch (error) {
      console.error("Error generating workout plan:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : 'No stack trace';
      console.error("Error stack:", errorStack);
      res.status(500).json({ 
        message: "Failed to generate workout plan",
        error: errorMessage 
      });
    }
  });

  app.get('/api/daily-progress/:date', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { date } = req.params;
      
      // Mock progress data for now
      const mockProgress = {
        id: 1,
        planId: 1,
        date,
        dietCompleted: false,
        workoutCompleted: false,
        notes: null
      };
      
      res.json(mockProgress);
    } catch (error) {
      console.error("Error fetching daily progress:", error);
      res.status(500).json({ message: "Failed to fetch daily progress" });
    }
  });

  app.post('/api/daily-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { planId, date, type, completed } = req.body;
      
      // Mock response for now
      const mockProgress = {
        id: 1,
        planId,
        date,
        dietCompleted: type === 'diet' ? completed : false,
        workoutCompleted: type === 'workout' ? completed : false,
        notes: null
      };
      
      res.json(mockProgress);
    } catch (error) {
      console.error("Error updating daily progress:", error);
      res.status(500).json({ message: "Failed to update daily progress" });
    }
  });

  app.post('/api/user-plans/:id/activate', isAuthenticated, async (req: any, res) => {
    try {
      const planId = parseInt(req.params.id);
      const userId = req.user.id;
      // Use the new activation method that preserves different plan types
      const activatedPlan = await storage.activateMealPlan(planId, userId);
      res.json(activatedPlan);
    } catch (error) {
      console.error("Error activating plan:", error);
      res.status(500).json({ message: "Failed to activate plan" });
    }
  });

  app.delete('/api/user-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const planId = parseInt(req.params.id);
      await storage.deleteMealPlan(planId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ message: "Failed to delete plan" });
    }
  });

  // Export plan as PDF
  app.post('/api/export-plan-pdf', isAuthenticated, async (req: any, res) => {
    try {
      const { planId } = req.body;
      const userId = req.user.id;
      
      // Get user data
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get plan data from history or active
      let plan;
      try {
        const planHistory = await storage.getMealPlanHistory(userId);
        plan = planHistory.find(p => p.id === planId);
        
        // If not found in history, check active plan
        if (!plan) {
          const activePlan = await storage.getActiveMealPlan(userId);
          if (activePlan && activePlan.id === planId) {
            plan = activePlan;
          }
        }
      } catch (error) {
        console.error("Error fetching plan:", error);
      }
      
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Generate PDF content based on plan type
      const isPlanDiet = (plan.dailyCalories || 0) > 0;
      
      // Simple PDF generation using HTML template
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${plan.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            h2 { color: #1f2937; margin-top: 30px; }
            .meta { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .meal-day { background: #fafafa; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .exercise { background: #f0f9ff; padding: 10px; margin: 5px 0; border-radius: 5px; }
            .macros { display: flex; gap: 20px; }
            .macro { text-align: center; padding: 10px; background: #e5e7eb; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>🥗 ${plan.name}</h1>
          
          <div class="meta">
            <p><strong>Tipo:</strong> ${isPlanDiet ? 'Plano Nutricional' : 'Plano de Treino'}</p>
            <p><strong>Usuário:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Criado em:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>Descrição:</strong> ${plan.description}</p>
          </div>

          ${isPlanDiet ? `
            <h2>📊 Metas Nutricionais</h2>
            <div class="macros">
              <div class="macro">
                <h3>${plan.dailyCalories}</h3>
                <p>Calorias/dia</p>
              </div>
              <div class="macro">
                <h3>${plan.macroProtein}g</h3>
                <p>Proteína</p>
              </div>
              <div class="macro">
                <h3>${plan.macroCarbs}g</h3>
                <p>Carboidratos</p>
              </div>
              <div class="macro">
                <h3>${plan.macroFat}g</h3>
                <p>Gordura</p>
              </div>
            </div>

            <h2>🍽️ Cronograma de Refeições</h2>
            ${plan.meals ? Object.entries(plan.meals).map(([day, dayMeals]) => `
              <div class="meal-day">
                <h3>${day.charAt(0).toUpperCase() + day.slice(1)}</h3>
                ${Object.entries(dayMeals).map(([mealType, meal]) => `
                  <p><strong>${mealType}:</strong> ${meal.name} ${meal.calories ? `(~${meal.calories} kcal)` : ''}</p>
                `).join('')}
              </div>
            `).join('') : '<p>Cronograma não disponível</p>'}
          ` : `
            <h2>💪 Cronograma de Treinos</h2>
            ${plan.meals ? Object.entries(plan.meals).map(([day, workout]) => `
              <div class="meal-day">
                <h3>${day.charAt(0).toUpperCase() + day.slice(1)}</h3>
                ${Object.entries(workout).map(([exerciseType, exercise]) => `
                  <div class="exercise">
                    <strong>${exerciseType}:</strong> 
                    ${typeof exercise === 'object' && exercise.name ? exercise.name : exercise}
                    ${typeof exercise === 'object' && exercise.reps ? ` - ${exercise.reps} reps` : ''}
                    ${typeof exercise === 'object' && exercise.sets ? ` - ${exercise.sets} séries` : ''}
                  </div>
                `).join('')}
              </div>
            `).join('') : '<p>Cronograma não disponível</p>'}
          `}

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
            <p>Gerado por NutrIA - Seu assistente nutricional com IA</p>
            <p>Data de geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </body>
        </html>
      `;

      // Return HTML as PDF (browser will handle conversion)
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${plan.name}.html"`);
      res.send(htmlContent);

    } catch (error) {
      console.error("Error exporting plan PDF:", error);
      res.status(500).json({ message: "Failed to export plan PDF" });
    }
  });

  // Legacy meal plan endpoints for backward compatibility
  app.get('/api/my-meal-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const activePlan = await storage.getActiveMealPlan(userId);
      res.json(activePlan || null);
    } catch (error) {
      console.error("Error fetching active meal plan:", error);
      res.status(500).json({ message: "Failed to fetch meal plan" });
    }
  });

  app.get('/api/my-meal-plans/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const history = await storage.getMealPlanHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching meal plan history:", error);
      res.status(500).json({ message: "Failed to fetch meal plan history" });
    }
  });

  app.delete('/api/meal-plans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const planId = parseInt(req.params.id);
      await storage.deleteMealPlan(planId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting meal plan:", error);
      res.status(500).json({ message: "Failed to delete meal plan" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
