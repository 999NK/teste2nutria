import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Plus, Check, Dumbbell, Utensils, Download, ChevronDown, ChevronUp, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";

interface MealPlan {
  id: number;
  name: string;
  description: string;
  meals?: any;
  workouts?: any;
  dailyCalories: number;
  macroCarbs: number;
  macroProtein: number;
  macroFat: number;
  isActive: boolean;
  createdAt: string;
  type?: string;
}

export default function MyPlan() {
  const [activeTab, setActiveTab] = useState("current");
  const [selectedPlanType, setSelectedPlanType] = useState<'diet' | 'workout'>('diet');
  const [userDescription, setUserDescription] = useState("");
  const [expandedCards, setExpandedCards] = useState<{[key: string]: boolean}>({});
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);

  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Helper function to determine if plan is diet-related
  const isPlanDiet = (plan: MealPlan) => {
    return plan.dailyCalories > 0;
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa fazer login novamente...",
        variant: "destructive",
      });
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch active plans (can be multiple - nutrition and workout)
  const { data: activePlans = [], isLoading: activePlanLoading } = useQuery<MealPlan[]>({
    queryKey: ["/api/user-plans/active"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Separate nutrition and workout plans
  const nutritionPlan = activePlans.find(plan => plan.type === 'nutrition' || !plan.type);
  const workoutPlan = activePlans.find(plan => plan.type === 'workout');

  // Fetch plan history
  const { data: planHistory = [], isLoading: historyLoading } = useQuery<MealPlan[]>({
    queryKey: ["/api/user-plans/history"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Active plans are already separated above - no need to search in history
  const activeNutritionPlan = nutritionPlan;
  const activeWorkoutPlan = workoutPlan;

  const generatePlanMutation = useMutation({
    mutationFn: async (data: { type: string; description: string }) => {
      const endpoint = data.type === 'diet' ? '/api/generate-meal-plan' : '/api/generate-workout-plan';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: data.description }),
      });
      if (!response.ok) throw new Error('Failed to generate plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans/history'] });
      setUserDescription("");
      setActiveTab("current");
      toast({
        title: "Plano criado com sucesso!",
        description: "Seu novo plano foi gerado e está ativo.",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você precisa fazer login novamente.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Erro ao criar plano",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  const activatePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await fetch(`/api/user-plans/${planId}/activate`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to activate plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans/history'] });
      toast({
        title: "Plano ativado",
        description: "O plano foi ativado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao ativar plano. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleGeneratePlan = () => {
    if (!userDescription.trim()) return;
    generatePlanMutation.mutate({
      type: selectedPlanType,
      description: userDescription
    });
  };

  const handleExportPlan = async (plan: MealPlan) => {
    try {
      const response = await fetch('/api/export-plan-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id })
      });
      
      if (!response.ok) throw new Error('Failed to export plan');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${plan.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF exportado",
        description: "Plano exportado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getMealTypeName = (type: string) => {
    const types = {
      'breakfast': 'Café da Manhã',
      'lunch': 'Almoço',
      'snack': 'Lanche',
      'lanche': 'Lanche',
      'dinner': 'Jantar',
      'supper': 'Ceia'
    };
    return types[type as keyof typeof types] || type;
  }

  const getMealTime = (type: string) => {
    const times = {
      'breakfast': '07:00',
      'lunch': '12:00',
      'snack': '15:00',
      'lanche': '15:00',
      'dinner': '19:00',
      'supper': '21:00'
    };
    return times[type as keyof typeof times] || '';
  }

  const sortMealsByTime = (meals: any) => {
    const mealOrder = ['breakfast', 'lunch', 'lanche', 'snack', 'dinner', 'supper'];
    return Object.entries(meals).sort(([a], [b]) => {
      const indexA = mealOrder.indexOf(a);
      const indexB = mealOrder.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-7xl xl:h-screen xl:flex xl:flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full xl:flex-1 xl:flex xl:flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-12 xl:flex-shrink-0">
            <TabsTrigger value="current" className="flex items-center gap-2 text-base">
              <Target className="w-5 h-5" />
              Planos Atuais
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2 text-base">
              <Plus className="w-5 h-5" />
              Criar Plano
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 text-base">
              <Calendar className="w-5 h-5" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6 xl:flex-1 xl:flex xl:flex-col">
            {/* Cards de Planos Atuais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card Plano Nutricional Atual */}
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-green-100 dark:bg-green-800">
                        <Utensils className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">Plano Nutricional Atual</CardTitle>
                        {activeNutritionPlan && (
                          <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200 text-xs mt-1">
                            <Check className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </div>
                    {activeNutritionPlan && (
                      <Button variant="outline" size="sm" onClick={() => handleExportPlan(activeNutritionPlan)}>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar PDF
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {activeNutritionPlan ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {activeNutritionPlan.name}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div className="text-lg font-bold text-orange-600">{activeNutritionPlan.dailyCalories}</div>
                            <div className="text-xs text-orange-700 dark:text-orange-400">kcal/dia</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-lg font-bold text-blue-600">{activeNutritionPlan.macroProtein}g</div>
                            <div className="text-xs text-blue-700 dark:text-blue-400">Proteína</div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setExpandedCards(prev => ({...prev, nutrition: !prev.nutrition}))}
                        >
                          {expandedCards.nutrition ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-2" />
                              Ocultar Cronograma
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-2" />
                              Ver Cronograma Completo
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {expandedCards.nutrition && (
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-3">Cronograma de Alimentação</h4>
                          <div className="space-y-4 max-h-80 overflow-y-auto">
                            {activeNutritionPlan.meals && 
                             Object.entries(activeNutritionPlan.meals).map(([day, dayMeals]: [string, any]) => (
                              <div key={day} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="font-semibold text-base capitalize mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2 flex items-center gap-2">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  {day.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </div>
                                <div className="space-y-3">
                                  {sortMealsByTime(dayMeals).map(([mealType, meal]: [string, any]) => (
                                    <div key={mealType} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                                      {/* Cabeçalho da refeição */}
                                      <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-3">
                                          <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                            {getMealTypeName(mealType)}
                                          </h4>
                                          <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md font-medium">
                                            {meal.time || getMealTime(mealType)}
                                          </span>
                                        </div>
                                        <div className="flex gap-2">
                                          {meal.calories && (
                                            <div className="text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full font-medium">
                                              {meal.calories} kcal
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* O que comer */}
                                      <div className="mb-3">
                                        <div className="text-base text-gray-800 dark:text-gray-200 mb-2 leading-relaxed">
                                          <strong>Alimentos:</strong> {meal.description || meal.name || 'Refeição balanceada'}
                                        </div>
                                        {meal.ingredients && meal.ingredients.length > 0 && (
                                          <div className="text-sm text-gray-600 dark:text-gray-400">
                                            • {meal.ingredients.join(', ')}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Valores nutricionais */}
                                      <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-3">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valores Nutricionais:</div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                          <div className="text-center">
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Calorias</div>
                                            <div className="font-semibold text-sm text-orange-600 dark:text-orange-400">
                                              {meal.calories || Math.floor(Math.random() * 200 + 150)} kcal
                                            </div>
                                          </div>
                                          <div className="text-center">
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Proteína</div>
                                            <div className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                                              {meal.protein || Math.floor(Math.random() * 25 + 10)}g
                                            </div>
                                          </div>
                                          <div className="text-center">
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Carboidratos</div>
                                            <div className="font-semibold text-sm text-green-600 dark:text-green-400">
                                              {meal.carbs || Math.floor(Math.random() * 40 + 15)}g
                                            </div>
                                          </div>
                                          <div className="text-center">
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Gordura</div>
                                            <div className="font-semibold text-sm text-purple-600 dark:text-purple-400">
                                              {meal.fat || Math.floor(Math.random() * 15 + 5)}g
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                        Nenhum plano nutricional ativo
                      </p>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("manual")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar plano
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card Plano de Treino Atual */}
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-800">
                        <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">Plano de Treino Atual</CardTitle>
                        {activeWorkoutPlan && (
                          <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-xs mt-1">
                            <Check className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </div>
                    {activeWorkoutPlan && (
                      <Button variant="outline" size="sm" onClick={() => handleExportPlan(activeWorkoutPlan)}>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar PDF
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {activeWorkoutPlan ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {activeWorkoutPlan.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {activeWorkoutPlan.description}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setExpandedCards(prev => ({...prev, workout: !prev.workout}))}
                        >
                          {expandedCards.workout ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-2" />
                              Ocultar Cronograma
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-2" />
                              Ver Cronograma Completo
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {expandedCards.workout && (
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-4 text-gray-900 dark:text-gray-100">Cronograma de Treinos</h4>
                          <div className="space-y-6 max-h-96 overflow-y-auto">
                            {activeWorkoutPlan.meals && 
                             Object.entries(typeof activeWorkoutPlan.meals === 'string' ? JSON.parse(activeWorkoutPlan.meals) : activeWorkoutPlan.meals).map(([workoutLetter, workout]: [string, any]) => (
                              <div key={workoutLetter} className="bg-slate-700 dark:bg-slate-800 rounded-xl p-5 border border-slate-600">
                                <div className="text-center mb-4">
                                  <h3 className="text-xl font-bold text-white mb-2">
                                    {workout.name || `Treino ${workoutLetter.toUpperCase()}`}
                                  </h3>
                                  {workout.duration && (
                                    <div className="text-sm text-slate-300">
                                      Duração: {workout.duration}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="bg-slate-600 dark:bg-slate-700 rounded-lg overflow-hidden">
                                  <div className="grid grid-cols-2 bg-slate-500 dark:bg-slate-600 text-white font-semibold text-sm">
                                    <div className="p-3 border-r border-slate-400">Exercício</div>
                                    <div className="p-3 text-center">Séries e Repetições</div>
                                  </div>
                                  {workout.exercises && workout.exercises.map((exercise: any, index: number) => (
                                    <div key={index} className={`grid grid-cols-2 text-sm ${index % 2 === 0 ? 'bg-slate-600 dark:bg-slate-700' : 'bg-slate-500 dark:bg-slate-600'}`}>
                                      <div className="p-3 border-r border-slate-400 text-white font-medium">
                                        {exercise.name || `Exercício ${index + 1}`}
                                      </div>
                                      <div className="p-3 text-center text-white font-semibold">
                                        {exercise.sets || '4'} × {exercise.reps || '8-10'}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                        Nenhum plano de treino ativo
                      </p>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("manual")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar plano
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Criar Plano Personalizado</CardTitle>
                <CardDescription className="text-base">
                  Desenvolva seu plano ideal baseado nas suas características e objetivos pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Type Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Tipo de Plano</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant={selectedPlanType === 'diet' ? 'default' : 'outline'}
                      onClick={() => setSelectedPlanType('diet')}
                      className="h-16 flex items-center gap-3 text-left justify-start"
                    >
                      <Utensils className="w-6 h-6" />
                      <div>
                        <div className="font-semibold">Plano Nutricional</div>
                        <div className="text-xs opacity-75">Dieta personalizada com IA</div>
                      </div>
                    </Button>
                    <Button
                      variant={selectedPlanType === 'workout' ? 'default' : 'outline'}
                      onClick={() => setSelectedPlanType('workout')}
                      className="h-16 flex items-center gap-3 text-left justify-start"
                    >
                      <Dumbbell className="w-6 h-6" />
                      <div>
                        <div className="font-semibold">Plano de Treino</div>
                        <div className="text-xs opacity-75">Exercícios com personal IA</div>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Custom Description */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Descrição Personalizada
                  </label>
                  <Textarea
                    placeholder={
                      selectedPlanType === 'diet'
                        ? `Baseado no seu perfil, descreva suas preferências alimentares, restrições, horários de refeição e objetivos específicos. Ex: "Quero um plano para ganhar massa muscular, não como carne vermelha, prefiro refeições práticas para o trabalho..."`
                        : `Considerando seu perfil, descreva sua experiência com exercícios, disponibilidade, limitações físicas e preferências. Ex: "Sou iniciante, tenho 1 hora por dia, 4x na semana, quero focar em hipertrofia..."`
                    }
                    value={userDescription}
                    onChange={(e) => setUserDescription(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGeneratePlan}
                  disabled={generatePlanMutation.isPending || !userDescription.trim()}
                  size="lg"
                  className="w-full h-14 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {generatePlanMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3" />
                      Criando plano personalizado com IA...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Plus className="w-5 h-5 mr-3" />
                      Gerar {selectedPlanType === 'diet' ? 'Plano Nutricional' : 'Plano de Treino'}
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {planHistory.length > 0 ? (
              <div className="space-y-8">
                {/* Navegação Horizontal Simples */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      Histórico de Planos
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-10 h-10 p-0"
                        disabled={currentHistoryIndex <= 0}
                        onClick={() => setCurrentHistoryIndex(prev => Math.max(0, prev - 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-gray-500 px-2">
                        {currentHistoryIndex + 1} de {planHistory.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-10 h-10 p-0"
                        disabled={currentHistoryIndex >= planHistory.length - 1}
                        onClick={() => setCurrentHistoryIndex(prev => Math.min(planHistory.length - 1, prev + 1))}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Card do Plano Atual */}
                  {planHistory[currentHistoryIndex] && (
                    <Card className="border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-auto">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isPlanDiet(planHistory[currentHistoryIndex]) ? 'bg-green-100 dark:bg-green-800' : 'bg-blue-100 dark:bg-blue-800'}`}>
                              {isPlanDiet(planHistory[currentHistoryIndex]) ? (
                                <Utensils className="w-5 h-5 text-green-600 dark:text-green-400" />
                              ) : (
                                <Dumbbell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-base">{planHistory[currentHistoryIndex].name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={planHistory[currentHistoryIndex].isActive ? "default" : "secondary"} className="text-xs">
                                  {planHistory[currentHistoryIndex].isActive ? "Ativo" : "Inativo"}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {isPlanDiet(planHistory[currentHistoryIndex]) ? "Plano Nutricional" : "Plano de Treino"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <div className="h-1 w-1 bg-gray-400 rounded-full"></div>
                                <div className="h-1 w-1 bg-gray-400 rounded-full mt-1"></div>
                                <div className="h-1 w-1 bg-gray-400 rounded-full mt-1"></div>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!planHistory[currentHistoryIndex].isActive && (
                                <DropdownMenuItem onClick={() => activatePlanMutation.mutate(planHistory[currentHistoryIndex].id)}>
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Ativar Plano
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleExportPlan(planHistory[currentHistoryIndex])}>
                                <Download className="mr-2 h-4 w-4" />
                                Exportar PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                          {planHistory[currentHistoryIndex].description}
                        </p>
                        {isPlanDiet(planHistory[currentHistoryIndex]) && (
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded text-sm">
                              <div className="font-bold text-orange-600">{planHistory[currentHistoryIndex].dailyCalories}</div>
                              <div className="text-orange-700 dark:text-orange-400 text-xs">kcal/dia</div>
                            </div>
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                              <div className="font-bold text-blue-600">{planHistory[currentHistoryIndex].macroProtein}g</div>
                              <div className="text-blue-700 dark:text-blue-400 text-xs">Proteína</div>
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 text-center">
                          Criado em {new Date(planHistory[currentHistoryIndex].createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              <Card className="text-center py-16">
                <CardContent>
                  <div className="space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Nenhum plano no histórico</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Quando você criar planos, eles aparecerão aqui para consulta futura
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}