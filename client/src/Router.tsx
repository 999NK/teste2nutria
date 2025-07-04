import { Switch, Route } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import AddMeal from "@/pages/AddMeal";
import MyPlan from "@/pages/MyPlan";
import Progress from "@/pages/Progress";
import Profile from "@/pages/Profile";
import Onboarding from "@/pages/Onboarding";
import AiChat from "@/pages/AiChat";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";

export default function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <i className="fas fa-utensils text-white text-2xl"></i>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }
  
  if (user && !(user as any).isProfileComplete) {
    return <Onboarding />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/add-meal" component={AddMeal} />
        <Route path="/my-plan" component={MyPlan} />
        <Route path="/progress" component={Progress} />
        <Route path="/profile" component={Profile} />
        <Route path="/ai-chat">
          <AiChat />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}