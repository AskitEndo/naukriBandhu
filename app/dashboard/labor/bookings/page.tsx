// app/dashboard/labor/bookings/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getLaborBookings } from "@/lib/firestore";
import { Booking } from "@/types";
import Link from "next/link";
import LoadingScreen from "@/components/LoadingScreen";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  Building,
  TrendingUp,
} from "lucide-react";

export default function LaborBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getLaborBookings(user.uid).then((data) => {
        setBookings(data);
        setLoading(false);
      });
    }
  }, [user]);

  // Calculate stats
  const totalHours = bookings.reduce(
    (sum, booking) => sum + booking.durationHours,
    0
  );
  const totalEarnings = bookings.reduce(
    (sum, booking) => sum + booking.wageAmount,
    0
  );
  const upcomingJobs = bookings.filter(
    (booking) => new Date(booking.jobDate) >= new Date()
  ).length;
  const completedJobs = bookings.filter(
    (booking) => new Date(booking.jobDate) < new Date()
  ).length;

  if (loading)
    return <LoadingScreen message="Loading your confirmed bookings..." />;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/labor"
                className="flex items-center space-x-2 text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </div>
          </div>

          <div className="mt-4">
            <h1 className="text-3xl font-bold gradient-text font-poppins">
              My Confirmed Jobs 📅
            </h1>
            <p className="text-gray-600 mt-2">
              Your confirmed and completed work schedule
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">
                  {bookings.length}
                </div>
                <div className="text-sm text-blue-600">Total Jobs</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-lg border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700">
                  {totalHours}h
                </div>
                <div className="text-sm text-green-600">Total Hours</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-lg border border-purple-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-700">
                  ₹{totalEarnings}
                </div>
                <div className="text-sm text-purple-600">Total Earned</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-lg border border-orange-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-700">
                  {upcomingJobs}
                </div>
                <div className="text-sm text-orange-600">Upcoming</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-lg">
            <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-4 font-poppins">
              No Confirmed Jobs Yet
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Once your job applications are accepted, they will appear here as
              confirmed bookings.
            </p>
            <Link
              href="/dashboard/labor"
              className="bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
            >
              <span>Find Jobs</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const jobDate = new Date(booking.jobDate);
              const isUpcoming = jobDate >= new Date();
              const isToday =
                jobDate.toDateString() === new Date().toDateString();

              return (
                <div
                  key={booking.id}
                  className={`group bg-white p-6 rounded-3xl shadow-lg hover:shadow-2xl border-l-4 transition-all duration-500 relative overflow-hidden ${
                    isUpcoming
                      ? isToday
                        ? "border-orange-500 hover:border-orange-400"
                        : "border-cyan-500 hover:border-cyan-400"
                      : "border-green-500 hover:border-green-400"
                  }`}
                >
                  {/* Background decoration */}
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500 ${
                      isUpcoming
                        ? isToday
                          ? "bg-linear-to-br from-orange-50 to-orange-100"
                          : "bg-linear-to-br from-cyan-50 to-cyan-100"
                        : "bg-linear-to-br from-green-50 to-green-100"
                    }`}
                  ></div>

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-cyan-700 transition-colors duration-300 font-poppins">
                              {booking.jobTitle}
                            </h3>
                            <div
                              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                                isUpcoming
                                  ? isToday
                                    ? "bg-orange-100 text-orange-800 border border-orange-200"
                                    : "bg-cyan-100 text-cyan-800 border border-cyan-200"
                                  : "bg-green-100 text-green-800 border border-green-200"
                              }`}
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>
                                {isUpcoming
                                  ? isToday
                                    ? "Today"
                                    : "Upcoming"
                                  : "Completed"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{booking.locationName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{jobDate.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{booking.durationHours} hours</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-6">
                          <div className="bg-linear-to-br from-green-400 to-green-600 text-white px-4 py-2 rounded-2xl shadow-lg">
                            <div className="text-lg font-bold">
                              ₹{booking.wageAmount}
                            </div>
                            <div className="text-xs opacity-90">confirmed</div>
                          </div>
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div
                          className={`p-4 rounded-2xl transition-colors duration-300 ${
                            isUpcoming
                              ? isToday
                                ? "bg-orange-50 group-hover:bg-orange-100"
                                : "bg-cyan-50 group-hover:bg-cyan-100"
                              : "bg-green-50 group-hover:bg-green-100"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isUpcoming
                                  ? isToday
                                    ? "bg-orange-100"
                                    : "bg-cyan-100"
                                  : "bg-green-100"
                              }`}
                            >
                              <Calendar
                                className={`w-5 h-5 ${
                                  isUpcoming
                                    ? isToday
                                      ? "text-orange-600"
                                      : "text-cyan-600"
                                    : "text-green-600"
                                }`}
                              />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Job Date</p>
                              <p className="font-semibold text-gray-800">
                                {jobDate.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`p-4 rounded-2xl transition-colors duration-300 ${
                            isUpcoming
                              ? isToday
                                ? "bg-orange-50 group-hover:bg-orange-100"
                                : "bg-cyan-50 group-hover:bg-cyan-100"
                              : "bg-green-50 group-hover:bg-green-100"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isUpcoming
                                  ? isToday
                                    ? "bg-orange-100"
                                    : "bg-cyan-100"
                                  : "bg-green-100"
                              }`}
                            >
                              <Clock
                                className={`w-5 h-5 ${
                                  isUpcoming
                                    ? isToday
                                      ? "text-orange-600"
                                      : "text-cyan-600"
                                    : "text-green-600"
                                }`}
                              />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Duration</p>
                              <p className="font-semibold text-gray-800">
                                {booking.durationHours} hours
                              </p>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`p-4 rounded-2xl transition-colors duration-300 ${
                            isUpcoming
                              ? isToday
                                ? "bg-orange-50 group-hover:bg-orange-100"
                                : "bg-cyan-50 group-hover:bg-cyan-100"
                              : "bg-green-50 group-hover:bg-green-100"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isUpcoming
                                  ? isToday
                                    ? "bg-orange-100"
                                    : "bg-cyan-100"
                                  : "bg-green-100"
                              }`}
                            >
                              <DollarSign
                                className={`w-5 h-5 ${
                                  isUpcoming
                                    ? isToday
                                      ? "text-orange-600"
                                      : "text-cyan-600"
                                    : "text-green-600"
                                }`}
                              />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Payment</p>
                              <p className="font-semibold text-gray-800">
                                ₹{booking.wageAmount}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
