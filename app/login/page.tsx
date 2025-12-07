"use client";

import { useState, useEffect } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Lock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import LoadingScreen from "@/components/LoadingScreen";

// Extend window type for recaptcha
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

type Step = "INPUT_PHONE" | "INPUT_OTP";

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState<string>("+91");
  const [otp, setOtp] = useState<string>("");
  const [step, setStep] = useState<Step>("INPUT_PHONE");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  // Redirect if user is already logged in
  useEffect(() => {
    const checkUser = auth.currentUser;
    if (checkUser) {
      console.log("User already logged in, redirecting to home");
      router.push("/");
    }
  }, [router]);

  // Initialize Recaptcha on mount
  useEffect(() => {
    const initializeRecaptcha = () => {
      try {
        // Clean up any existing verifier
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch (clearError) {
            console.log("Error clearing existing recaptcha:", clearError);
          }
          window.recaptchaVerifier = undefined;
        }

        console.log("Initializing reCAPTCHA...");

        // Wait a bit before initializing to ensure DOM is ready
        setTimeout(() => {
          const recaptchaContainer = document.getElementById(
            "recaptcha-container"
          );
          if (!recaptchaContainer) {
            console.error("Recaptcha container not found");
            return;
          }

          window.recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "invisible",
              callback: (response: string) => {
                console.log("Recaptcha solved successfully");
              },
              "expired-callback": () => {
                console.log("Recaptcha expired");
                setError("Recaptcha expired. Please try again.");
                toast.error("Recaptcha expired. Please try again.");
              },
            }
          );
          console.log("reCAPTCHA initialized successfully");
        }, 100);
      } catch (error) {
        console.error("Failed to initialize recaptcha:", error);
        toast.error(
          "Failed to initialize authentication. Please refresh the page."
        );
      }
    };

    // Only initialize in browser environment
    if (typeof window !== "undefined") {
      initializeRecaptcha();
    }

    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = undefined;
        } catch (error) {
          console.log("Error during cleanup:", error);
        }
      }
    };
  }, []);

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate phone number format
    const cleanNumber = phoneNumber.replace(/\s+/g, "");
    if (cleanNumber.length < 13 || !cleanNumber.match(/^\+91[6-9]\d{9}$/)) {
      setError(
        "Please enter a valid Indian mobile number (+91 followed by 10 digits)"
      );
      toast.error("Please enter a valid Indian mobile number");
      setLoading(false);
      return;
    }

    try {
      console.log("Starting OTP send process for:", cleanNumber);

      // Ensure recaptcha is ready
      if (!window.recaptchaVerifier) {
        console.log("Creating new recaptcha verifier...");
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: (response: string) => {
              console.log("Recaptcha solved successfully");
            },
            "expired-callback": () => {
              console.log("Recaptcha expired");
              setError("Recaptcha expired. Please try again.");
              toast.error("Recaptcha expired. Please try again.");
            },
          }
        );
      }

      const appVerifier = window.recaptchaVerifier;
      console.log("Recaptcha verifier ready, sending OTP...");

      const confirmation = await signInWithPhoneNumber(
        auth,
        cleanNumber,
        appVerifier
      );

      console.log("OTP sent successfully");
      setConfirmationResult(confirmation);
      setStep("INPUT_OTP");
      toast.success("OTP sent successfully!");
    } catch (error: any) {
      console.error("Error sending OTP:", error);

      // Handle specific Firebase errors
      if (error?.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.");
        toast.error("Too many requests. Please try again later.");
      } else if (error?.code === "auth/invalid-phone-number") {
        setError("Invalid phone number format.");
        toast.error("Invalid phone number format.");
      } else {
        setError("Failed to send OTP. Please try again.");
        toast.error("Failed to send OTP. Please try again.");
      }

      // Reset reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      toast.error("Please enter a valid 6-digit OTP");
      setLoading(false);
      return;
    }

    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otp);
        toast.success("Phone verified successfully!");
        router.push("/onboarding");
      } else {
        throw new Error("No confirmation result available");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);

      if (error?.code === "auth/invalid-verification-code") {
        setError("Invalid OTP. Please check and try again.");
        toast.error("Invalid OTP. Please check and try again.");
      } else {
        setError("Failed to verify OTP. Please try again.");
        toast.error("Failed to verify OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  const goBack = () => {
    setStep("INPUT_PHONE");
    setOtp("");
    setError("");
    setConfirmationResult(null);

    // Reset reCAPTCHA
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = undefined;
    }
  };
  if (loading && step === "INPUT_OTP" && !confirmationResult) {
    return <LoadingScreen message="Sending OTP..." />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
        className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 w-full max-w-md relative z-10"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{
              y: [0, -8, 0],
              rotate: [0, 2, -2, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="relative"
          >
            <div className="absolute inset-0 bg-cyan-200 rounded-full opacity-20 scale-110"></div>
            <Image
              src="/logo.gif"
              alt="Naukri Bandu"
              width={100}
              height={100}
              className="mx-auto mb-6 rounded-full shadow-xl relative z-10"
              unoptimized
            />
          </motion.div>
          <motion.h1
            className="text-4xl font-bold gradient-text mb-3 font-poppins"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          >
            Welcome Back! 👋
          </motion.h1>
          <motion.p
            className="text-gray-600 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {step === "INPUT_PHONE"
              ? "Enter your phone number to get started"
              : `Verify the OTP sent to ${phoneNumber}`}
          </motion.p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "INPUT_PHONE" ? (
            <motion.form
              key="phone-form"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
              onSubmit={handleSendOtp}
              className="space-y-7"
            >
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  📱 Phone Number
                </label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-500 w-5 h-5 transition-colors duration-200 group-hover:text-cyan-600" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      let value = e.target.value;

                      // Always ensure +91 prefix
                      if (!value.startsWith("+91")) {
                        if (value.startsWith("+9") || value.startsWith("+")) {
                          setPhoneNumber("+91");
                        } else {
                          const digits = value.replace(/\D/g, "");
                          if (digits.length > 0) {
                            setPhoneNumber("+91" + digits.slice(0, 10));
                          } else {
                            setPhoneNumber("+91");
                          }
                        }
                      } else {
                        const digits = value.slice(3).replace(/\D/g, "");
                        // Validate first digit (should be 6-9 for Indian mobile numbers)
                        if (
                          digits.length > 0 &&
                          !["6", "7", "8", "9"].includes(digits[0])
                        ) {
                          toast.error(
                            "Indian mobile numbers start with 6, 7, 8, or 9"
                          );
                          return;
                        }
                        if (digits.length <= 10) {
                          setPhoneNumber("+91" + digits);
                        }
                      }
                    }}
                    placeholder="+91 9876543210"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover:border-cyan-300 transition-all duration-300 text-gray-900 bg-white placeholder-gray-400 focus:shadow-xl font-semibold text-lg group-hover:shadow-md"
                    required
                  />
                  <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs text-blue-700 font-medium">
                    ℹ️ Enter valid 10-digit mobile number starting with 6, 7, 8,
                    or 9
                  </p>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex items-center space-x-3 text-red-600 bg-red-50 p-4 rounded-2xl border-l-4 border-red-500"
                >
                  <AlertCircle size={20} className="shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={
                  loading ||
                  phoneNumber.length < 13 ||
                  !phoneNumber.match(/^\+91[6-9]\d{9}$/)
                }
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform duration-300"
                    />
                  </>
                )}
              </motion.button>
            </motion.form>
          ) : (
            <motion.form
              key="otp-form"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
              onSubmit={handleVerifyOtp}
              className="space-y-7"
            >
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  🔐 Enter Verification Code
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-500 w-5 h-5 transition-colors duration-200 group-hover:text-cyan-600" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="123456"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover:border-cyan-300 transition-all duration-300 text-center text-3xl tracking-widest font-bold text-gray-900 bg-white focus:shadow-xl group-hover:shadow-md"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs text-green-700 font-medium text-center">
                    ✅ OTP sent to {phoneNumber}
                  </p>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex items-center space-x-3 text-red-600 bg-red-50 p-4 rounded-2xl border-l-4 border-red-500"
                >
                  <AlertCircle size={20} className="shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading || otp.length !== 6}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    <span>Verify & Continue</span>
                  </>
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={goBack}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-gray-600 hover:text-cyan-600 py-3 px-4 text-sm font-semibold transition-all duration-300 rounded-xl hover:bg-gray-50 border border-gray-200 hover:border-cyan-200"
              >
                ← Back to phone number
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8 pt-6 border-t border-gray-100"
        >
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
            {[
              { icon: "🔒", text: "Secure Login" },
              { icon: "🏛️", text: "Government Approved" },
              { icon: "⚡", text: "Instant Access" },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="flex items-center space-x-2 hover:text-cyan-600 transition-colors duration-200"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-center mt-4"
          >
            <p className="text-xs text-gray-500">
              By continuing, you agree to our terms and privacy policy
            </p>
          </motion.div>
        </motion.div>

        {/* Hidden reCAPTCHA container */}
        <div
          id="recaptcha-container"
          className="fixed bottom-0 left-0 opacity-0 pointer-events-none"
        ></div>
      </motion.div>
    </div>
  );
}
