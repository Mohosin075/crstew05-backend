const fs = require('fs');
const path = require('path');

// Helper to format Postman URL object
function createUrl(pathStr, queryParams = []) {
  const cleanPath = pathStr.replace(/^\//, '');

  const query = queryParams.map(q => ({
    key: q.key,
    value: q.value,
    description: q.description || '',
    disabled: q.disabled || false
  }));

  let rawUrl = `{{base_url}}/api/v1/${cleanPath}`;
  if (query.length > 0) {
    const qs = query.filter(q => !q.disabled).map(q => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`).join('&');
    if (qs) rawUrl += `?${qs}`;
  }

  const rawPathSegments = cleanPath.split('/');
  return {
    raw: rawUrl,
    host: ["{{base_url}}"],
    path: ["api", "v1", ...rawPathSegments],
    query: query.length > 0 ? query : undefined,
    variable: cleanPath.split('/').filter(p => p.startsWith(':')).map(p => ({
      key: p.slice(1),
      value: `{{${p.slice(1)}}}`,
      description: `Target ${p.slice(1)} ID`
    }))
  };
}

// Standard JSON request headers
function jsonHeaders(tokenVar = 'access_token') {
  const headers = [
    { key: "Content-Type", value: "application/json", type: "text" }
  ];
  if (tokenVar) {
    headers.push({
      key: "Authorization",
      value: `Bearer {{${tokenVar}}}`,
      type: "text",
      description: `Bearer JWT Token from {{${tokenVar}}}`
    });
  }
  return headers;
}

// Generate Postman Event for Test / Assertion & Variable storage
function createTestScript(options = {}) {
  const {
    expectedStatus = 200,
    storeVars = {}, // key -> expression string
    extraAssertions = []
  } = options;

  const lines = [
    `pm.test("Status code is ${expectedStatus}", function () {`,
    `    pm.response.to.have.status(${expectedStatus});`,
    `});`,
    ``,
    `pm.test("Response indicates success", function () {`,
    `    var jsonData = pm.response.json();`,
    `    pm.expect(jsonData).to.be.an("object");`,
    `    if (jsonData.statusCode) {`,
    `        pm.expect(jsonData.success).to.be.true;`,
    `    }`,
    `});`
  ];

  if (Object.keys(storeVars).length > 0) {
    lines.push(``, `// Automated Variable Extraction & Persistence`);
    lines.push(`try {`);
    lines.push(`    var res = pm.response.json();`);
    lines.push(`    var d = res.data || res;`);
    for (const [varName, pathExpr] of Object.entries(storeVars)) {
      lines.push(`    var val = ${pathExpr};`);
      lines.push(`    if (val !== undefined && val !== null && val !== "" && val !== "null" && val !== "undefined") {`);
      lines.push(`        pm.collectionVariables.set("${varName}", val);`);
      lines.push(`        console.log("Updated variable [${varName}]:", val);`);
      lines.push(`    }`);
    }
    lines.push(`} catch(e) { console.error("Could not parse variables from response:", e); }`);
  }

  if (extraAssertions.length > 0) {
    lines.push(``, ...extraAssertions);
  }

  return [
    {
      listen: "test",
      script: {
        exec: lines,
        type: "text/javascript"
      }
    }
  ];
}

// Create Sample Mock Response for Postman
function createResponse(name, code, bodyObj) {
  return [
    {
      name: name,
      originalRequest: {},
      status: code === 201 ? "Created" : (code === 204 ? "No Content" : "OK"),
      code: code,
      _postman_previewlanguage: "json",
      header: [{ key: "Content-Type", value: "application/json" }],
      cookie: [],
      body: JSON.stringify(bodyObj, null, 2)
    }
  ];
}

// ========================================================
// COLLECTION BUILDER
// ========================================================

const collection = {
  info: {
    _postman_id: "c48d910a-6e54-4732-b7b5-tcp-api-v1",
    name: "The Coach Profile (TCP) - Complete Backend API Suite",
    description: "Production-ready Postman Collection for The Coach Profile (crstew05-backend). Contains comprehensive endpoints for Authentication, Coach Profiles, Organizations, Opportunities, Candidates Pipeline, Shortlists, Verifications, Subscriptions, Chat/Messages, Analytics, Support, Location, and an Automated Agentic End-to-End Test Suite.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    { key: "base_url", value: "http://localhost:5004", type: "string", description: "Base URL of the Backend API" },
    { key: "access_token", value: "", type: "string", description: "Current active JWT bearer access token" },
    { key: "admin_token", value: "", type: "string", description: "Super Admin JWT access token" },
    { key: "org_token", value: "", type: "string", description: "Recruiter / Organization JWT access token" },
    { key: "coach_token", value: "", type: "string", description: "Coach JWT access token" },
    { key: "admin_email", value: "admin@thecoachprofile.com", type: "string" },
    { key: "admin_password", value: "adminpassword123", type: "string" },
    { key: "org_email", value: "recruiter@texasathletics.edu", type: "string" },
    { key: "org_password", value: "Password123!", type: "string" },
    { key: "coach_email", value: "marcus.vance@tcpcoach.com", type: "string" },
    { key: "coach_password", value: "Password123!", type: "string" },
    { key: "user_id", value: "", type: "string" },
    { key: "coach_id", value: "", type: "string" },
    { key: "recruiter_id", value: "", type: "string" },
    { key: "member_id", value: "", type: "string" },
    { key: "org_id", value: "", type: "string" },
    { key: "opportunity_id", value: "", type: "string" },
    { key: "candidate_id", value: "", type: "string" },
    { key: "shortlist_id", value: "", type: "string" },
    { key: "chat_id", value: "", type: "string" },
    { key: "verification_id", value: "", type: "string" },
    { key: "support_id", value: "", type: "string" },
    { key: "faq_id", value: "", type: "string" },
    { key: "public_id", value: "", type: "string" },
    { key: "type", value: "privacy-policy", type: "string" }
  ],
  item: []
};

// -------------------------------------------------------------
// FOLDER 0: ⚡ AUTOMATED END-TO-END AGENTIC TEST FLOW
// -------------------------------------------------------------
const e2eFolder = {
  name: "⚡ 00. Automated End-to-End Agentic Test Suite",
  description: "Run this entire folder sequentially using Postman Collection Runner. It simulates an authentic multi-party recruiting workflow: Admin login -> Org login -> Coach login -> Org posts Opportunity -> Coach applies (Express Interest) -> Org moves Candidate through Pipeline & rates them -> Org adds to Shortlist -> Live Chat & Messaging -> Verification Submission & Admin Approval -> Analytics check.",
  item: [
    {
      name: "Step 01: Super Admin Login (Auto-captures admin_token)",
      request: {
        method: "POST",
        header: jsonHeaders(null),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            email: "{{admin_email}}",
            password: "{{admin_password}}"
          }, null, 2)
        },
        url: createUrl("/auth/admin-login"),
        description: "Logs in as Super Admin and stores admin_token and access_token."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "admin_token": "d.accessToken",
          "access_token": "d.accessToken"
        }
      }),
      response: createResponse("Admin Login Success", 200, {
        statusCode: 200,
        success: true,
        message: "Login successful",
        data: {
          accessToken: "eyJhbGciOi...",
          refreshToken: "eyJhbGciOi...",
          role: "super_admin"
        }
      })
    },
    {
      name: "Step 02: Organization / Recruiter Login (Auto-captures org_token)",
      request: {
        method: "POST",
        header: jsonHeaders(null),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            email: "{{org_email}}",
            password: "{{org_password}}"
          }, null, 2)
        },
        url: createUrl("/auth/login"),
        description: "Logs in as collegiate athletic program recruiter."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "org_token": "d.accessToken",
          "recruiter_id": "d.user ? d.user._id : undefined",
          "access_token": "d.accessToken"
        }
      }),
      response: createResponse("Org Login Success", 200, {
        statusCode: 200,
        success: true,
        message: "Login successful",
        data: {
          accessToken: "eyJhbGciOi...",
          refreshToken: "eyJhbGciOi...",
          role: "collegiate",
          user: { _id: "66f1234567890abcdef10001", name: "Chris Del Conte" }
        }
      })
    },
    {
      name: "Step 03: Coach Login (Auto-captures coach_token & coach_id)",
      request: {
        method: "POST",
        header: jsonHeaders(null),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            email: "{{coach_email}}",
            password: "{{coach_password}}"
          }, null, 2)
        },
        url: createUrl("/auth/login"),
        description: "Logs in as Coach and stores coach_token & coach_id."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "coach_token": "d.accessToken",
          "coach_id": "d.user ? d.user._id : undefined",
          "access_token": "d.accessToken"
        }
      }),
      response: createResponse("Coach Login Success", 200, {
        statusCode: 200,
        success: true,
        message: "Login successful",
        data: {
          accessToken: "eyJhbGciOi...",
          refreshToken: "eyJhbGciOi...",
          role: "coach",
          user: { _id: "66f1234567890abcdef10002", name: "Marcus Vance" }
        }
      })
    },
    {
      name: "Step 04: Org Creates Opportunity (Auto-captures opportunity_id)",
      request: {
        method: "POST",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            title: "Offensive Coordinator - Air Raid Specialist {{$timestamp}}",
            position: "Offensive Coordinator",
            level: "FBS",
            type: "full_time",
            location: "Austin, TX",
            isRemote: false,
            description: "Seeking an experienced Offensive Coordinator with top tier QB development pedigree and dynamic play-calling mastery.",
            requirements: [
              "5+ years collegiate coaching experience at FBS/FCS level",
              "Demonstrated track record of explosive offensive output",
              "Verified recruiting footprint in Texas and the Southeast"
            ],
            preferredQualifications: ["Prior experience calling plays in a Power 4 conference"],
            status: "active",
            isFeatured: true
          }, null, 2)
        },
        url: createUrl("/opportunities"),
        description: "Recruiter creates an opportunity job posting."
      },
      event: createTestScript({
        expectedStatus: 201,
        storeVars: {
          "opportunity_id": "d._id || d.id"
        }
      }),
      response: createResponse("Opportunity Created", 201, {
        statusCode: 201,
        success: true,
        message: "Opportunity created successfully",
        data: {
          _id: "66f9876543210abcdef20001",
          title: "Offensive Coordinator - Air Raid Specialist",
          position: "Offensive Coordinator",
          level: "FBS",
          status: "active"
        }
      })
    },
    {
      name: "Step 05: Coach Expresses Interest (Auto-captures candidate_id)",
      request: {
        method: "POST",
        header: jsonHeaders("coach_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            opportunityId: "{{opportunity_id}}",
            sharedFields: {
              shareContactInfo: true,
              shareCareerHistory: true,
              shareCredentials: true,
              shareRecruitingFootprint: true
            },
            message: "I am extremely interested in leading the offense and developing your quarterbacks for championship contention."
          }, null, 2)
        },
        url: createUrl("/candidates/express-interest"),
        description: "Coach submits Express Interest application on the created opportunity."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "candidate_id": "d.candidateId || d._id || (d.candidate ? (d.candidate._id || d.candidate.id) : undefined)"
        }
      }),
      response: createResponse("Express Interest Submitted", 200, {
        statusCode: 200,
        success: true,
        message: "Expressed interest successfully",
        data: {
          _id: "66f9876543210abcdef30001",
          opportunityId: "66f9876543210abcdef20001",
          pipelineStage: "interested"
        }
      })
    },
    {
      name: "Step 06: Org Views Pipeline Board",
      request: {
        method: "GET",
        header: jsonHeaders("org_token"),
        url: createUrl("/candidates/pipeline", [
          { key: "opportunityId", value: "{{opportunity_id}}" }
        ]),
        description: "Recruiter checks the Kanban pipeline board for the opportunity."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "candidate_id": "(function() { if (Array.isArray(d)) { for (var i = 0; i < d.length; i++) { var col = d[i]; if (col.candidates && col.candidates.length > 0) return col.candidates[0]._id || col.candidates[0].id; } } return undefined; })()"
        }
      }),
      response: createResponse("Pipeline Board Retrieved", 200, {
        statusCode: 200,
        success: true,
        message: "Pipeline board retrieved successfully",
        data: {
          stages: {
            discovered: [],
            saved: [],
            contacted: [],
            interested: [{ _id: "66f9876543210abcdef30001", name: "Marcus Vance" }],
            interview: [],
            offer: [],
            hired: []
          }
        }
      })
    },
    {
      name: "Step 07: Org Moves Candidate to 'interview' Stage",
      request: {
        method: "PATCH",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            stage: "interview"
          }, null, 2)
        },
        url: createUrl("/candidates/:candidate_id/stage"),
        description: "Recruiter promotes the candidate from 'interested' to 'interview'."
      },
      event: createTestScript({
        expectedStatus: 200
      }),
      response: createResponse("Stage Updated", 200, {
        statusCode: 200,
        success: true,
        message: "Candidate stage updated successfully",
        data: null
      })
    },
    {
      name: "Step 08: Org Rates Candidate (5 Stars)",
      request: {
        method: "PATCH",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            rating: 5
          }, null, 2)
        },
        url: createUrl("/candidates/:candidate_id/rating"),
        description: "Recruiter rates candidate internally."
      },
      event: createTestScript({
        expectedStatus: 200
      }),
      response: createResponse("Rating Updated", 200, {
        statusCode: 200,
        success: true,
        message: "Candidate rating updated successfully",
        data: null
      })
    },
    {
      name: "Step 09: Org Adds Internal Note on Candidate",
      request: {
        method: "POST",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            content: "Excellent initial interview. Scheme breakdown and philosophy strongly align with our offensive core values."
          }, null, 2)
        },
        url: createUrl("/candidates/:candidate_id/notes"),
        description: "Recruiter adds internal confidential note on the candidate record."
      },
      event: createTestScript({
        expectedStatus: 201
      }),
      response: createResponse("Note Added", 201, {
        statusCode: 201,
        success: true,
        message: "Note added successfully",
        data: {
          content: "Excellent initial interview...",
          createdAt: "2026-10-26T12:00:00.000Z"
        }
      })
    },
    {
      name: "Step 10: Org Creates Shortlist (Auto-captures shortlist_id)",
      request: {
        method: "POST",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            name: "Top Tier Offensive Coordinators 2026",
            description: "Vetted finalists for head play-caller position"
          }, null, 2)
        },
        url: createUrl("/shortlists"),
        description: "Creates a dedicated shortlist and captures shortlist_id."
      },
      event: createTestScript({
        expectedStatus: 201,
        storeVars: {
          "shortlist_id": "d._id || d.id"
        }
      }),
      response: createResponse("Shortlist Created", 201, {
        statusCode: 201,
        success: true,
        message: "Shortlist created successfully",
        data: {
          _id: "66f9876543210abcdef40001",
          name: "Top Tier Offensive Coordinators 2026"
        }
      })
    },
    {
      name: "Step 11: Org Adds Coach to Shortlist",
      request: {
        method: "POST",
        header: jsonHeaders("org_token"),
        url: createUrl("/shortlists/:shortlist_id/coaches/:coach_id"),
        description: "Adds the coach to the newly created shortlist."
      },
      event: createTestScript({
        expectedStatus: 200
      }),
      response: createResponse("Coach Added to Shortlist", 200, {
        statusCode: 200,
        success: true,
        message: "Coach added to shortlist successfully",
        data: null
      })
    },
    {
      name: "Step 12: Org Initiates Direct Chat with Coach (Auto-captures chat_id)",
      request: {
        method: "POST",
        header: jsonHeaders("org_token"),
        url: createUrl("/chat/:coach_id"),
        description: "Opens a 1-on-1 direct conversation with the Coach."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "chat_id": "d._id || d.id"
        }
      }),
      response: createResponse("Chat Created", 200, {
        statusCode: 200,
        success: true,
        message: "Create Chat Successfully",
        data: {
          _id: "66f9876543210abcdef50001",
          participants: ["66f1234567890abcdef10001", "66f1234567890abcdef10002"]
        }
      })
    },
    {
      name: "Step 13: Org Sends Direct Message in Chat",
      request: {
        method: "POST",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            chatId: "{{chat_id}}",
            message: "Coach Vance, we were very impressed with your presentation. Can we schedule an on-campus visit this Friday?"
          }, null, 2)
        },
        url: createUrl("/message"),
        description: "Sends message to the coach."
      },
      event: createTestScript({
        expectedStatus: 200
      }),
      response: createResponse("Message Sent", 200, {
        statusCode: 200,
        success: true,
        message: "Send Message Successfully",
        data: {
          _id: "66f9876543210abcdef60001",
          message: "Coach Vance, we were very impressed...",
          chatId: "66f9876543210abcdef50001"
        }
      })
    },
    {
      name: "Step 14: Coach Submits Identity Verification (Auto-captures verification_id)",
      request: {
        method: "POST",
        header: jsonHeaders("coach_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            entityId: "{{coach_id}}",
            entityType: "coach_identity",
            entityName: "Marcus Vance",
            documents: [
              {
                name: "Government_Issued_ID.pdf",
                url: "https://tcp-uploads.s3.amazonaws.com/verifications/sample_id.pdf",
                mimeType: "application/pdf"
              }
            ]
          }, null, 2)
        },
        url: createUrl("/verifications/submit"),
        description: "Coach submits credentials/identity for official verification."
      },
      event: createTestScript({
        expectedStatus: 201,
        storeVars: {
          "verification_id": "d._id || d.id"
        }
      }),
      response: createResponse("Verification Submitted", 200, {
        statusCode: 200,
        success: true,
        message: "Verification submitted successfully",
        data: {
          _id: "66f9876543210abcdef70001",
          status: "pending"
        }
      })
    },
    {
      name: "Step 15: Admin Approves Verification Request",
      request: {
        method: "PATCH",
        header: jsonHeaders("admin_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            note: "Verified identity through state database and verified active collegiate contract."
          }, null, 2)
        },
        url: createUrl("/verifications/:verification_id/approve"),
        description: "Admin approves the verification item."
      },
      event: createTestScript({
        expectedStatus: 200
      }),
      response: createResponse("Verification Approved", 200, {
        statusCode: 200,
        success: true,
        message: "Verification approved successfully",
        data: {
          _id: "66f9876543210abcdef70001",
          status: "verified"
        }
      })
    }
  ]
};

