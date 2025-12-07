// Firebase Demo Data Population Script
// This is the equivalent of SQL INSERT statements for Firebase Firestore

/*
FIREBASE EQUIVALENT OF SQL INSERT STATEMENTS:

Since Firebase is NoSQL, there's no direct SQL query. Instead, use these methods:

METHOD 1: Use the Demo Jobs button in the navbar (Recommended)
- Click "Demo Jobs" button in the top navigation bar
- This will populate all demo jobs automatically

METHOD 2: Run in browser console (Advanced)
Copy and paste this code in your browser's developer console when on the app:

```javascript
// Populate demo jobs via console
async function populateDemoJobsFromConsole() {
  const response = await fetch('/api/demo-jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'populate' })
  });
  const result = await response.json();
  console.log('Demo jobs result:', result);
  window.location.reload();
}

populateDemoJobsFromConsole();
```

METHOD 3: Firebase Console (Manual)
Go to Firebase Console → Firestore Database → Add documents manually with this data:
*/

// Demo Jobs Data Structure for Manual Entry:
const demoJobsData = [
  {
    // Document ID: auto-generated
    // Collection: "jobs"
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
    wageType: "daily",
    laborersRequired: 5,
    laborersApplied: 0,
    supervisorId: "demo-supervisor-1",
    supervisorName: "Rajesh Kumar",
    supervisorPhone: "+91-9876543210",
    status: "open",
    isListed: true,
    expiresAt: "2025-12-17T00:00:00.000Z", // 7 days from creation
    createdAt: "serverTimestamp", // Use Firebase serverTimestamp
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
    wageType: "daily",
    laborersRequired: 8,
    laborersApplied: 1,
    supervisorId: "demo-supervisor-2",
    supervisorName: "Suresh Reddy",
    supervisorPhone: "+91-9876543211",
    status: "open",
    isListed: true,
    expiresAt: "2025-12-18T00:00:00.000Z",
    createdAt: "serverTimestamp",
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
    wageType: "daily",
    laborersRequired: 6,
    laborersApplied: 0,
    supervisorId: "demo-supervisor-3",
    supervisorName: "Mohan Singh",
    supervisorPhone: "+91-9876543212",
    status: "open",
    isListed: true,
    expiresAt: "2025-12-19T00:00:00.000Z",
    createdAt: "serverTimestamp",
  },

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
    wageType: "daily",
    laborersRequired: 3,
    laborersApplied: 0,
    supervisorId: "demo-supervisor-4",
    supervisorName: "Venkatesh Pai",
    supervisorPhone: "+91-9876543213",
    status: "open",
    isListed: true,
    expiresAt: "2025-12-20T00:00:00.000Z",
    createdAt: "serverTimestamp",
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
    wageType: "daily",
    laborersRequired: 4,
    laborersApplied: 1,
    supervisorId: "demo-supervisor-5",
    supervisorName: "Prakash Nair",
    supervisorPhone: "+91-9876543214",
    status: "open",
    isListed: true,
    expiresAt: "2025-12-21T00:00:00.000Z",
    createdAt: "serverTimestamp",
  },

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
    wageType: "daily",
    laborersRequired: 2,
    laborersApplied: 0,
    supervisorId: "demo-supervisor-6",
    supervisorName: "Ravi Sharma",
    supervisorPhone: "+91-9876543215",
    status: "open",
    isListed: true,
    expiresAt: "2025-12-22T00:00:00.000Z",
    createdAt: "serverTimestamp",
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
    wageType: "daily",
    laborersRequired: 3,
    laborersApplied: 0,
    supervisorId: "demo-supervisor-7",
    supervisorName: "Lakshman Rao",
    supervisorPhone: "+91-9876543216",
    status: "open",
    isListed: true,
    expiresAt: "2025-12-23T00:00:00.000Z",
    createdAt: "serverTimestamp",
  },

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
    wageType: "daily",
    laborersRequired: 2,
    laborersApplied: 0,
    supervisorId: "demo-supervisor-8",
    supervisorName: "Krishna Murthy",
    supervisorPhone: "+91-9876543217",
    status: "open",
    isListed: true,
    expiresAt: "2025-12-24T00:00:00.000Z",
    createdAt: "serverTimestamp",
  },

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
    wageType: "daily",
    laborersRequired: 4,
    laborersApplied: 1,
    supervisorId: "demo-supervisor-9",
    supervisorName: "Ramesh Babu",
    supervisorPhone: "+91-9876543218",
    status: "open",
    isListed: true,
    expiresAt: "2025-12-25T00:00:00.000Z",
    createdAt: "serverTimestamp",
  },

  {
    title: "Garden Landscaping Work",
    description: "Garden maintenance and landscaping for residential society.",
    workType: "Gardening",
    locationName: "Indiranagar, Bangalore",
    locationDetails: "Indiranagar 12th Main Road",
    requiredDate: "2025-12-19",
    startTime: "07:00",
    endTime: "15:00",
    durationHours: 8,
    wageAmount: 650,
    wageType: "daily",
    laborersRequired: 3,
    laborersApplied: 0,
    supervisorId: "demo-supervisor-10",
    supervisorName: "Govind Prasad",
    supervisorPhone: "+91-9876543219",
    status: "open",
    isListed: true,
    expiresAt: "2025-12-26T00:00:00.000Z",
    createdAt: "serverTimestamp",
  },
];

/*
SQL EQUIVALENT (for reference only - Firebase doesn't use SQL):

INSERT INTO jobs (
  title, description, workType, locationName, locationDetails, 
  requiredDate, startTime, endTime, durationHours, wageAmount, 
  wageType, laborersRequired, laborersApplied, supervisorId, 
  supervisorName, supervisorPhone, status, isListed, expiresAt, createdAt
) VALUES
('Construction Worker - Residential Building', 'Need experienced construction workers...', 'Construction', 'Yelahanka, Bangalore', 'Near Yelahanka Railway Station', '2025-12-10', '08:00', '17:00', 9, 800, 'daily', 5, 0, 'demo-supervisor-1', 'Rajesh Kumar', '+91-9876543210', 'open', true, '2025-12-17 00:00:00', NOW()),

('Building Construction Helper', 'Construction helper needed...', 'Construction', 'Electronic City, Bangalore', 'Electronic City Phase 1', '2025-12-11', '07:30', '16:30', 9, 750, 'daily', 8, 1, 'demo-supervisor-2', 'Suresh Reddy', '+91-9876543211', 'open', true, '2025-12-18 00:00:00', NOW()),

-- ... (continue for all jobs)

VOICE SEARCH TEST EXAMPLES:

After populating demo jobs, test these voice search queries:

1. "Construction work in Nagasaki" 
   → Should find "Road Construction Work" in Nagasandra via fuzzy matching

2. "Hospital jobs in Nagasandra"
   → Should find "Hospital Plumbing Maintenance"

3. "Painting work in Jayanagar"
   → Should find "House Painting Work"

4. "Any construction jobs in Yelahanka?"
   → Should find "Construction Worker - Residential Building"

5. "Plumbing work near Electronic City"
   → Should find plumbing jobs and suggest nearby locations

6. "Electrical work in BTM"
   → Should find "Electrical Installation" in BTM Layout

The extended search will help with typos and location variations!
*/

module.exports = { demoJobsData };
