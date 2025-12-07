// app/onboarding/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { createUserProfile, UserProfile } from "@/lib/firestore";

export default function Onboarding() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);

  // If user is not logged in, kick them out
  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  const handleRoleSelection = async (role: "supervisor" | "labor") => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Save to Firestore
      await createUserProfile(user.uid, {
        phoneNumber: user.phoneNumber || "",
        role: role,
      });

      // 2. Redirect to correct dashboard
      router.push(`/dashboard/${role}`);
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Failed to save profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="p-10 text-center">Setting up your account...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-2 text-black">Who are you?</h1>
      <p className="text-gray-600 mb-8">Select your role to continue.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Supervisor Card */}
        <button
          onClick={() => handleRoleSelection("supervisor")}
          className="flex flex-col items-center p-8 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-600 hover:shadow-lg transition gap-4"
        >
          <div className="text-6xl">👔</div>
          <h2 className="text-xl font-bold text-blue-900">I am a Supervisor</h2>
          <p className="text-sm text-gray-500">
            I want to hire workers & post jobs.
          </p>
        </button>

        {/* Labor Card */}
        <button
          onClick={() => handleRoleSelection("labor")}
          className="flex flex-col items-center p-8 bg-white border-2 border-green-200 rounded-xl hover:border-green-600 hover:shadow-lg transition gap-4"
        >
          <div className="text-6xl">⛑️</div>
          <h2 className="text-xl font-bold text-green-900">I am a Labor</h2>
          <p className="text-sm text-gray-500">
            I want to find work & track hours.
          </p>
        </button>
      </div>
    </div>
  );
}