collection.item.push(e2eFolder);

// -------------------------------------------------------------
// FOLDER 01: AUTHENTICATION MODULE
// -------------------------------------------------------------
const authFolder = {
  name: "01. Authentication (/auth)",
  description: "User registration, authentication, OAuth, password reset, and session control.",
  item: [
    {
      name: "POST /auth/signup (Register Coach / User)",
      request: {
        method: "POST",
        header: jsonHeaders(null),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            email: "newcoach" + Date.now() + "@thecoachprofile.com",
            password: "Password123!",
            name: "Coach Travis Hunter",
            role: "coach",
            address: {
              city: "Dallas",
              country: "USA"
            }
          }, null, 2)
        },
        url: createUrl("/auth/signup"),
        description: "Creates a new user/coach account and sends verification OTP."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "user_id": "d._id || (d.user ? d.user._id : undefined)"
        }
      }),
      response: createResponse("User Signed Up", 200, {
        statusCode: 200,
        success: true,
        message: "User registered successfully! Please check your email for OTP.",
        data: { email: "newcoach@thecoachprofile.com" }
      })
    },
    {
      name: "POST /auth/login (Custom Login - Coach / Recruiter / Org)",
      request: {
        method: "POST",
        header: jsonHeaders(null),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            email: "{{coach_email}}",
            password: "{{coach_password}}",
            rememberMe: true
          }, null, 2)
        },
        url: createUrl("/auth/login"),
        description: "Authenticates email/password and returns accessToken and refreshToken."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "access_token": "d.accessToken",
          "coach_token": "d.accessToken",
          "coach_id": "d.user ? d.user._id : undefined"
        }
      }),
      response: createResponse("Login Success", 200, {
        statusCode: 200,
        success: true,
        message: "Login successfully",
        data: {
          accessToken: "eyJhbGciOi...",
          refreshToken: "eyJhbGciOi...",
          role: "coach",
          user: { _id: "66f1234567890abcdef10002", name: "Marcus Vance" }
        }
      })
    },
    {
      name: "POST /auth/admin-login (Admin & Super Admin Portal)",
      request: {
        method: "POST",
        header: jsonHeaders(null),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            email: "{{admin_email}}",
            password: "{{admin_password}}"
          }, null, 2)
        },
        url: createUrl("/auth/admin-login"),
        description: "Admin exclusive login endpoint."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "admin_token": "d.accessToken",
          "access_token": "d.accessToken"
        }
      }),
      response: createResponse("Admin Login Success", 200, {
        statusCode: 200,
        success: true,
        message: "Admin Login successfully",
        data: {
          accessToken: "eyJhbGciOi...",
          refreshToken: "eyJhbGciOi...",
          role: "super_admin"
        }
      })
    },
    {
      name: "POST /auth/social-login (Mobile Flutter Google/Facebook Token)",
      request: {
        method: "POST",
        header: jsonHeaders(null),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            provider: "google",
            token: "sample-google-oauth2-id-token"
          }, null, 2)
        },
        url: createUrl("/auth/social-login"),
        description: "Mobile Flutter social login via verified idToken."
      },
      event: [
        {
          listen: "test",
          script: {
            exec: [
              `pm.test("Status code is 200 or 401 (valid mock or missing token)", function () {`,
              `    pm.expect([200, 400, 401]).to.include(pm.response.code);`,
              `});`
            ],
            type: "text/javascript"
          }
        }
      ],
      response: createResponse("Social Login", 200, {
        statusCode: 200,
        success: true,
        message: "Social Login successfully",
        data: { accessToken: "eyJhbGci...", refreshToken: "eyJhbGci...", role: "coach" }
      })
    },
    {
      name: "GET /auth/google (Web Google OAuth Initiate)",
      request: {
        method: "GET",
        header: [],
        url: createUrl("/auth/google"),
        description: "Initiates web-based Google OAuth redirect flow."
      },
      event: createTestScript({ expectedStatus: 302 }),
      response: createResponse("Redirecting to Google", 302, {})
    },
    {
      name: "GET /auth/google/callback (Google OAuth Callback)",
      request: {
        method: "GET",
        header: [],
        url: createUrl("/auth/google/callback"),
        description: "Handles Google OAuth redirect response from Google servers."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Google Callback Success", 200, {
        statusCode: 200,
        success: true,
        data: { accessToken: "eyJhbGciOi..." }
      })
    },
    {
      name: "POST /auth/verify-account (Verify OTP)",
      request: {
        method: "POST",
        header: jsonHeaders(null),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            email: "newcoach@thecoachprofile.com",
            oneTimeCode: "123456"
          }, null, 2)
        },
        url: createUrl("/auth/verify-account"),
        description: "Verifies the 6-digit OTP sent to email or phone."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Account Verified", 200, {
        statusCode: 200,
        success: true,
        message: "Account verified successfully",
        data: { accessToken: "eyJhbGci...", role: "coach" }
      })
    },
    {
      name: "POST /auth/resend-otp (Resend OTP Code)",
      request: {
        method: "POST",
        header: jsonHeaders(null),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            email: "{{coach_email}}",
            authType: "createAccount"
          }, null, 2)
        },
        url: createUrl("/auth/resend-otp"),
        description: "Resends the OTP code."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("OTP Resent", 200, {
        statusCode: 200,
        success: true,
        message: "An OTP has been sent to your email. Please verify your account."
      })
    },
    {
      name: "POST /auth/forget-password",
      request: {
        method: "POST",
        header: jsonHeaders(null),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            email: "{{coach_email}}"
          }, null, 2)
        },
        url: createUrl("/auth/forget-password"),
        description: "Initiates password reset flow by sending OTP."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("OTP Sent", 200, {
        statusCode: 200,
        success: true,
        message: "An OTP has been sent to your email. Please verify your email."
      })
    },
    {
      name: "POST /auth/reset-password",
      request: {
        method: "POST",
        header: jsonHeaders("access_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            newPassword: "NewSecurePassword123!",
            confirmPassword: "NewSecurePassword123!"
          }, null, 2)
        },
        url: createUrl("/auth/reset-password"),
        description: "Sets new password using reset token."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Password Reset", 200, {
        statusCode: 200,
        success: true,
        message: "Password reset successfully, please login now."
      })
    },
    {
      name: "POST /auth/refresh-token",
      request: {
        method: "POST",
        header: jsonHeaders(null),
        url: createUrl("/auth/refresh-token"),
        description: "Refreshes expired access token using refreshToken cookie or body."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: { "access_token": "d.accessToken" }
      }),
      response: createResponse("Token Refreshed", 200, {
        statusCode: 200,
        success: true,
        message: "Token refreshed successfully",
        data: { accessToken: "eyJhbGciOi..." }
      })
    },
    {
      name: "POST /auth/change-password",
      request: {
        method: "POST",
        header: jsonHeaders("access_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            currentPassword: "Password123!",
            newPassword: "UpdatedPassword123!",
            confirmPassword: "UpdatedPassword123!"
          }, null, 2)
        },
        url: createUrl("/auth/change-password"),
        description: "Changes password for logged in user."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Password Changed", 200, {
        statusCode: 200,
        success: true,
        message: "Password changed successfully"
      })
    },
    {
      name: "DELETE /auth/delete-account",
      request: {
        method: "DELETE",
        header: jsonHeaders("access_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            password: "Password123!"
          }, null, 2)
        },
        url: createUrl("/auth/delete-account"),
        description: "Permanently deletes the authenticated user's account."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Account Deleted", 200, {
        statusCode: 200,
        success: true,
        message: "Account deleted successfully"
      })
    },
    {
      name: "POST /auth/logout",
      request: {
        method: "POST",
        header: jsonHeaders("access_token"),
        url: createUrl("/auth/logout"),
        description: "Logs out current user and invalidates session token."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Logged Out", 200, {
        statusCode: 200,
        success: true,
        message: "User logged out successfully"
      })
    }
  ]
};

