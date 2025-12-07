"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getUserProfile } from "@/lib/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield,
  DollarSign,
  Clock,
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import LoadingScreen from "@/components/LoadingScreen";

const notifications = [
  "🎯 Get fair wages as per government standards",
  "⚡ Find work instantly in your area",
  "🛡️ Work safely with 50-hour weekly limits",
  "💰 Earn more with verified supervisors",
  "📱 Track your hours and earnings easily",
  "🤝 Join thousands of satisfied workers",
  "🏆 Guaranteed minimum wage compliance",
  "🚀 Quick application process",
  "🔒 Secure payment system",
  "📊 Real-time work tracking",
];

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checkingDb, setCheckingDb] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(0);

  // Auto-scroll notifications
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNotification((prev) => (prev + 1) % notifications.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        setCheckingDb(true);
        try {
          const profile = await getUserProfile((user as any).uid);

          if (!profile || !profile.role) {
            // No profile found -> Send to Onboarding
            router.push("/onboarding");
          } else {
            // Profile found -> Send to Dashboard (default to labor)
            router.push(`/dashboard/${profile.role}`);
          }
        } catch (error) {
          console.error("Error checking user role:", error);
        } finally {
          setCheckingDb(false);
        }
      }
    };

    checkUserRole();
  }, [user, router]);

  if (authLoading || checkingDb) {
    return <LoadingScreen message="Welcome to Naukri Bandu..." />;
  }

  if (user) {
    return <LoadingScreen message="Redirecting to your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: 1,
                rotate: 0,
                y: [0, -8, 0],
              }}
              transition={{
                scale: { delay: 0.2, type: "spring", stiffness: 200 },
                rotate: { delay: 0.2, duration: 0.8 },
                y: {
                  delay: 1,
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              className="mb-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-white rounded-full shadow-2xl opacity-50 scale-110"></div>
                <Image
                  src="/logo.gif"
                  alt="Naukri Bandhu"
                  width={150}
                  height={150}
                  className="mx-auto relative z-10 rounded-full shadow-xl"
                  unoptimized
                />
              </div>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 font-poppins tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <motion.span
                className="gradient-text"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                Naukri
              </motion.span>{" "}
              <motion.span
                className="gradient-text"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3, duration: 0.6 }}
              >
                Bandhu
              </motion.span>
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-8 max-w-4xl mx-auto leading-relaxed font-medium px-4 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
            >
              Your trusted partner for{" "}
              <span className="text-cyan-600 font-semibold">fair wages</span>{" "}
              and{" "}
              <span className="text-blue-600 font-semibold">
                safe working conditions
              </span>
              . Connect laborers with supervisors while ensuring government
              compliance.
            </motion.p>

            {/* Feature badges */}
            <motion.div
              className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 px-4 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.6 }}
            >
              {[
                { icon: "🛡️", text: "Safety First" },
                { icon: "💰", text: "Fair Wages" },
                { icon: "⚡", text: "Instant Jobs" },
                { icon: "📱", text: "Easy Tracking" },
              ].map((badge, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="glass px-4 py-2 rounded-full text-sm font-medium text-gray-700 shadow-lg"
                >
                  <span className="mr-2">{badge.icon}</span>
                  {badge.text}
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 px-4 sm:px-0"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.9, duration: 0.6 }}
            >
              <motion.div
                whileHover={{
                  scale: 1.05,
                  y: -4,
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link
                  href="/login"
                  className="group bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <span className="relative z-10">Get Started Today</span>
                  <ArrowRight
                    size={22}
                    className="relative z-10 group-hover:translate-x-1 transition-transform duration-300"
                  />
                </Link>
              </motion.div>
              <motion.button
                whileHover={{
                  scale: 1.02,
                  y: -4,
                  backgroundColor: "rgba(6, 182, 212, 0.05)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="group border-2 border-cyan-200 hover:border-cyan-400 text-cyan-700 hover:text-cyan-800 px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                <span className="group-hover:mr-2 transition-all duration-300">
                  Learn More
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Enhanced floating notification marquee */}
        <div className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden">
          <div className="bg-linear-to-r from-cyan-600 via-blue-600 to-cyan-600 text-white py-6 relative shadow-2xl">
            {/* Continuous scrolling marquee */}
            <div className="flex animate-marquee">
              <div className="flex items-center space-x-12 px-6 whitespace-nowrap">
                {notifications
                  .concat(notifications)
                  .map((notification, index) => (
                    <motion.span
                      key={index}
                      className="text-lg font-medium flex items-center space-x-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span className="text-xl">
                        {notification.split(" ")[0]}
                      </span>
                      <span>
                        {notification.substring(notification.indexOf(" ") + 1)}
                      </span>
                    </motion.span>
                  ))}
              </div>
            </div>

            {/* Gradient overlays for smooth appearance */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-cyan-600 to-transparent"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-cyan-600 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 bg-white relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.h2
              className="text-5xl md:text-6xl font-bold mb-6 font-poppins"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Why Choose <span className="gradient-text">Naukri Bandhu</span>?
            </motion.h2>
            <motion.p
              className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              We're not just another job portal. We're a platform built with
              <span className="text-cyan-600 font-semibold">
                {" "}
                worker safety
              </span>{" "}
              and{" "}
              <span className="text-blue-600 font-semibold">fair wages</span> at
              its core.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <DollarSign className="w-10 h-10" />,
                title: "Fair Wages Guaranteed",
                description:
                  "All jobs meet government minimum wage standards with transparent pay structures",
                color: "text-emerald-600",
                bgColor: "bg-emerald-50",
                borderColor: "border-emerald-200",
                hoverColor: "hover:border-emerald-400",
              },
              {
                icon: <Shield className="w-10 h-10" />,
                title: "Safety First",
                description:
                  "50-hour weekly limit prevents overwork and ensures worker wellbeing",
                color: "text-blue-600",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
                hoverColor: "hover:border-blue-400",
              },
              {
                icon: <Clock className="w-10 h-10" />,
                title: "Real-time Tracking",
                description:
                  "Monitor your hours, earnings, and job progress with live updates",
                color: "text-amber-600",
                bgColor: "bg-amber-50",
                borderColor: "border-amber-200",
                hoverColor: "hover:border-amber-400",
              },
              {
                icon: <Users className="w-10 h-10" />,
                title: "Trusted Network",
                description:
                  "Connect with verified supervisors and skilled workers in your area",
                color: "text-purple-600",
                bgColor: "bg-purple-50",
                borderColor: "border-purple-200",
                hoverColor: "hover:border-purple-400",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{
                  y: -12,
                  scale: 1.03,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }}
                viewport={{ once: true }}
                className={`group bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border-2 ${feature.borderColor} ${feature.hoverColor} relative overflow-hidden`}
              >
                {/* Animated background effect */}
                <div
                  className={`absolute inset-0 ${feature.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                ></div>

                <div className="relative z-10">
                  <div
                    className={`${feature.color} mb-6 transform group-hover:scale-110 transition-transform duration-300`}
                  >
                    <div
                      className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-4`}
                    >
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors duration-300 font-poppins">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative element */}
                <div
                  className={`absolute -top-2 -right-2 w-20 h-20 ${feature.bgColor} rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500`}
                ></div>
              </motion.div>
            ))}
          </div>

          {/* Call to action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Link
              href="/login"
              className="group inline-flex items-center space-x-3 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <span>Start Your Journey</span>
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform duration-300"
              />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="py-20 bg-cyan-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
            {[
              { number: "10,000+", label: "Workers Protected" },
              { number: "₹50L+", label: "Fair Wages Ensured" },
              { number: "99%", label: "Safety Compliance" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-cyan-100 text-lg">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-20 bg-linear-to-br from-gray-900 via-blue-900 to-cyan-900 text-white relative overflow-hidden"
      >
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-poppins">
              Get in <span className="text-cyan-400">Touch</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Have questions? We're here to help you get started with fair work
              opportunities.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="text-center lg:text-left">
                <h3 className="text-2xl font-bold mb-6 text-cyan-400">
                  Contact Information
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-center lg:justify-start space-x-4">
                    <div className="w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-gray-300">support@naukribandhu.com</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center lg:justify-start space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Phone</p>
                      <p className="text-gray-300">+91 999-999-9999</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center lg:justify-start space-x-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Address</p>
                      <p className="text-gray-300">
                        Bangalore Yelahanka, Karnataka & Bihar, India
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <div className="glass rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-center">
                  Send us a Message
                </h3>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="Your Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                      placeholder="Tell us more about your query..."
                    ></textarea>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Send Message
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/logo.gif"
                  alt="Naukri Bandhu"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <span className="text-2xl font-bold font-poppins">
                  Naukri Bandhu
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                Empowering the blue-collar workforce with fair wages, safe
                working conditions, and government compliance. Built by workers,
                for workers.
              </p>
              <div className="flex space-x-4">
                {/* Social Media Icons */}
                <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center hover:bg-cyan-700 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">f</span>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">t</span>
                </div>
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">in</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 font-poppins">
                For Workers
              </h3>
              <ul className="space-y-3 text-gray-400">
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Find Jobs
                </li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Track Hours
                </li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Earn Fairly
                </li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Stay Safe
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 font-poppins">
                For Employers
              </h3>
              <ul className="space-y-3 text-gray-400">
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Post Jobs
                </li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Hire Workers
                </li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Ensure Compliance
                </li>
                <li className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Build Trust
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p className="font-medium">
              &copy; 2024 Naukri Bandhu. Made with ❤️ for the hardworking people
              of India.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
