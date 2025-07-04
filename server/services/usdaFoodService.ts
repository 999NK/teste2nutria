interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

interface USDAFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  dataType: string;
  foodNutrients: USDANutrient[];
  foodCategory?: {
    description: string;
  };
}

interface USDASearchResult {
  foods: USDAFood[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

export interface ProcessedFood {
  usdaFdcId: number;
  name: string;
  brand?: string;
  category?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sugarPer100g: number;
  sodiumPer100g: number;
}

class USDAFoodService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.nal.usda.gov/fdc/v1';

  // Portuguese to English food translation dictionary
  private readonly foodTranslations: Record<string, string> = {
    // Frutas
    'banana': 'banana',
    'maçã': 'apple',
    'laranja': 'orange',
    'uva': 'grape',
    'limão': 'lemon',
    'manga': 'mango',
    'abacaxi': 'pineapple',
    'morango': 'strawberry',
    'pêra': 'pear',
    'pêssego': 'peach',
    'melancia': 'watermelon',
    'melão': 'melon',
    'kiwi': 'kiwi',
    'mamão': 'papaya',
    'coco': 'coconut',
    'abacate': 'avocado',
    
    // Carnes
    'frango': 'chicken',
    'carne': 'beef',
    'porco': 'pork',
    'peixe': 'fish',
    'salmão': 'salmon',
    'atum': 'tuna',
    'camarão': 'shrimp',
    'peru': 'turkey',
    'cordeiro': 'lamb',
    'bacon': 'bacon',
    'linguiça': 'sausage',
    'presunto': 'ham',
    
    // Grãos e Cereais
    'arroz': 'rice',
    'feijão': 'beans',
    'lentilha': 'lentils',
    'grão-de-bico': 'chickpeas',
    'quinoa': 'quinoa',
    'aveia': 'oats',
    'trigo': 'wheat',
    'milho': 'corn',
    'centeio': 'rye',
    'cevada': 'barley',
    
    // Laticínios
    'leite': 'milk',
    'queijo': 'cheese',
    'iogurte': 'yogurt',
    'manteiga': 'butter',
    'cream': 'cream',
    'requeijão': 'cottage cheese',
    
    // Ovos
    'ovo': 'egg',
    'ovos': 'eggs',
    
    // Vegetais
    'tomate': 'tomato',
    'cebola': 'onion',
    'alho': 'garlic',
    'batata': 'potato',
    'cenoura': 'carrot',
    'brócolis': 'broccoli',
    'couve-flor': 'cauliflower',
    'espinafre': 'spinach',
    'alface': 'lettuce',
    'pepino': 'cucumber',
    'pimentão': 'bell pepper',
    'abobrinha': 'zucchini',
    'berinjela': 'eggplant',
    'beterraba': 'beet',
    'repolho': 'cabbage',
    'couve': 'kale',
    'rúcula': 'arugula',
    
    // Nozes e Sementes
    'amendoim': 'peanuts',
    'castanha': 'nuts',
    'nozes': 'walnuts',
    'amêndoas': 'almonds',
    'pistache': 'pistachios',
    'sementes de girassol': 'sunflower seeds',
    'chia': 'chia seeds',
    'linhaça': 'flax seeds',
    
    // Óleos e Gorduras
    'azeite': 'olive oil',
    'óleo': 'oil',
    'óleo de coco': 'coconut oil',
    'óleo de girassol': 'sunflower oil',
    
    // Pães e Massas
    'pão': 'bread',
    'macarrão': 'pasta',
    'espaguete': 'spaghetti',
    'lasanha': 'lasagna',
    'pizza': 'pizza',
    'biscoito': 'cookie',
    'bolacha': 'cracker',
    
    // Doces
    'açúcar': 'sugar',
    'mel': 'honey',
    'chocolate': 'chocolate',
    'bolo': 'cake',
    'sorvete': 'ice cream',
    'pudim': 'pudding',
    'brigadeiro': 'chocolate truffle',
    'beijinho': 'coconut candy',
    
    // Bebidas
    'água': 'water',
    'café': 'coffee',
    'chá': 'tea',
    'suco': 'juice',
    'refrigerante': 'soda',
    'cerveja': 'beer',
    'vinho': 'wine',
    'cachaça': 'cachaca',
    
    // Temperos e Ervas
    'sal': 'salt',
    'pimenta': 'pepper',
    'oregano': 'oregano',
    'manjericão': 'basil',
    'salsa': 'parsley',
    'coentro': 'cilantro',
    'tomilho': 'thyme',
    'alecrim': 'rosemary',
    'canela': 'cinnamon',
    'gengibre': 'ginger',
    
    // Pratos Brasileiros (aproximações)
    'farofa': 'breadcrumbs',
    'tapioca': 'tapioca',
    'açaí': 'acai',
    'guaraná': 'guarana',
    'coxinha': 'chicken croquette',
    'pastel': 'pastry',
    'pão de açúcar': 'sugar bread',
    'mandioca': 'cassava',
    'inhame': 'yam',
    'batata doce': 'sweet potato',
    'doce': 'candy',
    'açafrão': 'turmeric'
  };

  constructor() {
    this.apiKey = process.env.USDA_API_KEY || '';
    if (!this.apiKey) {
      console.warn('USDA_API_KEY not provided. Food search will use fallback data.');
    }
  }

  private translateToEnglish(query: string): string {
    // Normalize accents and special characters
    const normalizeString = (str: string): string => {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    };
    
    const normalizedQuery = normalizeString(query);
    
    // Direct translation with normalized strings
    for (const [portuguese, english] of Object.entries(this.foodTranslations)) {
      const normalizedPortuguese = normalizeString(portuguese);
      if (normalizedQuery === normalizedPortuguese) {
        return english;
      }
    }
    
    // Partial match for compound words
    for (const [portuguese, english] of Object.entries(this.foodTranslations)) {
      const normalizedPortuguese = normalizeString(portuguese);
      if (normalizedQuery.includes(normalizedPortuguese) || normalizedPortuguese.includes(normalizedQuery)) {
        return english;
      }
    }
    
    // Return original query if no translation found
    return query;
  }

  async searchFoods(query: string, pageSize: number = 50): Promise<ProcessedFood[]> {
    if (!this.apiKey) {
      return this.getFallbackFoods(query);
    }

    try {
      // Translate Portuguese to English for better USDA results
      const translatedQuery = this.translateToEnglish(query);
      console.log(`Searching USDA: "${query}" -> "${translatedQuery}"`);
      
      const url = `${this.baseUrl}/foods/search?api_key=${this.apiKey}&query=${encodeURIComponent(translatedQuery)}&pageSize=${pageSize}&dataType=Foundation,SR%20Legacy`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      const data: USDASearchResult = await response.json();
      return data.foods.map(food => this.processUSDAFood(food));
    } catch (error) {
      console.error('Error fetching from USDA API:', error);
      return this.getFallbackFoods(query);
    }
  }

  async getFoodDetails(fdcId: number): Promise<ProcessedFood | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const url = `${this.baseUrl}/food/${fdcId}?api_key=${this.apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }

      const food: USDAFood = await response.json();
      return this.processUSDAFood(food);
    } catch (error) {
      console.error('Error fetching food details from USDA API:', error);
      return null;
    }
  }

  private processUSDAFood(food: USDAFood): ProcessedFood {
    const nutrients = food.foodNutrients || [];
    
    // USDA nutrient IDs for key nutrients
    const energyKcal = this.findNutrient(nutrients, [1008]); // Energy (kcal)
    const protein = this.findNutrient(nutrients, [1003]); // Protein
    const totalFat = this.findNutrient(nutrients, [1004]); // Total fat
    const carbs = this.findNutrient(nutrients, [1005]); // Carbohydrates
    const fiber = this.findNutrient(nutrients, [1079]); // Fiber
    const sugars = this.findNutrient(nutrients, [2000]); // Total sugars
    const sodium = this.findNutrient(nutrients, [1093]); // Sodium

    return {
      usdaFdcId: food.fdcId,
      name: food.description,
      brand: food.brandOwner,
      category: food.foodCategory?.description,
      caloriesPer100g: Math.round(energyKcal?.value || 0),
      proteinPer100g: Math.round((protein?.value || 0) * 100) / 100,
      carbsPer100g: Math.round((carbs?.value || 0) * 100) / 100,
      fatPer100g: Math.round((totalFat?.value || 0) * 100) / 100,
      fiberPer100g: Math.round((fiber?.value || 0) * 100) / 100,
      sugarPer100g: Math.round((sugars?.value || 0) * 100) / 100,
      sodiumPer100g: Math.round((sodium?.value || 0) / 10) / 100, // Convert mg to g
    };
  }

  private findNutrient(nutrients: USDANutrient[], ids: number[]): USDANutrient | undefined {
    return nutrients.find(nutrient => ids.includes(nutrient.nutrientId));
  }

  private getFallbackFoods(query: string): ProcessedFood[] {
    // Common Brazilian foods for fallback
    const commonFoods: ProcessedFood[] = [
      {
        usdaFdcId: 0,
        name: "Arroz branco cozido",
        category: "Cereais",
        caloriesPer100g: 130,
        proteinPer100g: 2.7,
        carbsPer100g: 28,
        fatPer100g: 0.3,
        fiberPer100g: 0.4,
        sugarPer100g: 0.1,
        sodiumPer100g: 0.001
      },
      {
        usdaFdcId: 0,
        name: "Feijão preto cozido",
        category: "Leguminosas",
        caloriesPer100g: 132,
        proteinPer100g: 8.9,
        carbsPer100g: 23,
        fatPer100g: 0.5,
        fiberPer100g: 8.7,
        sugarPer100g: 0.3,
        sodiumPer100g: 0.002
      },
      {
        usdaFdcId: 0,
        name: "Peito de frango grelhado",
        category: "Carnes",
        caloriesPer100g: 165,
        proteinPer100g: 31,
        carbsPer100g: 0,
        fatPer100g: 3.6,
        fiberPer100g: 0,
        sugarPer100g: 0,
        sodiumPer100g: 0.074
      },
      {
        usdaFdcId: 0,
        name: "Banana",
        category: "Frutas",
        caloriesPer100g: 89,
        proteinPer100g: 1.1,
        carbsPer100g: 23,
        fatPer100g: 0.3,
        fiberPer100g: 2.6,
        sugarPer100g: 12,
        sodiumPer100g: 0.001
      },
      {
        usdaFdcId: 0,
        name: "Ovos",
        category: "Proteínas",
        caloriesPer100g: 155,
        proteinPer100g: 13,
        carbsPer100g: 1.1,
        fatPer100g: 11,
        fiberPer100g: 0,
        sugarPer100g: 1.1,
        sodiumPer100g: 0.124
      }
    ];

    return commonFoods.filter(food => 
      food.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}

export const usdaFoodService = new USDAFoodService();