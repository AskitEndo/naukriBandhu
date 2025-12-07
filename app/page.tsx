// app/page.js
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { getUserProfile } from "@/lib/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checkingDb, setCheckingDb] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        setCheckingDb(true);
        const profile = await getUserProfile((user as any).uid);

        if (!profile || !profile.role) {
          // No profile found -> Send to Onboarding
          router.push("/onboarding");
        } else {
          // Profile found -> Send to Dashboard
          router.push(`/dashboard/${profile.role}`);
        }
        setCheckingDb(false);
      }
    };

    if (!authLoading && user) {
      checkUserRole();
    }
  }, [user, authLoading, router]);

  if (authLoading || checkingDb) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // If we are here, user is NOT logged in
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-b from-blue-50 to-white">
      <h1 className="text-5xl font-bold text-blue-900">Naukri Bandu</h1>
      <p className="text-xl text-gray-700 max-w-lg text-center">
        The trusted platform for blue-collar jobs.
        <br />
        <span className="text-sm text-gray-500">Fair Wages. Safety First.</span>
      </p>

      <Link
        href="/login"
        className="bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition shadow-lg"
      >
        Get Started (Login)
      </Link>
    </div>
  );
}
