import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Heart, Target, Scale, Ruler, Calendar } from "lucide-react";

const profileSchema = z.object({
  weight: z.number().min(30, "Peso deve ser maior que 30kg").max(300, "Peso deve ser menor que 300kg"),
  height: z.number().min(100, "Altura deve ser maior que 100cm").max(250, "Altura deve ser menor que 250cm"),
  age: z.number().min(13, "Idade deve ser maior que 13 anos").max(120, "Idade deve ser menor que 120 anos"),
  goal: z.enum(["lose", "gain", "maintain"], {
    required_error: "Selecione um objetivo",
  }),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"], {
    required_error: "Selecione seu nível de atividade",
  }),
});

type ProfileData = z.infer<typeof profileSchema>;

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      weight: undefined,
      height: undefined,
      age: undefined,
      goal: undefined,
      activityLevel: "moderate",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      const goals = calculateNutritionGoals(data);
      return await apiRequest(`/api/user/goals`, "PATCH", {
        ...data,
        ...goals,
        isProfileComplete: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "Perfil configurado!",
        description: "Suas metas nutricionais foram calculadas automaticamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao salvar perfil. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const calculateNutritionGoals = (data: ProfileData) => {
    // Calculadora de BMR usando fórmula Mifflin-St Jeor
    const weightKg = data.weight;
    const heightCm = data.height;
    const age = data.age;

    // Assumindo gênero masculino para simplificação (pode ser adicionado depois)
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

    // Fatores de atividade
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = bmr * activityMultipliers[data.activityLevel];

    // Ajuste de calorias baseado no objetivo
    let dailyCalories = tdee;
    if (data.goal === "lose") {
      dailyCalories = tdee - 500; // Déficit de 500 cal para perda de 0.5kg/semana
    } else if (data.goal === "gain") {
      dailyCalories = tdee + 300; // Surplus de 300 cal para ganho controlado
    }

    // Cálculo de macronutrientes
    const proteinCalories = dailyCalories * 0.25; // 25% proteína
    const fatCalories = dailyCalories * 0.25; // 25% gordura
    const carbsCalories = dailyCalories * 0.5; // 50% carboidratos

    return {
      dailyCalories: Math.round(dailyCalories),
      dailyProtein: Math.round(proteinCalories / 4), // 4 cal/g
      dailyFat: Math.round(fatCalories / 9), // 9 cal/g
      dailyCarbs: Math.round(carbsCalories / 4), // 4 cal/g
    };
  };

  const onSubmit = (data: ProfileData) => {
    updateProfileMutation.mutate(data);
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-green-700 dark:text-green-300">NutrIA</h1>
          </div>
          <CardTitle>Configure seu perfil</CardTitle>
          <CardDescription>
            Etapa {step} de 3 - Vamos personalizar suas metas nutricionais
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <Scale className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold">Dados físicos</h3>
                    <p className="text-sm text-muted-foreground">
                      Informações básicas para calcular suas necessidades
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ex: 70"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Altura (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ex: 175"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idade</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ex: 25"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <Target className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold">Seu objetivo</h3>
                    <p className="text-sm text-muted-foreground">
                      Qual é seu foco principal?
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objetivo principal</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione seu objetivo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lose">🔥 Emagrecimento</SelectItem>
                            <SelectItem value="maintain">⚖️ Manutenção</SelectItem>
                            <SelectItem value="gain">💪 Ganho de massa</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="activityLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível de atividade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione seu nível de atividade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sedentary">😴 Sedentário</SelectItem>
                            <SelectItem value="light">🚶 Exercício leve</SelectItem>
                            <SelectItem value="moderate">🏃 Exercício moderado</SelectItem>
                            <SelectItem value="active">🏋️ Exercício intenso</SelectItem>
                            <SelectItem value="very_active">🔥 Muito ativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <Heart className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold">Resumo do perfil</h3>
                    <p className="text-sm text-muted-foreground">
                      Confirme suas informações
                    </p>
                  </div>

                  <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex justify-between">
                      <span>Peso:</span>
                      <span className="font-medium">{form.watch("weight")}kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Altura:</span>
                      <span className="font-medium">{form.watch("height")}cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Idade:</span>
                      <span className="font-medium">{form.watch("age")} anos</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Objetivo:</span>
                      <span className="font-medium">
                        {form.watch("goal") === "lose" && "Emagrecimento"}
                        {form.watch("goal") === "maintain" && "Manutenção"}
                        {form.watch("goal") === "gain" && "Ganho de massa"}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground text-center">
                    Suas metas nutricionais serão calculadas automaticamente baseadas nesses dados.
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                    Voltar
                  </Button>
                )}
                
                {step < 3 ? (
                  <Button 
                    type="button" 
                    onClick={nextStep} 
                    className="flex-1"
                    disabled={
                      (step === 1 && (!form.watch("weight") || !form.watch("height") || !form.watch("age"))) ||
                      (step === 2 && (!form.watch("goal") || !form.watch("activityLevel")))
                    }
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Configurando..." : "Finalizar"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}