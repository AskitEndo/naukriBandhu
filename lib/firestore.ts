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
  deleteDoc,
  writeBatch,
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

// --- DEBUG FUNCTION - Populate Demo Jobs ---
export const populateDemoJobs = async (): Promise<void> => {
  try {
    console.log("🏗️ Creating demo jobs...");

    const demoJobs = [
      // Construction Jobs
      {
        title: "Construction Worker - Residential Building",
        description:
          "Need experienced construction workers for residential apartment construction. Work includes brick laying, cement mixing, and general construction support.",
        workType: "Construction",
        locationName: "Yelahanka, Bangalore",
        locationDetails: "Near Yelahanka Railway Station, Bangalore North",
        requiredDate: "2025-12-10",
        startTime: "08:00",
        endTime: "17:00",
        durationHours: 9,
        wageAmount: 800,
        wageType: "daily" as const,
        laborersRequired: 5,
        supervisorId: "demo-supervisor-1",
        supervisorName: "Rajesh Kumar",
        supervisorPhone: "+91-9876543210",
      },
      {
        title: "Building Construction Helper",
        description:
          "Construction helper needed for commercial building project. Basic construction work including material handling and site assistance.",
        workType: "Construction",
        locationName: "Electronic City, Bangalore",
        locationDetails: "Electronic City Phase 1, Near Infosys Gate",
        requiredDate: "2025-12-11",
        startTime: "07:30",
        endTime: "16:30",
        durationHours: 9,
        wageAmount: 750,
        wageType: "daily" as const,
        laborersRequired: 8,
        supervisorId: "demo-supervisor-2",
        supervisorName: "Suresh Reddy",
        supervisorPhone: "+91-9876543211",
      },
      {
        title: "Road Construction Work",
        description:
          "Road construction and maintenance work. Experience with concrete work preferred.",
        workType: "Construction",
        locationName: "Nagasandra, Bangalore",
        locationDetails: "Nagasandra Metro Station area",
        requiredDate: "2025-12-12",
        startTime: "06:00",
        endTime: "15:00",
        durationHours: 9,
        wageAmount: 850,
        wageType: "daily" as const,
        laborersRequired: 6,
        supervisorId: "demo-supervisor-3",
        supervisorName: "Mohan Singh",
        supervisorPhone: "+91-9876543212",
      },

      // Painting Jobs
      {
        title: "House Painting Work",
        description:
          "Interior and exterior painting for residential house. Experience with brush and roller painting required.",
        workType: "Painting",
        locationName: "Jayanagar, Bangalore",
        locationDetails: "Jayanagar 4th Block, Near Shopping Complex",
        requiredDate: "2025-12-13",
        startTime: "09:00",
        endTime: "18:00",
        durationHours: 9,
        wageAmount: 700,
        wageType: "daily" as const,
        laborersRequired: 3,
        supervisorId: "demo-supervisor-4",
        supervisorName: "Venkatesh Pai",
        supervisorPhone: "+91-9876543213",
      },
      {
        title: "Office Painting Contract",
        description:
          "Commercial office space painting. Wall preparation and painting work.",
        workType: "Painting",
        locationName: "Whitefield, Bangalore",
        locationDetails: "Whitefield Main Road, IT Park Area",
        requiredDate: "2025-12-14",
        startTime: "08:30",
        endTime: "17:30",
        durationHours: 9,
        wageAmount: 750,
        wageType: "daily" as const,
        laborersRequired: 4,
        supervisorId: "demo-supervisor-5",
        supervisorName: "Prakash Nair",
        supervisorPhone: "+91-9876543214",
      },

      // Plumbing Jobs
      {
        title: "Plumbing Installation Work",
        description:
          "Plumbing installation for new apartment complex. Pipe fitting and fixture installation.",
        workType: "Plumbing",
        locationName: "Koramangala, Bangalore",
        locationDetails: "Koramangala 5th Block, Near Forum Mall",
        requiredDate: "2025-12-15",
        startTime: "08:00",
        endTime: "17:00",
        durationHours: 9,
        wageAmount: 900,
        wageType: "daily" as const,
        laborersRequired: 2,
        supervisorId: "demo-supervisor-6",
        supervisorName: "Ravi Sharma",
        supervisorPhone: "+91-9876543215",
      },
      {
        title: "Hospital Plumbing Maintenance",
        description:
          "Plumbing maintenance work at hospital facility. Experience with hospital-grade fittings preferred.",
        workType: "Plumbing",
        locationName: "Nagasandra, Bangalore",
        locationDetails: "Nagasandra Hospital Complex",
        requiredDate: "2025-12-16",
        startTime: "07:00",
        endTime: "16:00",
        durationHours: 9,
        wageAmount: 950,
        wageType: "daily" as const,
        laborersRequired: 3,
        supervisorId: "demo-supervisor-7",
        supervisorName: "Lakshman Rao",
        supervisorPhone: "+91-9876543216",
      },

      // Electrical Jobs
      {
        title: "Electrical Installation",
        description:
          "Electrical wiring and installation work for residential complex.",
        workType: "Electrical",
        locationName: "BTM Layout, Bangalore",
        locationDetails: "BTM Layout 2nd Stage, Near Udupi Garden",
        requiredDate: "2025-12-17",
        startTime: "09:00",
        endTime: "18:00",
        durationHours: 9,
        wageAmount: 1000,
        wageType: "daily" as const,
        laborersRequired: 2,
        supervisorId: "demo-supervisor-8",
        supervisorName: "Krishna Murthy",
        supervisorPhone: "+91-9876543217",
      },

      // Cleaning Jobs
      {
        title: "Construction Site Cleaning",
        description:
          "Post-construction cleaning work. Site cleanup and debris removal.",
        workType: "Cleaning",
        locationName: "Marathahalli, Bangalore",
        locationDetails: "Marathahalli Bridge, IT Corridor",
        requiredDate: "2025-12-18",
        startTime: "08:00",
        endTime: "16:00",
        durationHours: 8,
        wageAmount: 600,
        wageType: "daily" as const,
        laborersRequired: 4,
        supervisorId: "demo-supervisor-9",
        supervisorName: "Ramesh Babu",
        supervisorPhone: "+91-9876543218",
      },

      // Gardening Jobs
      {
        title: "Garden Landscaping Work",
        description:
          "Garden maintenance and landscaping for residential society.",
        workType: "Gardening",
        locationName: "Indiranagar, Bangalore",
        locationDetails: "Indiranagar 12th Main Road",
        requiredDate: "2025-12-19",
        startTime: "07:00",
        endTime: "15:00",
        durationHours: 8,
        wageAmount: 650,
        wageType: "daily" as const,
        laborersRequired: 3,
        supervisorId: "demo-supervisor-10",
        supervisorName: "Govind Prasad",
        supervisorPhone: "+91-9876543219",
      },
    ];

    const batch = writeBatch(db);

    for (let i = 0; i < demoJobs.length; i++) {
      const jobRef = doc(collection(db, "jobs"));
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);

      batch.set(jobRef, {
        ...demoJobs[i],
        status: "open",
        isListed: true,
        laborersApplied: Math.floor(Math.random() * 2), // 0-1 applied randomly
        expiresAt: expirationDate.toISOString(),
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
    console.log(`✅ Created ${demoJobs.length} demo jobs successfully!`);
  } catch (error) {
    console.error("❌ Error creating demo jobs:", error);
    throw error;
  }
};

// --- DEBUG FUNCTION - Reset All Data ---
export const resetAllData = async (): Promise<void> => {
  try {
    const collectionsToReset = ["jobs", "bookings", "job_applications"];

    console.log("🗑️ Starting database reset...");

    for (const collectionName of collectionsToReset) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      if (!snapshot.empty) {
        // Use batch deletion for efficiency
        const batch = writeBatch(db);

        snapshot.docs.forEach((docSnapshot) => {
          batch.delete(docSnapshot.ref);
        });

        await batch.commit();
        console.log(
          `✅ Cleared ${snapshot.docs.length} documents from ${collectionName}`
        );
      } else {
        console.log(`✅ Collection ${collectionName} was already empty`);
      }
    }

    // Reset user roles but keep user profiles
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    if (!usersSnapshot.empty) {
      const batch = writeBatch(db);

      usersSnapshot.docs.forEach((userDoc) => {
        batch.update(userDoc.ref, {
          // Reset to default role if needed
          // Keep other profile data intact
        });
      });

      await batch.commit();
      console.log(`✅ Reset user data for ${usersSnapshot.docs.length} users`);
    }

    console.log("🎉 Database reset complete! All data cleared.");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    throw error;
  }
};
