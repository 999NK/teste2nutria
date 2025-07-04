import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CustomFoodModal } from "@/components/CustomFoodModal";
import { FoodDropdownSearch } from "@/components/FoodDropdownSearch";
import { getNutritionalDay } from "@/lib/nutritionalDay";

interface FoodItem {
  id?: number;
  usdaFdcId?: number;
  name: string;
  brand?: string;
  category?: string;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  sodiumPer100g?: number;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function AddMeal() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedMealType, setSelectedMealType] = useState<number | null>(null);
  const [aiDescription, setAiDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [addedFoods, setAddedFoods] = useState<FoodItem[]>([]);
  const [showCustomFood, setShowCustomFood] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa fazer login novamente...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch meal types with optimized caching
  const { data: mealTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/meal-types"],
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes - meal types rarely change
    refetchOnWindowFocus: false,
  });

  // Removed redundant food search query - FoodDropdownSearch handles its own search

  // AI meal analysis mutation
  const aiAnalysisMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await fetch("/api/ai/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ description }),
      });
      if (!response.ok) throw new Error("Failed to analyze meal");
      return response.json();
    },
    onSuccess: (data) => {
      const aiFoods = data.foods.map((food: any, index: number) => ({
        id: Date.now() + index,
        name: food.name,
        quantity: food.quantity,
        unit: food.unit,
        calories: food.estimatedCalories,
        protein: food.estimatedProtein,
        carbs: food.estimatedCarbs,
        fat: food.estimatedFat,
      }));
      setAddedFoods(prev => [...prev, ...aiFoods]);
      setAiDescription("");
      toast({
        title: "Análise concluída!",
        description: `${aiFoods.length} alimentos identificados com ${(data.confidence * 100).toFixed(0)}% de confiança`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar a descrição da refeição",
        variant: "destructive",
      });
    },
  });

  // Create meal mutation
  const createMealMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMealType || addedFoods.length === 0) {
        throw new Error("Selecione um tipo de refeição e adicione alimentos");
      }

      const today = getNutritionalDay();
      
      // Create meal
      const mealResponse = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mealTypeId: selectedMealType,
          date: today,
        }),
      });

      if (!mealResponse.ok) throw new Error("Failed to create meal");
      const meal = await mealResponse.json();

      // Add foods to meal
      for (const food of addedFoods) {
        const foodResponse = await fetch(`/api/meals/${meal.id}/foods`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            foodId: food.id || food.usdaFdcId,
            name: food.name,
            brand: food.brand,
            category: food.category,
            quantity: food.quantity,
            unit: food.unit,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            caloriesPer100g: food.caloriesPer100g,
            proteinPer100g: food.proteinPer100g,
            carbsPer100g: food.carbsPer100g,
            fatPer100g: food.fatPer100g,
            fiberPer100g: food.fiberPer100g,
            sugarPer100g: food.sugarPer100g,
            sodiumPer100g: food.sodiumPer100g,
            usdaFdcId: food.usdaFdcId,
          }),
        });

        if (!foodResponse.ok) {
          console.error(`Failed to add food ${food.id} to meal`);
        }
      }

      return meal;
    },
    onSuccess: () => {
      // Invalidate all progress-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/hourly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/weekly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition/history"] });
      
      toast({
        title: "Refeição salva!",
        description: "Sua refeição foi adicionada com sucesso",
      });
      setLocation("/");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAIAnalysis = async () => {
    if (!aiDescription.trim()) return;
    setIsAnalyzing(true);
    try {
      await aiAnalysisMutation.mutateAsync(aiDescription);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addFoodFromSearch = (food: any) => {
    const newFood: FoodItem = {
      id: food.id,
      name: food.name,
      quantity: 100,
      unit: "g",
      calories: food.caloriesPer100g,
      protein: parseFloat(food.proteinPer100g),
      carbs: parseFloat(food.carbsPer100g),
      fat: parseFloat(food.fatPer100g),
    };
    setAddedFoods(prev => [...prev, newFood]);
  };

  const handleAddFoodFromSearch = (food: any) => {
    const newFood: FoodItem = {
      id: food.id || Date.now(),
      name: food.name,
      quantity: food.quantity,
      unit: food.unit,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    };
    setAddedFoods(prev => [...prev, newFood]);
    toast({
      title: "Alimento adicionado",
      description: `${food.name} foi adicionado à refeição`,
    });
  };

  const removeFoodItem = (index: number) => {
    setAddedFoods(prev => prev.filter((_, i) => i !== index));
  };

  const totalCalories = addedFoods.reduce((sum, food) => sum + food.calories, 0);
  const totalProtein = addedFoods.reduce((sum, food) => sum + food.protein, 0);
  const totalCarbs = addedFoods.reduce((sum, food) => sum + food.carbs, 0);
  const totalFat = addedFoods.reduce((sum, food) => sum + food.fat, 0);

  const getMealTypeIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('café') || lowerName.includes('manhã')) return 'coffee';
    if (lowerName.includes('almoço')) return 'utensils';
    if (lowerName.includes('jantar')) return 'bowl-food';
    if (lowerName.includes('lanche')) return 'cookie-bite';
    return 'utensils';
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Voltar
        </Button>
        <h2 className="text-lg font-semibold">Adicionar Refeição</h2>
        <Button
          onClick={() => createMealMutation.mutate()}
          disabled={!selectedMealType || addedFoods.length === 0 || createMealMutation.isPending}
        >
          {createMealMutation.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {/* Meal Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Refeição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {(mealTypes as any[]).map((mealType: any) => (
              <Button
                key={mealType.id}
                variant={selectedMealType === mealType.id ? "default" : "outline"}
                className="p-3 h-auto justify-start"
                onClick={() => setSelectedMealType(mealType.id)}
              >
                <i className={`fas fa-${getMealTypeIcon(mealType.name)} mr-2`}></i>
                {mealType.name}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              // TODO: Add custom meal type functionality
              toast({
                title: "Em breve",
                description: "Funcionalidade de tipo personalizado será implementada",
              });
            }}
          >
            <i className="fas fa-plus mr-2"></i>
            Tipo Personalizado
          </Button>
        </CardContent>
      </Card>

      {/* AI Input Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Entrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Text AI Input */}
          <div>
            <Label>Descrever com IA</Label>
            <div className="relative mt-2">
              <Textarea
                placeholder="Ex: comi pão, 2 fatias de presunto e 2 ovos..."
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                className="resize-none h-20 pr-12"
              />
              <Button
                size="sm"
                className="absolute bottom-2 right-2"
                onClick={handleAIAnalysis}
                disabled={!aiDescription.trim() || isAnalyzing}
              >
                {isAnalyzing ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-wand-magic-sparkles"></i>
                )}
              </Button>
            </div>
          </div>

          {/* Food Search with Quantity */}
          <FoodDropdownSearch onAddFood={handleAddFoodFromSearch} />
          
          {/* Custom Food Entry */}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setShowCustomFood(true)}
          >
            <i className="fas fa-edit mr-2 text-orange-500"></i>
            Criar Alimento Personalizado
          </Button>
        </CardContent>
      </Card>

      {/* Food Items Added */}
      <Card>
        <CardHeader>
          <CardTitle>Itens Adicionados</CardTitle>
        </CardHeader>
        <CardContent>
          {addedFoods.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <i className="fas fa-utensils text-3xl mb-3 opacity-50"></i>
              <p className="text-sm">Nenhum alimento adicionado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addedFoods.map((food, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium">{food.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {food.quantity} {food.unit}
                    </p>
                  </div>
                  <div className="text-right mr-3">
                    <p className="font-semibold">{food.calories} kcal</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {food.protein.toFixed(0)}g prot • {food.carbs.toFixed(0)}g carb
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFoodItem(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </Button>
                </div>
              ))}

              <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <div className="text-right">
                    <p className="font-bold text-lg">{totalCalories} kcal</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {totalProtein.toFixed(0)}g prot • {totalCarbs.toFixed(0)}g carb • {totalFat.toFixed(0)}g gord
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Food Modal */}
      <CustomFoodModal
        isOpen={showCustomFood}
        onClose={() => setShowCustomFood(false)}
        onAdd={(food) => {
          setAddedFoods(prev => [...prev, { ...food, id: Date.now() }]);
          setShowCustomFood(false);
        }}
      />
    </div>
  );
}
