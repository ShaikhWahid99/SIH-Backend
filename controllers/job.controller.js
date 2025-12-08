// SIH-Backend/controllers/job.controller.js
const { mapSectorToNCS } = require('../utils/ncsMapper');

// ✅ SAFETY NET: Dummy Data (Shown only if API fails or returns 0 jobs)
const MOCK_JOBS = [
  {
    id: "mock-1",
    jobTitle: "Junior Software Developer",
    organizationName: "Tech Solutions Pvt Ltd",
    jobLocations: [{ city: "Bangalore" }],
    minSalary: "4,50,000",
    maxSalary: "6,00,000",
    jobDescription: "Looking for a junior developer with React and Node.js skills. Freshers can apply."
  },
  {
    id: "mock-2",
    jobTitle: "Data Analyst Intern",
    organizationName: "Global Analytics",
    jobLocations: [{ city: "Mumbai" }],
    minSalary: "3,00,000",
    maxSalary: "4,50,000",
    jobDescription: "Required data analyst with knowledge of Python, SQL, and Excel."
  },
  {
    id: "mock-3",
    jobTitle: "IT Support Specialist",
    organizationName: "Infosys (Contract)",
    jobLocations: [{ city: "Hyderabad" }],
    minSalary: "3,00,000",
    maxSalary: "5,00,000",
    jobDescription: "Technical support role for internal IT infrastructure. Rotational shifts."
  },
  {
    id: "mock-4",
    jobTitle: "Frontend Engineer",
    organizationName: "StartUp Inc",
    jobLocations: [{ city: "Remote" }],
    minSalary: "6,00,000",
    maxSalary: "8,00,000",
    jobDescription: "React.js developer needed for a fast-paced startup environment."
  }
];

exports.getJobs = async (req, res) => {
  try {
    const { neo4jSector, limit = 10 } = req.body;

    // 1. Map the sector
    const ncsSector = mapSectorToNCS(neo4jSector);
    console.log(`\n[Job Controller] ------------------------------------------------`);
    console.log(`[Job Controller] Incoming Request for: ${neo4jSector}`);
    console.log(`[Job Controller] Mapped to NCS Sector: ${ncsSector}`);

    // 2. Fetch from NCS API
    let apiJobs = [];
    try {
        const response = await fetch("https://betacloud.ncs.gov.in/api/v1/job-posts/search", {
          method: "POST",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Content-Type": "application/json",
            "Referer": "https://betacloud.ncs.gov.in/job-listing",
            "Origin": "https://betacloud.ncs.gov.in",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            page: 0,
            size: limit,
            sortBy: "RELEVANCE",
            filter: { industries: [ncsSector] }
          })
        });

        console.log(`[Job Controller] API Status Code: ${response.status}`);
        
        if (!response.ok) {
            console.log(`[Job Controller] API Error Text: ${await response.text()}`);
        } else {
            const data = await response.json();
            // console.log(`[Job Controller] Raw API Response:`, JSON.stringify(data).substring(0, 200) + "..."); 

            if (data.data && data.data.content) {
                apiJobs = data.data.content;
            }
        }
    } catch (err) {
        console.error("[Job Controller] CRITICAL FETCH ERROR:", err.message);
    }

    // 3. DECISION: LIVE DATA OR MOCK DATA?
    let finalJobs = [];
    if (apiJobs.length > 0) {
        console.log(`[Job Controller] ✅ SUCCESS: Found ${apiJobs.length} live jobs from NCS.`);
        finalJobs = apiJobs;
    } else {
        console.warn(`[Job Controller] ⚠️ WARNING: No live jobs found (or API blocked). Switching to Mock Data.`);
        finalJobs = MOCK_JOBS; // <--- This saves your demo
    }

    // 4. Clean & Send Data
    const jobs = finalJobs.map(job => ({
      id: job.id,
      title: job.jobTitle,
      company: job.organizationName,
      location: job.jobLocations?.[0]?.city || "Pan India",
      salary: `${job.minSalary} - ${job.maxSalary}`,
      apply_link: `https://betacloud.ncs.gov.in/job-listing/applying/${job.id}`,
      description: job.jobDescription ? job.jobDescription.replace(/\n/g, ' ') : ""
    }));

    res.status(200).json({ success: true, mappedSector: ncsSector, jobs });
    console.log(`[Job Controller] ------------------------------------------------\n`);

  } catch (error) {
    console.error("Internal Server Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};