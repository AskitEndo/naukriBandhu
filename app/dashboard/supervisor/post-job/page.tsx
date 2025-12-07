// app/dashboard/supervisor/post-job/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { createJobPosting, getSystemRates } from "@/lib/firestore";
import { SystemRates } from "@/types";
import LoadingScreen from "@/components/LoadingScreen";

export default function PostJobPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState("");
  const [locationName, setLocationName] = useState("");
  const [wageType, setWageType] = useState<"hourly" | "daily">("daily");
  const [wageAmount, setWageAmount] = useState<number | "">("");
  const [durationHours, setDurationHours] = useState<number>(8); // Default 8 hours
  const [requiredDate, setRequiredDate] = useState("");
  const [description, setDescription] = useState("");
  const [laborersRequired, setLaborersRequired] = useState<number>(1);
  const [expiresAt, setExpiresAt] = useState("");

  // System State
  const [rates, setRates] = useState<SystemRates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch Min Wage on Load
  useEffect(() => {
    getSystemRates().then((data) => setRates(data));
  }, []);

  const calculateMinWageRequired = () => {
    if (!rates) return 0;

    // If posting is Hourly, check against Hourly Rate
    if (wageType === "hourly") {
      return rates.minWagePerHour;
    }

    // If posting is Daily, we assume Daily = durationHours * HourlyRate
    // (Standard logic: 8 hours * 60rs = 480rs)
    return rates.minWagePerHour * durationHours;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    if (typeof wageAmount !== "number") {
      setError("Please enter a valid wage amount.");
      setLoading(false);
      return;
    }

    // --- ENFORCE MINIMUM WAGE LOGIC ---
    const minRequired = calculateMinWageRequired();
    if (wageAmount < minRequired) {
      setError(
        `Wage is too low! Government minimum for this duration is ₹${minRequired}.`
      );
      setLoading(false);
      return;
    }

    try {
      await createJobPosting({
        supervisorId: user.uid,
        title,
        locationName,
        description,
        wageType,
        wageAmount,
        requiredDate,
        durationHours,
        laborersRequired,
        expiresAt:
          expiresAt ||
          (() => {
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + 7);
            return expDate.toISOString();
          })(),
      });

      // Redirect back to dashboard on success
      router.push("/dashboard/supervisor");
    } catch (err) {
      console.error(err);
      setError("Failed to post job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!rates) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text font-poppins">
                Post a New Job 📋
              </h1>
              <p className="text-gray-600 mt-2">
                Create a job posting that attracts quality workers
              </p>
            </div>
            <div className="bg-linear-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-2xl shadow-lg">
              <div className="text-center">
                <div className="text-sm opacity-90">Min Wage</div>
                <div className="text-lg font-bold">
                  ₹{rates.minWagePerHour}/hr
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-6 rounded-r-2xl shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">⚠</span>
              </div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Job Information Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 font-poppins">
                  Job Information
                </h2>
                <p className="text-gray-600">
                  Basic details about your job posting
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Job Title */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Construction Helper, Warehouse Worker, Delivery Assistant"
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 group-hover:border-gray-300"
                />
              </div>

              {/* Location */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Work Location *
                </label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Jalali West Construction Site, Warehouse District B"
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 group-hover:border-gray-300"
                />
              </div>

              {/* Description */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Description & Contact Information *
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the work requirements, safety measures, contact details, and any special instructions..."
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-500 resize-none group-hover:border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Schedule & Requirements Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 font-poppins">
                  Schedule & Requirements
                </h2>
                <p className="text-gray-600">
                  When and how many workers you need
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Required Date *
                </label>
                <input
                  type="date"
                  required
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 text-gray-900 group-hover:border-gray-300"
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Work Duration (Hours) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full px-4 py-4 pr-16 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 text-gray-900 group-hover:border-gray-300"
                  />
                  <span className="absolute right-4 top-4 text-gray-500 font-medium">
                    hours
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Maximum 12 hours per day for worker safety
                </p>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Workers Needed *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={laborersRequired}
                    onChange={(e) =>
                      setLaborersRequired(Number(e.target.value))
                    }
                    className="w-full px-4 py-4 pr-20 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 text-gray-900 group-hover:border-gray-300"
                  />
                  <span className="absolute right-4 top-4 text-gray-500 font-medium">
                    workers
                  </span>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Expires On
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-4 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 text-gray-900 group-hover:border-gray-300"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Defaults to 7 days if not specified
                </p>
              </div>
            </div>
          </div>

          {/* Wage Calculator Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 font-poppins">
                  Wage Calculator
                </h2>
                <p className="text-gray-600">Set competitive and fair wages</p>
              </div>
            </div>

            {/* Wage Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Payment Structure *
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setWageType("daily")}
                  className={`flex-1 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                    wageType === "daily"
                      ? "bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">Daily Rate</div>
                    <div className="text-sm opacity-80">
                      Fixed amount per day
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setWageType("hourly")}
                  className={`flex-1 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                    wageType === "hourly"
                      ? "bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">Hourly Rate</div>
                    <div className="text-sm opacity-80">
                      Amount per hour worked
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Wage Input */}
            <div className="space-y-4">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Wage Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500 font-semibold text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    value={wageAmount}
                    onChange={(e) => setWageAmount(Number(e.target.value))}
                    placeholder="0.00"
                    min={0}
                    step="0.01"
                    className="w-full pl-8 pr-20 py-4 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 text-gray-900 text-lg font-semibold group-hover:border-gray-300"
                  />
                  <span className="absolute right-4 top-4 text-gray-500 font-medium">
                    per {wageType === "daily" ? "day" : "hour"}
                  </span>
                </div>
              </div>

              {/* Wage Analysis */}
              <div
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  typeof wageAmount === "number" &&
                  wageAmount >= calculateMinWageRequired()
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      typeof wageAmount === "number" &&
                      wageAmount >= calculateMinWageRequired()
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    <span className="text-white text-xl">
                      {typeof wageAmount === "number" &&
                      wageAmount >= calculateMinWageRequired()
                        ? "✓"
                        : "⚠"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-bold text-lg mb-2 ${
                        typeof wageAmount === "number" &&
                        wageAmount >= calculateMinWageRequired()
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      Wage Analysis
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Your offer:</span>
                        <span className="font-semibold">
                          ₹{wageAmount || 0} per {wageType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Government minimum:
                        </span>
                        <span className="font-semibold">
                          ₹{calculateMinWageRequired()} for {durationHours}h
                        </span>
                      </div>
                      <div
                        className={`mt-3 p-3 rounded-xl ${
                          typeof wageAmount === "number" &&
                          wageAmount >= calculateMinWageRequired()
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {typeof wageAmount === "number" &&
                        wageAmount >= calculateMinWageRequired()
                          ? `✓ Great! Your offer exceeds minimum wage by ₹${(
                              wageAmount - calculateMinWageRequired()
                            ).toFixed(2)}`
                          : `⚠️ Increase wage by at least ₹${(
                              calculateMinWageRequired() -
                              (typeof wageAmount === "number" ? wageAmount : 0)
                            ).toFixed(2)} to meet legal requirements`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={loading}
              className="group bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-12 py-6 rounded-3xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-xl flex items-center space-x-3"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Posting Job...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Post Job & Find Workers</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
