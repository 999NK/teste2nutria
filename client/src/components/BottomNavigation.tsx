import { useLocation } from "wouter";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: "home", label: "Início" },
    { path: "/ai-chat", icon: "robot", label: "IA Chat" },
    { path: "/my-plan", icon: "calendar", label: "Meu Plano" },
    { path: "/progress", icon: "chart-bar", label: "Progresso" },
    { path: "/profile", icon: "user", label: "Perfil" },
  ];

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`flex flex-col items-center justify-center transition-colors ${
              isActive(item.path)
                ? "text-primary"
                : "text-gray-400 hover:text-primary"
            }`}
            onClick={() => setLocation(item.path)}
          >
            <i className={`fas fa-${item.icon} text-lg mb-1`}></i>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