collection.item.push(authFolder);

// -------------------------------------------------------------
// FOLDER 02: USERS & COACH DIRECTORY MODULE
// -------------------------------------------------------------
const userFolder = {
  name: "02. Users & Coach Directory (/users)",
  description: "Coach search, discovery, profile management, and admin user controls.",
  item: [
    {
      name: "GET /users/profile (Get My Profile)",
      request: {
        method: "GET",
        header: jsonHeaders("access_token"),
        url: createUrl("/users/profile"),
        description: "Returns the authenticated user's complete profile."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "user_id": "d._id"
        }
      }),
      response: createResponse("User Profile", 200, {
        statusCode: 200,
        success: true,
        message: "Profile retrieved successfully",
        data: {
          _id: "66f1234567890abcdef10002",
          name: "Marcus Vance",
          role: "coach",
          currentRole: "Offensive Coordinator",
          currentOrganization: "Boise State",
          highestLevel: "FBS"
        }
      })
    },
    {
      name: "PATCH /users/profile (Update My Profile)",
      request: {
        method: "PATCH",
        header: jsonHeaders("access_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            headline: "Elite Play-Caller | Air Raid & Zone Run Specialist",
            bio: "14+ years of FBS coaching experience with championship credentials.",
            coachingPhilosophy: "Fast, disciplined, player-centric execution.",
            careerStatus: "open_to_opportunities",
            yearsExperience: 14
          }, null, 2)
        },
        url: createUrl("/users/profile"),
        description: "Updates user profile attributes."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Profile Updated", 200, {
        statusCode: 200,
        success: true,
        message: "Profile updated successfully",
        data: { _id: "66f1234567890abcdef10002", headline: "Elite Play-Caller" }
      })
    },
    {
      name: "DELETE /users/profile (Delete My Profile)",
      request: {
        method: "DELETE",
        header: jsonHeaders("access_token"),
        url: createUrl("/users/profile"),
        description: "Deletes own profile data."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Profile Deleted", 200, {
        statusCode: 200,
        success: true,
        message: "Profile deleted successfully"
      })
    },
    {
      name: "PATCH /users/deactivate-profile (Deactivate Account)",
      request: {
        method: "PATCH",
        header: jsonHeaders("access_token"),
        url: createUrl("/users/deactivate-profile"),
        description: "Deactivates own profile status."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Profile Deactivated", 200, {
        statusCode: 200,
        success: true,
        message: "Profile deactivated successfully"
      })
    },
    {
      name: "GET /users/download-account-data (Export Account Data)",
      request: {
        method: "GET",
        header: jsonHeaders("access_token"),
        url: createUrl("/users/download-account-data"),
        description: "Downloads user's account and GDPR data export."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Account Data Export", 200, {
        statusCode: 200,
        success: true,
        data: { user: {}, opportunities: [], chats: [] }
      })
    },
    {
      name: "GET /users/coaches (Search Directory with Filters)",
      request: {
        method: "GET",
        header: jsonHeaders(null),
        url: createUrl("/users/coaches", [
          { key: "search", value: "Offensive Coordinator" },
          { key: "level", value: "FBS" },
          { key: "state", value: "TX" },
          { key: "page", value: "1" },
          { key: "limit", value: "10" }
        ]),
        description: "Search coaches by title, level, experience, state, and credentials."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "coach_id": "d.data && d.data.length > 0 ? d.data[0]._id : (Array.isArray(d) && d.length > 0 ? d[0]._id : undefined)"
        }
      }),
      response: createResponse("Coaches Search Result", 200, {
        statusCode: 200,
        success: true,
        message: "Coaches retrieved successfully",
        data: [{ _id: "66f1234567890abcdef10002", name: "Marcus Vance", highestLevel: "FBS" }]
      })
    },
    {
      name: "GET /users/coaches/recommended",
      request: {
        method: "GET",
        header: jsonHeaders("access_token"),
        url: createUrl("/users/coaches/recommended"),
        description: "Returns AI-matched / algorithmically recommended coaches."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Recommended Coaches", 200, {
        statusCode: 200,
        success: true,
        message: "Recommended coaches retrieved successfully",
        data: []
      })
    },
    {
      name: "GET /users/coaches/:id (Get Coach Details)",
      request: {
        method: "GET",
        header: jsonHeaders(null),
        url: createUrl("/users/coaches/:coach_id"),
        description: "Returns deep public profile of a coach."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Coach Details", 200, {
        statusCode: 200,
        success: true,
        message: "Coach details retrieved successfully",
        data: { _id: "66f1234567890abcdef10002", name: "Marcus Vance" }
      })
    },
    {
      name: "POST /users/coaches/:coachId/save (Bookmark Coach)",
      request: {
        method: "POST",
        header: jsonHeaders("org_token"),
        url: createUrl("/users/coaches/:coach_id/save"),
        description: "Recruiter saves/bookmarks coach for later consideration."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Coach Saved", 200, {
        statusCode: 200,
        success: true,
        message: "Coach saved successfully",
        data: null
      })
    },
    {
      name: "GET /users/coaches/saved (List Saved Coaches)",
      request: {
        method: "GET",
        header: jsonHeaders("org_token"),
        url: createUrl("/users/coaches/saved"),
        description: "Returns recruiter's saved/bookmarked coaches list."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Saved Coaches List", 200, {
        statusCode: 200,
        success: true,
        message: "Saved coaches retrieved successfully",
        data: []
      })
    },
    {
      name: "DELETE /users/coaches/:coachId/save (Unsave Coach)",
      request: {
        method: "DELETE",
        header: jsonHeaders("org_token"),
        url: createUrl("/users/coaches/:coach_id/save"),
        description: "Removes coach from saved list."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Coach Unsaved", 200, {
        statusCode: 200,
        success: true,
        message: "Coach removed from saved list",
        data: null
      })
    },
    {
      name: "GET /users (Admin: Get All Platform Users)",
      request: {
        method: "GET",
        header: jsonHeaders("admin_token"),
        url: createUrl("/users", [
          { key: "page", value: "1" },
          { key: "limit", value: "20" }
        ]),
        description: "Admin directory of all platform users with roles and status."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("All Users", 200, {
        statusCode: 200,
        success: true,
        message: "Users retrieved successfully",
        data: []
      })
    },
    {
      name: "GET /users/:userId (Get User By ID)",
      request: {
        method: "GET",
        header: jsonHeaders("admin_token"),
        url: createUrl("/users/:user_id"),
        description: "Returns user account details by ID."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("User Details", 200, {
        statusCode: 200,
        success: true,
        message: "User retrieved successfully",
        data: { _id: "66f1234567890abcdef10002" }
      })
    },
    {
      name: "PATCH /users/:userId (Admin: Update Status)",
      request: {
        method: "PATCH",
        header: jsonHeaders("admin_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            status: "active"
          }, null, 2)
        },
        url: createUrl("/users/:coach_id"),
        description: "Admin activates, suspends or deactivates user account."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("User Status Updated", 200, {
        statusCode: 200,
        success: true,
        message: "User status updated successfully",
        data: null
      })
    },
    {
      name: "DELETE /users/:userId (Admin: Delete User Account)",
      request: {
        method: "DELETE",
        header: jsonHeaders("admin_token"),
        url: createUrl("/users/:user_id"),
        description: "Admin deletes a user account."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("User Deleted", 200, {
        statusCode: 200,
        success: true,
        message: "User deleted successfully"
      })
    }
  ]
};

