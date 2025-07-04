import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Target, Activity, Clock, BarChart3, Zap, Download, FileText, Flame } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend } from "recharts";
import { ProgressRing } from "@/components/ProgressRing";
import { useToast } from "@/hooks/use-toast";
import { getNutritionalDay } from "@/lib/nutritionalDay";

interface HourlyData {
  hour: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface WeeklyData {
  date: string;
  dayName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MonthlyData {
  weekStart: string;
  weekEnd: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function Progress() {
  const [selectedDate, setSelectedDate] = useState(getNutritionalDay());
  const [activeView, setActiveView] = useState("daily");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentNutritionalDay, setCurrentNutritionalDay] = useState(getNutritionalDay());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Check for nutritional day changes
      const newNutritionalDay = getNutritionalDay();
      if (newNutritionalDay !== currentNutritionalDay) {
        setCurrentNutritionalDay(newNutritionalDay);
        setSelectedDate(newNutritionalDay);
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [currentNutritionalDay]);

  const { data: user } = useQuery({
    queryKey: ['/api/auth/user']
  });

  const { toast } = useToast();

  // PDF Export mutation
  const exportPDFMutation = useMutation({
    mutationFn: async ({ period, date }: { period: string; date: string }) => {
      const response = await fetch(`/api/reports/nutrition-pdf?period=${period}&date=${date}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Falha ao gerar relatório');
      
      const blob = await response.blob();
      return blob;
    },
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-nutricional-${variables.period}-${variables.date}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Relatório gerado!",
        description: "O download do seu relatório nutricional foi iniciado.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o relatório PDF. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const { data: hourlyData, isLoading: hourlyLoading } = useQuery<HourlyData[]>({
    queryKey: ['/api/progress/hourly', selectedDate],
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery<WeeklyData[]>({
    queryKey: ['/api/progress/weekly'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery<MonthlyData[]>({
    queryKey: ['/api/progress/monthly'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const { data: dailyNutrition, isLoading: dailyLoading } = useQuery({
    queryKey: ['/api/nutrition/daily', selectedDate],
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Progress calculations with type safety
  const progress = {
    calories: Math.round(((dailyNutrition as any)?.calories || 0) / ((user as any)?.dailyCalories || 1) * 100),
    protein: Math.round(((dailyNutrition as any)?.protein || 0) / ((user as any)?.dailyProtein || 1) * 100),
    carbs: Math.round(((dailyNutrition as any)?.carbs || 0) / ((user as any)?.dailyCarbs || 1) * 100),
    fat: Math.round(((dailyNutrition as any)?.fat || 0) / ((user as any)?.dailyFat || 1) * 100),
  };

  const formatHourlyChart = () => {
    if (!hourlyData || !Array.isArray(hourlyData)) return [];
    return hourlyData
      .filter(item => item.calories > 0 || item.protein > 0 || item.carbs > 0 || item.fat > 0)
      .map(item => ({
        time: `${item.hour}:00`,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
      }));
  };

  const macroDistribution = dailyNutrition ? [
    { name: 'Proteínas', value: (dailyNutrition as any).protein, color: '#3b82f6' },
    { name: 'Carboidratos', value: (dailyNutrition as any).carbs, color: '#f59e0b' },
    { name: 'Gorduras', value: (dailyNutrition as any).fat, color: '#ef4444' }
  ] : [];

  // Macronutrient Chart Component (similar to the reference image)
  const MacronutrientChart = () => {
    const totalCalories = (dailyNutrition as any)?.calories || 0;
    const currentProtein = (dailyNutrition as any)?.protein || 0;
    const currentCarbs = (dailyNutrition as any)?.carbs || 0;
    const currentFat = (dailyNutrition as any)?.fat || 0;
    const targetCalories = (user as any)?.dailyCalories || 2000;
    const remainingCalories = Math.max(0, targetCalories - totalCalories);

    return (
      <Card className="bg-gray-900 dark:bg-gray-900 bg-white dark:text-white text-gray-900 border-gray-200 dark:border-gray-700 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 dark:text-white text-lg">Progresso Diário</CardTitle>
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Circular Calories Display */}
          <div className="flex justify-center">
            <div className="relative">
              <svg width="180" height="180" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="90"
                  cy="90"
                  r="75"
                  stroke="rgb(229, 231, 235)"
                  className="dark:stroke-gray-600"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="90"
                  cy="90"
                  r="75"
                  stroke="#22c55e"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 75}`}
                  strokeDashoffset={`${2 * Math.PI * 75 * (1 - Math.min(1, totalCalories / targetCalories))}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {totalCalories}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">kcal</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {remainingCalories} restantes
                </div>
              </div>
            </div>
          </div>

          {/* Macronutrient Bars */}
          <div className="space-y-4">
            {/* Protein */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-blue-600 dark:text-blue-400 font-medium">Proteína</span>
                <span className="text-gray-900 dark:text-white font-semibold">{currentProtein}g</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (currentProtein / ((user as any)?.dailyProtein || 120)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Carbohydrates */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">Carboidratos</span>
                <span className="text-gray-900 dark:text-white font-semibold">{currentCarbs}g</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (currentCarbs / ((user as any)?.dailyCarbs || 250)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Fat */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-orange-600 dark:text-orange-400 font-medium">Gordura</span>
                <span className="text-gray-900 dark:text-white font-semibold">{currentFat}g</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (currentFat / ((user as any)?.dailyFat || 67)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderHourlyView = () => (
    <div className="space-y-8">
      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Progresso do Dia
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Atualizado em tempo real • {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
            <Zap className="w-3 h-3 mr-1" />
            Ao vivo
          </Badge>
          <Button
            onClick={() => exportPDFMutation.mutate({ period: 'daily', date: selectedDate })}
            disabled={exportPDFMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {exportPDFMutation.isPending ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Macronutrient Chart - Featured prominently */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <MacronutrientChart />
        </div>
        <div className="lg:col-span-2 space-y-6">
          {/* Gráfico do Dia do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Progresso ao Longo do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(hour) => `${hour}h`}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value, name) => [
                      `${value} ${name === 'calories' ? 'kcal' : 'g'}`,
                      name === 'calories' ? 'Calorias' : 
                      name === 'protein' ? 'Proteínas' : 'Total'
                    ]}
                  />
                  <Bar dataKey="calories" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Progress Cards - 2x2 Layout */}
      <div className="flex flex-wrap w-full">
        {/* Calories Card */}
        <div className="w-1/2 p-1 min-w-[160px]">
          <Card className="h-full relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10" />
            <CardContent className="relative p-3 text-center">
              <div className="mb-2">
                <div className="w-12 h-12 mx-auto mb-2 relative">
                  <ProgressRing progress={progress.calories} size={48} color="#22c55e">
                    <div className="text-center">
                      <div className="text-sm font-bold text-green-700">{progress.calories}%</div>
                    </div>
                  </ProgressRing>
                </div>
                <Activity className="w-4 h-4 text-green-600 mx-auto mb-1" />
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">Calorias</h3>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">
                    {(dailyNutrition as any)?.calories || 0}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    de {(user as any)?.dailyCalories || 0} kcal
                  </p>
                  <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress.calories, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Protein Card */}
        <div className="w-1/2 p-1 min-w-[160px]">
          <Card className="h-full relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-400/10" />
            <CardContent className="relative p-3 text-center">
              <div className="mb-2">
                <div className="w-12 h-12 mx-auto mb-2 relative">
                  <ProgressRing progress={progress.protein} size={48} color="#3b82f6">
                    <div className="text-center">
                      <div className="text-sm font-bold text-blue-700">{progress.protein}%</div>
                    </div>
                  </ProgressRing>
                </div>
                <Target className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Proteínas</h3>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {(dailyNutrition as any)?.protein || 0}g
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    de {(user as any)?.dailyProtein || 0}g
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress.protein, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carbs Card */}
        <div className="w-1/2 p-1 min-w-[160px]">
          <Card className="h-full relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-400/10" />
            <CardContent className="relative p-3 text-center">
              <div className="mb-2">
                <div className="w-12 h-12 mx-auto mb-2 relative">
                  <ProgressRing progress={progress.carbs} size={48} color="#f59e0b">
                    <div className="text-center">
                      <div className="text-sm font-bold text-amber-700">{progress.carbs}%</div>
                    </div>
                  </ProgressRing>
                </div>
                <TrendingUp className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Carboidratos</h3>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                    {(dailyNutrition as any)?.carbs || 0}g
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    de {(user as any)?.dailyCarbs || 0}g
                  </p>
                  <div className="w-full bg-amber-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress.carbs, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fat Card */}
        <div className="w-1/2 p-1 min-w-[160px]">
          <Card className="h-full relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
            <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-pink-400/10" />
            <CardContent className="relative p-3 text-center">
              <div className="mb-2">
                <div className="w-12 h-12 mx-auto mb-2 relative">
                  <ProgressRing progress={progress.fat} size={48} color="#ef4444">
                    <div className="text-center">
                      <div className="text-sm font-bold text-red-700">{progress.fat}%</div>
                    </div>
                  </ProgressRing>
                </div>
                <Calendar className="w-4 h-4 text-red-600 mx-auto mb-1" />
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Gorduras</h3>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">
                    {(dailyNutrition as any)?.fat || 0}g
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    de {(user as any)?.dailyFat || 0}g
                  </p>
                  <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress.fat, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Charts Section */}
      <div className="space-y-8">
        {/* Hourly Consumption Chart - Full Width */}
        {formatHourlyChart().length > 0 && (
          <Card className="w-full bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border-0 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                Consumo Nutricional por Hora
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Distribuição das calorias e macronutrientes ao longo do dia
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={formatHourlyChart()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="proteinGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="carbsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="fatGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value, name) => [
                      `${value} ${name === 'calories' ? 'kcal' : 'g'}`,
                      name === 'calories' ? 'Calorias' : 
                      name === 'protein' ? 'Proteínas' :
                      name === 'carbs' ? 'Carboidratos' : 'Gorduras'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="calories" 
                    stroke="#22c55e" 
                    fill="url(#caloriesGradient)"
                    strokeWidth={3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="protein" 
                    stroke="#3b82f6" 
                    fill="url(#proteinGradient)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="carbs" 
                    stroke="#f59e0b" 
                    fill="url(#carbsGradient)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="fat" 
                    stroke="#ef4444" 
                    fill="url(#fatGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Resumo Nutricional Simplificado */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Resumo das Metas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-lg font-bold text-green-600">
                  {Math.round((((dailyNutrition as any)?.calories || 0) / ((user as any)?.dailyCalories || 2000)) * 100)}%
                </div>
                <div className="text-xs text-green-700 dark:text-green-400">Calorias</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-lg font-bold text-blue-600">
                  {Math.round((((dailyNutrition as any)?.protein || 0) / ((user as any)?.dailyProtein || 120)) * 100)}%
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-400">Proteína</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">
                  {Math.round((((dailyNutrition as any)?.carbs || 0) / ((user as any)?.dailyCarbs || 250)) * 100)}%
                </div>
                <div className="text-xs text-yellow-700 dark:text-yellow-400">Carboidratos</div>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-lg font-bold text-orange-600">
                  {Math.round((((dailyNutrition as any)?.fat || 0) / ((user as any)?.dailyFat || 67)) * 100)}%
                </div>
                <div className="text-xs text-orange-700 dark:text-orange-400">Gorduras</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderWeeklyView = () => (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Progresso Semanal
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Últimos 7 dias de progresso nutricional
          </p>
        </div>
        <Button
          onClick={() => exportPDFMutation.mutate({ period: 'weekly', date: selectedDate })}
          disabled={exportPDFMutation.isPending}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {exportPDFMutation.isPending ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          Relatório Semanal
        </Button>
      </div>

      {weeklyData && weeklyData.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              Tendência Semanal de Calorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="dayName" 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, fill: '#8b5cf6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderMonthlyView = () => (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Progresso Mensal
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visão geral do mês atual
          </p>
        </div>
        <Button
          onClick={() => exportPDFMutation.mutate({ period: 'monthly', date: selectedDate })}
          disabled={exportPDFMutation.isPending}
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
        >
          {exportPDFMutation.isPending ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
          ) : (
            <Calendar className="w-4 h-4 mr-2" />
          )}
          Relatório Mensal
        </Button>
      </div>

      {monthlyData && monthlyData.length > 0 && (
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              Progresso Mensal por Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="weekStart" 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  }}
                  labelFormatter={(value) => `Semana: ${new Date(value).toLocaleDateString('pt-BR')}`}
                />
                <Bar 
                  dataKey="avgCalories" 
                  fill="url(#monthlyGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      {renderHourlyView()}
    </div>
  );
}