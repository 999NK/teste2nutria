import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function MyFoods() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("foods");
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [recipeDescription, setRecipeDescription] = useState("");
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [generatedRecipes, setGeneratedRecipes] = useState<any[]>([]);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);

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

  // Fetch recipes
  const { data: recipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ["/api/recipes"],
    enabled: isAuthenticated,
  });

  // Fetch all foods (both custom and USDA)
  const { data: allFoods = [] } = useQuery({
    queryKey: ["/api/foods"],
    enabled: isAuthenticated,
  });

  // Generate recipes with AI
  const generateRecipesMutation = useMutation({
    mutationFn: async (selectedIngredients: string[]) => {
      const response = await fetch("/api/ai/suggest-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ availableIngredients: selectedIngredients }),
      });
      if (!response.ok) throw new Error("Failed to generate recipes");
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedRecipes(data || []);
      setIsGeneratingRecipes(false);
      toast({
        title: "Receitas geradas!",
        description: `${data?.length || 0} receitas criadas com os ingredientes selecionados`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erro",
        description: "Não foi possível gerar as receitas",
        variant: "destructive",
      });
    },
  });

  // Create recipe mutation
  const createRecipeMutation = useMutation({
    mutationFn: async (recipeData: any) => {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(recipeData),
      });
      if (!response.ok) throw new Error("Failed to create recipe");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setShowAddRecipe(false);
      setRecipeName("");
      setRecipeDescription("");
      toast({
        title: "Receita criada!",
        description: "Sua receita foi salva com sucesso",
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
        title: "Erro ao criar receita",
        description: "Não foi possível salvar a receita",
        variant: "destructive",
      });
    },
  });

  // Delete recipe mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete recipe");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Receita excluída",
        description: "A receita foi removida com sucesso",
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
        title: "Erro ao excluir",
        description: "Não foi possível excluir a receita",
        variant: "destructive",
      });
    },
  });

  // Get recipe suggestions mutation
  const getRecipeSuggestionsMutation = useMutation({
    mutationFn: async (ingredients: string[]) => {
      const response = await fetch("/api/ai/suggest-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ availableIngredients: ingredients }),
      });
      if (!response.ok) throw new Error("Failed to get recipe suggestions");
      return response.json();
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
        title: "Erro nas sugestões",
        description: "Não foi possível obter sugestões de receitas",
        variant: "destructive",
      });
    },
  });

  const handleCreateRecipe = () => {
    if (!recipeName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a receita",
        variant: "destructive",
      });
      return;
    }

    createRecipeMutation.mutate({
      name: recipeName,
      description: recipeDescription,
      servings: 1,
    });
  };

  const addIngredient = () => {
    if (newIngredient.trim() && !availableIngredients.includes(newIngredient.trim())) {
      setAvailableIngredients(prev => [...prev, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  // Handler functions for food selection and recipe generation
  const handleFoodSelection = (foodName: string) => {
    setSelectedFoods(prev => 
      prev.includes(foodName) 
        ? prev.filter(name => name !== foodName)
        : [...prev, foodName]
    );
  };

  const handleGenerateRecipes = () => {
    if (selectedFoods.length < 2) {
      toast({
        title: "Ingredientes insuficientes",
        description: "Selecione pelo menos 2 ingredientes para gerar receitas",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingRecipes(true);
    generateRecipesMutation.mutate(selectedFoods);
  };

  // Update the effect to handle mutation completion
  useEffect(() => {
    if (!generateRecipesMutation.isPending) {
      setIsGeneratingRecipes(false);
    }
  }, [generateRecipesMutation.isPending]);

  const clearSelection = () => {
    setSelectedFoods([]);
    setGeneratedRecipes([]);
  };

  const removeIngredient = (ingredient: string) => {
    setAvailableIngredients(prev => prev.filter(ing => ing !== ingredient));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
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

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Meus Alimentos</h2>
        <Dialog open={showAddRecipe} onOpenChange={setShowAddRecipe}>
          <DialogTrigger asChild>
            <Button size="sm">
              <i className="fas fa-plus mr-2"></i>
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Receita</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipe-name">Nome da Receita</Label>
                <Input
                  id="recipe-name"
                  placeholder="Ex: Omelete de Queijo"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="recipe-description">Descrição</Label>
                <Textarea
                  id="recipe-description"
                  placeholder="Descreva sua receita..."
                  value={recipeDescription}
                  onChange={(e) => setRecipeDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddRecipe(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateRecipe}
                  disabled={createRecipeMutation.isPending}
                  className="flex-1"
                >
                  {createRecipeMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recipes">Receitas</TabsTrigger>
          <TabsTrigger value="foods">Alimentos</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="space-y-4 mt-6">
          {recipesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((j) => (
                          <div key={j} className="text-center">
                            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (recipes as any[]).length > 0 ? (
            <div className="space-y-4">
              {(recipes as any[]).map((recipe: any) => (
                <Card key={recipe.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{recipe.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {recipe.description || `${recipe.ingredients?.length || 0} ingredientes`}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost">
                          <i className="fas fa-edit text-sm text-primary"></i>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deleteRecipeMutation.mutate(recipe.id)}
                          disabled={deleteRecipeMutation.isPending}
                        >
                          <i className="fas fa-trash text-sm text-red-500"></i>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center text-sm mb-4">
                      <div>
                        <p className="font-semibold text-primary">{recipe.totalCalories || 0}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-500">{parseFloat(recipe.totalProtein || "0").toFixed(0)}g</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">prot</p>
                      </div>
                      <div>
                        <p className="font-semibold text-yellow-500">{parseFloat(recipe.totalCarbs || "0").toFixed(0)}g</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">carb</p>
                      </div>
                      <div>
                        <p className="font-semibold text-orange-500">{parseFloat(recipe.totalFat || "0").toFixed(0)}g</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">gord</p>
                      </div>
                    </div>

                    <Button className="w-full" size="sm">
                      Adicionar à Refeição
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <i className="fas fa-utensils text-3xl text-gray-400 mb-4"></i>
                <h3 className="font-semibold mb-2">Nenhuma receita encontrada</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Crie sua primeira receita clicando no botão Adicionar
                </p>
                <Button onClick={() => setShowAddRecipe(true)}>
                  <i className="fas fa-plus mr-2"></i>
                  Criar Receita
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Suggested Recipes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Receitas Sugeridas</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => getRecipeSuggestionsMutation.mutate(availableIngredients)}
                  disabled={availableIngredients.length === 0 || getRecipeSuggestionsMutation.isPending}
                >
                  {getRecipeSuggestionsMutation.isPending ? (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fas fa-wand-magic-sparkles mr-2"></i>
                  )}
                  Buscar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableIngredients.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Adicione ingredientes na aba "Ingredientes" para receber sugestões de receitas
                </p>
              ) : getRecipeSuggestionsMutation.data ? (
                <div className="space-y-3">
                  {getRecipeSuggestionsMutation.data.map((suggestion: any, index: number) => (
                    <div key={index} className="p-3 border border-gray-200 dark:border-gray-600 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{suggestion.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{suggestion.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getDifficultyColor(suggestion.difficulty)}>
                              {getDifficultyText(suggestion.difficulty)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {suggestion.cookingTime} min
                            </span>
                          </div>
                        </div>
                        <Button size="sm">
                          Ver Receita
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Clique em "Buscar" para obter sugestões baseadas nos seus ingredientes
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="foods" className="space-y-4 mt-6">
          {/* Food Selection for Recipe Generation */}
          {selectedFoods.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-blue-900">
                    {selectedFoods.length} ingredientes selecionados
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateRecipes}
                      disabled={selectedFoods.length < 2 || generateRecipesMutation.isPending}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {generateRecipesMutation.isPending ? "Gerando..." : "Gerar Receitas"}
                    </Button>
                    <Button
                      onClick={clearSelection}
                      variant="outline"
                      size="sm"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedFoods.map((food) => (
                    <Badge key={food} variant="secondary" className="bg-blue-100 text-blue-800">
                      {food}
                      <Button
                        onClick={() => handleFoodSelection(food)}
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-4 w-4 p-0 hover:bg-blue-200"
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Recipes Display */}
          {generatedRecipes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Receitas Geradas pela IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generatedRecipes.map((recipe: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-lg">{recipe.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{recipe.description}</p>
                          <div className="flex items-center gap-4 mb-2">
                            <Badge className={`${
                              recipe.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              recipe.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {recipe.difficulty === 'easy' ? 'Fácil' : 
                               recipe.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                            </Badge>
                            <span className="text-sm text-gray-500">{recipe.cookingTime} min</span>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => {
                            // Create recipe from AI suggestion
                            createRecipeMutation.mutate({
                              name: recipe.name,
                              description: recipe.description,
                              servings: 1,
                            });
                          }}
                        >
                          Salvar Receita
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-center mb-3">
                        <div>
                          <div className="font-semibold text-orange-600">{recipe.estimatedCalories}</div>
                          <div className="text-xs text-gray-500">kcal</div>
                        </div>
                        <div>
                          <div className="font-semibold text-blue-600">{recipe.estimatedProtein}g</div>
                          <div className="text-xs text-gray-500">proteína</div>
                        </div>
                        <div>
                          <div className="font-semibold text-green-600">{recipe.estimatedCarbs}g</div>
                          <div className="text-xs text-gray-500">carbos</div>
                        </div>
                        <div>
                          <div className="font-semibold text-red-600">{recipe.estimatedFat}g</div>
                          <div className="text-xs text-gray-500">gordura</div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium mb-1">Ingredientes:</h5>
                        <div className="flex flex-wrap gap-1">
                          {recipe.ingredients?.map((ingredient: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {ingredient}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Foods List with Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Alimentos para Receitas</CardTitle>
            </CardHeader>
            <CardContent>
              {(allFoods as any[]).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum alimento cadastrado ainda. Adicione seu primeiro alimento personalizado!
                </p>
              ) : (
                <div className="grid gap-3">
                  {(allFoods as any[]).map((food: any) => (
                    <div 
                      key={food.id} 
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedFoods.includes(food.name) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleFoodSelection(food.name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedFoods.includes(food.name)}
                            onChange={() => handleFoodSelection(food.name)}
                            className="rounded border-gray-300"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{food.name}</h4>
                            {food.brand && (
                              <p className="text-sm text-gray-600">{food.brand}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-orange-600 font-medium">
                            {food.caloriesPer100g} kcal/100g
                          </span>
                          {food.isCustom && (
                            <Badge variant="secondary">Personalizado</Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 mt-2 ml-6">
                        <span>Prot: {food.proteinPer100g}g</span>
                        <span>Carbs: {food.carbsPer100g}g</span>
                        <span>Gord: {food.fatPer100g}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ingredients" className="space-y-4 mt-6">
          {/* Add Ingredient */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredientes Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Ex: frango, arroz, brócolis..."
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                />
                <Button onClick={addIngredient} disabled={!newIngredient.trim()}>
                  <i className="fas fa-plus"></i>
                </Button>
              </div>

              {availableIngredients.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableIngredients.map((ingredient, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {ingredient}
                      <button
                        onClick={() => removeIngredient(ingredient)}
                        className="ml-1 text-xs hover:text-red-500"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Adicione ingredientes que você tem disponível para receber sugestões de receitas
                </p>
              )}
            </CardContent>
          </Card>

          {/* Custom Foods */}
          <Card>
            <CardHeader>
              <CardTitle>Alimentos Personalizados</CardTitle>
            </CardHeader>
            <CardContent>
              {(allFoods as any[]).filter((food: any) => food.isCustom).length > 0 ? (
                <div className="space-y-2">
                  {(allFoods as any[]).filter((food: any) => food.isCustom).map((food: any) => (
                    <div key={food.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div>
                        <p className="font-medium">{food.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {food.caloriesPer100g} kcal/100g
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <i className="fas fa-edit text-primary"></i>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Você ainda não criou alimentos personalizados
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
