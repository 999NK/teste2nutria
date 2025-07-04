import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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

// Componente Smart Plan Card com melhorias UX
interface SmartPlanCardProps {
  type: 'nutrition' | 'workout';
  plan?: MealPlan;
  allPlans: MealPlan[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onActivate: (planId: number) => void;
  onDelete: (planId: number) => void;
  progressData: { dietCompleted: boolean; workoutCompleted: boolean };
}

function SmartPlanCard({ type, plan, allPlans, isExpanded, onToggleExpand, onActivate, onDelete, progressData }: SmartPlanCardProps) {
  const isNutrition = type === 'nutrition';
  const icon = isNutrition ? Utensils : Dumbbell;
  const IconComponent = icon;
  const title = isNutrition ? 'Plano Nutricional' : 'Plano de Treino';
  const isActive = plan?.isActive;
  const completed = isNutrition ? progressData.dietCompleted : progressData.workoutCompleted;
  
  // Calcular progresso baseado em dados fictícios para demonstração
  const progressPercentage = completed ? 100 : Math.floor(Math.random() * 80) + 10;
  const consecutiveDays = Math.floor(Math.random() * 7) + 1;

  return (
    <Card className={`transition-all duration-300 ${
      isActive 
        ? 'border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg' 
        : 'border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
    }`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              isActive 
                ? isNutrition ? 'bg-green-100 dark:bg-green-800' : 'bg-blue-100 dark:bg-blue-800'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <IconComponent className={`w-6 h-6 ${
                isActive 
                  ? isNutrition ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500'
              }`} />
            </div>
            <div>
              <CardTitle className={`text-lg font-bold ${isActive ? '' : 'text-gray-500'}`}>
                {title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {isActive ? (
                  <>
                    <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200 text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      Ativo
                    </Badge>
                    {completed && (
                      <Badge variant="outline" className="text-yellow-700 bg-yellow-50 border-yellow-200 text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        Concluído hoje
                      </Badge>
                    )}
                  </>
                ) : (
                  <Badge variant="secondary" className="text-gray-600 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Inativo
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {}}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(plan!.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggleExpand}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isActive && plan ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{plan.name}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{plan.description}</p>
            </div>
            
            {/* Progresso Visual */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Progresso hoje</span>
                <span className="font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <TrendingUp className="w-3 h-3" />
                <span>{consecutiveDays} dias seguidos</span>
                {consecutiveDays >= 3 && <span className="text-green-600">🔥</span>}
              </div>
            </div>

            {isExpanded && (
              <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                {isNutrition ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">{plan.dailyCalories}</div>
                      <div className="text-xs text-orange-700 dark:text-orange-400">kcal/dia</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{plan.macroProtein}g</div>
                      <div className="text-xs text-blue-700 dark:text-blue-400">Proteína</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>Ver cronograma completo de treinos</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
              Nenhum {isNutrition ? 'plano nutricional' : 'plano de treino'} ativo
            </p>
            {allPlans.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">Planos disponíveis:</p>
                {allPlans.slice(0, 2).map(p => (
                  <Button
                    key={p.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onActivate(p.id)}
                    className="w-full text-left justify-start text-xs"
                  >
                    {p.name}
                  </Button>
                ))}
              </div>
            ) : (
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Criar primeiro plano
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MyPlan() {
  const [activeTab, setActiveTab] = useState("current");
  const [selectedPlanType, setSelectedPlanType] = useState<'diet' | 'workout'>('diet');
  const [userDescription, setUserDescription] = useState("");
  const [progressData, setProgressData] = useState({
    dietCompleted: false,
    workoutCompleted: false
  });
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
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch active plan
  const { data: activePlan } = useQuery<MealPlan | null>({
    queryKey: ['/api/user-plans/active'],
    retry: false,
    enabled: isAuthenticated,
  });

  // Fetch plan history
  const { data: planHistory = [] } = useQuery<MealPlan[]>({
    queryKey: ['/api/user-plans/history'],
    retry: false,
    enabled: isAuthenticated,
  });

  // Generate plan mutation
  const generatePlanMutation = useMutation({
    mutationFn: async (data: { description: string; type: 'diet' | 'workout' }) => {
      const endpoint = data.type === 'diet' ? '/api/generate-meal-plan' : '/api/generate-workout-plan';
      return await apiRequest(endpoint, 'POST', { description: data.description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans/history'] });
      toast({
        title: "Plano criado com sucesso!",
        description: "Seu novo plano personalizado foi gerado e ativado.",
      });
      setUserDescription("");
    },
    onError: (error: any) => {
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
        title: "Erro ao gerar plano",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    },
  });

  // Activate plan mutation
  const activatePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      return await apiRequest(`/api/user-plans/${planId}/activate`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans/history'] });
      toast({
        title: "Plano ativado",
        description: "O plano foi ativado com sucesso.",
      });
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      return await apiRequest(`/api/user-plans/${planId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans/history'] });
      toast({
        title: "Plano excluído",
        description: "O plano foi removido com sucesso.",
      });
    },
  });

  const handleGeneratePlan = () => {
    if (!userDescription.trim()) {
      toast({
        title: "Descrição necessária",
        description: "Por favor, descreva seus objetivos e preferências.",
        variant: "destructive",
      });
      return;
    }

    generatePlanMutation.mutate({
      description: userDescription,
      type: selectedPlanType
    });
  };

  const handleProgressUpdate = (type: 'diet' | 'workout', completed: boolean) => {
    setProgressData(prev => ({
      ...prev,
      [type === 'diet' ? 'dietCompleted' : 'workoutCompleted']: completed
    }));
  };

  const handleExportPlan = (plan: MealPlan) => {
    toast({
      title: "Exportando plano",
      description: "O download do seu plano será iniciado em breve.",
    });
  };

  const handleSwitchPlanType = (plan: MealPlan) => {
    const newType = isPlanDiet(plan) ? 'workout' : 'diet';
    toast({
      title: "Alterando tipo do plano",
      description: `Convertendo para plano de ${newType === 'diet' ? 'dieta' : 'treino'}...`,
    });
  };

  const isPlanDiet = (plan: MealPlan) => {
    return plan.dailyCalories > 0;
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

  // Funções para os cards inteligentes
  const handleActivatePlan = async (planId: number) => {
    try {
      const response = await fetch(`/api/user-plans/${planId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to activate plan');
      
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans/history'] });
      toast({
        title: "Plano ativado",
        description: "Plano ativado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao ativar plano. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlan = async (planId: number) => {
    try {
      const response = await fetch(`/api/user-plans/${planId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to delete plan');
      
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-plans/history'] });
      toast({
        title: "Plano excluído",
        description: "Plano excluído com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir plano. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-7xl xl:h-screen xl:flex xl:flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full xl:flex-1 xl:flex xl:flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-12 xl:flex-shrink-0">
            <TabsTrigger value="current" className="flex items-center gap-2 text-base">
              <Target className="w-5 h-5" />
              Plano Atual
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
            {/* Cards de Planos Atuais Simplificados */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                        {planHistory.find(p => isPlanDiet(p) && p.isActive) && (
                          <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200 text-xs mt-1">
                            <Check className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </div>
                    {planHistory.find(p => isPlanDiet(p) && p.isActive) && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar PDF
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {planHistory.find(p => isPlanDiet(p) && p.isActive) ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {planHistory.find(p => isPlanDiet(p) && p.isActive)?.name}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div className="text-lg font-bold text-orange-600">{planHistory.find(p => isPlanDiet(p) && p.isActive)?.dailyCalories}</div>
                            <div className="text-xs text-orange-700 dark:text-orange-400">kcal/dia</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-lg font-bold text-blue-600">{planHistory.find(p => isPlanDiet(p) && p.isActive)?.macroProtein}g</div>
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
                          {/* Aqui será renderizado o cronograma completo de refeições */}
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
                      <Button variant="outline" size="sm">
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
                      <Button variant="outline" size="sm">
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
                          {/* Aqui será renderizado o cronograma completo de exercícios */}
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
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Criar plano
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Seção removida - progresso diário foi movido para Dashboard */}
          </TabsContent>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {isPlanDiet(activePlan) ? (
                          <div className="p-4 bg-green-100 dark:bg-green-800 rounded-2xl">
                            <Utensils className="w-8 h-8 text-green-600 dark:text-green-400" />
                          </div>
                        ) : (
                          <div className="p-4 bg-blue-100 dark:bg-blue-800 rounded-2xl">
                            <Dumbbell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-2xl lg:text-3xl font-bold">
                            {activePlan.name}
                          </CardTitle>
                          <CardDescription className="text-base mt-2 max-w-lg">
                            {activePlan.description}
                          </CardDescription>
                          <div className="flex items-center gap-3 mt-3">
                            <Badge variant={isPlanDiet(activePlan) ? "default" : "secondary"} className="text-sm px-3 py-1">
                              {isPlanDiet(activePlan) ? "Plano Nutricional" : "Plano de Treino"}
                            </Badge>
                            <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200 px-3 py-1">
                              <Check className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          onClick={() => handleExportPlan(activePlan)}
                          className="flex items-center gap-2 px-4 py-2"
                        >
                          <Download className="w-4 h-4" />
                          Exportar PDF
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSwitchPlanType(activePlan)}
                          className="flex items-center gap-2 px-4 py-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Alterar Tipo
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:flex-1 xl:min-h-0">
                  {/* Plan Details - Takes up 2 columns on XL screens */}
                  <div className="xl:col-span-2 space-y-6 xl:h-full xl:overflow-y-auto">
                    {/* Nutrition/Workout Stats */}
                    <Card className="shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          {isPlanDiet(activePlan) ? (
                            <>
                              <Utensils className="w-6 h-6 text-green-600" />
                              Informações Nutricionais
                            </>
                          ) : (
                            <>
                              <Dumbbell className="w-6 h-6 text-blue-600" />
                              Informações do Treino
                            </>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isPlanDiet(activePlan) ? (
                          <div className="space-y-6">
                            {/* Macro Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 shadow-sm">
                                <div className="text-3xl lg:text-4xl font-bold text-orange-600 mb-1">
                                  {activePlan.dailyCalories}
                                </div>
                                <div className="text-sm font-medium text-orange-700 dark:text-orange-400">
                                  Calorias/dia
                                </div>
                              </div>
                              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 shadow-sm">
                                <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-1">
                                  {activePlan.macroProtein}g
                                </div>
                                <div className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                  Proteína
                                </div>
                              </div>
                              <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl border border-amber-200 shadow-sm">
                                <div className="text-3xl lg:text-4xl font-bold text-amber-600 mb-1">
                                  {activePlan.macroCarbs}g
                                </div>
                                <div className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                  Carboidratos
                                </div>
                              </div>
                              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 shadow-sm">
                                <div className="text-3xl lg:text-4xl font-bold text-purple-600 mb-1">
                                  {activePlan.macroFat}g
                                </div>
                                <div className="text-sm font-medium text-purple-700 dark:text-purple-400">
                                  Gordura
                                </div>
                              </div>
                            </div>

                            {/* Weekly Meal Plan */}
                            {activePlan.meals && (
                              <div>
                                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                  <Calendar className="w-5 h-5" />
                                  Refeições da Semana
                                </h4>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                  {Object.entries(activePlan.meals).map(([day, dayMeals]: [string, any]) => (
                                    <Card key={day} className="border border-gray-200 dark:border-gray-700">
                                      <CardHeader className="pb-3">
                                        <CardTitle className="text-lg capitalize font-semibold">
                                          {day}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {Object.entries(dayMeals).map(([mealType, meal]: [string, any]) => (
                                            <div key={mealType} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                              <div className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                                {getMealTypeName(mealType)}
                                              </div>
                                              <div className="text-sm font-semibold mt-1">
                                                {meal.name}
                                              </div>
                                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {meal.calories} kcal
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200">
                              <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                                Plano de Exercícios Personalizado
                              </h4>
                              <p className="text-blue-700 dark:text-blue-300">
                                Treino desenvolvido especificamente para suas características e objetivos
                              </p>
                            </div>

                            {/* Workout Schedule */}
                            {activePlan.meals && (
                              <div>
                                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                  <Calendar className="w-5 h-5" />
                                  Cronograma de Treinos
                                </h4>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                  {Object.entries(activePlan.meals).map(([day, workout]: [string, any]) => (
                                    <Card key={day} className="border border-gray-200 dark:border-gray-700">
                                      <CardHeader className="pb-3">
                                        <CardTitle className="text-lg capitalize font-semibold">
                                          {day}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {Object.entries(workout).map(([exerciseType, exercise]: [string, any]) => (
                                            <div key={exerciseType} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                              <div className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                                {exerciseType}
                                              </div>
                                              <div className="text-sm font-semibold mt-1">
                                                {typeof exercise === 'object' && exercise.name ? exercise.name : 
                                                 typeof exercise === 'string' ? exercise : 
                                                 'Exercício'}
                                              </div>
                                              {typeof exercise === 'object' && exercise.duration && (
                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                  <Clock className="w-3 h-3" />
                                                  {exercise.duration}
                                                </div>
                                              )}
                                              {typeof exercise === 'object' && exercise.reps && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                  {exercise.reps} repetições
                                                </div>
                                              )}
                                              {typeof exercise === 'object' && exercise.sets && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                  {exercise.sets} séries
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Progress Sidebar */}
                  <div className="xl:h-full xl:flex xl:flex-col space-y-6">
                    {/* Daily Progress */}
                    <Card className="shadow-md xl:flex-1 xl:flex xl:flex-col xl:overflow-hidden">
                      <CardHeader className="xl:flex-shrink-0">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <TrendingUp className="w-6 h-6 text-purple-600" />
                          Progresso Diário
                        </CardTitle>
                        <CardDescription>
                          Acompanhe suas conquistas de hoje
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 xl:flex-1 xl:overflow-y-auto">
                        {/* Diet Progress */}
                        <div className="p-4 border-2 rounded-xl transition-all hover:shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg transition-colors ${progressData.dietCompleted ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                <Utensils className={`w-5 h-5 ${progressData.dietCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`} />
                              </div>
                              <div>
                                <div className="font-semibold">Dieta</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Seguiu o plano alimentar
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={progressData.dietCompleted ? "default" : "outline"}
                              onClick={() => handleProgressUpdate('diet', true)}
                              className="flex-1"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Sim
                            </Button>
                            <Button
                              size="sm"
                              variant={!progressData.dietCompleted ? "destructive" : "outline"}
                              onClick={() => handleProgressUpdate('diet', false)}
                              className="flex-1"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Não
                            </Button>
                          </div>
                        </div>

                        {/* Workout Progress */}
                        <div className="p-4 border-2 rounded-xl transition-all hover:shadow-md">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg transition-colors ${progressData.workoutCompleted ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                <Dumbbell className={`w-5 h-5 ${progressData.workoutCompleted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`} />
                              </div>
                              <div>
                                <div className="font-semibold">Treino</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Completou os exercícios
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={progressData.workoutCompleted ? "default" : "outline"}
                              onClick={() => handleProgressUpdate('workout', true)}
                              className="flex-1"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Sim
                            </Button>
                            <Button
                              size="sm"
                              variant={!progressData.workoutCompleted ? "destructive" : "outline"}
                              onClick={() => handleProgressUpdate('workout', false)}
                              className="flex-1"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Não
                            </Button>
                          </div>
                        </div>

                        {/* Progress Summary */}
                        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold">Progresso Geral</span>
                            <span className="text-lg font-bold">
                              {(progressData.dietCompleted && progressData.workoutCompleted) ? '100%' : 
                               (progressData.dietCompleted || progressData.workoutCompleted) ? '50%' : '0%'}
                            </span>
                          </div>
                          <Progress 
                            value={(progressData.dietCompleted ? 50 : 0) + (progressData.workoutCompleted ? 50 : 0)} 
                            className="h-3"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="shadow-md xl:flex-shrink-0 xl:h-auto">
                      <CardHeader>
                        <CardTitle className="text-lg">Estatísticas Rápidas</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium">Plano criado em</span>
                          <span className="text-sm font-semibold">
                            {new Date(activePlan.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium">Tipo</span>
                          <span className="text-sm font-semibold">
                            {isPlanDiet(activePlan) ? 'Nutricional' : 'Treino'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ) : (
              <Card className="text-center py-16">
                <CardContent>
                  <div className="space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Target className="w-10 h-10 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-2">Nenhum plano ativo</h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Crie seu primeiro plano personalizado usando nossa IA avançada ou configure manualmente
                      </p>
                    </div>
                    <Button 
                      onClick={() => setActiveTab("manual")}
                      size="lg"
                      className="px-8 py-3"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Criar Primeiro Plano
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            {/* Manual Plan Creation */}
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

                {/* User Characteristics */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Suas Características Atuais
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                        {user && 'weight' in user ? (user as any).weight : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Peso (kg)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                        {user && 'height' in user ? (user as any).height : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Altura (cm)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                        {user && 'age' in user ? (user as any).age : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Idade</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {user && 'goal' in user ? (user as any).goal : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Objetivo</div>
                    </div>
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
                    <>
                      <Target className="w-5 h-5 mr-2" />
                      Gerar Plano com IA {selectedPlanType === 'diet' ? 'Nutricionista' : 'Personal Trainer'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {planHistory.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {planHistory.map((plan: MealPlan) => (
                  <Card key={plan.id} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {isPlanDiet(plan) ? (
                            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                              <Utensils className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                          ) : (
                            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                              <Dumbbell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <CardDescription className="mt-1">{plan.description}</CardDescription>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={isPlanDiet(plan) ? "default" : "secondary"} className="text-xs">
                                {isPlanDiet(plan) ? "Nutricional" : "Treino"}
                              </Badge>
                              {plan.isActive && (
                                <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200 text-xs">
                                  Ativo
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => activatePlanMutation.mutate(plan.id)}
                            disabled={plan.isActive}
                            variant={plan.isActive ? "outline" : "default"}
                          >
                            {plan.isActive ? 'Ativo' : 'Ativar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deletePlanMutation.mutate(plan.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Criado em {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-16">
                <CardContent>
                  <div className="space-y-4">
                    <Calendar className="w-16 h-16 mx-auto text-gray-400" />
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