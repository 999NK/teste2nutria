import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Trash2, Edit3 } from "lucide-react";
import { FoodDropdownSearch } from "./FoodDropdownSearch";
import { CustomFoodForm } from "./CustomFoodForm";

interface MealFood {
  id: number;
  foodId: number;
  quantity: string;
  unit: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  food: {
    name: string;
    brand?: string;
  };
}

interface Meal {
  id: number;
  date: string;
  mealType: {
    id: number;
    name: string;
    icon: string;
  };
  mealFoods: MealFood[];
}

interface EditMealModalProps {
  meal: Meal | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditMealModal({ meal, isOpen, onClose }: EditMealModalProps) {
  const [mealFoods, setMealFoods] = useState<MealFood[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (meal) {
      setMealFoods(meal.mealFoods);
    }
  }, [meal]);

  const deleteMealMutation = useMutation({
    mutationFn: async () => {
      if (!meal) return;
      await apiRequest("DELETE", `/api/meals/${meal.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Refeição excluída",
        description: "A refeição foi removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition/daily"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a refeição.",
        variant: "destructive",
      });
    },
  });

  const removeFoodMutation = useMutation({
    mutationFn: async ({ mealId, foodId }: { mealId: number; foodId: number }) => {
      await apiRequest("DELETE", `/api/meals/${mealId}/foods/${foodId}`);
    },
    onSuccess: () => {
      toast({
        title: "Alimento removido",
        description: "O alimento foi removido da refeição.",
      });
      // Invalidate all progress-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/hourly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/weekly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition/history"] });
      // Refresh the meal foods list
      if (meal) {
        setMealFoods(prev => prev.filter(mf => mf.id !== removeFoodMutation.variables?.foodId));
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o alimento.",
        variant: "destructive",
      });
    },
  });

  const addFoodMutation = useMutation({
    mutationFn: async (foodData: any) => {
      if (!meal) return;
      await apiRequest("POST", `/api/meals/${meal.id}/foods`, foodData);
    },
    onSuccess: () => {
      toast({
        title: "Alimento adicionado",
        description: "O alimento foi adicionado à refeição.",
      });
      // Invalidate all progress-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition/daily"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/hourly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/weekly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/monthly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition/history"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o alimento.",
        variant: "destructive",
      });
    },
  });

  const handleAddFood = (food: any) => {
    const foodData = {
      foodId: food.id || food.usdaFdcId,
      name: food.name,
      brand: food.brand,
      category: food.category || 'Personalizado',
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
    };
    addFoodMutation.mutate(foodData);
  };

  const handleRemoveFood = (mealFoodId: number, foodId: number) => {
    if (!meal) return;
    removeFoodMutation.mutate({ mealId: meal.id, foodId });
  };

  const handleDeleteMeal = () => {
    if (window.confirm("Tem certeza que deseja excluir esta refeição?")) {
      deleteMealMutation.mutate();
    }
  };

  if (!meal) return null;

  // Calculate total nutrition
  const totalCalories = mealFoods.reduce((sum, mf) => sum + parseFloat(mf.calories), 0);
  const totalProtein = mealFoods.reduce((sum, mf) => sum + parseFloat(mf.protein), 0);
  const totalCarbs = mealFoods.reduce((sum, mf) => sum + parseFloat(mf.carbs), 0);
  const totalFat = mealFoods.reduce((sum, mf) => sum + parseFloat(mf.fat), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className={`fas fa-${meal.mealType.icon} text-green-600`}></i>
            {meal.mealType.name}
            <Badge variant="outline">{meal.date}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto">
          {/* Current Foods */}
          <div>
            <h3 className="font-medium mb-3">Alimentos da Refeição</h3>
            {mealFoods.length > 0 ? (
              <div className="space-y-2">
                {mealFoods.map((mealFood) => (
                  <Card key={mealFood.id} className="border border-gray-200">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{mealFood.food.name}</h4>
                          {mealFood.food.brand && (
                            <p className="text-sm text-muted-foreground">{mealFood.food.brand}</p>
                          )}
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {mealFood.quantity} {mealFood.unit}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(parseFloat(mealFood.calories))} kcal
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            P: {Math.round(parseFloat(mealFood.protein))}g • 
                            C: {Math.round(parseFloat(mealFood.carbs))}g • 
                            G: {Math.round(parseFloat(mealFood.fat))}g
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveFood(mealFood.id, mealFood.foodId)}
                          disabled={removeFoodMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhum alimento adicionado ainda.
              </p>
            )}

            {/* Nutrition Summary */}
            {mealFoods.length > 0 && (
              <Card className="mt-3 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CardContent className="p-3">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Total da Refeição
                  </h4>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{Math.round(totalCalories)}</div>
                      <div className="text-muted-foreground">kcal</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{Math.round(totalProtein)}g</div>
                      <div className="text-muted-foreground">prot</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{Math.round(totalCarbs)}g</div>
                      <div className="text-muted-foreground">carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{Math.round(totalFat)}g</div>
                      <div className="text-muted-foreground">gord</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Add More Foods */}
          <div>
            <h3 className="font-medium mb-3">Adicionar Mais Alimentos</h3>
            <div className="space-y-3">
              <FoodDropdownSearch onAddFood={handleAddFood} />
              <CustomFoodForm onAddFood={handleAddFood} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Fechar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMeal}
              disabled={deleteMealMutation.isPending}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Refeição
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}