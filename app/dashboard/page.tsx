// app/dashboard/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

export default function DashboardRedirect() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      // If user is not logged in, redirect to homepage
      if (!user) {
        router.push("/");
        return;
      }

      // If user exists, log them out and redirect to homepage
      // This prevents users from accessing /dashboard directly
      try {
        await logout();
        router.push("/");
      } catch (error) {
        console.error("Logout error:", error);
        router.push("/");
      }
    };

    handleRedirect();
  }, [user, logout, router]);

  // Show loading screen while redirecting
  return <LoadingScreen />;
}
