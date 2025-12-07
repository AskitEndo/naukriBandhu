// app/dashboard/labor/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  getOpenJobs,
  applyForJob,
  getLaborBookings,
  getSystemRates,
  hasAlreadyApplied,
} from "@/lib/firestore";
import { JobListing, Booking } from "@/types";
import Link from "next/link";
import {
  MapPin,
  Clock,
  CalendarDays,
  Users,
  ArrowRight,
  CheckCircle,
  Mic,
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import VoiceSearch from "@/components/VoiceSearch";

// Helper to get day name
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function LaborDashboard() {
  const { user, logout } = useAuth();

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]); // Sun-Sat hours
  const [totalHours, setTotalHours] = useState(0);
  const [minWagePerHour, setMinWagePerHour] = useState(60);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [searchKeywords, setSearchKeywords] = useState<string[]>([]);
  const [searchLocation, setSearchLocation] = useState<string | null>(null);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [searchTranscript, setSearchTranscript] = useState("");

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

      // 2. Check which jobs user has already applied for
      const appliedSet = new Set<string>();
      for (const job of jobData) {
        if (job.id) {
          const hasApplied = await hasAlreadyApplied(job.id, user.uid);
          if (hasApplied) {
            appliedSet.add(job.id);
          }
        }
      }
      setAppliedJobs(appliedSet);

      // 3. Fetch Bookings to calculate Daily breakdown
      const myBookings = await getLaborBookings(user.uid);
      calculateWeeklyVisuals(myBookings);

      // 4. Fetch system rates for minimum wage
      const systemRates = await getSystemRates();
      setMinWagePerHour(systemRates.minWagePerHour);

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
    if (!user || !job.id) return;
    setBookingStatus(null);
    if (!confirm(`Apply for ${job.title}?`)) return;

    const result = await applyForJob(job, user.uid);

    if (result.success) {
      setBookingStatus({ msg: result.message, type: "success" });
      // Add job to applied set
      setAppliedJobs((prev) => new Set(prev).add(job.id!));
      // Reload jobs to update applied count
      const jobData = await getOpenJobs();
      setJobs(jobData);
      // Reload to update graph
      const myBookings = await getLaborBookings(user.uid);
      calculateWeeklyVisuals(myBookings);
    } else {
      setBookingStatus({ msg: result.message, type: "error" });
    }
  };

  const handleVoiceSearch = (keywords: string[], location: string | null) => {
    setSearchKeywords(keywords);
    setSearchLocation(location);
    console.log("🔍 Voice search triggered:", { keywords, location });
  };

  const clearSearch = () => {
    setSearchKeywords([]);
    setSearchLocation(null);
    setSearchTranscript("");
  };

  // Filter jobs based on search criteria
  const filteredJobs = jobs.filter((job) => {
    if (searchKeywords.length === 0 && !searchLocation) {
      return true; // No search active, show all jobs
    }

    const jobText =
      `${job.title} ${job.description} ${job.workType} ${job.locationName}`.toLowerCase();

    // Check keywords match
    const keywordMatch =
      searchKeywords.length === 0 ||
      searchKeywords.some((keyword) => jobText.includes(keyword.toLowerCase()));

    // Check location match
    const locationMatch =
      !searchLocation ||
      job.locationName.toLowerCase().includes(searchLocation.toLowerCase());

    return keywordMatch && locationMatch;
  });

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50 text-gray-900">
      {/* Enhanced Header - Mobile Responsive */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text font-poppins">
                Welcome Back, Worker! 👋
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mt-2 font-medium">
                Find your next opportunity with fair wages
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto">
              {/* Weekly Progress */}
              <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200">
                <div className="text-xs text-blue-600 font-medium mb-1">
                  Weekly Hours
                </div>
                <div
                  className={`text-xl font-bold ${
                    totalHours >= 50
                      ? "text-red-600"
                      : totalHours >= 40
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {totalHours}/50
                </div>
              </div>

              {/* Available Jobs */}
              <div className="bg-linear-to-br from-green-50 to-green-100 p-4 rounded-2xl border border-green-200">
                <div className="text-xs text-green-600 font-medium mb-1">
                  {searchKeywords.length > 0 || searchLocation
                    ? "Found"
                    : "Available"}
                </div>
                <div className="text-xl font-bold text-green-700">
                  {
                    filteredJobs.filter(
                      (job) => job.laborersApplied < job.laborersRequired
                    ).length
                  }
                </div>
              </div>

              {/* Applied Jobs */}
              <div className="bg-linear-to-br from-purple-50 to-purple-100 p-4 rounded-2xl border border-purple-200">
                <div className="text-xs text-purple-600 font-medium mb-1">
                  Applied
                </div>
                <div className="text-xl font-bold text-purple-700">
                  {appliedJobs.size}
                </div>
              </div>

              {/* Total Jobs */}
              <div className="bg-linear-to-br from-orange-50 to-orange-100 p-4 rounded-2xl border border-orange-200">
                <div className="text-xs text-orange-600 font-medium mb-1">
                  {searchKeywords.length > 0 || searchLocation
                    ? "Matching"
                    : "Total Jobs"}
                </div>
                <div className="text-xl font-bold text-orange-700">
                  {filteredJobs.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Voice Search Section */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                🎤 Voice Job Search
              </h2>
              <button
                onClick={() => setShowVoiceSearch(!showVoiceSearch)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200 ${
                  showVoiceSearch
                    ? "bg-blue-100 border-blue-300 text-blue-700"
                    : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>
                  {showVoiceSearch ? "Hide Voice Search" : "Show Voice Search"}
                </span>
              </button>
            </div>

            {showVoiceSearch && (
              <VoiceSearch
                onSearch={handleVoiceSearch}
                onTranscriptChange={setSearchTranscript}
                availableJobs={jobs}
                lastSearchResultCount={filteredJobs.length}
              />
            )}
          </div>
        </div>

        {/* Search Results Summary */}
        {(searchKeywords.length > 0 || searchLocation) && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  🔍 Search Results
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {searchKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                  {searchLocation && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      📍 {searchLocation}
                    </span>
                  )}
                </div>
                <p className="text-blue-700 text-sm">
                  Found {filteredJobs.length} job
                  {filteredJobs.length !== 1 ? "s" : ""} matching your search
                  {searchTranscript && (
                    <span className="block text-blue-600 italic mt-1">
                      "{searchTranscript}"
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={clearSearch}
                className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-100 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Educational Banner */}
        <div className="bg-linear-to-r from-blue-600 via-cyan-600 to-blue-700 text-white p-6 rounded-2xl shadow-xl border border-blue-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">📢</span>
              </div>
              <h3 className="font-bold text-xl font-poppins">
                Know Your Rights!
              </h3>
            </div>
            <p className="text-blue-100 leading-relaxed">
              The government mandates minimum wages. If you are paid less than
              displayed, verify with the supervisor. Remember:{" "}
              <span className="font-semibold text-white">
                never work more than 50 hours a week
              </span>{" "}
              for your own safety and wellbeing.
            </p>
          </div>
        </div>

        {/* Enhanced Weekly Calendar Visualizer */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 font-poppins">
                Weekly Overview
              </h2>
              <p className="text-gray-600 mt-1">Track your work hours safely</p>
            </div>
            <div className="text-right">
              <div
                className={`text-3xl font-bold ${
                  totalHours >= 50
                    ? "text-red-600"
                    : totalHours >= 40
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              >
                {totalHours} / 50
              </div>
              <p className="text-sm text-gray-500">Hours this week</p>
            </div>
          </div>

          {/* Enhanced Bar Chart */}
          <div className="bg-gray-50 p-6 rounded-2xl mb-6">
            <div className="flex justify-between items-end h-40 gap-3">
              {weeklyData.map((hours, index) => {
                const heightPercent = Math.max((hours / 12) * 100, 3);
                const today = new Date().getDay();
                const isToday = index === today;
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center flex-1"
                  >
                    <div className="flex flex-col items-center justify-end h-32 w-full">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-700 ease-out shadow-sm ${
                          hours > 8
                            ? "bg-linear-to-t from-red-400 to-red-500"
                            : hours > 0
                            ? "bg-linear-to-t from-green-400 to-green-500"
                            : "bg-gray-200"
                        } ${
                          isToday ? "ring-2 ring-cyan-500 ring-opacity-50" : ""
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    </div>
                    <div className="mt-3 text-center">
                      <span
                        className={`text-sm font-medium ${
                          isToday ? "text-cyan-600" : "text-gray-600"
                        }`}
                      >
                        {days[index]}
                      </span>
                      <div
                        className={`text-lg font-bold ${
                          hours > 8
                            ? "text-red-600"
                            : hours > 0
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {hours}h
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress indicators */}
            <div className="flex justify-between text-xs text-gray-500 mt-4 px-2">
              <span>0h</span>
              <span>6h</span>
              <span className="text-orange-600">8h (Safe limit)</span>
              <span className="text-red-600">12h</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Safe hours</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Overtime</span>
              </div>
            </div>
            <Link
              href="/dashboard/labor/applications"
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              View Applications
            </Link>
          </div>
        </div>

        {/* Feedback Message */}
        {bookingStatus && (
          <div
            className={`p-6 rounded-2xl shadow-lg border-l-4 ${
              bookingStatus.type === "success"
                ? "bg-green-50 border-green-500 text-green-800"
                : "bg-red-50 border-red-500 text-red-800"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  bookingStatus.type === "success"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              >
                <span className="text-white text-sm">
                  {bookingStatus.type === "success" ? "✓" : "!"}
                </span>
              </div>
              <p className="font-medium">{bookingStatus.msg}</p>
            </div>
          </div>
        )}

        {/* Job Listings Section Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 font-poppins">
              {searchKeywords.length > 0 || searchLocation
                ? "Search Results"
                : "Available Jobs"}
            </h2>
            <p className="text-gray-600 mt-1">
              {searchKeywords.length > 0 || searchLocation
                ? "Jobs matching your voice search"
                : "Find opportunities that match your skills"}
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border">
            <span className="text-sm text-gray-600">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}
              {searchKeywords.length > 0 || searchLocation
                ? " found"
                : " available"}
            </span>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">
                {searchKeywords.length > 0 || searchLocation ? "🔍" : "💼"}
              </span>
            </div>
            <p className="text-xl text-gray-500 font-medium">
              {searchKeywords.length > 0 || searchLocation
                ? "No jobs found matching your search"
                : "No jobs available right now"}
            </p>
            <p className="text-gray-400 mt-2">
              {searchKeywords.length > 0 || searchLocation
                ? "Try different keywords or clear your search"
                : "Check back later for new opportunities"}
            </p>
            {(searchKeywords.length > 0 || searchLocation) && (
              <button
                onClick={clearSearch}
                className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-8">
            {filteredJobs.map((job: JobListing) => {
              const hourlyRate =
                job.wageType === "hourly"
                  ? job.wageAmount
                  : job.wageAmount / job.durationHours;
              const isAboveMinimum = hourlyRate >= minWagePerHour;
              const isFullyBooked = job.laborersApplied >= job.laborersRequired;
              const hasApplied = job.id ? appliedJobs.has(job.id) : false;

              return (
                <div
                  key={job.id}
                  className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl border border-gray-100 hover:border-cyan-200 transition-all duration-500 relative overflow-hidden"
                >
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-cyan-50 to-blue-50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500"></div>

                  {/* Header */}
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-2xl font-bold text-gray-800 font-poppins group-hover:text-cyan-700 transition-colors duration-300">
                          {job.title}
                        </h3>
                        {isAboveMinimum && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                            Fair Wage
                          </span>
                        )}
                        {hasApplied && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                            ✓ Applied
                          </span>
                        )}
                      </div>
                      {job.company && (
                        <p className="text-cyan-600 font-semibold text-lg">
                          {job.company}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.locationName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CalendarDays className="w-4 h-4" />
                          <span>
                            {new Date(job.requiredDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <div className="bg-linear-to-br from-green-400 to-green-600 text-white px-4 py-2 rounded-2xl shadow-lg">
                        <div className="text-2xl font-bold">
                          ₹{job.wageAmount}
                        </div>
                        <div className="text-sm opacity-90">
                          {job.wageType === "daily" ? "per day" : "per hour"}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        ₹{hourlyRate.toFixed(2)}/hour
                      </div>
                    </div>
                  </div>

                  {/* Job Details Grid */}
                  <div className="grid grid-cols-2 gap-6 mb-6 relative z-10">
                    <div className="bg-gray-50 p-4 rounded-2xl group-hover:bg-cyan-50 transition-colors duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-semibold text-gray-800">
                            {job.durationHours} hours
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl group-hover:bg-cyan-50 transition-colors duration-300">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Applications</p>
                          <p className="font-semibold text-gray-800">
                            {job.laborersApplied}/{job.laborersRequired}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Wage Comparison */}
                  <div
                    className={`mb-6 p-4 rounded-2xl border-2 transition-colors duration-300 ${
                      isAboveMinimum
                        ? "bg-green-50 border-green-200 group-hover:bg-green-100"
                        : "bg-red-50 border-red-200 group-hover:bg-red-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-700">
                        Wage Analysis
                      </span>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isAboveMinimum
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {isAboveMinimum ? "✓ Fair" : "⚠ Check"}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Offered rate:</span>
                        <span className="font-semibold">
                          ₹{hourlyRate.toFixed(2)}/hour
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Minimum wage:</span>
                        <span className="font-semibold">
                          ₹{minWagePerHour}/hour
                        </span>
                      </div>
                      <div
                        className={`mt-2 p-2 rounded-lg ${
                          isAboveMinimum
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {isAboveMinimum
                          ? `✓ This job pays ₹${(
                              hourlyRate - minWagePerHour
                            ).toFixed(2)} above minimum wage`
                          : `⚠️ This job pays ₹${(
                              minWagePerHour - hourlyRate
                            ).toFixed(2)} below minimum wage`}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6 relative z-10">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Job Description
                    </h4>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl group-hover:bg-cyan-50 transition-colors duration-300">
                      {job.description}
                    </p>
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={() => handleApply(job)}
                    disabled={
                      loading || totalHours >= 45 || isFullyBooked || hasApplied
                    }
                    className={`w-full font-semibold py-4 px-6 rounded-2xl transition-all duration-300 relative z-10 ${
                      hasApplied
                        ? "bg-blue-100 text-blue-700 cursor-not-allowed border-2 border-blue-200"
                        : isFullyBooked
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : loading || totalHours >= 45
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl hover:scale-105"
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Applying...</span>
                        </>
                      ) : hasApplied ? (
                        <>
                          <CheckCircle size={18} />
                          <span>Already Applied</span>
                        </>
                      ) : isFullyBooked ? (
                        <>
                          <span>Position Filled</span>
                        </>
                      ) : (
                        <>
                          <span>Apply Now</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </div>
                  </button>

                  {/* Warnings */}
                  {totalHours >= 45 && (
                    <div className="mt-4 bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl relative z-10">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">🛡️</span>
                        </div>
                        <p className="text-orange-800 font-medium">
                          Cannot apply - You're approaching the 50-hour weekly
                          safety limit
                        </p>
                      </div>
                    </div>
                  )}

                  {isFullyBooked && (
                    <div className="mt-4 bg-gray-50 border-l-4 border-gray-400 p-4 rounded-r-xl relative z-10">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">📋</span>
                        </div>
                        <p className="text-gray-600 font-medium">
                          This position has reached maximum applicants (
                          {job.laborersRequired})
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
