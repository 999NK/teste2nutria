import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - Update this to your server URL
const API_BASE_URL = 'http://localhost:5000'; // For development
// For production/deployment: const API_BASE_URL = 'https://your-server-url.com';

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const apiRequest = async (endpoint: string, options: ApiOptions = {}): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, config);

    // Handle different response types
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Nutrition API functions
export const nutritionApi = {
  getDailyNutrition: (date: string) => apiRequest(`/api/daily-nutrition?date=${date}`),
  getNutritionHistory: (startDate: string, endDate: string) => 
    apiRequest(`/api/daily-nutrition/history?start=${startDate}&end=${endDate}`),
  updateDailyNutrition: (data: any) => apiRequest('/api/daily-nutrition', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Meals API functions
export const mealsApi = {
  getMeals: (date?: string) => apiRequest(`/api/meals${date ? `?date=${date}` : ''}`),
  createMeal: (meal: any) => apiRequest('/api/meals', {
    method: 'POST',
    body: JSON.stringify(meal),
  }),
  updateMeal: (id: number, meal: any) => apiRequest(`/api/meals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(meal),
  }),
  deleteMeal: (id: number) => apiRequest(`/api/meals/${id}`, {
    method: 'DELETE',
  }),
  addFoodToMeal: (mealId: number, foodData: any) => apiRequest(`/api/meals/${mealId}/foods`, {
    method: 'POST',
    body: JSON.stringify(foodData),
  }),
  removeFoodFromMeal: (mealId: number, foodId: number) => apiRequest(`/api/meals/${mealId}/foods/${foodId}`, {
    method: 'DELETE',
  }),
};

// Foods API functions
export const foodsApi = {
  getFoods: (search?: string) => apiRequest(`/api/foods${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createFood: (food: any) => apiRequest('/api/foods', {
    method: 'POST',
    body: JSON.stringify(food),
  }),
  updateFood: (id: number, food: any) => apiRequest(`/api/foods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(food),
  }),
  deleteFood: (id: number) => apiRequest(`/api/foods/${id}`, {
    method: 'DELETE',
  }),
};

// Meal Plans API functions
export const mealPlansApi = {
  getActivePlans: () => apiRequest('/api/meal-plans/active'),
  getPlanHistory: () => apiRequest('/api/meal-plans/history'),
  createPlan: (plan: any) => apiRequest('/api/meal-plans', {
    method: 'POST',
    body: JSON.stringify(plan),
  }),
  activatePlan: (id: number) => apiRequest(`/api/meal-plans/${id}/activate`, {
    method: 'POST',
  }),
  deletePlan: (id: number) => apiRequest(`/api/meal-plans/${id}`, {
    method: 'DELETE',
  }),
  exportPDF: (id: number) => apiRequest(`/api/meal-plans/${id}/export`, {
    method: 'GET',
  }),
};

// Recipes API functions
export const recipesApi = {
  getRecipes: () => apiRequest('/api/recipes'),
  createRecipe: (recipe: any) => apiRequest('/api/recipes', {
    method: 'POST',
    body: JSON.stringify(recipe),
  }),
  updateRecipe: (id: number, recipe: any) => apiRequest(`/api/recipes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(recipe),
  }),
  deleteRecipe: (id: number) => apiRequest(`/api/recipes/${id}`, {
    method: 'DELETE',
  }),
  addIngredient: (recipeId: number, ingredient: any) => apiRequest(`/api/recipes/${recipeId}/ingredients`, {
    method: 'POST',
    body: JSON.stringify(ingredient),
  }),
};

// AI Chat API functions
export const aiApi = {
  sendMessage: (message: string, history?: any[]) => apiRequest('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({message, history}),
  }),
  generateMealPlan: (preferences: any) => apiRequest('/api/ai/meal-plan', {
    method: 'POST',
    body: JSON.stringify(preferences),
  }),
  generateWorkoutPlan: (preferences: any) => apiRequest('/api/ai/workout-plan', {
    method: 'POST',
    body: JSON.stringify(preferences),
  }),
};

// Auth API functions
export const authApi = {
  login: (email: string, password: string) => apiRequest('/api/login', {
    method: 'POST',
    body: JSON.stringify({email, password}),
  }),
  register: (email: string, password: string, name: string) => apiRequest('/api/register', {
    method: 'POST',
    body: JSON.stringify({email, password, name}),
  }),
  logout: () => apiRequest('/api/logout', {
    method: 'POST',
  }),
  getUser: () => apiRequest('/api/user'),
  updateProfile: (data: any) => apiRequest('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};