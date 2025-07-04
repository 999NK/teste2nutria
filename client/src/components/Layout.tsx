import { useEffect, useState } from "react";
import BottomNavigation from "./BottomNavigation";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Initialize dark mode and check screen size
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      document.documentElement.classList.add('dark');
    }

    // Check if mobile (phones and small tablets)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    // Mobile Layout
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900 min-h-screen relative">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <i className="fas fa-utensils text-white text-sm"></i>
              </div>
              <div>
                <h1 className="font-semibold text-lg">NutrIA</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date().toLocaleDateString('pt-BR', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <i className="fas fa-bell text-gray-600 dark:text-gray-400"></i>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="min-h-[calc(100vh-140px)]">
            {children}
          </main>

          {/* Bottom Navigation */}
          <BottomNavigation />
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-full z-30">
        <Sidebar />
      </div>
      
      {/* Main Content with sidebar offset */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Fixed Desktop Header */}
        <header className="fixed top-0 right-0 left-64 bg-white dark:bg-gray-800 shadow-sm px-8 py-4 border-b border-gray-200 dark:border-gray-700 z-20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {getPageTitle(window.location.pathname)}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <i className="fas fa-bell text-gray-600 dark:text-gray-400"></i>
              </button>
              <button 
                className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center space-x-2"
                onClick={() => window.location.href = "/add-meal"}
              >
                <i className="fas fa-plus"></i>
                <span>Adicionar Refeição</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content with header offset */}
        <main className="flex-1 p-8 pt-24 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/': 'Dashboard',
    '/add-meal': 'Adicionar Refeição',
    '/my-plan': 'Meu Plano',
    '/progress': 'Progresso',
    '/ai-chat': 'Assistente Nutricional',
    '/profile': 'Perfil'
  };
  return titles[pathname] || 'NutrIA';
}
