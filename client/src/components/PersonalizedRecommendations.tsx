import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefHat, Target, Clock, Zap, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface PersonalizedRecommendation {
  recipe: {
    name: string;
    description: string;
    ingredients: string[];
    estimatedCalories: number;
    estimatedProtein: number;
    estimatedCarbs: number;
    estimatedFat: number;
    cookingTime: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  reason: string;
  nutritionMatch: 'calories' | 'protein' | 'carbs' | 'fat' | 'balanced';
  priority: 'high' | 'medium' | 'low';
}

export function PersonalizedRecommendations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch personalized recommendations
  const { data: recommendations = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/ai/personalized-recommendations"],
    queryFn: async () => {
      const response = await fetch("/api/ai/personalized-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ availableIngredients: [] }),
      });
      if (!response.ok) {
        if (response.status === 400) {
          const error = await response.json();
          throw new Error(error.message);
        }
        throw new Error("Failed to get recommendations");
      }
      return response.json();
    },
    enabled: false, // Only fetch when explicitly requested
  });

  // Create recipe from recommendation
  const createRecipeMutation = useMutation({
    mutationFn: async (recipe: PersonalizedRecommendation['recipe']) => {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: recipe.name,
          description: recipe.description,
          servings: 1,
        }),
      });
      if (!response.ok) throw new Error("Failed to save recipe");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Receita salva!",
        description: "A receita foi adicionada aos seus favoritos",
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
        title: "Erro",
        description: "Não foi possível salvar a receita",
        variant: "destructive",
      });
    },
  });

  const handleGetRecommendations = () => {
    refetch();
    setIsExpanded(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNutritionIcon = (match: string) => {
    switch (match) {
      case 'calories': return <Zap className="w-4 h-4" />;
      case 'protein': return <TrendingUp className="w-4 h-4" />;
      case 'carbs': return <Target className="w-4 h-4" />;
      case 'fat': return <Target className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
      default: return difficulty;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="w-5 h-5" />
          Receitas Personalizadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isExpanded ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">
              Obtenha receitas personalizadas baseadas nas suas metas nutricionais e progresso atual
            </p>
            <Button 
              onClick={handleGetRecommendations} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Gerando..." : "Ver Recomendações"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Recomendações para você</h3>
              <Button 
                onClick={handleGetRecommendations} 
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>

            {recommendations.length === 0 && !isLoading ? (
              <p className="text-center text-muted-foreground py-4">
                Complete seu perfil para receber recomendações personalizadas
              </p>
            ) : (
              <div className="space-y-4">
                {recommendations.map((recommendation: PersonalizedRecommendation, index: number) => (
                  <div key={index} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-lg">{recommendation.recipe.name}</h4>
                          <Badge className={getPriorityColor(recommendation.priority)}>
                            {recommendation.priority === 'high' ? 'Alta' : 
                             recommendation.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{recommendation.recipe.description}</p>
                        <div className="flex items-center gap-2 mb-2">
                          {getNutritionIcon(recommendation.nutritionMatch)}
                          <span className="text-sm text-blue-700 font-medium">
                            {recommendation.reason}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {recommendation.recipe.cookingTime} min
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {getDifficultyText(recommendation.recipe.difficulty)}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => createRecipeMutation.mutate(recommendation.recipe)}
                        disabled={createRecipeMutation.isPending}
                      >
                        Salvar
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center mb-3">
                      <div>
                        <div className="font-semibold text-orange-600">
                          {recommendation.recipe.estimatedCalories}
                        </div>
                        <div className="text-xs text-gray-500">kcal</div>
                      </div>
                      <div>
                        <div className="font-semibold text-blue-600">
                          {recommendation.recipe.estimatedProtein}g
                        </div>
                        <div className="text-xs text-gray-500">proteína</div>
                      </div>
                      <div>
                        <div className="font-semibold text-green-600">
                          {recommendation.recipe.estimatedCarbs}g
                        </div>
                        <div className="text-xs text-gray-500">carbos</div>
                      </div>
                      <div>
                        <div className="font-semibold text-red-600">
                          {recommendation.recipe.estimatedFat}g
                        </div>
                        <div className="text-xs text-gray-500">gordura</div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-1">Ingredientes:</h5>
                      <div className="flex flex-wrap gap-1">
                        {recommendation.recipe.ingredients.map((ingredient, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {ingredient}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}