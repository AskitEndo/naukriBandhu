// app/dashboard/labor/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getOpenJobs, bookJob, getLaborBookings } from "@/lib/firestore";
import { JobListing, Booking } from "@/types";
import Link from "next/link";

// Helper to get day name
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function LaborDashboard() {
  const { user, logout } = useAuth();

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]); // Sun-Sat hours
  const [totalHours, setTotalHours] = useState(0);

  const [bookingStatus, setBookingStatus] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user) return;

      // 1. Fetch Jobs
      const jobData = await getOpenJobs();
      setJobs(jobData);

      // 2. Fetch Bookings to calculate Daily breakdown
      const myBookings = await getLaborBookings(user.uid);
      calculateWeeklyVisuals(myBookings);

      setLoading(false);
    };

    loadDashboard();
  }, [user]);

  const calculateWeeklyVisuals = (bookings: Booking[]) => {
    // Reset counters
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    let total = 0;

    // Get current week bounds to filter only relevant jobs
    const now = new Date();
    // (Simplification: We just map all active bookings. In a real app, strict week filtering applies)

    bookings.forEach((b) => {
      if (b.status === "confirmed") {
        const date = new Date(b.jobDate);
        const dayIndex = date.getDay(); // 0 = Sun
        dayCounts[dayIndex] += b.durationHours;
        total += b.durationHours;
      }
    });

    setWeeklyData(dayCounts);
    setTotalHours(total);
  };

  const handleApply = async (job: JobListing) => {
    if (!user) return;
    setBookingStatus(null);
    if (!confirm(`Apply for ${job.title}?`)) return;

    const result = await bookJob(job, user.uid);

    if (result.success) {
      setBookingStatus({ msg: result.message, type: "success" });
      // Reload to update graph
      const myBookings = await getLaborBookings(user.uid);
      calculateWeeklyVisuals(myBookings);
    } else {
      setBookingStatus({ msg: result.message, type: "error" });
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50 text-black">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-green-900">Naukri Bandu</h1>
          <p className="text-sm text-gray-600">Labor Dashboard</p>
        </div>
        <button onClick={logout} className="text-sm text-red-600 underline">
          Logout
        </button>
      </header>

      {/* STEP 10: EDUCATIONAL BANNER (Top) */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg shadow-lg mb-8">
        <h3 className="font-bold text-lg">📢 Know Your Rights!</h3>
        <p className="text-sm opacity-90">
          The government mandates minimum wages. If you are paid less than
          displayed, verify with the supervisor. Also, never work more than 50
          hours a week for your own safety.
        </p>
      </div>

      {/* STEP 9: WEEKLY CALENDAR VISUALIZER */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <div className="flex justify-between items-end mb-4">
          <h2 className="font-bold text-gray-800">Your Week</h2>
          <span
            className={`font-bold ${
              totalHours >= 50 ? "text-red-600" : "text-green-600"
            }`}
          >
            {totalHours} / 50 Hours
          </span>
        </div>

        {/* Bar Chart */}
        <div className="flex justify-between items-end h-32 gap-2">
          {weeklyData.map((hours, index) => {
            // Calculate height percentage (max 12 hours per day for visual scaling)
            const heightPercent = Math.min((hours / 12) * 100, 100);
            return (
              <div key={index} className="flex flex-col items-center w-full">
                <div
                  className={`w-full rounded-t ${
                    hours > 8 ? "bg-red-400" : "bg-green-400"
                  } transition-all duration-500`}
                  style={{ height: `${heightPercent || 2}%` }} // 2% min height for visibility
                ></div>
                <span className="text-xs text-gray-500 mt-1">
                  {days[index]}
                </span>
                <span className="text-xs font-bold">{hours}h</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/dashboard/labor/bookings"
            className="text-blue-600 text-sm underline"
          >
            View Schedule Details
          </Link>
        </div>
      </div>

      {/* Feedback Message */}
      {bookingStatus && (
        <div
          className={`mb-6 p-4 rounded text-center font-bold ${
            bookingStatus.type === "success"
              ? "bg-green-200 text-green-900"
              : "bg-red-200 text-red-900"
          }`}
        >
          {bookingStatus.msg}
        </div>
      )}

      {/* Job Listings */}
      <h2 className="text-xl font-bold mb-4 text-gray-800">Available Jobs</h2>

      {jobs.length === 0 ? (
        <p className="text-gray-500 italic">No jobs available right now.</p>
      ) : (
        <div className="grid gap-6">
          {jobs.map((job: JobListing) => (
            <div
              key={job.id}
              className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {job.title}
                  </h3>
                  <p className="text-green-600 font-semibold">{job.company}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{job.wageAmount}
                  </div>
                  <div className="text-sm text-gray-500">
                    {job.wageType === "daily" ? "per day" : "per hour"}
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{job.locationName}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{job.durationHours} hours</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <CalendarDays className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{job.requiredDate}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Skilled work</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-700 text-sm mb-4 leading-relaxed">
                {job.description}
              </p>

              {/* Apply Button */}
              <button
                onClick={() => handleApply(job)}
                disabled={loading || totalHours >= 45}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 
                           text-white font-semibold py-3 px-4 rounded-lg 
                           transition duration-200 disabled:cursor-not-allowed"
              >
                {loading ? "Applying..." : "Apply Now"}
              </button>

              {/* Safety Warning */}
              {totalHours >= 45 && (
                <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-orange-800 text-sm">
                    🛡️ Cannot apply - You're approaching the 50-hour weekly
                    safety limit
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
