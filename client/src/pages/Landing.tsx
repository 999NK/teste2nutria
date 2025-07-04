import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto w-full">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <i className="fas fa-utensils text-white text-2xl"></i>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">NutrIA</h1>
              <p className="text-gray-600 dark:text-gray-400">Seu assistente nutricional inteligente</p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleLogin}
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-green-600 transition-colors"
              >
                Entrar com Replit
              </Button>
            </div>

            <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
              <h3 className="font-semibold mb-2">Recursos principais:</h3>
              <ul className="space-y-1">
                <li>🤖 Reconhecimento de refeições com IA</li>
                <li>📊 Acompanhamento nutricional detalhado</li>
                <li>🎯 Metas personalizáveis</li>
                <li>📱 Interface otimizada para mobile</li>
                <li>📄 Relatórios em PDF</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
