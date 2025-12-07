// app/dashboard/supervisor/page.tsx
"use client";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";

export default function SupervisorDashboard() {
  const { logout } = useAuth();

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50 text-black">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Naukri Bandu</h1>
          <p className="text-sm text-gray-600">Supervisor Dashboard</p>
        </div>
        <button onClick={logout} className="text-sm text-red-600 underline">
          Logout
        </button>
      </header>

      {/* PROMO BANNER */}
      <div className="bg-gradient-to-r from-green-500 to-green-700 text-white p-6 rounded-lg shadow-lg mb-8">
        <h3 className="font-bold text-xl mb-2">🚀 Grow Your Business!</h3>
        <p className="text-sm opacity-90 mb-4">
          Hire skilled workers instantly with Naukri Bandu. Fair wages, reliable
          labor, government compliance built-in.
        </p>
        <div className="flex gap-4 text-xs">
          <span className="bg-white/20 px-3 py-1 rounded-full">
            ✓ Verified Workers
          </span>
          <span className="bg-white/20 px-3 py-1 rounded-full">
            ✓ Wage Compliance
          </span>
          <span className="bg-white/20 px-3 py-1 rounded-full">
            ✓ Instant Matching
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Post Job Card */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Hire Labor</h2>
            <p className="text-gray-600 mb-6">
              Post a new job listing and connect with skilled workers in your
              area.
            </p>
            <Link
              href="/dashboard/supervisor/post-job"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition"
            >
              + Post New Job
            </Link>
          </div>
        </div>

        {/* My Hires Card */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">My Hires</h2>
            <p className="text-gray-600 mb-6">
              Track your bookings and see who is coming to work for your
              projects.
            </p>
            <Link
              href="/dashboard/supervisor/bookings"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition"
            >
              View History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
