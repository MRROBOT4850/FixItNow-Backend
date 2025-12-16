module.exports = {
  openapi: "3.1.0",

  info: {
    title: "FixItNow – Backend API",
    version: "1.0.0",
    description: "Production OpenAPI documentation for FixItNow backend",
  },

  servers: [
    {
      url: "https://fixitnow-backend-d40h.onrender.com",
      description: "Render production server",
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    schemas: {
      AuthResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              role: { type: "string" },
            },
          },
        },
      },

      WorkerModel: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          workerType: { type: "string" },
          rating: { type: "number" },
          availability: { type: "boolean" },
          skills: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                hourlyRate: { type: "number" },
              },
            },
          },
        },
      },

      RequestModel: {
        type: "object",
        properties: {
          _id: { type: "string" },
          type: { type: "string" },
          description: { type: "string" },
          status: { type: "string" },
        },
      },

      ReviewModel: {
        type: "object",
        properties: {
          rating: { type: "integer" },
          text: { type: "string" },
        },
      },
    },
  },

  tags: [
    { name: "Auth" },
    { name: "Search" },
    { name: "Requests" },
    { name: "Worker" },
    { name: "Worker Skills" },
    { name: "Reviews" },
    { name: "User" },
    { name: "Health" },
  ],

  paths: {
    /* ───────────── AUTH ───────────── */

    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Register user or worker",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                name: "Amit Kumar",
                email: "amit@example.com",
                password: "Amit@1234",
                role: "worker",
                workerType: "plumber",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Signup success",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
        },
      },
    },

    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                email: "amit@example.com",
                password: "Amit@1234",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login success",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
        },
      },
    },

    /* ───────────── SEARCH (ADVANCED) ───────────── */

    "/search": {
      post: {
        tags: ["Search"],
        summary: "Advanced worker search",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              example: {
                type: "plumber",
                skills: ["pipeRepair"],
                rating: { min: 3 },
                fees: { max: 800 },
                location: {
                  lat: 28.7041,
                  lng: 77.1025,
                  radius: 5000,
                },
                address: {
                  state: "Uttar Pradesh",
                  district: "Moradabad",
                },
                sort: "ratingDesc",
                pagination: { page: 1, limit: 10 },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    total: { type: "integer" },
                    results: {
                      type: "array",
                      items: { $ref: "#/components/schemas/WorkerModel" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    /* ───────────── REQUESTS ───────────── */

    "/requests": {
      post: {
        tags: ["Requests"],
        security: [{ bearerAuth: [] }],
        summary: "Create service request",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  description: { type: "string" },
                  photos: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Created" },
        },
      },
    },

    "/requests/{id}/accept": {
      post: {
        tags: ["Requests"],
        security: [{ bearerAuth: [] }],
        summary: "Worker accepts request",
        parameters: [{ name: "id", in: "path", required: true }],
        responses: { 200: { description: "Accepted" } },
      },
    },

    "/requests/{id}/resolve": {
      post: {
        tags: ["Requests"],
        security: [{ bearerAuth: [] }],
        summary: "Resolve request",
        parameters: [{ name: "id", in: "path", required: true }],
        responses: { 200: { description: "Resolved" } },
      },
    },

    "/requests/dashboard": {
      get: {
        tags: ["Requests"],
        security: [{ bearerAuth: [] }],
        summary: "Request dashboard",
        responses: { 200: { description: "Dashboard" } },
      },
    },

    "/requests/request/{id}": {
      delete: {
        tags: ["Requests"],
        security: [{ bearerAuth: [] }],
        summary: "Delete request",
        parameters: [{ name: "id", in: "path", required: true }],
        responses: { 200: { description: "Deleted" } },
      },
    },

    /* ───────────── WORKER ───────────── */

    "/worker/dashboard": {
      get: {
        tags: ["Worker"],
        security: [{ bearerAuth: [] }],
        summary: "Worker dashboard",
        responses: { 200: { description: "Dashboard" } },
      },
    },

    "/worker/delete": {
      delete: {
        tags: ["Worker"],
        security: [{ bearerAuth: [] }],
        summary: "Delete worker",
        responses: { 200: { description: "Deleted" } },
      },
    },

    /* ───────────── WORKER SKILLS ───────────── */

    "/worker/skills": {
      post: {
        tags: ["Worker Skills"],
        security: [{ bearerAuth: [] }],
        summary: "Add/update skill",
        requestBody: {
          content: {
            "application/json": {
              example: { name: "Plumbing", hourlyRate: 600 },
            },
          },
        },
        responses: { 200: { description: "Updated" } },
      },
      get: {
        tags: ["Worker Skills"],
        security: [{ bearerAuth: [] }],
        summary: "Get skills",
        responses: { 200: { description: "List" } },
      },
    },

    "/worker/skills/{name}": {
      delete: {
        tags: ["Worker Skills"],
        security: [{ bearerAuth: [] }],
        summary: "Delete skill",
        parameters: [{ name: "name", in: "path", required: true }],
        responses: { 200: { description: "Removed" } },
      },
    },

    "/worker/skills/availability": {
      patch: {
        tags: ["Worker Skills"],
        security: [{ bearerAuth: [] }],
        summary: "Set availability",
        requestBody: {
          content: {
            "application/json": {
              example: { availability: true },
            },
          },
        },
        responses: { 200: { description: "Updated" } },
      },
    },

    /* ───────────── REVIEWS ───────────── */

    "/reviews/{requestId}": {
      post: {
        tags: ["Reviews"],
        security: [{ bearerAuth: [] }],
        summary: "Create review",
        parameters: [{ name: "requestId", in: "path", required: true }],
        requestBody: {
          content: {
            "application/json": {
              example: { rating: 5, text: "Excellent service" },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },

    "/reviews/worker/{workerId}": {
      get: {
        tags: ["Reviews"],
        summary: "Worker reviews",
        parameters: [{ name: "workerId", in: "path", required: true }],
        responses: { 200: { description: "List" } },
      },
    },

    "/reviews/{reviewId}": {
      delete: {
        tags: ["Reviews"],
        security: [{ bearerAuth: [] }],
        summary: "Delete review",
        parameters: [{ name: "reviewId", in: "path", required: true }],
        responses: { 200: { description: "Deleted" } },
      },
    },

    /* ───────────── USER ───────────── */

    "/user/dashboard": {
      get: {
        tags: ["User"],
        security: [{ bearerAuth: [] }],
        summary: "User dashboard",
        responses: { 200: { description: "Dashboard" } },
      },
    },

    "/user/profile": {
      patch: {
        tags: ["User"],
        security: [{ bearerAuth: [] }],
        summary: "Update profile",
        responses: { 200: { description: "Updated" } },
      },
    },

    "/user/delete": {
      delete: {
        tags: ["User"],
        security: [{ bearerAuth: [] }],
        summary: "Delete user",
        responses: { 200: { description: "Deleted" } },
      },
    },

    /* ───────────── HEALTH ───────────── */

    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: { 200: { description: "OK" } },
      },
    },
  },
};






// docs/api-docs.js
// Clean and corrected OpenAPI 3.1 JS document

// module.exports = {
//   openapi: "3.1.0",
//   info: {
//     title: "FixItNow - Service Request API",
//     version: "1.0.0",
//     description:
//       "OpenAPI 3.1 documentation for the FixItNow backend. Includes curl and Postman examples.",
//   },

//   servers: [{ url: "http://localhost:5000", description: "Local dev" }],

//   components: {
//     securitySchemes: {
//       bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
//     },
//     schemas: {
//       SignupRequest: {
//         type: "object",
//         properties: {
//           name: { type: "string" },
//           email: { type: "string" },
//           password: { type: "string" },
//           role: { type: "string", enum: ["user", "worker"] },
//           phone: { type: "string" },
//           workerType: { type: "string" },
//           experienceYears: { type: "integer" },
//           state: { type: "string" },
//           district: { type: "string" },
//           tehsil: { type: "string" },
//           location: {
//             type: "object",
//             properties: {
//               type: { type: "string", example: "Point" },
//               coordinates: { type: "array", items: { type: "number" } },
//             },
//           },
//         },
//         required: ["name", "email", "password", "role"],
//       },

//       AuthResponse: {
//         type: "object",
//         properties: {
//           token: { type: "string" },
//           user: {
//             type: "object",
//             properties: {
//               id: { type: "string" },
//               name: { type: "string" },
//               role: { type: "string" },
//             },
//           },
//         },
//       },

//       LocationPoint: {
//         type: "object",
//         properties: {
//           type: { type: "string", example: "Point" },
//           coordinates: { type: "array", items: { type: "number" } },
//         },
//       },

//       RequestModel: { type: "object" },
//       WorkerModel: { type: "object" },
//       ReviewModel: { type: "object" },
//     },
//   },

//   tags: [
//     { name: "Auth" },
//     { name: "Search" },
//     { name: "Requests" },
//     { name: "Worker" },
//     { name: "Worker Skills" },
//     { name: "Reviews" },
//     { name: "User" },
//     { name: "Health" },
//   ],

//   paths: {
//     // ───────────────────────── AUTH ─────────────────────────
//     "/auth/signup": {
//       post: {
//         tags: ["Auth"],
//         summary: "Register user or worker",
//         requestBody: {
//           required: true,
//           content: {
//             "application/json": {
//               schema: { $ref: "#/components/schemas/SignupRequest" },
//               examples: {
//                 worker: {
//                   value: {
//                     name: "Amit Kumar",
//                     email: "amit.worker@example.com",
//                     password: "Amit@1234",
//                     role: "worker",
//                     phone: "9123456789",
//                     workerType: "plumber",
//                     experienceYears: 4,
//                     state: "Uttar Pradesh",
//                     district: "Moradabad",
//                     tehsil: "Bilari",
//                   },
//                 },
//               },
//             },
//           },
//         },

//         responses: {
//           "200": {
//             description: "Signup success",
//             content: {
//               "application/json": {
//                 schema: { $ref: "#/components/schemas/AuthResponse" },
//               },
//             },
//           },
//           "400": { description: "Bad request" },
//           "500": { description: "Server error" },
//         },

//         // FIXED JSON.stringify
//         "x-codeSamples": [
//           {
//             lang: "curl",
//             label: "curl - signup (worker)",
//             source:
//               "curl -X POST http://localhost:5000/auth/signup -H 'Content-Type: application/json' -d '{\"name\":\"Amit Kumar\",\"email\":\"amit.worker@example.com\",\"password\":\"Amit@1234\",\"role\":\"worker\",\"workerType\":\"plumber\"}'",
//           },
//           {
//             lang: "http",
//             label: "Postman (raw JSON)",
//             source: JSON.stringify(
//               {
//                 url: "http://localhost:5000/auth/signup",
//                 method: "POST",
//                 header: [{ key: "Content-Type", value: "application/json" }],
//                 body: {
//                   mode: "raw",
//                   raw: JSON.stringify(
//                     {
//                       name: "Amit Kumar",
//                       email: "amit.worker@example.com",
//                       password: "Amit@1234",
//                       role: "worker",
//                       workerType: "plumber",
//                     },
//                     null,
//                     2
//                   ),
//                 },
//               },
//               null,
//               2
//             ),
//           },
//         ],
//       },
//     },

//     "/auth/login": {
//       post: {
//         tags: ["Auth"],
//         summary: "Login user or worker",
//         requestBody: {
//           required: true,
//           content: {
//             "application/json": {
//               schema: {
//                 type: "object",
//                 properties: {
//                   email: { type: "string" },
//                   password: { type: "string" },
//                 },
//                 example: {
//                   email: "amit.worker@example.com",
//                   password: "Amit@1234",
//                 },
//               },
//             },
//           },
//         },

//         responses: {
//           "200": {
//             description: "Login success",
//             content: {
//               "application/json": {
//                 schema: { $ref: "#/components/schemas/AuthResponse" },
//               },
//             },
//           },
//           "400": { description: "Invalid credentials" },
//         },

//         "x-codeSamples": [
//           {
//             lang: "curl",
//             label: "curl - login",
//             source:
//               "curl -X POST http://localhost:5000/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"amit.worker@example.com\",\"password\":\"Amit@1234\"}'",
//           },
//         ],
//       },
//     },

//     // ───────────────────────── SEARCH ─────────────────────────
// "/search": {
//   "post": {
//     "tags": ["Search"],
//     "summary": "Search workers with flexible filters, location, address, and pagination",
//     "requestBody": {
//       "required": false,
//       "content": {
//         "application/json": {
//           "schema": {
//             "type": "object",
//             "properties": {
//               "type": { "type": "string", "description": "Worker type (e.g., plumber, electrician)" },
//               "skills": { "type": "array", "items": { "type": "string" }, "description": "Skills to filter by" },
//               "rating": {
//                 "type": "object",
//                 "properties": {
//                   "min": { "type": "number", "description": "Minimum average rating" },
//                   "max": { "type": "number", "description": "Maximum average rating" }
//                 }
//               },
//               "fees": {
//                 "type": "object",
//                 "properties": {
//                   "min": { "type": "number", "description": "Minimum hourly rate" },
//                   "max": { "type": "number", "description": "Maximum hourly rate" }
//                 }
//               },
//               "location": {
//                 "type": "object",
//                 "properties": {
//                   "lat": { "type": "number", "description": "Latitude for nearby search" },
//                   "lng": { "type": "number", "description": "Longitude for nearby search" },
//                   "radius": { "type": "number", "description": "Radius in meters (default 5000)" }
//                 }
//               },
//               "address": {
//                 "type": "object",
//                 "properties": {
//                   "state": { "type": "string", "description": "State for textual address search" },
//                   "district": { "type": "string", "description": "District for textual address search" },
//                   "tehsil": { "type": "string", "description": "Tehsil for textual address search" }
//                 }
//               },
//               "sort": {
//                 "type": "string",
//                 "enum": ["ratingAsc", "ratingDesc", "feesAsc", "feesDesc"],
//                 "description": "Sort order"
//               },
//               "pagination": {
//                 "type": "object",
//                 "properties": {
//                   "page": { "type": "integer", "description": "Page number (default 1)" },
//                   "limit": { "type": "integer", "description": "Number of results per page (default 10)" }
//                 }
//               }
//             },
//             "example": {
//               "type": "plumber",
//               "skills": ["pipeRepair", "gasFitting"],
//               "rating": { "min": 3 },
//               "fees": { "max": 800 },
//               "location": { "lat": 28.7041, "lng": 77.1025, "radius": 5000 },
//               "address": { "state": "Uttar Pradesh", "district": "Moradabad" },
//               "sort": "ratingDesc",
//               "pagination": { "page": 1, "limit": 20 }
//             }
//           }
//         }
//       }
//     },
//     "responses": {
//       "200": {
//         "description": "Paginated search results",
//         "content": {
//           "application/json": {
//             "schema": {
//               "type": "object",
//               "properties": {
//                 "page": { "type": "integer" },
//                 "limit": { "type": "integer" },
//                 "total": { "type": "integer" },
//                 "totalPages": { "type": "integer" },
//                 "results": {
//                   "type": "array",
//                   "items": { "$ref": "#/components/schemas/WorkerModel" }
//                 }
//               }
//             }
//           }
//         }
//       },
//       "400": { "description": "Invalid or missing parameters" },
//       "500": { "description": "Server error" }
//     },
//     "x-codeSamples": [
//       {
//         "lang": "curl",
//         "label": "Unified search - curl",
//         "source": "curl -X POST http://localhost:5000/search -H 'Content-Type: application/json' -d '{\"type\":\"plumber\",\"skills\":[\"pipeRepair\"],\"rating\":{\"min\":3},\"location\":{\"lat\":28.7041,\"lng\":77.1025,\"radius\":5000},\"address\":{\"state\":\"Uttar Pradesh\",\"district\":\"Moradabad\"}}'"
//       },
//       {
//         "lang": "http",
//         "label": "Unified search - Postman Body (JSON)",
//         "source": "{\n  \"url\": \"http://localhost:5000/search\",\n  \"method\": \"POST\",\n  \"header\": [{\"key\": \"Content-Type\", \"value\": \"application/json\"}],\n  \"body\": {\n    \"mode\": \"raw\",\n    \"raw\": \"{\\\"type\\\":\\\"plumber\\\",\\\"skills\\\":[\\\"pipeRepair\\\"],\\\"rating\\\":{\\\"min\\\":3},\\\"location\\\":{\\\"lat\\\":28.7041,\\\"lng\\\":77.1025,\\\"radius\\\":5000},\\\"address\\\":{\\\"state\\\":\\\"Uttar Pradesh\\\",\\\"district\\\":\\\"Moradabad\\\"}}\"\n  }\n}"
//       }
//     ]
//   }
// },


//     // ───────────────────────── REQUESTS ─────────────────────────
//     "/requests": {
//       post: {
//         tags: ["Requests"],
//         summary: "Create a new service request",
//         security: [{ bearerAuth: [] }],

//         requestBody: {
//           required: true,
//           content: {
//             "multipart/form-data": {
//               schema: {
//                 type: "object",
//                 properties: {
//                   type: { type: "string" },
//                   description: { type: "string" },
//                   state: { type: "string" },
//                   district: { type: "string" },
//                   tehsil: { type: "string" },
//                   useCurrentLocation: { type: "string" },
//                   location: { type: "string" },
//                   photos: {
//                     type: "array",
//                     items: { type: "string", format: "binary" },
//                   },
//                 },

//                 example: {
//                   type: "plumbing",
//                   description: "Pipe leaking",
//                   state: "Uttar Pradesh",
//                   district: "Bijnor",
//                   tehsil: "Dhampur",
//                 },
//               },
//             },
//           },
//         },

//         responses: {
//           "201": { description: "Request created" },
//           "400": { description: "Bad request" },
//           "403": { description: "Forbidden" },
//           "500": { description: "Server error" },
//         },

//         "x-codeSamples": [
//           {
//             lang: "curl",
//             label: "curl - create request",
//             source:
//               "curl -X POST 'http://localhost:5000/requests' -H 'Authorization: Bearer <TOKEN>' -F 'type=plumbing' -F 'description=Pipe leaking' -F 'photos=@/path/to/img.jpg'",
//           },
//         ],
//       },
//     },

//     "/requests/{id}/accept": {
//       post: {
//         tags: ["Requests"],
//         summary: "Worker accepts a request",
//         security: [{ bearerAuth: [] }],
//         parameters: [
//           { name: "id", in: "path", required: true, schema: { type: "string" } },
//         ],
//         responses: {
//           "200": { description: "Accepted" },
//           "400": { description: "Invalid" },
//           "403": { description: "Forbidden" },
//         },

//         "x-codeSamples": [
//           {
//             lang: "curl",
//             label: "curl - accept",
//             source:
//               "curl -X POST 'http://localhost:5000/requests/REQUEST_ID/accept' -H 'Authorization: Bearer <WORKER_TOKEN>'",
//           },
//         ],
//       },
//     },

//     "/requests/{id}/resolve": {
//       post: {
//         tags: ["Requests"],
//         summary: "Worker marks a request as resolved",
//         security: [{ bearerAuth: [] }],
//         parameters: [
//           { name: "id", in: "path", required: true, schema: { type: "string" } },
//         ],
//         requestBody: {
//           required: false,
//           content: {
//             "application/json": {
//               schema: {
//                 type: "object",
//                 properties: { notes: { type: "string" } },
//               },
//             },
//           },
//         },
//         responses: {
//           "200": { description: "Resolved" },
//           "403": { description: "Forbidden" },
//         },

//         "x-codeSamples": [
//           {
//             lang: "curl",
//             label: "curl - resolve",
//             source:
//               "curl -X POST 'http://localhost:5000/requests/REQUEST_ID/resolve' -H 'Authorization: Bearer <WORKER_TOKEN>' -H 'Content-Type: application/json' -d '{\"notes\":\"Fixed\"}'",
//           },
//         ],
//       },
//     },

//     "/requests/dashboard": {
//       get: {
//         tags: ["Requests"],
//         summary: "Get dashboard stats",
//         security: [{ bearerAuth: [] }],
//         responses: { "200": { description: "Stats" } },
//       },
//     },

//     "/requests/request/{id}": {
//       delete: {
//         tags: ["Requests"],
//         summary: "User deletes own request",
//         security: [{ bearerAuth: [] }],
//         parameters: [
//           { name: "id", in: "path", required: true, schema: { type: "string" } },
//         ],
//         responses: {
//           "200": { description: "Deleted" },
//           "403": { description: "Forbidden" },
//           "404": { description: "Not found" },
//         },
//         "x-codeSamples": [
//           {
//             lang: "curl",
//             label: "curl - delete request",
//             source:
//               "curl -X DELETE 'http://localhost:5000/requests/request/REQUEST_ID' -H 'Authorization: Bearer <TOKEN>'",
//           },
//         ],
//       },
//     },

//     // ───────────────────────── WORKER ─────────────────────────
//     "/worker/dashboard": {
//       get: {
//         tags: ["Worker"],
//         summary: "Worker dashboard",
//         security: [{ bearerAuth: [] }],
//         responses: {
//           "200": { description: "Dashboard data" },
//           "400": { description: "No location set" },
//         },
//       },
//     },

//     "/worker/delete": {
//       delete: {
//         tags: ["Worker"],
//         summary: "Delete worker account",
//         security: [{ bearerAuth: [] }],
//         responses: { "200": { description: "Worker deleted" } },
//       },
//     },

//     "/worker/skills": {
//       post: {
//         tags: ["Worker Skills"],
//         summary: "Add or update skill",
//         security: [{ bearerAuth: [] }],
//         requestBody: {
//           required: true,
//           content: {
//             "application/json": {
//               schema: {
//                 type: "object",
//                 properties: {
//                   name: { type: "string" },
//                   hourlyRate: { type: "number" },
//                 },
//                 example: { name: "Plumbing", hourlyRate: 600 },
//               },
//             },
//           },
//         },
//         responses: { "200": { description: "Skill updated" } },
//       },
//       get: {
//         tags: ["Worker Skills"],
//         summary: "Get worker skills",
//         security: [{ bearerAuth: [] }],
//         responses: { "200": { description: "List" } },
//       },
//     },

//     "/worker/skills/{name}": {
//       delete: {
//         tags: ["Worker Skills"],
//         summary: "Delete skill",
//         security: [{ bearerAuth: [] }],
//         parameters: [
//           { name: "name", in: "path", required: true, schema: { type: "string" } },
//         ],
//         responses: { "200": { description: "Removed" } },
//       },
//     },

//     "/worker/skills/availability": {
//       patch: {
//         tags: ["Worker Skills"],
//         summary: "Set availability",
//         security: [{ bearerAuth: [] }],
//         requestBody: {
//           required: true,
//           content: {
//             "application/json": {
//               schema: {
//                 type: "object",
//                 properties: { availability: { type: "boolean" } },
//                 example: { availability: true },
//               },
//             },
//           },
//         },
//         responses: { "200": { description: "Updated" } },
//       },
//     },

//     // ───────────────────────── REVIEWS ─────────────────────────
//     "/reviews/{requestId}": {
//       post: {
//         tags: ["Reviews"],
//         summary: "Create review",
//         security: [{ bearerAuth: [] }],
//         parameters: [
//           {
//             name: "requestId",
//             in: "path",
//             required: true,
//             schema: { type: "string" },
//           },
//         ],
//         requestBody: {
//           required: true,
//           content: {
//             "application/json": {
//               schema: {
//                 type: "object",
//                 properties: {
//                   rating: { type: "integer", minimum: 1, maximum: 5 },
//                   text: { type: "string" },
//                 },
//                 example: { rating: 5, text: "Very professional" },
//               },
//             },
//           },
//         },
//         responses: {
//           "201": { description: "Created" },
//           "400": { description: "Bad request" },
//         },
//       },
//     },

//     "/reviews/worker/{workerId}": {
//       get: {
//         tags: ["Reviews"],
//         summary: "List reviews for worker",
//         parameters: [
//           { name: "workerId", in: "path", required: true, schema: { type: "string" } },
//         ],
//         responses: { "200": { description: "Array of reviews" } },
//       },
//     },

//     "/reviews/{reviewId}": {
//       delete: {
//         tags: ["Reviews"],
//         summary: "Delete own review",
//         security: [{ bearerAuth: [] }],
//         parameters: [
//           {
//             name: "reviewId",
//             in: "path",
//             required: true,
//             schema: { type: "string" },
//           },
//         ],
//         responses: { "200": { description: "Deleted" } },
//       },
//     },

//     // ───────────────────────── USER ─────────────────────────
//     "/user/dashboard": {
//       get: {
//         tags: ["User"],
//         summary: "User dashboard",
//         security: [{ bearerAuth: [] }],
//         responses: { "200": { description: "User dashboard" } },
//       },
//     },

//     "/user/profile": {
//       patch: {
//         tags: ["User"],
//         summary: "Update profile",
//         security: [{ bearerAuth: [] }],
//         requestBody: {
//           required: false,
//           content: {
//             "multipart/form-data": {
//               schema: {
//                 type: "object",
//                 properties: {
//                   name: { type: "string" },
//                   photo: { type: "string", format: "binary" },
//                 },
//                 example: {
//                   name: "Ravi Updated",
//                   photo: "UPLOAD_IMAGE_FILE",
//                 },
//               },
//             },
//           },
//         },
//         responses: { "200": { description: "Profile updated" } },
//       },
//     },

//     "/user/delete": {
//       delete: {
//         tags: ["User"],
//         summary: "Delete user + cascade",
//         security: [{ bearerAuth: [] }],
//         responses: { "200": { description: "Deleted" } },
//       },
//     },

//     // ───────────────────────── HEALTH ─────────────────────────
//     "/health": {
//       get: {
//         tags: ["Health"],
//         summary: "Health check",
//         responses: { "200": { description: "OK" } },
//       },
//     },
//   },
// };