collection.item.push(userFolder);

// -------------------------------------------------------------
// FOLDER 03: ORGANIZATIONS MODULE
// -------------------------------------------------------------
const orgFolder = {
  name: "03. Organizations (/organizations)",
  description: "Collegiate Athletic Programs, Professional Teams, Agencies, and Member permissions.",
  item: [
    {
      name: "GET /organizations/current (My Workspace)",
      request: {
        method: "GET",
        header: jsonHeaders("org_token"),
        url: createUrl("/organizations/current"),
        description: "Returns currently active organization details for the logged-in recruiter."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "org_id": "d._id"
        }
      }),
      response: createResponse("Current Organization", 200, {
        statusCode: 200,
        success: true,
        message: "Current organization retrieved successfully",
        data: {
          _id: "66f1234567890abcdef10001",
          name: "Texas Longhorns Football",
          type: "collegiate_program",
          division: "FBS",
          conference: "SEC"
        }
      })
    },
    {
      name: "PATCH /organizations/current (Update Organization)",
      request: {
        method: "PATCH",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            description: "Updated championship athletics program and coaching operations.",
            website: "https://texassports.com"
          }, null, 2)
        },
        url: createUrl("/organizations/current"),
        description: "Updates organization profile and settings."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Organization Updated", 200, {
        statusCode: 200,
        success: true,
        message: "Organization updated successfully",
        data: { _id: "66f1234567890abcdef10001", name: "Texas Longhorns Football" }
      })
    },
    {
      name: "GET /organizations (Directory / Search)",
      request: {
        method: "GET",
        header: jsonHeaders(null),
        url: createUrl("/organizations", [
          { key: "type", value: "collegiate_program" },
          { key: "division", value: "FBS" }
        ]),
        description: "Public directory of registered programs and teams."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Organizations List", 200, {
        statusCode: 200,
        success: true,
        message: "Organizations retrieved successfully",
        data: []
      })
    },
    {
      name: "POST /organizations (Register New Organization)",
      request: {
        method: "POST",
        header: jsonHeaders("admin_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            name: "Georgia Bulldogs Football",
            type: "collegiate_program",
            role: "collegiate",
            school: "University of Georgia",
            conference: "SEC",
            division: "FBS",
            location: "Athens, GA",
            state: "GA",
            website: "https://georgiadogs.com",
            description: "Official athletic program for Georgia Football."
          }, null, 2)
        },
        url: createUrl("/organizations"),
        description: "Registers an organization in the platform."
      },
      event: createTestScript({
        expectedStatus: 201,
        storeVars: { "org_id": "d._id" }
      }),
      response: createResponse("Organization Created", 201, {
        statusCode: 201,
        success: true,
        message: "Organization created successfully",
        data: { _id: "66f1234567890abcdef10099", name: "Georgia Bulldogs Football" }
      })
    },
    {
      name: "GET /organizations/members (List Staff Members)",
      request: {
        method: "GET",
        header: jsonHeaders("org_token"),
        url: createUrl("/organizations/members"),
        description: "Retrieves staff members of the current organization workspace."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "member_id": "d && d.length > 0 ? (d[0].user ? d[0].user._id || d[0].user : d[0]._id) : undefined"
        }
      }),
      response: createResponse("Members List", 200, {
        statusCode: 200,
        success: true,
        message: "Organization members retrieved successfully",
        data: []
      })
    },
    {
      name: "POST /organizations/members/invite (Invite Colleague)",
      request: {
        method: "POST",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            email: "assistant.recruiter@texasathletics.edu",
            role: "recruiter"
          }, null, 2)
        },
        url: createUrl("/organizations/members/invite"),
        description: "Sends an invite email to join the organization workspace."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Member Invited", 200, {
        statusCode: 200,
        success: true,
        message: "Member invited successfully"
      })
    },
    {
      name: "PATCH /organizations/members/:memberId/role (Update Member Role)",
      request: {
        method: "PATCH",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            role: "admin"
          }, null, 2)
        },
        url: createUrl("/organizations/members/:member_id/role"),
        description: "Updates role of an organization member."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Member Role Updated", 200, {
        statusCode: 200,
        success: true,
        message: "Member role updated successfully"
      })
    },
    {
      name: "DELETE /organizations/members/:memberId (Remove Member)",
      request: {
        method: "DELETE",
        header: jsonHeaders("org_token"),
        url: createUrl("/organizations/members/:member_id"),
        description: "Removes staff member from organization."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Member Removed", 200, {
        statusCode: 200,
        success: true,
        message: "Member removed successfully"
      })
    }
  ]
};

