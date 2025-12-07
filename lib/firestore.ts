// lib/firestore.ts
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile, SystemRates, JobListing, Booking } from "@/types";

// --- User Logic ---
export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  } else {
    return null;
  }
};

export const createUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
) => {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      ...data,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

// --- System Config (Min Wage) ---
export const getSystemRates = async (): Promise<SystemRates> => {
  const ref = doc(db, "system_config", "rates");
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as SystemRates;
  } else {
    // FALLBACK: If DB is empty, return a default so app doesn't crash
    // In production, you would seed this via an Admin script
    return { minWagePerHour: 60, lastUpdated: new Date() }; // Example: 60 Rupees/hour
  }
};

// --- Job Logic ---
export const createJobPosting = async (
  jobData: Omit<JobListing, "id" | "createdAt" | "status">
) => {
  const jobsRef = collection(db, "jobs");
  await addDoc(jobsRef, {
    ...jobData,
    status: "open",
    createdAt: serverTimestamp(),
  });
};

// --- JOB FEED LOGIC ---
export const getOpenJobs = async (): Promise<JobListing[]> => {
  const jobsRef = collection(db, "jobs");
  // Get jobs that are 'open' (removed orderBy to avoid index requirement)
  const q = query(jobsRef, where("status", "==", "open"));

  const snapshot = await getDocs(q);
  const jobs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as JobListing[];

  // Sort in JavaScript instead of Firestore to avoid index requirement
  return jobs.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime; // Sort desc (newest first)
  });
};

// --- THE 50-HOUR ALGORITHM ---

// Helper to get start/end of the week for a specific date
const getWeekBounds = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDay(); // 0 (Sun) to 6 (Sat)

  // Assume week starts on Monday (Adjust if needed)
  // Calculate difference to get to Monday
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);

  const startOfWeek = new Date(date.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { start: startOfWeek, end: endOfWeek };
};

export const getLaborWeeklyHours = async (
  laborId: string,
  targetDate: string
): Promise<number> => {
  const { start, end } = getWeekBounds(targetDate);

  // Convert to string for simple comparison if storing as YYYY-MM-DD
  // Or handle as timestamps. For simplicity, we query all bookings and filter in JS
  // (In a massive app, you'd range query timestamps, but this is fine for MVP)

  const bookingsRef = collection(db, "bookings");
  const q = query(
    bookingsRef,
    where("laborId", "==", laborId),
    where("status", "==", "confirmed")
  );

  const snapshot = await getDocs(q);

  let totalHours = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data() as Booking;
    const bookDate = new Date(data.jobDate);

    // Check if this booking falls in the same week as the target date
    if (bookDate >= start && bookDate <= end) {
      totalHours += data.durationHours;
    }
  });

  return totalHours;
};

// --- BOOKING LOGIC ---
export const bookJob = async (
  job: JobListing,
  laborId: string
): Promise<{ success: boolean; message: string }> => {
  // 1. Run the Algorithm: Check current hours
  const currentHours = await getLaborWeeklyHours(laborId, job.requiredDate);
  const newTotal = currentHours + job.durationHours;

  // 2. Validate Constraint
  if (newTotal > 50) {
    return {
      success: false,
      message: `Health Safety Warning: This job would put you at ${newTotal} hours this week. The limit is 50 hours.`,
    };
  }

  // 3. Create Booking
  try {
    const bookingRef = collection(db, "bookings");
    const bookingData: Omit<Booking, "id" | "createdAt"> = {
      jobId: job.id!,
      laborId: laborId,
      supervisorId: job.supervisorId,
      jobTitle: job.title,
      locationName: job.locationName, // Include location
      jobDate: job.requiredDate,
      durationHours: job.durationHours,
      wageAmount: job.wageAmount,
      status: "confirmed",
    };

    await addDoc(bookingRef, {
      ...bookingData,
      createdAt: serverTimestamp(),
    });

    return { success: true, message: "Job Booked Successfully!" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "System error. Please try again." };
  }
};

// --- BOOKING HISTORY QUERIES ---

// Get all bookings for a specific labor worker
export const getLaborBookings = async (laborId: string): Promise<Booking[]> => {
  const bookingsRef = collection(db, "bookings");
  const q = query(
    bookingsRef,
    where("laborId", "==", laborId),
    where("status", "==", "confirmed")
  );

  const snapshot = await getDocs(q);
  const bookings = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Booking[];

  // Sort by job date (upcoming first, then past)
  return bookings.sort((a, b) => {
    const aDate = new Date(a.jobDate).getTime();
    const bDate = new Date(b.jobDate).getTime();
    return bDate - aDate; // Desc order (newest first)
  });
};

// Get all bookings for a specific supervisor
export const getSupervisorBookings = async (
  supervisorId: string
): Promise<Booking[]> => {
  const bookingsRef = collection(db, "bookings");
  const q = query(
    bookingsRef,
    where("supervisorId", "==", supervisorId),
    where("status", "==", "confirmed")
  );

  const snapshot = await getDocs(q);
  const bookings = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Booking[];

  // Sort by creation time (newest first)
  return bookings.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
};
