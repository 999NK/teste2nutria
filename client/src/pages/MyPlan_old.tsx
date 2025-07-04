import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Target, Trash2, Plus, Check, X, Dumbbell, Utensils, Download, RotateCcw, Clock, TrendingUp, Edit2, MoreVertical, Award, ChevronDown, ChevronUp } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
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
}

export default function MyPlan() {
  const [activeTab, setActiveTab] = useState("current");
  const [selectedPlanType, setSelectedPlanType] = useState<'diet' | 'workout'>('diet');
  const [userDescription, setUserDescription] = useState("");
  const [expandedCards, setExpandedCards] = useState<{[key: string]: boolean}>({});

  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

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

  // Fetch active plan
  const { data: activePlan, isLoading: activePlanLoading } = useQuery<MealPlan>({
    queryKey: ["/api/user-plans/active"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch plan history
  const { data: planHistory = [], isLoading: historyLoading } = useQuery<MealPlan[]>({
    queryKey: ["/api/user-plans/history"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Helper function to determine if plan is diet-related
  const isPlanDiet = (plan: MealPlan) => {
    return plan.dailyCalories > 0;
  };

  // Find active nutrition and workout plans
  const activeNutritionPlan = activePlan && isPlanDiet(activePlan) ? activePlan : 
                              planHistory.find(p => isPlanDiet(p) && p.isActive);
  const activeWorkoutPlan = activePlan && !isPlanDiet(activePlan) ? activePlan : 
                           planHistory.find(p => !isPlanDiet(p) && p.isActive);

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
      'breakfast': 'Café da manhã',
      'lunch': 'Almoço',
      'snack': 'Lanche',
      'dinner': 'Jantar',
      'supper': 'Ceia'
    };
    return types[type as keyof typeof types] || type;
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
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {planHistory.find(p => isPlanDiet(p) && p.isActive)?.meals && 
                             Object.entries(planHistory.find(p => isPlanDiet(p) && p.isActive)?.meals || {}).map(([day, dayMeals]: [string, any]) => (
                              <div key={day} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="font-medium text-sm capitalize mb-2">{day}</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {Object.entries(dayMeals).map(([mealType, meal]: [string, any]) => (
                                    <div key={mealType} className="text-xs p-2 bg-white dark:bg-gray-700 rounded">
                                      <div className="font-medium">{getMealTypeName(mealType)}</div>
                                      <div className="text-gray-600 dark:text-gray-400">{meal.name}</div>
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
                        {planHistory.find(p => !isPlanDiet(p) && p.isActive) && (
                          <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 text-xs mt-1">
                            <Check className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </div>
                    {planHistory.find(p => !isPlanDiet(p) && p.isActive) && (
                      <Button variant="outline" size="sm" onClick={() => handleExportPlan(planHistory.find(p => !isPlanDiet(p) && p.isActive)!)}>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar PDF
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {planHistory.find(p => !isPlanDiet(p) && p.isActive) ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {planHistory.find(p => !isPlanDiet(p) && p.isActive)?.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          Treino focado em ganho de massa muscular
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
                          <h4 className="font-medium mb-3">Cronograma de Treinos</h4>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {planHistory.find(p => !isPlanDiet(p) && p.isActive)?.meals && 
                             Object.entries(planHistory.find(p => !isPlanDiet(p) && p.isActive)?.meals || {}).map(([day, workout]: [string, any]) => (
                              <div key={day} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="font-medium text-sm capitalize mb-2">{day}</div>
                                <div className="space-y-2">
                                  {Object.entries(workout).map(([exerciseType, exercise]: [string, any]) => (
                                    <div key={exerciseType} className="text-xs p-2 bg-white dark:bg-gray-700 rounded">
                                      <div className="font-medium">{exerciseType}</div>
                                      <div className="text-gray-600 dark:text-gray-400">
                                        {typeof exercise === 'object' && exercise.name ? exercise.name : 
                                         typeof exercise === 'string' ? exercise : 'Exercício'}
                                      </div>
                                      {typeof exercise === 'object' && exercise.reps && (
                                        <div className="text-gray-500 text-xs">{exercise.reps} reps</div>
                                      )}
                                      {typeof exercise === 'object' && exercise.sets && (
                                        <div className="text-gray-500 text-xs">{exercise.sets} séries</div>
                                      )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planHistory.map((plan) => (
                  <Card key={plan.id} className="border border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isPlanDiet(plan) ? 'bg-green-100 dark:bg-green-800' : 'bg-blue-100 dark:bg-blue-800'}`}>
                            {isPlanDiet(plan) ? (
                              <Utensils className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <Dumbbell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-base">{plan.name}</CardTitle>
                            <Badge variant={plan.isActive ? "default" : "secondary"} className="text-xs">
                              {plan.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {plan.description}
                      </p>
                      <div className="text-xs text-gray-500">
                        Criado em {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
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