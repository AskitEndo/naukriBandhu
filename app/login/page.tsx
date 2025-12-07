// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type Step = "INPUT_PHONE" | "INPUT_OTP";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    grecaptcha: any;
  }
}

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState<string>("+91"); // Default to India code
  const [otp, setOtp] = useState<string>("");
  const [step, setStep] = useState<Step>("INPUT_PHONE"); // INPUT_PHONE or INPUT_OTP
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
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
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response: string) => {
            // reCAPTCHA solved
          },
          "expired-callback": () => {
            setError("Recaptcha expired. Please try again.");
          },
        }
      );
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (phoneNumber.length < 12) {
      setError(
        "Please enter a valid phone number with country code (e.g., +91...)"
      );
      return;
    }

    const appVerifier = window.recaptchaVerifier;

    try {
      const result = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );
      setConfirmationResult(result);
      setStep("INPUT_OTP");
    } catch (err) {
      console.error(err);
      setError(
        "Failed to send OTP. Ensure you added the test number in Firebase Console."
      );
      // If captcha fails, we might need to reset it
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then((widgetId: number) => {
          window.grecaptcha.reset(widgetId);
        });
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!confirmationResult) return;

    try {
      const result = await confirmationResult.confirm(otp);
      console.log("Authentication successful:", result.user);
      // Success! User is logged in.
      // Add a small delay to ensure the auth state is updated
      setTimeout(() => {
        router.push("/");
        router.refresh(); // Force refresh to update the UI
      }, 100);
    } catch (err) {
      console.error(err);
      setError("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Naukri Bandu Login
        </h1>

        {/* Hidden Container for Recaptcha */}
        <div id="recaptcha-container"></div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {step === "INPUT_PHONE" ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 9999999999"
                className="w-full border border-gray-300 p-2 rounded text-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use your test number: +91 9999999999
              </p>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full border border-gray-300 p-2 rounded text-black tracking-widest text-center text-xl"
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            >
              Verify & Login
            </button>
            <button
              type="button"
              onClick={() => setStep("INPUT_PHONE")}
              className="text-sm text-blue-600 underline text-center"
            >
              Change Phone Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
