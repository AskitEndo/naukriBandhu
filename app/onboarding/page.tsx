"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { createUserProfile } from "@/lib/firestore";
import { motion } from "framer-motion";
import {
  Building,
  HardHat,
  User,
  Users,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import LoadingScreen from "@/components/LoadingScreen";

export default function Onboarding() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<
    "supervisor" | "labor" | null
  >("labor"); // Default to labor

  // If user is not logged in, redirect to login
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const handleRoleSelection = async (role: "supervisor" | "labor") => {
    if (!user) return;
    setLoading(true);

    try {
      // Create user profile in Firestore
      await createUserProfile(user.uid, {
        phoneNumber: user.phoneNumber || "",
        role: role,
        createdAt: new Date().toISOString(),
      });

      toast.success(`Welcome! Your ${role} account is ready.`);

      // Redirect to appropriate dashboard
      router.push(`/dashboard/${role}`);
    } catch (error) {
      console.error("Error creating profile:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Setting up your account..." />;
  }

  if (!user) {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <Image
              src="/logo.gif"
              alt="Naukri Bandu"
              width={80}
              height={80}
              className="mx-auto"
              unoptimized
            />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-cyan-600">Naukri Bandu</span>
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Choose your role to get started
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Don't worry, you can switch between roles anytime from the dashboard
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Labor Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={`relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 ${
              selectedRole === "labor"
                ? "ring-4 ring-green-500 bg-green-50"
                : "bg-white hover:shadow-xl"
            }`}
            onClick={() => setSelectedRole("labor")}
          >
            <div className="p-8 text-center">
              {selectedRole === "labor" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 text-green-500"
                >
                  <CheckCircle size={24} />
                </motion.div>
              )}

              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <HardHat className="w-10 h-10 text-green-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                I am a Worker
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                Find work opportunities, track your hours, and ensure fair wages
              </p>

              <div className="space-y-3 text-left">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500 mr-3" />
                  <span>Browse available job listings</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500 mr-3" />
                  <span>Track weekly hours (50-hour safety limit)</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500 mr-3" />
                  <span>Guaranteed minimum wage protection</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500 mr-3" />
                  <span>View earnings and work schedule</span>
                </div>
              </div>
            </div>

            <div className="bg-green-500 text-white text-center py-3 font-semibold">
              Recommended for Most Users
            </div>
          </motion.div>

          {/* Supervisor Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={`relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 ${
              selectedRole === "supervisor"
                ? "ring-4 ring-blue-500 bg-blue-50"
                : "bg-white hover:shadow-xl"
            }`}
            onClick={() => setSelectedRole("supervisor")}
          >
            <div className="p-8 text-center">
              {selectedRole === "supervisor" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 text-blue-500"
                >
                  <CheckCircle size={24} />
                </motion.div>
              )}

              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building className="w-10 h-10 text-blue-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                I am a Supervisor
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                Post job listings and hire reliable workers for your projects
              </p>

              <div className="space-y-3 text-left">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-blue-500 mr-3" />
                  <span>Post job opportunities</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-blue-500 mr-3" />
                  <span>Connect with verified workers</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-blue-500 mr-3" />
                  <span>Automatic wage compliance checking</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle size={16} className="text-blue-500 mr-3" />
                  <span>Manage your hiring pipeline</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-8"
        >
          <button
            onClick={() => selectedRole && handleRoleSelection(selectedRole)}
            disabled={!selectedRole || loading}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 mx-auto disabled:cursor-not-allowed"
          >
            <span>
              Continue as {selectedRole === "labor" ? "Worker" : "Supervisor"}
            </span>
            <ArrowRight size={20} />
          </button>

          <p className="text-sm text-gray-500 mt-4">
            You can always switch roles later from your dashboard
          </p>
        </motion.div>
      </div>
    </div>
  );
}
