// types/index.ts

export interface UserProfile {
  uid: string;
  phoneNumber: string | null;
  role: "supervisor" | "labor";
  createdAt: any; // Firestore Timestamp
}

export interface SystemRates {
  minWagePerHour: number;
  lastUpdated: any;
}

export interface JobListing {
  id?: string;
  supervisorId: string;
  title: string;
  locationName: string; // "Jalali West"
  description: string;

  // Wage Logic
  wageType: "hourly" | "daily";
  wageAmount: number; // The amount offered

  // Time Logic
  requiredDate: string; // ISO String or Timestamp
  durationHours: number; // e.g., 8 hours

  status: "open" | "closed";
  createdAt: any;
}

export interface Booking {
  id?: string;
  jobId: string;
  laborId: string;
  supervisorId: string;
  jobTitle: string;
  locationName: string; // <--- ADD THIS
  jobDate: string; // ISO Date "YYYY-MM-DD"
  durationHours: number;
  wageAmount: number;
  status: "confirmed" | "cancelled";
  createdAt: any;
}
