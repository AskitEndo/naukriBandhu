// app/dashboard/labor/bookings/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getLaborBookings } from "@/lib/firestore";
import { Booking } from "@/types";
import Link from "next/link";

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

  if (loading) return <div className="p-8">Loading your schedule...</div>;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Schedule 📅</h1>
        <Link
          href="/dashboard/labor"
          className="text-blue-600 underline text-sm"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-10 bg-white rounded shadow">
          <p className="text-gray-500 mb-4">You haven't booked any jobs yet.</p>
          <Link
            href="/dashboard/labor"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Find Work
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-green-500"
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center">
                <div>
                  <h3 className="font-bold text-lg text-black">{b.jobTitle}</h3>
                  <p className="text-gray-600">📍 {b.locationName}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    🗓️ {b.jobDate} &nbsp; | &nbsp; ⏱️ {b.durationHours} Hours
                  </p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <span className="block text-2xl font-bold text-green-700">
                    ₹{b.wageAmount}
                  </span>
                  <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
                    Confirmed
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
