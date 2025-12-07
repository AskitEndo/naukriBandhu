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
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  UserProfile,
  SystemRates,
  JobListing,
  Booking,
  JobApplication,
} from "@/types";

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

export const updateUserRole = async (
  uid: string,
  role: "labor" | "supervisor"
): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { role });
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
  jobData: Omit<
    JobListing,
    "id" | "createdAt" | "status" | "isListed" | "laborersApplied"
  >
) => {
  // Calculate expiration date (default: 7 days from creation)
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);

  const jobsRef = collection(db, "jobs");
  await addDoc(jobsRef, {
    ...jobData,
    status: "open",
    isListed: true,
    laborersApplied: 0,
    expiresAt: jobData.expiresAt || expirationDate.toISOString(),
    createdAt: serverTimestamp(),
  });
};

// --- JOB MANAGEMENT FUNCTIONS ---

// Check and update expired jobs
export const updateExpiredJobs = async () => {
  const jobsRef = collection(db, "jobs");
  const q = query(jobsRef, where("status", "==", "open"));
  const snapshot = await getDocs(q);

  const now = new Date();

  snapshot.docs.forEach(async (docSnap) => {
    const job = docSnap.data() as JobListing;
    const expirationDate = new Date(job.expiresAt);

    if (now > expirationDate) {
      await setDoc(doc(db, "jobs", docSnap.id), {
        ...job,
        status: "expired",
      });
    }
  });
};

// Toggle job listing status
export const toggleJobListing = async (jobId: string, isListed: boolean) => {
  const jobRef = doc(db, "jobs", jobId);
  await setDoc(jobRef, { isListed }, { merge: true });
};

// Delete job posting
export const deleteJobPosting = async (jobId: string) => {
  const jobRef = doc(db, "jobs", jobId);
  await setDoc(jobRef, { status: "delisted" }, { merge: true });
};

