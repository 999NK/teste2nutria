import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

const navigationItems = [
  { href: "/", icon: "fas fa-home", label: "Dashboard" },
  {
    href: "/add-meal",
    icon: "fas fa-plus-circle",
    label: "Adicionar Refeição",
  },
  { href: "/my-plan", icon: "fas fa-clipboard-list", label: "Meu Plano" },
  { href: "/progress", icon: "fas fa-chart-line", label: "Progresso" },
  { href: "/ai-chat", icon: "fas fa-robot", label: "Chat IA" },
  { href: "/profile", icon: "fas fa-user", label: "Perfil" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      queryClient.clear();
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/auth";
    }
  };

  return (
    <div
      className="
      w-64
      h-screen
      fixed
      top-0
      left-0
      bg-white
      dark:bg-gray-800
      border-r border-gray-200 dark:border-gray-700
      flex flex-col
    "
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mr-3">
            <i className="fas fa-utensils text-white text-lg"></i>
          </div>
          <div>
            <h1 className="font-bold text-xl text-gray-900 dark:text-white">
              NutrIA
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`
                  relative flex items-center px-4 py-3 rounded-xl transition-all duration-200
                  ${
                    isActive
                      ? "bg-primary text-white shadow-lg transform scale-[1.02]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:transform hover:scale-[1.01]"
                  }
                `}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                  )}
                  <i className={`${item.icon} w-5 text-center mr-3 ${isActive ? 'text-white' : ''}`}></i>
                  <span className="font-medium">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <button className="w-full flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <i className="fas fa-bell w-5 text-center mr-3"></i>
            <span className="font-medium">Notificações</span>
          </button>
          <button className="w-full flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <i className="fas fa-cog w-5 text-center mr-3"></i>
            <span className="font-medium">Configurações</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <i className="fas fa-sign-out-alt w-5 text-center mr-3"></i>
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}
