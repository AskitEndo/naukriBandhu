// app/dashboard/labor/applications/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getUserApplications, getJobById } from "@/lib/firestore";
import { JobApplication, JobListing } from "@/types";
import Link from "next/link";
import LoadingScreen from "@/components/LoadingScreen";
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Building,
} from "lucide-react";

interface ApplicationWithJobDetails extends JobApplication {
  jobDetails?: JobListing;
}

export default function LaborApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithJobDetails[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  useEffect(() => {
    const loadApplications = async () => {
      if (!user) return;

      try {
        // Get user's applications
        const userApplications = await getUserApplications(user.uid);

        // Fetch job details for each application
        const applicationsWithDetails = await Promise.all(
          userApplications.map(async (app) => {
            try {
              const jobDetails = await getJobById(app.jobId);
              return { ...app, jobDetails };
            } catch (error) {
              console.error(
                `Error fetching job details for ${app.jobId}:`,
                error
              );
              return app;
            }
          })
        );

        setApplications(applicationsWithDetails);
      } catch (error) {
        console.error("Error loading applications:", error);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-600" />; // Default to confirmed
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-50 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-green-50 text-green-800 border-green-200"; // Default to confirmed styling
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (selectedFilter === "all") return true;
    return app.status === selectedFilter;
  });

  const statusCounts = {
    all: applications.length,
    confirmed: applications.filter((app) => app.status === "confirmed").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
  };

  if (loading) return <LoadingScreen message="Loading your applications..." />;

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
              <div className="text-gray-300">|</div>
              <Link
                href="/dashboard/labor/bookings"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Confirmed Jobs</span>
              </Link>
            </div>
          </div>

          <div className="mt-4">
            <h1 className="text-3xl font-bold gradient-text font-poppins">
              My Job Applications 📋
            </h1>
            <p className="text-gray-600 mt-2">
              Track all your job applications and their status
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            {
              key: "all",
              label: "Total Applications",
              value: statusCounts.all,
              color: "blue",
            },
            {
              key: "confirmed",
              label: "Booked Jobs",
              value: statusCounts.confirmed,
              color: "green",
            },
            {
              key: "rejected",
              label: "Rejected",
              value: statusCounts.rejected,
              color: "red",
            },
          ].map((stat) => (
            <button
              key={stat.key}
              onClick={() => setSelectedFilter(stat.key)}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                selectedFilter === stat.key
                  ? `border-${stat.color}-300 bg-${stat.color}-50`
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div
                className={`text-2xl font-bold ${
                  selectedFilter === stat.key
                    ? `text-${stat.color}-700`
                    : "text-gray-900"
                }`}
              >
                {stat.value}
              </div>
              <div
                className={`text-sm ${
                  selectedFilter === stat.key
                    ? `text-${stat.color}-600`
                    : "text-gray-600"
                }`}
              >
                {stat.label}
              </div>
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-lg">
            <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-4 font-poppins">
              {selectedFilter === "all"
                ? "No Applications Yet"
                : `No ${
                    selectedFilter.charAt(0).toUpperCase() +
                    selectedFilter.slice(1)
                  } Applications`}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {selectedFilter === "all"
                ? "Start applying for jobs to see them here"
                : `No applications with ${selectedFilter} status found`}
            </p>
            {selectedFilter === "all" && (
              <Link
                href="/dashboard/labor"
                className="bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
              >
                <span>Browse Jobs</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((application) => {
              const job = application.jobDetails;
              return (
                <div
                  key={application.id}
                  className="group bg-white p-6 rounded-3xl shadow-lg hover:shadow-2xl border border-gray-100 hover:border-cyan-200 transition-all duration-500 relative overflow-hidden"
                >
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-cyan-50 to-blue-50 rounded-full -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500"></div>

                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 relative z-10">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-cyan-700 transition-colors duration-300 font-poppins">
                              {job?.title || "Job Details Unavailable"}
                            </h3>
                            <div
                              className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(
                                application.status
                              )}`}
                            >
                              {getStatusIcon(application.status)}
                              <span>
                                {application.status.charAt(0).toUpperCase() +
                                  application.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          {job && (
                            <>
                              {job.company && (
                                <p className="text-cyan-600 font-semibold text-lg mb-2">
                                  {job.company}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{job.locationName}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(
                                      job.requiredDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{job.durationHours} hours</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        {job && (
                          <div className="text-right ml-6">
                            <div className="bg-linear-to-br from-green-400 to-green-600 text-white px-4 py-2 rounded-2xl shadow-lg">
                              <div className="text-lg font-bold">
                                ₹{job.wageAmount}
                              </div>
                              <div className="text-xs opacity-90">
                                {job.wageType === "daily"
                                  ? "per day"
                                  : "per hour"}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Application Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 p-4 rounded-2xl group-hover:bg-cyan-50 transition-colors duration-300">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                Applied On
                              </p>
                              <p className="font-semibold text-gray-800">
                                {new Date(
                                  application.appliedAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl group-hover:bg-cyan-50 transition-colors duration-300">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                              <Building className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Status</p>
                              <p className="font-semibold text-gray-800">
                                {application.status.charAt(0).toUpperCase() +
                                  application.status.slice(1)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Job Description */}
                      {job?.description && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-800 mb-2">
                            Job Description
                          </h4>
                          <p className="text-gray-700 bg-gray-50 p-4 rounded-xl group-hover:bg-cyan-50 transition-colors duration-300 text-sm">
                            {job.description}
                          </p>
                        </div>
                      )}

                      {/* Status-specific information */}
                      {application.status === "confirmed" && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-xl">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <div>
                              <p className="text-green-800 font-medium">
                                Application Accepted!
                              </p>
                              <p className="text-green-700 text-sm">
                                You've been selected for this job. Please arrive
                                on time.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {application.status === "rejected" && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
                          <div className="flex items-center space-x-3">
                            <XCircle className="w-8 h-8 text-red-600" />
                            <div>
                              <p className="text-red-800 font-medium">
                                Application Not Selected
                              </p>
                              <p className="text-red-700 text-sm">
                                Unfortunately, your application wasn't selected
                                this time.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {application.status === "pending" && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-xl">
                          <div className="flex items-center space-x-3">
                            <AlertCircle className="w-8 h-8 text-yellow-600" />
                            <div>
                              <p className="text-yellow-800 font-medium">
                                Application Under Review
                              </p>
                              <p className="text-yellow-700 text-sm">
                                Your application is being reviewed by the
                                supervisor.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
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
