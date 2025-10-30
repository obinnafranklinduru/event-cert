import axios from "axios";
import { API_BASE_URL } from "../utils/constants.js";
import { formatError } from "../utils/formatters.js";

/**
 * API service for backend communication using Axios.
 * This service is designed to interact with the multi-campaign certificate API.
 */
class ApiService {
  constructor(baseUrl = API_BASE_URL) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000, // 30 second timeout
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Interceptors for logging and consistent error handling
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

    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response.data; // Return response.data directly for convenience
      },
      (error) => {
        console.error("API Response Error:", error);
        if (!error.response) {
          throw new Error("Network error. Please check your connection.");
        }
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          `Request failed with status ${error.response?.status}`;
        throw new Error(formatError(new Error(errorMessage)));
      }
    );
  }

  /**
   * Fetches public details for a specific campaign.
   * @param {string | number} campaignId - The ID of the campaign.
   * @returns {Promise<Object>} The campaign details (name, times, etc.).
   */
  async getCampaignDetails(campaignId) {
    const response = await this.client.get(`/campaigns/${campaignId}`);
    if (!response.success) {
      throw new Error(response.error || "Failed to get campaign details");
    }
    return response.data;
  }

  /**
   * Gets the Merkle proof for a specific address within a campaign.
   * @param {string} address - The user's wallet address.
   * @param {string | number} campaignId - The ID of the campaign.
   * @returns {Promise<string[]>} The Merkle proof array.
   */
  async getProof(address, campaignId) {
    // UPDATED: Calls the new campaign-specific endpoint
    const response = await this.client.get(
      `/campaigns/${campaignId}/get-proof`,
      {
        params: { address },
      }
    );
    if (!response.success) {
      throw new Error(response.error || "Failed to get proof");
    }
    return response.data.proof;
  }

  /**
   * Submits a mint transaction request to the backend relayer.
   * @param {string} attendee - The user's wallet address.
   * @param {string | number} campaignId - The ID of the campaign.
   * @param {string[]} merkleProof - The Merkle proof array.
   * @returns {Promise<string>} The transaction hash.
   */
  async mintCertificate(attendee, campaignId, merkleProof) {
    // UPDATED: Calls the new campaign-specific endpoint
    const response = await this.client.post(`/campaigns/${campaignId}/mint`, {
      attendee,
      merkleProof,
    });
    if (!response.success) {
      throw new Error(response.error || "Failed to mint certificate");
    }
    return response.data.transactionHash;
  }

  /**
   * Retrieves the original transaction hash for a user who has already minted.
   * @param {string} address - The user's wallet address.
   * @param {string | number} campaignId - The ID of the campaign.
   * @returns {Promise<string>} The original transaction hash.
   */
  async getMintTransaction(address, campaignId) {
    const response = await this.client.get(`/campaigns/${campaignId}/mint`, {
      params: { address },
    });
    if (!response.success) {
      throw new Error(response.error || "Failed to find existing mint");
    }
    return response.data.transactionHash;
  }

  /**
   * Checks if the backend API is healthy.
   * @returns {Promise<boolean>} True if the API is healthy.
   */
  async healthCheck() {
    try {
      const response = await this.client.get("/health");
      return response.success === true;
    } catch (error) {
      console.warn("Health check failed:", error.message);
      return false;
    }
  }
}

// Create and export a singleton instance for use throughout the application
export const apiService = new ApiService();
export default apiService;
