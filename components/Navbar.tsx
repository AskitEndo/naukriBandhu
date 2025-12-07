"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { getUserProfile, updateUserRole } from "@/lib/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  User,
  Building,
  Clock,
  DollarSign,
  Menu,
  X,
  ChevronRight,
  Users,
  Briefcase,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({
    hours: 0,
    earnings: 0,
    jobsPosted: 0,
  });

  // Get user profile on mount
  useEffect(() => {
    if (user?.uid) {
      getUserProfile(user.uid).then((profile) => {
        setUserProfile(profile);
        // You can add logic here to fetch weekly stats
      });
    }
  }, [user]);

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (segment === "dashboard") label = "Dashboard";
      else if (segment === "labor") label = "Labor Portal";
      else if (segment === "supervisor") label = "Supervisor Portal";
      else if (segment === "post-job") label = "Post Job";
      else if (segment === "bookings") label = "My Schedule";
      else if (segment === "onboarding") label = "Getting Started";

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
        current: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleRoleSwitch = async () => {
    if (!user?.uid || !userProfile) return;

    try {
      const newRole = userProfile.role === "labor" ? "supervisor" : "labor";

      // Update role in database
      await updateUserRole(user.uid, newRole);

      // Update local state
      setUserProfile({ ...userProfile, role: newRole });

      // Navigate to appropriate dashboard
      if (newRole === "supervisor") {
        router.push("/dashboard/supervisor");
      } else {
        router.push("/dashboard/labor");
      }
    } catch (error) {
      console.error("Error switching roles:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!user) {
    // Show simple navbar for non-authenticated users
    return (
      <>
        <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-18">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <Image
                    src="/logo.png"
                    alt="Naukri Bandhu"
                    width={45}
                    height={45}
                    className="rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md"
                  />
                  <div className="absolute inset-0 bg-cyan-200 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </div>
                <span className="font-bold text-xl sm:text-2xl text-cyan-700 font-poppins group-hover:text-cyan-800 transition-colors duration-300">
                  Naukri Bandhu
                </span>
              </Link>

              <div className="hidden md:flex items-center space-x-6">
                <button
                  onClick={() => {
                    document.getElementById("features")?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                  className="text-gray-700 hover:text-cyan-600 font-medium transition-colors duration-200"
                >
                  Features
                </button>
                <button
                  onClick={() => {
                    document.getElementById("contact")?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                  className="text-gray-700 hover:text-cyan-600 font-medium transition-colors duration-200"
                >
                  Contact
                </button>
                <Link
                  href="/login"
                  className="bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-sm sm:text-base"
                >
                  Get Started
                </Link>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu for non-authenticated users */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden bg-white border-b border-gray-200 shadow-lg"
            >
              <div className="px-4 py-6 space-y-4">
                <button
                  onClick={() => {
                    document.getElementById("features")?.scrollIntoView({
                      behavior: "smooth",
                    });
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-gray-700 hover:text-cyan-600 font-medium py-3 transition-colors duration-200"
                >
                  Features
                </button>
                <button
                  onClick={() => {
                    document.getElementById("contact")?.scrollIntoView({
                      behavior: "smooth",
                    });
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-gray-700 hover:text-cyan-600 font-medium py-3 transition-colors duration-200"
                >
                  Contact
                </button>
                <Link
                  href="/login"
                  className="block w-full bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="Naukri Bandhu"
                  width={45}
                  height={45}
                  className="rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-md"
                />
                <div className="absolute inset-0 bg-cyan-200 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </div>
              <span className="font-bold text-2xl text-cyan-700 font-poppins group-hover:text-cyan-800 transition-colors duration-300">
                Naukri Bandhu
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Role-specific stats - Only for labor */}
              {userProfile?.role === "labor" && (
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1 text-orange-600">
                    <Clock size={16} />
                    <span>{weeklyStats.hours}/50h</span>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <DollarSign size={16} />
                    <span>₹{weeklyStats.earnings}</span>
                  </div>
                </div>
              )}

              {/* Role Switcher */}
              <button
                onClick={handleRoleSwitch}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 hover:border-cyan-300 transition-all duration-200 text-sm font-medium text-cyan-700 hover:text-cyan-800"
              >
                {userProfile?.role === "labor" ? (
                  <>
                    <Building size={16} />
                    <span>Switch to Supervisor</span>
                  </>
                ) : (
                  <>
                    <User size={16} />
                    <span>Switch to Labor</span>
                  </>
                )}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors text-sm"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 1 && (
          <div className="bg-gray-50 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex items-center space-x-1 py-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center">
                    {index > 0 && (
                      <ChevronRight size={14} className="mx-1 text-gray-400" />
                    )}
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="text-cyan-600 hover:text-cyan-700 transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-gray-900 font-medium">
                        {crumb.label}
                      </span>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-b border-gray-200 shadow-lg"
          >
            <div className="px-4 py-3 space-y-3">
              {/* Role-specific stats - Only for labor */}
              {userProfile?.role === "labor" && (
                <div className="flex justify-between text-sm">
                  <div className="flex items-center space-x-1 text-orange-600">
                    <Clock size={16} />
                    <span>{weeklyStats.hours}/50h this week</span>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <DollarSign size={16} />
                    <span>₹{weeklyStats.earnings} earned</span>
                  </div>
                </div>
              )}

              {/* Role Switcher */}
              <button
                onClick={handleRoleSwitch}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 hover:border-cyan-300 transition-all duration-200 font-medium text-cyan-700 hover:text-cyan-800"
              >
                {userProfile?.role === "labor" ? (
                  <>
                    <Building size={16} />
                    <span>Switch to Supervisor</span>
                  </>
                ) : (
                  <>
                    <User size={16} />
                    <span>Switch to Labor</span>
                  </>
                )}
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
