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
  company?: string; // Optional company name
  locationName: string; // "Jalali West"
  description: string;

  // Wage Logic
  wageType: "hourly" | "daily";
  wageAmount: number; // The amount offered

  // Time Logic
  requiredDate: string; // ISO String or Timestamp
  durationHours: number; // e.g., 8 hours
  expiresAt: string; // Job expiration date

  // Labor Requirements
  laborersRequired: number; // Number of laborers needed
  laborersApplied: number; // Number of laborers who have applied

  status: "open" | "closed" | "expired" | "delisted";
  isListed: boolean; // Whether the job is currently listed
  createdAt: any;
}

export interface JobApplication {
  id?: string;
  jobId: string;
  laborId: string;
  supervisorId: string;
  status: "pending" | "confirmed" | "rejected";
  appliedAt: any;
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