collection.item.push(orgFolder);

// -------------------------------------------------------------
// FOLDER 04: OPPORTUNITIES MODULE
// -------------------------------------------------------------
const oppFolder = {
  name: "04. Opportunities & Jobs (/opportunities)",
  description: "Job postings, coaching search openings, and express interest applications.",
  item: [
    {
      name: "GET /opportunities (Search & Filter Openings)",
      request: {
        method: "GET",
        header: jsonHeaders(null),
        url: createUrl("/opportunities", [
          { key: "status", value: "active" },
          { key: "level", value: "FBS" },
          { key: "type", value: "full_time" },
          { key: "page", value: "1" },
          { key: "limit", value: "10" }
        ]),
        description: "Lists active opportunities with filters."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "opportunity_id": "d.data && d.data.length > 0 ? d.data[0]._id : (Array.isArray(d) && d.length > 0 ? d[0]._id : undefined)"
        }
      }),
      response: createResponse("Opportunities List", 200, {
        statusCode: 200,
        success: true,
        message: "Opportunities retrieved successfully",
        data: []
      })
    },
    {
      name: "POST /opportunities (Post New Job)",
      request: {
        method: "POST",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            title: "Defensive Line Coach & Run Game Coordinator",
            position: "Defensive Line",
            level: "FBS",
            type: "full_time",
            location: "Austin, TX",
            isRemote: false,
            description: "Seeking championship-caliber defensive line coach with verified pass-rush development pedigree.",
            requirements: [
              "Bachelor's degree required",
              "Minimum 4 years Division I collegiate experience",
              "Proven recruiting production"
            ],
            status: "active",
            isFeatured: true
          }, null, 2)
        },
        url: createUrl("/opportunities"),
        description: "Creates an opportunity posting."
      },
      event: createTestScript({
        expectedStatus: 201,
        storeVars: {
          "opportunity_id": "d._id"
        }
      }),
      response: createResponse("Opportunity Created", 201, {
        statusCode: 201,
        success: true,
        message: "Opportunity created successfully",
        data: { _id: "66f9876543210abcdef20002", title: "Defensive Line Coach" }
      })
    },
    {
      name: "GET /opportunities/:id (Opportunity Details)",
      request: {
        method: "GET",
        header: jsonHeaders(null),
        url: createUrl("/opportunities/:opportunity_id"),
        description: "Returns single opportunity details."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Opportunity Details", 200, {
        statusCode: 200,
        success: true,
        message: "Opportunity retrieved successfully",
        data: { _id: "66f9876543210abcdef20001", title: "Offensive Coordinator" }
      })
    },
    {
      name: "PATCH /opportunities/:id (Update Opportunity)",
      request: {
        method: "PATCH",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            isUrgent: true,
            status: "active"
          }, null, 2)
        },
        url: createUrl("/opportunities/:opportunity_id"),
        description: "Updates opportunity details."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Opportunity Updated", 200, {
        statusCode: 200,
        success: true,
        message: "Opportunity updated successfully",
        data: { _id: "66f9876543210abcdef20001" }
      })
    },
    {
      name: "POST /opportunities/:id/express-interest (Direct Express Interest)",
      request: {
        method: "POST",
        header: jsonHeaders("coach_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            sharedFields: {
              shareContactInfo: true,
              shareCareerHistory: true,
              shareCredentials: true,
              shareRecruitingFootprint: true
            },
            message: "I am confident my defensive line development philosophy will elevate your unit."
          }, null, 2)
        },
        url: createUrl("/opportunities/:opportunity_id/express-interest"),
        description: "Applies to opportunity directly via URL param."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Interest Expressed", 200, {
        statusCode: 200,
        success: true,
        message: "Expressed interest successfully",
        data: {}
      })
    },
    {
      name: "DELETE /opportunities/:id (Close Opportunity)",
      request: {
        method: "DELETE",
        header: jsonHeaders("org_token"),
        url: createUrl("/opportunities/:opportunity_id"),
        description: "Closes opportunity once filled or cancelled."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Opportunity Closed", 200, {
        statusCode: 200,
        success: true,
        message: "Opportunity closed successfully",
        data: null
      })
    }
  ]
};

collection.item.push(oppFolder);

// -------------------------------------------------------------
// FOLDER 05: CANDIDATES & RECRUITING PIPELINE MODULE
// -------------------------------------------------------------
const candidateFolder = {
  name: "05. Candidates & Pipeline (/candidates)",
  description: "Recruiter Kanban board, candidate pipeline stages, ratings, shortlists, and notes.",
  item: [
    {
      name: "POST /candidates/express-interest (Submit Express Interest)",
      request: {
        method: "POST",
        header: jsonHeaders("coach_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            opportunityId: "{{opportunity_id}}",
            sharedFields: {
              shareContactInfo: true,
              shareCareerHistory: true,
              shareCredentials: true,
              shareRecruitingFootprint: true
            },
            message: "Excited about this opening."
          }, null, 2)
        },
        url: createUrl("/candidates/express-interest"),
        description: "Coach submits Express Interest."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: { "candidate_id": "d._id" }
      }),
      response: createResponse("Express Interest Submitted", 200, {
        statusCode: 200,
        success: true,
        message: "Expressed interest successfully",
        data: { _id: "66f9876543210abcdef30001" }
      })
    },
    {
      name: "GET /candidates/pipeline (Kanban Board)",
      request: {
        method: "GET",
        header: jsonHeaders("org_token"),
        url: createUrl("/candidates/pipeline", [
          { key: "opportunityId", value: "{{opportunity_id}}" }
        ]),
        description: "Retrieves pipeline Kanban stages (discovered, saved, contacted, interested, interview, offer, hired)."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Pipeline Board", 200, {
        statusCode: 200,
        success: true,
        message: "Pipeline board retrieved successfully",
        data: { stages: {} }
      })
    },
    {
      name: "GET /candidates/express-interests (Express Interest Inbound)",
      request: {
        method: "GET",
        header: jsonHeaders("org_token"),
        url: createUrl("/candidates/express-interests", [
          { key: "opportunityId", value: "{{opportunity_id}}" }
        ]),
        description: "Returns inbound Express Interest submissions from coaches."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "candidate_id": "d && d.length > 0 ? d[0]._id : undefined"
        }
      }),
      response: createResponse("Inbound Applications", 200, {
        statusCode: 200,
        success: true,
        message: "Express interest candidates retrieved successfully",
        data: []
      })
    },
    {
      name: "GET /candidates/shortlists (List Shortlists via Candidate Route)",
      request: {
        method: "GET",
        header: jsonHeaders("org_token"),
        url: createUrl("/candidates/shortlists"),
        description: "Retrieves shortlists via candidate module route."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Shortlists", 200, {
        statusCode: 200,
        success: true,
        message: "Shortlists retrieved successfully",
        data: []
      })
    },
    {
      name: "POST /candidates/shortlists (Create Shortlist via Candidate Route)",
      request: {
        method: "POST",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            name: "Candidate Special Teams Shortlist"
          }, null, 2)
        },
        url: createUrl("/candidates/shortlists"),
        description: "Creates shortlist via candidate module."
      },
      event: createTestScript({ expectedStatus: 201 }),
      response: createResponse("Shortlist Created", 201, {
        statusCode: 201,
        success: true,
        message: "Shortlist created successfully",
        data: { _id: "66f9876543210abcdef40088" }
      })
    },
    {
      name: "POST /candidates/shortlists/:shortlistId/coaches/:coachId",
      request: {
        method: "POST",
        header: jsonHeaders("org_token"),
        url: createUrl("/candidates/shortlists/:shortlist_id/coaches/:coach_id"),
        description: "Adds coach to shortlist via candidate module."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Coach Added", 200, {
        statusCode: 200,
        success: true,
        message: "Coach added to shortlist successfully"
      })
    },
    {
      name: "DELETE /candidates/shortlists/:shortlistId/coaches/:coachId",
      request: {
        method: "DELETE",
        header: jsonHeaders("org_token"),
        url: createUrl("/candidates/shortlists/:shortlist_id/coaches/:coach_id"),
        description: "Removes coach from shortlist via candidate module."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Coach Removed", 200, {
        statusCode: 200,
        success: true,
        message: "Coach removed from shortlist successfully"
      })
    },
    {
      name: "GET /candidates (List All Candidates)",
      request: {
        method: "GET",
        header: jsonHeaders("org_token"),
        url: createUrl("/candidates", [
          { key: "stage", value: "interview" },
          { key: "page", value: "1" },
          { key: "limit", value: "10" }
        ]),
        description: "Retrieves candidate records for the organization."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Candidates List", 200, {
        statusCode: 200,
        success: true,
        message: "Candidates retrieved successfully",
        data: []
      })
    },
    {
      name: "GET /candidates/:id (Candidate Details)",
      request: {
        method: "GET",
        header: jsonHeaders("org_token"),
        url: createUrl("/candidates/:candidate_id"),
        description: "Returns complete candidate record including coach snapshot, notes, and ratings."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Candidate Record", 200, {
        statusCode: 200,
        success: true,
        message: "Candidate record retrieved successfully",
        data: { _id: "66f9876543210abcdef30001" }
      })
    },
    {
      name: "PATCH /candidates/:id/stage (Update Stage)",
      request: {
        method: "PATCH",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            stage: "offer"
          }, null, 2)
        },
        url: createUrl("/candidates/:candidate_id/stage"),
        description: "Transitions candidate to a new pipeline stage."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Stage Updated", 200, {
        statusCode: 200,
        success: true,
        message: "Candidate stage updated successfully"
      })
    },
    {
      name: "PATCH /candidates/:id/rating (Update Internal Rating)",
      request: {
        method: "PATCH",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            rating: 5
          }, null, 2)
        },
        url: createUrl("/candidates/:candidate_id/rating"),
        description: "Updates internal 1-5 star rating for candidate."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Rating Updated", 200, {
        statusCode: 200,
        success: true,
        message: "Candidate rating updated successfully"
      })
    },
    {
      name: "POST /candidates/:id/notes (Add Note)",
      request: {
        method: "POST",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            content: "Met with Athletic Director. Terms of offer discussed."
          }, null, 2)
        },
        url: createUrl("/candidates/:candidate_id/notes"),
        description: "Appends confidential recruiting note."
      },
      event: createTestScript({ expectedStatus: 201 }),
      response: createResponse("Note Added", 201, {
        statusCode: 201,
        success: true,
        message: "Note added successfully",
        data: {}
      })
    },
    {
      name: "GET /candidates/:id/notes (List Notes)",
      request: {
        method: "GET",
        header: jsonHeaders("org_token"),
        url: createUrl("/candidates/:candidate_id/notes"),
        description: "Retrieves timeline of recruiting notes on candidate."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Candidate Notes", 200, {
        statusCode: 200,
        success: true,
        message: "Notes retrieved successfully",
        data: []
      })
    }
  ]
};

