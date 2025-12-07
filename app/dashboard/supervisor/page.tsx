// app/dashboard/supervisor/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  getSupervisorJobs,
  toggleJobListing,
  deleteJobPosting,
  getJobApplications,
} from "@/lib/firestore";
import { JobListing, JobApplication } from "@/types";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Trash2,
  Users,
  Clock,
  MapPin,
  Calendar,
  Plus,
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

export default function SupervisorDashboard() {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<{
    [jobId: string]: JobApplication[];
  }>({});

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Load supervisor's jobs
        const jobData = await getSupervisorJobs(user.uid);
        setJobs(jobData);

        // Load applications for each job
        const appsData: { [jobId: string]: JobApplication[] } = {};
        for (const job of jobData) {
          if (job.id) {
            appsData[job.id] = await getJobApplications(job.id);
          }
        }
        setApplications(appsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleToggleListing = async (jobId: string, currentListed: boolean) => {
    try {
      await toggleJobListing(jobId, !currentListed);
      setJobs(
        jobs.map((job) =>
          job.id === jobId ? { ...job, isListed: !currentListed } : job
        )
      );
    } catch (error) {
      console.error("Error toggling job listing:", error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;

    try {
      await deleteJobPosting(jobId);
      setJobs(jobs.filter((job) => job.id !== jobId));
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  const getJobStatusBadge = (job: JobListing) => {
    const isExpired = new Date(job.expiresAt) <= new Date();
    if (isExpired)
      return (
        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
          Expired
        </span>
      );
    if (job.status === "delisted")
      return (
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
          Deleted
        </span>
      );
    if (!job.isListed)
      return (
        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
          Unlisted
        </span>
      );
    if (job.laborersApplied >= job.laborersRequired)
      return (
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
          Full
        </span>
      );
    return (
      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
        Active
      </span>
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold gradient-text font-poppins mb-2">
                Supervisor Hub 👔
              </h1>
              <p className="text-base lg:text-lg text-gray-600 font-medium">
                Manage your workforce and job postings efficiently
              </p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="bg-linear-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{jobs.length}</div>
                  <div className="text-sm opacity-90">Total Jobs</div>
                </div>
              </div>
              <Link
                href="/dashboard/supervisor/post-job"
                className="group bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center space-x-2"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Post New Job</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Total Jobs",
              value: jobs.length,
              icon: "📋",
              color: "from-blue-500 to-blue-600",
              bgColor: "bg-blue-50",
              textColor: "text-blue-600",
            },
            {
              title: "Active Jobs",
              value: jobs.filter((j) => j.status === "open" && j.isListed)
                .length,
              icon: "✅",
              color: "from-green-500 to-green-600",
              bgColor: "bg-green-50",
              textColor: "text-green-600",
            },
            {
              title: "Applications",
              value: jobs.reduce((sum, job) => sum + job.laborersApplied, 0),
              icon: "👥",
              color: "from-purple-500 to-purple-600",
              bgColor: "bg-purple-50",
              textColor: "text-purple-600",
            },
            {
              title: "Expired",
              value: jobs.filter((j) => new Date(j.expiresAt) <= new Date())
                .length,
              icon: "⏰",
              color: "from-orange-500 to-orange-600",
              bgColor: "bg-orange-50",
              textColor: "text-orange-600",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="group bg-white p-6 rounded-3xl shadow-lg hover:shadow-2xl border border-gray-100 hover:border-cyan-200 transition-all duration-500 relative overflow-hidden"
            >
              <div
                className={`absolute top-0 right-0 w-20 h-20 ${stat.bgColor} rounded-full -translate-y-4 translate-x-4 group-hover:scale-110 transition-transform duration-500`}
              ></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-16 h-16 bg-linear-to-br ${stat.color} rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {stat.icon}
                  </div>
                  <div className={`text-right`}>
                    <div
                      className={`text-3xl font-bold ${stat.textColor} group-hover:scale-105 transition-transform duration-300`}
                    >
                      {stat.value}
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                  {stat.title}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Job Listings */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 font-poppins">
                  Your Job Postings
                </h2>
                <p className="text-gray-600 mt-2">
                  Manage and track all your job listings
                </p>
              </div>
              <div className="bg-cyan-50 px-4 py-2 rounded-xl">
                <span className="text-cyan-700 font-medium">
                  {jobs.length} {jobs.length === 1 ? "Job" : "Jobs"}
                </span>
              </div>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-32 h-32 mx-auto mb-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-5xl">📋</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4 font-poppins">
                No Jobs Posted Yet
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Start building your workforce by posting your first job. It's
                quick and easy!
              </p>
              <Link
                href="/dashboard/supervisor/post-job"
                className="group bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 inline-flex items-center space-x-2"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Create Your First Job</span>
              </Link>
            </div>
          ) : (
            <div className="p-8 space-y-6">
              {jobs.map((job, index) => {
                const isExpired = new Date(job.expiresAt) <= new Date();
                const isActive =
                  job.status === "open" && job.isListed && !isExpired;

                return (
                  <div
                    key={job.id}
                    className="group bg-gray-50 hover:bg-white p-6 rounded-2xl border border-gray-100 hover:border-cyan-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-50 rounded-full -translate-y-4 translate-x-4 group-hover:scale-110 transition-transform duration-500"></div>

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 relative z-10">
                      <div className="flex-1 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-800 group-hover:text-cyan-700 transition-colors duration-300 font-poppins">
                                {job.title}
                              </h3>
                              {getJobStatusBadge(job)}
                            </div>
                            <p className="text-gray-600 leading-relaxed mb-4">
                              {job.description}
                            </p>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="bg-linear-to-br from-green-400 to-green-600 text-white px-4 py-2 rounded-2xl shadow-lg">
                              <div className="text-lg font-bold">
                                ₹{job.wageAmount}
                              </div>
                              <div className="text-xs opacity-90">
                                per {job.wageType}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Job Details Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white p-3 rounded-xl group-hover:bg-cyan-50 transition-colors duration-300">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">
                                  Location
                                </div>
                                <div className="text-sm font-semibold text-gray-800">
                                  {job.locationName}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-xl group-hover:bg-cyan-50 transition-colors duration-300">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-4 h-4 text-purple-600" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">
                                  Duration
                                </div>
                                <div className="text-sm font-semibold text-gray-800">
                                  {job.durationHours}h
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-xl group-hover:bg-cyan-50 transition-colors duration-300">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-orange-600" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">
                                  Date
                                </div>
                                <div className="text-sm font-semibold text-gray-800">
                                  {new Date(
                                    job.requiredDate
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-xl group-hover:bg-cyan-50 transition-colors duration-300">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <Users className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">
                                  Applications
                                </div>
                                <div className="text-sm font-semibold text-gray-800">
                                  {job.laborersApplied}/{job.laborersRequired}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expiration Info */}
                        <div
                          className={`text-sm p-3 rounded-xl ${
                            isExpired
                              ? "bg-red-50 text-red-700"
                              : new Date(job.expiresAt) <=
                                new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span>⏰</span>
                            <span>
                              {isExpired
                                ? `Expired on ${new Date(
                                    job.expiresAt
                                  ).toLocaleDateString()}`
                                : `Expires on ${new Date(
                                    job.expiresAt
                                  ).toLocaleDateString()}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex lg:flex-col gap-2 lg:ml-6">
                        {job.status !== "delisted" && (
                          <>
                            <button
                              onClick={() =>
                                handleToggleListing(job.id!, job.isListed)
                              }
                              className={`flex items-center justify-center px-4 py-3 text-sm rounded-xl font-medium transition-all duration-300 ${
                                job.isListed
                                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 hover:scale-105"
                                  : "bg-green-100 text-green-700 hover:bg-green-200 hover:scale-105"
                              }`}
                            >
                              {job.isListed ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  Unlist
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  List
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job.id!)}
                              className="flex items-center justify-center px-4 py-3 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          </>
                        )}
                        {job.laborersApplied > 0 && (
                          <Link
                            href={`/dashboard/supervisor/applications/${job.id}`}
                            className="flex items-center justify-center px-4 py-3 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            View ({job.laborersApplied})
                          </Link>
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
    </div>
  );
}
