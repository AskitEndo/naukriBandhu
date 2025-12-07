// app/dashboard/supervisor/post-job/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { createJobPosting, getSystemRates } from "@/lib/firestore";
import { SystemRates } from "@/types";

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

  if (!rates) return <div className="p-8">Loading System Rates...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Post a New Job</h1>
      <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-6 text-sm text-blue-800">
        ℹ️ Current Minimum Wage: <strong>₹{rates.minWagePerHour}/hour</strong>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Job Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Construction Helper needed"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
          />
        </div>

        {/* Location (Text for now) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Location (Area Name)
          </label>
          <input
            type="text"
            required
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g. Jalali West, Site B"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
          />
        </div>

        {/* Duration & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date Required
            </label>
            <input
              type="date"
              required
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Duration (Hours)
            </label>
            <input
              type="number"
              required
              min={1}
              max={12} // Cap per day work to reasonable amount
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
            />
          </div>
        </div>

        {/* Wage Calculation */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wage Offer
          </label>
          <div className="flex gap-4 mb-3">
            <button
              type="button"
              onClick={() => setWageType("daily")}
              className={`px-4 py-2 rounded text-sm ${
                wageType === "daily"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Daily Rate
            </button>
            <button
              type="button"
              onClick={() => setWageType("hourly")}
              className={`px-4 py-2 rounded text-sm ${
                wageType === "hourly"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Hourly Rate
            </button>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">₹</span>
            <input
              type="number"
              required
              value={wageAmount}
              onChange={(e) => setWageAmount(Number(e.target.value))}
              placeholder="0.00"
              className="pl-8 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Minimum required for {durationHours} hours:
            <span className="font-bold text-gray-700">
              {" "}
              ₹{calculateMinWageRequired()}
            </span>
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description / Contact Info
          </label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g. Call +91 999... when you reach."
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition disabled:bg-blue-300"
        >
          {loading ? "Posting..." : "Post Job"}
        </button>
      </form>
    </div>
  );
}