collection.item.push(candidateFolder);

// -------------------------------------------------------------
// FOLDER 06: SHORTLISTS MODULE
// -------------------------------------------------------------
const shortlistFolder = {
  name: "06. Shortlists (/shortlists)",
  description: "Curated lists of coaches for recruiting committees and athletic boards.",
  item: [
    {
      name: "GET /shortlists (List All Shortlists)",
      request: {
        method: "GET",
        header: jsonHeaders("org_token"),
        url: createUrl("/shortlists"),
        description: "Returns all shortlists created by current recruiter's organization."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "shortlist_id": "d && d.length > 0 ? d[0]._id : undefined"
        }
      }),
      response: createResponse("Shortlists", 200, {
        statusCode: 200,
        success: true,
        message: "Shortlists retrieved successfully",
        data: []
      })
    },
    {
      name: "POST /shortlists (Create Shortlist)",
      request: {
        method: "POST",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            name: "Defensive Coordinator Candidates 2026",
            description: "High priority 3-4 and 4-2-5 defensive minds"
          }, null, 2)
        },
        url: createUrl("/shortlists"),
        description: "Creates a new shortlist container."
      },
      event: createTestScript({
        expectedStatus: 201,
        storeVars: {
          "shortlist_id": "d._id"
        }
      }),
      response: createResponse("Shortlist Created", 201, {
        statusCode: 201,
        success: true,
        message: "Shortlist created successfully",
        data: { _id: "66f9876543210abcdef40002" }
      })
    },
    {
      name: "GET /shortlists/:id (Get Shortlist By ID)",
      request: {
        method: "GET",
        header: jsonHeaders("org_token"),
        url: createUrl("/shortlists/:shortlist_id"),
        description: "Returns shortlist details and populated coach list."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Shortlist Details", 200, {
        statusCode: 200,
        success: true,
        message: "Shortlist retrieved successfully",
        data: { _id: "66f9876543210abcdef40001" }
      })
    },
    {
      name: "PATCH /shortlists/:id (Update Shortlist Details)",
      request: {
        method: "PATCH",
        header: jsonHeaders("org_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            name: "Updated Defensive Coordinator Shortlist",
            description: "Updated description for coaching search committee"
          }, null, 2)
        },
        url: createUrl("/shortlists/:shortlist_id"),
        description: "Updates shortlist name and description."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Shortlist Updated", 200, {
        statusCode: 200,
        success: true,
        message: "Shortlist updated successfully"
      })
    },
    {
      name: "POST /shortlists/:shortlistId/coaches/:coachId",
      request: {
        method: "POST",
        header: jsonHeaders("org_token"),
        url: createUrl("/shortlists/:shortlist_id/coaches/:coach_id"),
        description: "Adds a specific coach into the shortlist."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Coach Added", 200, {
        statusCode: 200,
        success: true,
        message: "Coach added to shortlist successfully"
      })
    },
    {
      name: "DELETE /shortlists/:shortlistId/coaches/:coachId",
      request: {
        method: "DELETE",
        header: jsonHeaders("org_token"),
        url: createUrl("/shortlists/:shortlist_id/coaches/:coach_id"),
        description: "Removes coach from the shortlist."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Coach Removed", 200, {
        statusCode: 200,
        success: true,
        message: "Coach removed from shortlist successfully"
      })
    },
    {
      name: "DELETE /shortlists/:id (Delete Shortlist)",
      request: {
        method: "DELETE",
        header: jsonHeaders("org_token"),
        url: createUrl("/shortlists/:shortlist_id"),
        description: "Deletes a shortlist container."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Shortlist Deleted", 200, {
        statusCode: 200,
        success: true,
        message: "Shortlist deleted successfully"
      })
    }
  ]
};

collection.item.push(shortlistFolder);

// -------------------------------------------------------------
// FOLDER 07: VERIFICATIONS MODULE
// -------------------------------------------------------------
const verifFolder = {
  name: "07. Verifications (/verifications)",
  description: "Trust badge validation for Identity, Experience, Credentials, and Programs.",
  item: [
    {
      name: "POST /verifications/submit (Submit Verification)",
      request: {
        method: "POST",
        header: jsonHeaders("coach_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            entityId: "{{coach_id}}",
            entityType: "coach_experience",
            entityName: "Marcus Vance - Boise State Experience",
            documents: [
              {
                name: "BoiseState_Contract_Verification.pdf",
                url: "https://tcp-uploads.s3.amazonaws.com/verifications/sample_contract.pdf",
                mimeType: "application/pdf"
              }
            ]
          }, null, 2)
        },
        url: createUrl("/verifications/submit"),
        description: "Submits verification documents for review."
      },
      event: createTestScript({
        expectedStatus: 201,
        storeVars: { "verification_id": "d._id" }
      }),
      response: createResponse("Verification Submitted", 200, {
        statusCode: 200,
        success: true,
        message: "Verification submitted successfully",
        data: { _id: "66f9876543210abcdef70002", status: "pending" }
      })
    },
    {
      name: "GET /verifications/status/:entityId (Check Status)",
      request: {
        method: "GET",
        header: jsonHeaders("access_token"),
        url: createUrl("/verifications/status/:coach_id"),
        description: "Returns the current verification status for an entity."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Verification Status", 200, {
        statusCode: 200,
        success: true,
        message: "Verification status retrieved successfully",
        data: { status: "verified" }
      })
    },
    {
      name: "GET /verifications/queue (Admin Review Queue)",
      request: {
        method: "GET",
        header: jsonHeaders("admin_token"),
        url: createUrl("/verifications/queue"),
        description: "Admin queue of pending verification requests."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "verification_id": "d && d.length > 0 ? d[0]._id : undefined"
        }
      }),
      response: createResponse("Verification Queue", 200, {
        statusCode: 200,
        success: true,
        message: "Verification queue retrieved successfully",
        data: []
      })
    },
    {
      name: "PATCH /verifications/:id/approve (Admin Approve)",
      request: {
        method: "PATCH",
        header: jsonHeaders("admin_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            note: "Official NCAA & AFCA credentials verified."
          }, null, 2)
        },
        url: createUrl("/verifications/:verification_id/approve"),
        description: "Admin approves verification and marks entity verified."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Verification Approved", 200, {
        statusCode: 200,
        success: true,
        message: "Verification approved successfully",
        data: { status: "verified" }
      })
    },
    {
      name: "PATCH /verifications/:id/request-info (Admin Request Info)",
      request: {
        method: "PATCH",
        header: jsonHeaders("admin_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            note: "Please provide a clearer copy of your government ID or contract signatory page."
          }, null, 2)
        },
        url: createUrl("/verifications/:verification_id/request-info"),
        description: "Admin requests additional documentation."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Info Requested", 200, {
        statusCode: 200,
        success: true,
        message: "Requested more info successfully"
      })
    },
    {
      name: "PATCH /verifications/:id/reject (Admin Reject)",
      request: {
        method: "PATCH",
        header: jsonHeaders("admin_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            reason: "Documents provided could not be authenticated."
          }, null, 2)
        },
        url: createUrl("/verifications/:verification_id/reject"),
        description: "Admin rejects verification request."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Verification Rejected", 200, {
        statusCode: 200,
        success: true,
        message: "Verification rejected successfully"
      })
    }
  ]
};

collection.item.push(verifFolder);

