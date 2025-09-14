import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: window.location.origin,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging and auth
api.interceptors.request.use(
  (config) => {
    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("❌ API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    console.log(
      `✅ API Response: ${response.config.method?.toUpperCase()} ${
        response.config.url
      }`,
      response.status
    );
    return response;
  },
  (error) => {
    console.error(
      "❌ API Response Error:",
      error.response?.status,
      error.response?.data
    );

    // Handle common errors
    if (error.response?.status === 404) {
      throw new Error("Resource not found");
    } else if (error.response?.status === 500) {
      throw new Error("Server error. Please try again later.");
    } else if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout. Please check your connection.");
    } else if (!error.response) {
      throw new Error("Network error. Please check your connection.");
    }

    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Get Merkle proof for address
  getProof: async (address) => {
    if (!address) {
      throw new Error("Address is required");
    }

    const response = await api.get(`/api/get-proof?address=${address}`);
    return response.data;
  },

  // Mint certificate
  mint: async ({ attendee, merkleProof }) => {
    if (!attendee || !merkleProof) {
      throw new Error("Attendee address and Merkle proof are required");
    }

    const response = await api.post("/api/mint", {
      attendee,
      merkleProof,
    });
    return response.data;
  },
};

export default api;
