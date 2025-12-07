// app/dashboard/supervisor/bookings/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getSupervisorBookings } from "@/lib/firestore";
import { Booking } from "@/types";
import Link from "next/link";
import LoadingScreen from "@/components/LoadingScreen";

export default function SupervisorBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getSupervisorBookings(user.uid).then((data) => {
        setBookings(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          My Hires / History 📋
        </h1>
        <Link
          href="/dashboard/supervisor"
          className="text-blue-600 underline text-sm"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white p-8 rounded shadow text-center">
          <p className="text-gray-500">No one has booked your jobs yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Job Title</th>
                <th className="p-4 font-semibold text-gray-700">Worker ID</th>
                <th className="p-4 font-semibold text-gray-700">Date</th>
                <th className="p-4 font-semibold text-gray-700">Wage</th>
                <th className="p-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 text-black">{b.jobTitle}</td>
                  <td className="p-4 font-mono text-xs text-gray-500">
                    {b.laborId.slice(0, 8)}...
                  </td>
                  <td className="p-4 text-black">{b.jobDate}</td>
                  <td className="p-4 font-bold text-black">₹{b.wageAmount}</td>
                  <td className="p-4 text-green-600 font-bold text-xs uppercase">
                    {b.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