// -------------------------------------------------------------
// FOLDER 08: SUBSCRIPTIONS MODULE
// -------------------------------------------------------------
const subFolder = {
  name: "08. Subscriptions & Billing (/subscriptions)",
  description: "Coach Pro ($19.88/mo), Org Pro, Stripe Checkout sessions, and Billing portal.",
  item: [
    {
      name: "GET /subscriptions/current (My Active Subscription)",
      request: {
        method: "GET",
        header: jsonHeaders("coach_token"),
        url: createUrl("/subscriptions/current"),
        description: "Returns active subscription status, plan name, and period dates."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Subscription Details", 200, {
        statusCode: 200,
        success: true,
        message: "Current subscription retrieved successfully",
        data: {
          plan: "coach_pro",
          status: "active",
          price: 19.88,
          billingCycle: "monthly"
        }
      })
    },
    {
      name: "POST /subscriptions/checkout-session (Create Stripe Session)",
      request: {
        method: "POST",
        header: jsonHeaders("coach_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            plan: "coach_pro",
            billingCycle: "monthly"
          }, null, 2)
        },
        url: createUrl("/subscriptions/checkout-session"),
        description: "Creates Stripe Checkout URL to upgrade subscription."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Checkout Session", 200, {
        statusCode: 200,
        success: true,
        message: "Checkout session created successfully",
        data: { url: "https://checkout.stripe.com/pay/cs_test_..." }
      })
    },
    {
      name: "GET /subscriptions/billing-portal (Stripe Customer Portal)",
      request: {
        method: "GET",
        header: jsonHeaders("coach_token"),
        url: createUrl("/subscriptions/billing-portal"),
        description: "Returns Stripe Customer Billing Portal link to manage cards/invoices."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Billing Portal Link", 200, {
        statusCode: 200,
        success: true,
        message: "Billing portal URL retrieved successfully",
        data: { url: "https://billing.stripe.com/p/session/..." }
      })
    },
    {
      name: "POST /subscriptions/change-plan (Direct Plan Upgrade)",
      request: {
        method: "POST",
        header: jsonHeaders("coach_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            plan: "coach_pro"
          }, null, 2)
        },
        url: createUrl("/subscriptions/change-plan"),
        description: "Upgrades or downgrades subscription plan."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Plan Changed", 200, {
        statusCode: 200,
        success: true,
        message: "Subscription plan updated successfully",
        data: {}
      })
    },
    {
      name: "POST /subscriptions/cancel (Cancel Subscription)",
      request: {
        method: "POST",
        header: jsonHeaders("coach_token"),
        url: createUrl("/subscriptions/cancel"),
        description: "Cancels subscription at the end of the billing period."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Subscription Cancelled", 200, {
        statusCode: 200,
        success: true,
        message: "Subscription cancelled successfully",
        data: null
      })
    }
  ]
};

collection.item.push(subFolder);

// -------------------------------------------------------------
// FOLDER 09: CHAT & MESSAGING MODULE
// -------------------------------------------------------------
const chatFolder = {
  name: "09. Chat & Direct Messaging (/chat & /message)",
  description: "Direct communications between Recruiters, Coaches, and Support Admin.",
  item: [
    {
      name: "GET /chat (List User Conversations)",
      request: {
        method: "GET",
        header: jsonHeaders("access_token"),
        url: createUrl("/chat", [
          { key: "search", value: "", disabled: true }
        ]),
        description: "Retrieves all active chat conversations for the user."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "chat_id": "d && d.length > 0 ? d[0]._id : undefined"
        }
      }),
      response: createResponse("Chats List", 200, {
        statusCode: 200,
        success: true,
        message: "Chat Retrieve Successfully",
        data: []
      })
    },
    {
      name: "POST /chat/:id (Start Direct Chat with User)",
      request: {
        method: "POST",
        header: jsonHeaders("org_token"),
        url: createUrl("/chat/:coach_id"),
        description: "Initializes conversation between recruiter and coach."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "chat_id": "d._id"
        }
      }),
      response: createResponse("Chat Created", 200, {
        statusCode: 200,
        success: true,
        message: "Create Chat Successfully",
        data: { _id: "66f9876543210abcdef50001" }
      })
    },
    {
      name: "POST /chat/contact-admin (Start Admin Support Chat)",
      request: {
        method: "POST",
        header: jsonHeaders("access_token"),
        url: createUrl("/chat/contact-admin"),
        description: "Opens an official support channel with system administrator."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "chat_id": "d._id"
        }
      }),
      response: createResponse("Support Chat Created", 200, {
        statusCode: 200,
        success: true,
        message: "Chat with Admin created successfully",
        data: { _id: "66f9876543210abcdef50099" }
      })
    },
    {
      name: "POST /message (Send Message)",
      request: {
        method: "POST",
        header: jsonHeaders("access_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            chatId: "{{chat_id}}",
            message: "Hello! Thank you for getting in touch. I am ready for our discussion."
          }, null, 2)
        },
        url: createUrl("/message"),
        description: "Sends text message (supports optional file attachments via multipart)."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Message Sent", 200, {
        statusCode: 200,
        success: true,
        message: "Send Message Successfully",
        data: { _id: "66f9876543210abcdef60001" }
      })
    },
    {
      name: "GET /message/:id (Get Chat Message History)",
      request: {
        method: "GET",
        header: jsonHeaders("access_token"),
        url: createUrl("/message/:chat_id"),
        description: "Returns message history of the chat room."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Messages History", 200, {
        statusCode: 200,
        success: true,
        message: "Message Retrieve Successfully",
        data: []
      })
    }
  ]
};

collection.item.push(chatFolder);

// -------------------------------------------------------------
// FOLDER 10: ANALYTICS MODULE
// -------------------------------------------------------------
const analyticsFolder = {
  name: "10. Analytics & Telemetry (/analytics)",
  description: "Recruiter organizational metrics, platform overview, and event tracking.",
  item: [
    {
      name: "GET /analytics/org-summary (Organization Metrics)",
      request: {
        method: "GET",
        header: jsonHeaders("org_token"),
        url: createUrl("/analytics/org-summary"),
        description: "Returns candidate views, pipeline conversion stats, and response rates."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Org Analytics", 200, {
        statusCode: 200,
        success: true,
        message: "Organization analytics summary retrieved successfully",
        data: {
          activeOpportunities: 3,
          totalCandidates: 28,
          interviewsScheduled: 5
        }
      })
    },
    {
      name: "GET /analytics/platform-overview (Admin Metrics)",
      request: {
        method: "GET",
        header: jsonHeaders("admin_token"),
        url: createUrl("/analytics/platform-overview"),
        description: "Super Admin dashboard: user growth, pro subscribers, and opportunity volume."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Platform Overview", 200, {
        statusCode: 200,
        success: true,
        message: "Platform overview metrics retrieved successfully",
        data: {
          totalCoaches: 540,
          totalOrganizations: 82,
          proSubscribers: 140
        }
      })
    },
    {
      name: "POST /analytics/track (Track User Event)",
      request: {
        method: "POST",
        header: jsonHeaders("access_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            eventType: "profile_view",
            metadata: {
              viewedCoachId: "{{coach_id}}",
              source: "search_directory"
            }
          }, null, 2)
        },
        url: createUrl("/analytics/track"),
        description: "Logs user analytics event for network graph analysis."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Event Tracked", 200, {
        statusCode: 200,
        success: true,
        message: "Event tracked successfully",
        data: {}
      })
    }
  ]
};

collection.item.push(analyticsFolder);

// -------------------------------------------------------------
// FOLDER 11: SUPPORT & REPORTS MODULE
// -------------------------------------------------------------
const supportFolder = {
  name: "11. Support & Reports (/support)",
  description: "Customer service tickets, reporting abuse, and inquiry management.",
  item: [
    {
      name: "POST /support (Create Support Ticket)",
      request: {
        method: "POST",
        header: jsonHeaders("access_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            subject: "Verification document question",
            message: "I uploaded my certification and want to confirm if it has been received.",
            contentType: "comment"
          }, null, 2)
        },
        url: createUrl("/support"),
        description: "Submits a support or inquiry ticket."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: { "support_id": "d._id" }
      }),
      response: createResponse("Ticket Created", 200, {
        statusCode: 200,
        success: true,
        message: "Support created successfully",
        data: { _id: "66f9876543210abcdef80001" }
      })
    },
    {
      name: "GET /support (Admin: Get All Tickets)",
      request: {
        method: "GET",
        header: jsonHeaders("admin_token"),
        url: createUrl("/support"),
        description: "Admin reviews all open user support tickets."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "support_id": "d && d.length > 0 ? d[0]._id : undefined"
        }
      }),
      response: createResponse("Support Tickets", 200, {
        statusCode: 200,
        success: true,
        message: "All support retrieved successfully",
        data: []
      })
    },
    {
      name: "GET /support/:id (Get Single Support Ticket)",
      request: {
        method: "GET",
        header: jsonHeaders("access_token"),
        url: createUrl("/support/:support_id"),
        description: "Retrieves details of a single support ticket."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Single Support", 200, {
        statusCode: 200,
        success: true,
        data: { _id: "66f9876543210abcdef80001" }
      })
    },
    {
      name: "PATCH /support/:id (Update Support Ticket Status)",
      request: {
        method: "PATCH",
        header: jsonHeaders("access_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            status: "solved"
          }, null, 2)
        },
        url: createUrl("/support/:support_id"),
        description: "Updates status or message of support ticket."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Support Updated", 200, {
        statusCode: 200,
        success: true,
        message: "Support updated successfully"
      })
    },
    {
      name: "DELETE /support/:id (Delete Support Ticket)",
      request: {
        method: "DELETE",
        header: jsonHeaders("access_token"),
        url: createUrl("/support/:support_id"),
        description: "Deletes a support ticket."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Support Deleted", 200, {
        statusCode: 200,
        success: true,
        message: "Support deleted successfully"
      })
    }
  ]
};

collection.item.push(supportFolder);

