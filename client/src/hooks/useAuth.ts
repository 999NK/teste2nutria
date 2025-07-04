import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 30 * 1000, // 30 seconds - more frequent checks
    refetchOnWindowFocus: true,
    retry: 2,
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
  };
}