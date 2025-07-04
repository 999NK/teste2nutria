import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Target,
  Plus,
  Check,
  Dumbbell,
  Utensils,
  Download,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [selectedPlanType, setSelectedPlanType] = useState<"diet" | "workout">(
    "diet",
  );
  const [userDescription, setUserDescription] = useState("");
  const [expandedCards, setExpandedCards] = useState<{
    [key: string]: boolean;
  }>({});
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
  const { data: activePlans = [], isLoading: activePlanLoading } = useQuery<
    MealPlan[]
  >({
    queryKey: ["/api/user-plans/active"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Separate nutrition and workout plans
  const nutritionPlan = activePlans.find(
    (plan) => plan.type === "nutrition" || !plan.type,
  );
  const workoutPlan = activePlans.find((plan) => plan.type === "workout");

  // Fetch plan history
  const { data: planHistory = [], isLoading: historyLoading } = useQuery<
    MealPlan[]
  >({
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
      const endpoint =
        data.type === "diet"
          ? "/api/generate-meal-plan"
          : "/api/generate-workout-plan";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: data.description }),
      });
      if (!response.ok) throw new Error("Failed to generate plan");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-plans/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-plans/history"] });
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
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to activate plan");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-plans/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-plans/history"] });
      toast({
        title: "Plano ativado com sucesso!",
        description: "Seu plano agora está ativo.",
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
        title: "Erro ao ativar plano",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  const handleGeneratePlan = () => {
    if (!userDescription.trim()) {
      toast({
        title: "Descrição obrigatória",
        description: "Por favor, descreva suas preferências e objetivos.",
        variant: "destructive",
      });
      return;
    }
    generatePlanMutation.mutate({
      type: selectedPlanType,
      description: userDescription,
    });
  };

  const handleExportPlan = async (plan: MealPlan) => {
    try {
      const response = await fetch("/api/export-plan-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });

      if (!response.ok) throw new Error("Failed to export PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${plan.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF exportado com sucesso!",
        description: "O arquivo foi baixado para seu dispositivo.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar PDF",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || activePlanLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Carregando seus planos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-6">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="current">Planos Atuais</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="manual">Criar Plano</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Card Plano de Nutrição Atual */}
              <Card className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-green-100 dark:bg-green-800">
                        <Utensils className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">
                          Plano de Nutrição Atual
                        </CardTitle>
                        {activeNutritionPlan && (
                          <Badge
                            variant="outline"
                            className="text-green-700 bg-green-50 border-green-200 text-xs mt-1"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </div>
                    {activeNutritionPlan && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPlan(activeNutritionPlan)}
                        className="h-8 px-3 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Salvar
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
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {activeNutritionPlan.description}
                        </p>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Calorias
                            </div>
                            <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                              {activeNutritionPlan.dailyCalories}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Proteína
                            </div>
                            <div className="font-bold text-lg text-green-600 dark:text-green-400">
                              {activeNutritionPlan.macroProtein}g
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            setExpandedCards((prev) => ({
                              ...prev,
                              nutrition: !prev.nutrition,
                            }))
                          }
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
                          <h4 className="font-medium mb-3">
                            Cronograma Nutricional
                          </h4>
                          <div className="space-y-3 max-h-80 overflow-y-auto">
                            {activeNutritionPlan.meals &&
                              Object.entries(
                                typeof activeNutritionPlan.meals === "string"
                                  ? JSON.parse(activeNutritionPlan.meals)
                                  : activeNutritionPlan.meals,
                              ).map(([day, dayMeals]: [string, any]) => {
                                // Convert day keys to proper day names
                                const dayNames: { [key: string]: string } = {
                                  'segunda': 'Segunda-feira',
                                  'terca': 'Terça-feira', 
                                  'quarta': 'Quarta-feira',
                                  'quinta': 'Quinta-feira',
                                  'sexta': 'Sexta-feira',
                                  'sabado': 'Sábado',
                                  'domingo': 'Domingo'
                                };
                                
                                const dayName = dayNames[day] || day;
                                
                                return (
                                  <div
                                    key={day}
                                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                  >
                                    <h5 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                                      {dayName}
                                    </h5>
                                    <div className="space-y-3">
                                      {Object.entries(dayMeals).map(
                                        ([mealType, meal]: [string, any]) => (
                                          <div
                                            key={mealType}
                                            className="p-3 bg-white dark:bg-gray-700 rounded-lg"
                                          >
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                                {meal.name}
                                              </div>
                                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {meal.time || ''}
                                              </div>
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                              {meal.description}
                                            </div>
                                            <div className="flex gap-4 text-xs">
                                              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                                                {meal.calories} kcal
                                              </span>
                                              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                                                {meal.protein}g proteína
                                              </span>
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                        Nenhum plano de nutrição ativo
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("manual")}
                      >
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
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-800">
                        <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">
                          Plano de Treino Atual
                        </CardTitle>
                        {activeWorkoutPlan && (
                          <Badge
                            variant="outline"
                            className="text-blue-700 bg-blue-50 border-blue-200 text-xs mt-1"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </div>
                    {activeWorkoutPlan && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportPlan(activeWorkoutPlan)}
                        className="h-8 px-3 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Salvar
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
                          onClick={() =>
                            setExpandedCards((prev) => ({
                              ...prev,
                              workout: !prev.workout,
                            }))
                          }
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
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              Cronograma de Treinos
                            </h4>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const container =
                                    document.getElementById(
                                      "workout-container",
                                    );
                                  if (container) {
                                    container.scrollBy({
                                      left: -320,
                                      behavior: "smooth",
                                    });
                                  }
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const container =
                                    document.getElementById(
                                      "workout-container",
                                    );
                                  if (container) {
                                    container.scrollBy({
                                      left: 320,
                                      behavior: "smooth",
                                    });
                                  }
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div
                            id="workout-container"
                            className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory"
                            style={{ maxHeight: "600px" }}
                          >
                            {activeWorkoutPlan.meals &&
                              Object.entries(
                                typeof activeWorkoutPlan.meals === "string"
                                  ? JSON.parse(activeWorkoutPlan.meals)
                                  : activeWorkoutPlan.meals,
                              ).map(
                                ([workoutLetter, workout]: [string, any]) => (
                                  <div
                                    key={workoutLetter}
                                    className="flex-shrink-0 w-80 bg-gray-100 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 snap-start"
                                    style={{
                                      maxHeight: "550px",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <div className="text-center mb-4">
                                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                        {workout.name ||
                                          `Treino ${workoutLetter.toUpperCase()}`}
                                      </h3>
                                      {workout.duration && (
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                          Duração: {workout.duration}
                                        </div>
                                      )}
                                    </div>

                                    <div className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                                      <div className="grid grid-cols-2 bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold text-sm">
                                        <div className="p-3 border-r border-gray-200 dark:border-gray-500">
                                          Exercício
                                        </div>
                                        <div className="p-3 text-center">
                                          Séries e Repetições
                                        </div>
                                      </div>
                                      <div className="max-h-64 overflow-y-auto">
                                        {workout.exercises &&
                                          workout.exercises.map(
                                            (exercise: any, index: number) => (
                                              <div
                                                key={index}
                                                className={`grid grid-cols-2 text-sm ${index % 2 === 0 ? "bg-white dark:bg-gray-700" : "bg-gray-50 dark:bg-gray-600"}`}
                                              >
                                                <div className="p-3 border-r border-gray-200 dark:border-gray-500 text-gray-900 dark:text-gray-100 font-medium">
                                                  {exercise.name ||
                                                    `Exercício ${index + 1}`}
                                                </div>
                                                <div className="p-3 text-center text-gray-900 dark:text-gray-100 font-semibold">
                                                  {exercise.sets || "4"} ×{" "}
                                                  {exercise.reps || "8-10"}
                                                </div>
                                              </div>
                                            ),
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                        Nenhum plano de treino ativo
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("manual")}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Criar plano
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Histórico de Planos</CardTitle>
                <CardDescription className="text-base">
                  Visualize e gerencie todos os seus planos anteriores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {planHistory.length > 0 ? (
                  <div className="space-y-4">
                    {/* Navigation controls */}
                    <div className="flex justify-between items-center mb-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentHistoryIndex((prev) =>
                            Math.max(0, prev - 1),
                          )
                        }
                        disabled={currentHistoryIndex === 0}
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Anterior
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {currentHistoryIndex + 1} de {planHistory.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentHistoryIndex((prev) =>
                            Math.min(planHistory.length - 1, prev + 1),
                          )
                        }
                        disabled={
                          currentHistoryIndex === planHistory.length - 1
                        }
                      >
                        Próximo
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>

                    {/* Current plan display */}
                    {planHistory[currentHistoryIndex] && (
                      <Card className="border-2 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                {planHistory[currentHistoryIndex].name}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {planHistory[currentHistoryIndex].description}
                              </CardDescription>
                              <div className="flex gap-2 mt-2">
                                <Badge
                                  variant={
                                    isPlanDiet(planHistory[currentHistoryIndex])
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {isPlanDiet(planHistory[currentHistoryIndex])
                                    ? "Nutrição"
                                    : "Treino"}
                                </Badge>
                                {planHistory[currentHistoryIndex].isActive && (
                                  <Badge
                                    variant="outline"
                                    className="text-green-700 bg-green-50 border-green-200"
                                  >
                                    Ativo
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-xs"
                                >
                                  Ações
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {!planHistory[currentHistoryIndex].isActive && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      activatePlanMutation.mutate(
                                        planHistory[currentHistoryIndex].id,
                                      )
                                    }
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Ativar Plano
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleExportPlan(
                                      planHistory[currentHistoryIndex],
                                    )
                                  }
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Salvar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Criado em:{" "}
                            {new Date(
                              planHistory[currentHistoryIndex].createdAt,
                            ).toLocaleDateString("pt-BR")}
                          </div>
                          {isPlanDiet(planHistory[currentHistoryIndex]) && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Calorias
                                </div>
                                <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                  {
                                    planHistory[currentHistoryIndex]
                                      .dailyCalories
                                  }
                                </div>
                              </div>
                              <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Proteína
                                </div>
                                <div className="font-bold text-lg text-green-600 dark:text-green-400">
                                  {
                                    planHistory[currentHistoryIndex]
                                      .macroProtein
                                  }
                                  g
                                </div>
                              </div>
                              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Carboidratos
                                </div>
                                <div className="font-bold text-lg text-yellow-600 dark:text-yellow-400">
                                  {planHistory[currentHistoryIndex].macroCarbs}g
                                </div>
                              </div>
                              <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  Gordura
                                </div>
                                <div className="font-bold text-lg text-red-600 dark:text-red-400">
                                  {planHistory[currentHistoryIndex].macroFat}g
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                      Nenhum plano no histórico
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm">
                      Crie seu primeiro plano na aba "Criar Plano"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Criar Plano Personalizado
                </CardTitle>
                <CardDescription className="text-base">
                  Desenvolva seu plano ideal baseado nas suas características e
                  objetivos pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Type Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Tipo de Plano</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant={
                        selectedPlanType === "diet" ? "default" : "outline"
                      }
                      onClick={() => setSelectedPlanType("diet")}
                      className="h-16 flex items-center gap-3"
                    >
                      <Utensils className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-semibold">Plano Nutricional</div>
                        <div className="text-xs opacity-70">
                          Cardápio e refeições
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant={
                        selectedPlanType === "workout" ? "default" : "outline"
                      }
                      onClick={() => setSelectedPlanType("workout")}
                      className="h-16 flex items-center gap-3"
                    >
                      <Dumbbell className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-semibold">Plano de Treino</div>
                        <div className="text-xs opacity-70">
                          Exercícios e rotina
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Descreva seus objetivos e preferências
                  </label>
                  <Textarea
                    placeholder={
                      selectedPlanType === "diet"
                        ? "Ex: Quero um plano para ganho de massa muscular, com refeições brasileiras típicas, sem lactose..."
                        : "Ex: Quero um treino para hipertrofia, 3x por semana, focado em peito, costas e pernas..."
                    }
                    value={userDescription}
                    onChange={(e) => setUserDescription(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                </div>

                <Button
                  onClick={handleGeneratePlan}
                  disabled={
                    generatePlanMutation.isPending || !userDescription.trim()
                  }
                  className="w-full h-12"
                >
                  {generatePlanMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Gerando plano...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Gerar{" "}
                      {selectedPlanType === "diet"
                        ? "Plano Nutricional"
                        : "Plano de Treino"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