// -------------------------------------------------------------
// FOLDER 12: LOCATION SERVICES MODULE
// -------------------------------------------------------------
const locationFolder = {
  name: "12. Location Services (/location)",
  description: "Map autocomplete, address search suggestions, and geocoding.",
  item: [
    {
      name: "GET /location/search (Search Suggestions)",
      request: {
        method: "GET",
        header: jsonHeaders("access_token"),
        url: createUrl("/location/search", [
          { key: "query", value: "Austin, TX" }
        ]),
        description: "Search auto-complete suggestions for cities, schools, and states."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Location Suggestions", 200, {
        statusCode: 200,
        success: true,
        message: "Suggestions retrieved successfully",
        data: ["Austin, Texas, United States"]
      })
    },
    {
      name: "GET /location/geocode (Geocode Address)",
      request: {
        method: "GET",
        header: jsonHeaders("access_token"),
        url: createUrl("/location/geocode", [
          { key: "address", value: "Austin, TX" }
        ]),
        description: "Converts address string to latitude/longitude coordinates."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Geocoded Coordinates", 200, {
        statusCode: 200,
        success: true,
        message: "Address geocoded successfully",
        data: { lat: 30.2672, lng: -97.7431 }
      })
    }
  ]
};

collection.item.push(locationFolder);

// -------------------------------------------------------------
// FOLDER 13: PUBLIC CONTENT & FAQS MODULE
// -------------------------------------------------------------
const publicFolder = {
  name: "13. Public Pages & FAQs (/public)",
  description: "Public contact form, FAQs, and static legal documents (Privacy Policy, Terms).",
  item: [
    {
      name: "POST /public/contact (Public Contact Form)",
      request: {
        method: "POST",
        header: jsonHeaders(null),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            name: "Coach Bill Belichick",
            email: "bill@footballpros.com",
            phone: "+15125550199",
            country: "USA",
            message: "Interested in enterprise organizational membership for our football program."
          }, null, 2)
        },
        url: createUrl("/public/contact"),
        description: "Public landing page contact inquiry form."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Contact Form Submitted", 200, {
        statusCode: 200,
        success: true,
        message: "Contact message sent successfully"
      })
    },
    {
      name: "GET /public/faq/all (Get All FAQs)",
      request: {
        method: "GET",
        header: jsonHeaders(null),
        url: createUrl("/public/faq/all"),
        description: "Returns list of frequently asked questions."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "faq_id": "d && d.length > 0 ? d[0]._id : undefined"
        }
      }),
      response: createResponse("FAQs List", 200, {
        statusCode: 200,
        success: true,
        message: "All FAQs retrieved successfully",
        data: [
          {
            _id: "66f9876543210abcdef90001",
            question: "How does verification work for football coaches?",
            answer: "Coaches submit identification and coaching contract documents which are verified by our team."
          }
        ]
      })
    },
    {
      name: "GET /public/faq/single/:id (Get Single FAQ)",
      request: {
        method: "GET",
        header: jsonHeaders(null),
        url: createUrl("/public/faq/single/:faq_id"),
        description: "Returns details of a single FAQ."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Single FAQ", 200, {
        statusCode: 200,
        success: true,
        data: { _id: "66f9876543210abcdef90001" }
      })
    },
    {
      name: "POST /public/faq (Admin: Create FAQ)",
      request: {
        method: "POST",
        header: jsonHeaders("admin_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            question: "What is included with Coach Pro Membership?",
            answer: "Pro membership includes nationwide profile visibility, advanced matching, and direct messaging."
          }, null, 2)
        },
        url: createUrl("/public/faq"),
        description: "Admin creates a new FAQ item."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: { "faq_id": "d._id" }
      }),
      response: createResponse("FAQ Created", 200, {
        statusCode: 200,
        success: true,
        message: "FAQ created successfully"
      })
    },
    {
      name: "PATCH /public/faq/:id (Admin: Update FAQ)",
      request: {
        method: "PATCH",
        header: jsonHeaders("admin_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            question: "What is included with Coach Pro Membership? (Updated)",
            answer: "Nationwide directory access, unlimited messaging, and verification badge."
          }, null, 2)
        },
        url: createUrl("/public/faq/:faq_id"),
        description: "Admin updates an existing FAQ item."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("FAQ Updated", 200, {
        statusCode: 200,
        success: true,
        message: "FAQ updated successfully"
      })
    },
    {
      name: "DELETE /public/faq/:id (Admin: Delete FAQ)",
      request: {
        method: "DELETE",
        header: jsonHeaders("admin_token"),
        url: createUrl("/public/faq/:faq_id"),
        description: "Admin deletes an FAQ item."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("FAQ Deleted", 200, {
        statusCode: 200,
        success: true,
        message: "FAQ deleted successfully"
      })
    },
    {
      name: "POST /public (Admin: Create Public Content)",
      request: {
        method: "POST",
        header: jsonHeaders("admin_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            type: "terms-and-condition",
            content: "Official terms and conditions for The Coach Profile platform."
          }, null, 2)
        },
        url: createUrl("/public"),
        description: "Admin creates static legal page content."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: { "public_id": "d._id" }
      }),
      response: createResponse("Public Content Created", 200, {
        statusCode: 200,
        success: true,
        message: "Public content created successfully",
        data: { _id: "66f9876543210abcdef90099" }
      })
    },
    {
      name: "GET /public/:type (Public Content Page)",
      request: {
        method: "GET",
        header: jsonHeaders(null),
        url: createUrl("/public/:type"),
        description: "Fetches static content by type: 'privacy-policy', 'terms-and-condition', 'about', or 'contact'."
      },
      event: createTestScript({
        expectedStatus: 200,
        storeVars: {
          "public_id": "d && d._id ? d._id : undefined"
        }
      }),
      response: createResponse("Privacy Policy Content", 200, {
        statusCode: 200,
        success: true,
        message: "Public content retrieved successfully",
        data: { type: "privacy-policy", content: "Privacy policy text..." }
      })
    },
    {
      name: "PATCH /public/update/:id (Admin: Update Public Content)",
      request: {
        method: "PATCH",
        header: jsonHeaders("admin_token"),
        body: {
          mode: "raw",
          raw: JSON.stringify({
            content: "Updated terms and conditions content."
          }, null, 2)
        },
        url: createUrl("/public/update/:public_id"),
        description: "Admin updates legal page content."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Public Content Updated", 200, {
        statusCode: 200,
        success: true,
        message: "Public content updated successfully"
      })
    },
    {
      name: "DELETE /public/:id (Admin: Delete Public Content)",
      request: {
        method: "DELETE",
        header: jsonHeaders("admin_token"),
        url: createUrl("/public/:public_id"),
        description: "Admin deletes static content entry."
      },
      event: createTestScript({ expectedStatus: 200 }),
      response: createResponse("Public Content Deleted", 200, {
        statusCode: 200,
        success: true,
        message: "Public content deleted successfully"
      })
    }
  ]
};

collection.item.push(publicFolder);

// ========================================================
// GENERATE MATCHING POSTMAN ENVIRONMENT JSON
// ========================================================
const environment = {
  id: "e48d910a-env-the-coach-profile",
  name: "The Coach Profile (Local Dev)",
  values: [
    { key: "base_url", value: "http://localhost:5004", enabled: true },
    { key: "admin_email", value: "admin@thecoachprofile.com", enabled: true },
    { key: "admin_password", value: "adminpassword123", enabled: true },
    { key: "org_email", value: "recruiter@texasathletics.edu", enabled: true },
    { key: "org_password", value: "Password123!", enabled: true },
    { key: "coach_email", value: "marcus.vance@tcpcoach.com", enabled: true },
    { key: "coach_password", value: "Password123!", enabled: true },
    { key: "access_token", value: "", enabled: true },
    { key: "admin_token", value: "", enabled: true },
    { key: "org_token", value: "", enabled: true },
    { key: "coach_token", value: "", enabled: true },
    { key: "user_id", value: "", enabled: true },
    { key: "coach_id", value: "", enabled: true },
    { key: "recruiter_id", value: "", enabled: true },
    { key: "member_id", value: "", enabled: true },
    { key: "org_id", value: "", enabled: true },
    { key: "opportunity_id", value: "", enabled: true },
    { key: "candidate_id", value: "", enabled: true },
    { key: "shortlist_id", value: "", enabled: true },
    { key: "chat_id", value: "", enabled: true },
    { key: "verification_id", value: "", enabled: true },
    { key: "support_id", value: "", enabled: true },
    { key: "faq_id", value: "", enabled: true },
    { key: "public_id", value: "", enabled: true },
    { key: "type", value: "privacy-policy", enabled: true }
  ],
  _postman_variable_scope: "environment"
};

// WRITE OUTPUT FILES
const collectionFilePath = path.join(process.cwd(), 'The_Coach_Profile_API.postman_collection.json');
const environmentFilePath = path.join(process.cwd(), 'The_Coach_Profile.postman_environment.json');

fs.writeFileSync(collectionFilePath, JSON.stringify(collection, null, 2), 'utf-8');
fs.writeFileSync(environmentFilePath, JSON.stringify(environment, null, 2), 'utf-8');

console.log(`✅ Postman Collection generated at: ${collectionFilePath}`);
console.log(`✅ Postman Environment generated at: ${environmentFilePath}`);
console.log(`Total folders: ${collection.item.length}`);
let totalRequests = 0;
collection.item.forEach(f => { totalRequests += f.item ? f.item.length : 0; });
console.log(`Total requests: ${totalRequests}`);
