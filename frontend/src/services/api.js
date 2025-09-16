import axios from "axios";
import { API_BASE_URL } from "../utils/constants.js";
import { formatError } from "../utils/formatters.js";

/**
 * API service for backend communication using Axios
 */
class ApiService {
  constructor(baseUrl = API_BASE_URL) {
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000, // 30 second timeout
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error("API Request Error:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error("API Response Error:", error);

        // Handle network errors
        if (!error.response) {
          throw new Error("Network error. Please check your connection.");
        }

        // Handle HTTP errors
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          `HTTP ${error.response?.status}`;

        throw new Error(formatError(new Error(errorMessage)));
      }
    );
  }

  /**
   * Make a GET request
   * @param {string} endpoint
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async get(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw new Error(formatError(error));
    }
  }

  /**
   * Make a POST request
   * @param {string} endpoint
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async post(endpoint, data = {}) {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw new Error(formatError(error));
    }
  }

  /**
   * Make a PUT request
   * @param {string} endpoint
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async put(endpoint, data = {}) {
    try {
      const response = await this.client.put(endpoint, data);
      return response.data;
    } catch (error) {
      throw new Error(formatError(error));
    }
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint
   * @returns {Promise<Object>}
   */
  async delete(endpoint) {
    try {
      const response = await this.client.delete(endpoint);
      return response.data;
    } catch (error) {
      throw new Error(formatError(error));
    }
  }

  /**
   * Get Merkle proof for an address
   * @param {string} address - Wallet address
   * @returns {Promise<string[]>} Merkle proof array
   */
  async getProof(address) {
    const response = await this.get("/get-proof", { address });

    if (!response.success) {
      throw new Error(response.error || "Failed to get proof");
    }

    return response.data.proof;
  }

  /**
   * Submit mint transaction
   * @param {string} attendee - Wallet address
   * @param {string[]} merkleProof - Merkle proof array
   * @returns {Promise<string>} Transaction hash
   */
  async mintCertificate(attendee, merkleProof) {
    const response = await this.post("/mint", {
      attendee,
      merkleProof,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to mint certificate");
    }

    return response.data.transactionHash;
  }

  /**
   * Check if address has already claimed
   * @param {string} address - Wallet address
   * @returns {Promise<boolean>} True if already claimed
   */
  async hasClaimedCertificate(address) {
    try {
      // This would be an additional endpoint on your backend
      const response = await this.get("/has-claimed", { address });
      return response.data.hasClaimed;
    } catch (error) {
      // If endpoint doesn't exist, return false and let mint call handle it
      console.warn("Has claimed endpoint not available:", error.message);
      return false;
    }
  }

  /**
   * Get contract information
   * @returns {Promise<Object>} Contract info (address, network, etc.)
   */
  async getContractInfo() {
    try {
      const response = await this.get("/contract-info");
      return response.data;
    } catch (error) {
      console.warn("Contract info endpoint not available:", error.message);
      return null;
    }
  }

  /**
   * Health check endpoint
   * @returns {Promise<boolean>} True if API is healthy
   */
  async healthCheck() {
    try {
      const response = await this.get("/health");
      return response.success === true;
    } catch (error) {
      console.warn("Health check failed:", error.message);
      return false;
    }
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