// --- JOB FEED LOGIC ---
export const getOpenJobs = async (): Promise<JobListing[]> => {
  // First update expired jobs
  await updateExpiredJobs();

  const jobsRef = collection(db, "jobs");
  // Get jobs that are 'open' and 'listed'
  const q = query(
    jobsRef,
    where("status", "==", "open"),
    where("isListed", "==", true)
  );

  const snapshot = await getDocs(q);
  const jobs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as JobListing[];

  // Filter out expired jobs and sort
  const now = new Date();
  const validJobs = jobs.filter((job) => new Date(job.expiresAt) > now);

  return validJobs.sort((a, b) => {
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

// --- APPLICATION LOGIC ---

// Check if labor has already applied for a job
export const hasAlreadyApplied = async (
  jobId: string,
  laborId: string
): Promise<boolean> => {
  const applicationsRef = collection(db, "job_applications");
  const q = query(
    applicationsRef,
    where("jobId", "==", jobId),
    where("laborId", "==", laborId)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Apply for a job
export const applyForJob = async (
  job: JobListing,
  laborId: string
): Promise<{ success: boolean; message: string }> => {
  // 1. Check if already applied
  const alreadyApplied = await hasAlreadyApplied(job.id!, laborId);
  if (alreadyApplied) {
    return {
      success: false,
      message: "You have already applied for this job!",
    };
  }

  // 2. Check weekly hours limit
  const currentHours = await getLaborWeeklyHours(laborId, job.requiredDate);
  const newTotal = currentHours + job.durationHours;

  if (newTotal > 50) {
    return {
      success: false,
      message: `Health Safety Warning: This job would put you at ${newTotal} hours this week. The limit is 50 hours.`,
    };
  }

  // 3. Check if job is still available
  if (job.laborersApplied >= job.laborersRequired) {
    return {
      success: false,
      message: "Sorry, this job has reached its maximum number of applicants.",
    };
  }

  // 4. Create application with automatic approval
  try {
    const applicationRef = collection(db, "job_applications");
    const applicationData: Omit<JobApplication, "id" | "appliedAt"> = {
      jobId: job.id!,
      laborId: laborId,
      supervisorId: job.supervisorId,
      status: "confirmed", // Auto-approve applications
    };

    const applicationDoc = await addDoc(applicationRef, {
      ...applicationData,
      appliedAt: serverTimestamp(),
    });

    // 5. Create booking immediately since it's auto-approved
    const bookingData: Omit<Booking, "id" | "createdAt"> = {
      jobId: job.id!,
      laborId: laborId,
      supervisorId: job.supervisorId,
      jobTitle: job.title,
      locationName: job.locationName,
      jobDate: job.requiredDate,
      durationHours: job.durationHours,
      wageAmount: job.wageAmount,
      status: "confirmed",
    };

    const bookingsRef = collection(db, "bookings");
    await addDoc(bookingsRef, {
      ...bookingData,
      createdAt: serverTimestamp(),
    });

    // 6. Update job's applied count and check if job is full
    const jobRef = doc(db, "jobs", job.id!);
    const updatedAppliedCount = job.laborersApplied + 1;

    await updateDoc(jobRef, {
      laborersApplied: increment(1),
      // Close job if capacity reached
      ...(updatedAppliedCount >= job.laborersRequired && {
        status: "filled",
        isListed: false,
      }),
    });

    return {
      success: true,
      message: "Job booked successfully! You're all set.",
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "System error. Please try again." };
  }
};

// --- BOOKING LOGIC (Updated) ---
export const bookJob = async (
  job: JobListing,
  laborId: string
): Promise<{ success: boolean; message: string }> => {
  // Use the new application system
  return await applyForJob(job, laborId);
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

// Get all jobs posted by a supervisor
export const getSupervisorJobs = async (
  supervisorId: string
): Promise<JobListing[]> => {
  const jobsRef = collection(db, "jobs");
  const q = query(jobsRef, where("supervisorId", "==", supervisorId));

  const snapshot = await getDocs(q);
  const jobs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as JobListing[];

  return jobs.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
};

// Get applications for a specific job
export const getJobApplications = async (
  jobId: string
): Promise<JobApplication[]> => {
  const applicationsRef = collection(db, "job_applications");
  const q = query(applicationsRef, where("jobId", "==", jobId));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as JobApplication[];
};

// Accept/reject job application
export const updateApplicationStatus = async (
  applicationId: string,
  status: "confirmed" | "rejected"
): Promise<void> => {
  const applicationRef = doc(db, "job_applications", applicationId);
  await updateDoc(applicationRef, { status });

  // If confirmed, create a booking
  if (status === "confirmed") {
    const applicationSnap = await getDoc(applicationRef);
    if (applicationSnap.exists()) {
      const application = applicationSnap.data() as JobApplication;
      const jobRef = doc(db, "jobs", application.jobId);
      const jobSnap = await getDoc(jobRef);

      if (jobSnap.exists()) {
        const job = jobSnap.data() as JobListing;

        const bookingData: Omit<Booking, "id" | "createdAt"> = {
          jobId: job.id!,
          laborId: application.laborId,
          supervisorId: job.supervisorId,
          jobTitle: job.title,
          locationName: job.locationName,
          jobDate: job.requiredDate,
          durationHours: job.durationHours,
          wageAmount: job.wageAmount,
          status: "confirmed",
        };

        const bookingsRef = collection(db, "bookings");
        await addDoc(bookingsRef, {
          ...bookingData,
          createdAt: serverTimestamp(),
        });
      }
    }
  }
};

// Get all applications for a specific user (labor)
export const getUserApplications = async (
  laborId: string
): Promise<JobApplication[]> => {
  const applicationsRef = collection(db, "job_applications");
  const q = query(
    applicationsRef,
    where("laborId", "==", laborId),
    orderBy("appliedAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as JobApplication[];
};

// Get job by ID
export const getJobById = async (jobId: string): Promise<JobListing | null> => {
  const jobRef = doc(db, "jobs", jobId);
  const jobSnap = await getDoc(jobRef);

  if (jobSnap.exists()) {
    return {
      id: jobSnap.id,
      ...jobSnap.data(),
    } as JobListing;
  } else {
    return null;
  }
};
