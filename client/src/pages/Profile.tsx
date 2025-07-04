import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [goals, setGoals] = useState({
    dailyCalories: 2000,
    dailyProtein: 120,
    dailyCarbs: 225,
    dailyFat: 67,
  });

  // Initialize goals from user data
  useEffect(() => {
    if (user) {
      setGoals({
        dailyCalories: user.dailyCalories || 2000,
        dailyProtein: user.dailyProtein || 120,
        dailyCarbs: user.dailyCarbs || 225,
        dailyFat: user.dailyFat || 67,
      });
    }
  }, [user]);

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

  // Update goals mutation
  const updateGoalsMutation = useMutation({
    mutationFn: async (newGoals: typeof goals) => {
      const response = await fetch("/api/user/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newGoals),
      });
      if (!response.ok) throw new Error("Failed to update goals");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
      toast({
        title: "Metas atualizadas!",
        description: "Suas metas nutricionais foram salvas com sucesso",
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
        title: "Erro ao salvar",
        description: "Não foi possível atualizar suas metas",
        variant: "destructive",
      });
    },
  });

  const handleSaveGoals = () => {
    // Validate goals
    if (goals.dailyCalories < 1200 || goals.dailyCalories > 5000) {
      toast({
        title: "Valor inválido",
        description: "Calorias diárias devem estar entre 1200 e 5000",
        variant: "destructive",
      });
      return;
    }

    if (goals.dailyProtein < 50 || goals.dailyProtein > 300) {
      toast({
        title: "Valor inválido",
        description: "Proteína diária deve estar entre 50g e 300g",
        variant: "destructive",
      });
      return;
    }

    updateGoalsMutation.mutate(goals);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      queryClient.clear(); // Clear all cached data
      window.location.href = "/auth"; // Redirect to auth page
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/auth";
    }
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', isDark.toString());
    toast({
      title: isDark ? "Modo escuro ativado" : "Modo claro ativado",
      description: "Sua preferência foi salva",
    });
  };

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const formatWeight = (weight: string | null | undefined) => {
    if (!weight) return '0';
    // Remove leading zeros and fix the weight display issue
    const numWeight = parseFloat(weight);
    return isNaN(numWeight) ? '0' : numWeight.toString();
  };

  const calculateBMI = () => {
    const weight = parseFloat((user?.weight as string) || "0");
    const height = user?.height || 0;
    
    if (weight > 0 && height > 0) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return "0";
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { text: "Abaixo do peso", color: "text-blue-600" };
    if (bmi < 25) return { text: "Peso normal", color: "text-green-600" };
    if (bmi < 30) return { text: "Sobrepeso", color: "text-yellow-600" };
    return { text: "Obesidade", color: "text-red-600" };
  };

  const bmi = parseFloat(calculateBMI());
  const bmiCategory = getBMICategory(bmi);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Perfil</h2>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt mr-2"></i>
          Sair
        </Button>
      </div>

      {/* User Info */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <i className="fas fa-user text-white text-2xl"></i>
            )}
          </div>
          <h3 className="font-semibold text-lg mb-1">
            {user?.firstName || user?.lastName 
              ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
              : 'Usuário'
            }
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{user?.email || 'Email não disponível'}</p>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{formatWeight(user?.weight)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">kg</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">{user?.height || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">cm</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{user?.age || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">anos</p>
            </div>
          </div>

          {/* BMI Display */}
          {user?.weight && user?.height && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">IMC:</span>
                <span className="font-semibold">{calculateBMI()}</span>
                <span className={`text-sm font-medium ${bmiCategory.color}`}>
                  ({bmiCategory.text})
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Goals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Metas Personalizadas</CardTitle>
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => isEditing ? handleSaveGoals() : setIsEditing(true)}
              disabled={updateGoalsMutation.isPending}
            >
              {updateGoalsMutation.isPending ? (
                <i className="fas fa-spinner fa-spin mr-2"></i>
              ) : isEditing ? (
                <i className="fas fa-save mr-2"></i>
              ) : (
                <i className="fas fa-edit mr-2"></i>
              )}
              {isEditing ? "Salvar" : "Personalizar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Label htmlFor="calories" className="text-sm font-medium">Calorias Diárias</Label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    id="calories"
                    type="number"
                    value={goals.dailyCalories}
                    onChange={(e) => setGoals(prev => ({ ...prev, dailyCalories: parseInt(e.target.value) || 0 }))}
                    className="w-20 text-right text-sm"
                    min="1200"
                    max="5000"
                  />
                ) : (
                  <span className="w-20 text-right text-sm font-semibold">{goals.dailyCalories}</span>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400">kcal</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Label htmlFor="protein" className="text-sm font-medium">Proteínas</Label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    id="protein"
                    type="number"
                    value={goals.dailyProtein}
                    onChange={(e) => setGoals(prev => ({ ...prev, dailyProtein: parseInt(e.target.value) || 0 }))}
                    className="w-16 text-right text-sm"
                    min="50"
                    max="300"
                  />
                ) : (
                  <span className="w-16 text-right text-sm font-semibold">{goals.dailyProtein}</span>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400">g</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Label htmlFor="carbs" className="text-sm font-medium">Carboidratos</Label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    id="carbs"
                    type="number"
                    value={goals.dailyCarbs}
                    onChange={(e) => setGoals(prev => ({ ...prev, dailyCarbs: parseInt(e.target.value) || 0 }))}
                    className="w-16 text-right text-sm"
                    min="100"
                    max="600"
                  />
                ) : (
                  <span className="w-16 text-right text-sm font-semibold">{goals.dailyCarbs}</span>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400">g</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Label htmlFor="fat" className="text-sm font-medium">Gorduras</Label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    id="fat"
                    type="number"
                    value={goals.dailyFat}
                    onChange={(e) => setGoals(prev => ({ ...prev, dailyFat: parseInt(e.target.value) || 0 }))}
                    className="w-16 text-right text-sm"
                    min="20"
                    max="200"
                  />
                ) : (
                  <span className="w-16 text-right text-sm font-semibold">{goals.dailyFat}</span>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400">g</span>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              <p>• Calorias: 1200-5000 kcal</p>
              <p>• Proteína: 50-300g</p>
              <p>• Carboidratos: 100-600g</p>
              <p>• Gorduras: 20-200g</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <div className="flex items-center">
              <i className="fas fa-bell text-gray-400 mr-3"></i>
              <div>
                <span className="text-sm font-medium">Notificações</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Lembrete diário às 20h</p>
              </div>
            </div>
            <Switch
              checked={user?.notificationsEnabled ?? true}
              onCheckedChange={(checked) => {
                // TODO: Implement notification preference update
                toast({
                  title: checked ? "Notificações ativadas" : "Notificações desativadas",
                  description: "Sua preferência foi salva",
                });
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-colors"
               onClick={toggleDarkMode}>
            <div className="flex items-center">
              <i className="fas fa-moon text-gray-400 mr-3"></i>
              <span className="text-sm font-medium">Modo Escuro</span>
            </div>
            <Switch
              checked={document.documentElement.classList.contains('dark')}
              onCheckedChange={() => {}} // Handled by onClick
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-colors"
               onClick={() => {
                 toast({
                   title: "Em breve",
                   description: "Funcionalidade de backup será implementada",
                 });
               }}>
            <div className="flex items-center">
              <i className="fas fa-download text-gray-400 mr-3"></i>
              <span className="text-sm font-medium">Backup de Dados</span>
            </div>
            <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-colors"
               onClick={() => {
                 toast({
                   title: "Em breve",
                   description: "Funcionalidade de exportação de dados será implementada",
                 });
               }}>
            <div className="flex items-center">
              <i className="fas fa-file-export text-gray-400 mr-3"></i>
              <span className="text-sm font-medium">Exportar Dados</span>
            </div>
            <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardContent className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-center mb-2">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center mr-2">
              <i className="fas fa-utensils text-white text-xs"></i>
            </div>
            <span className="font-semibold text-primary">NutrIA</span>
          </div>
          <p>Versão 1.0.0</p>
          <p className="mt-1">Seu assistente nutricional inteligente</p>
        </CardContent>
      </Card>
    </div>
  );
}
