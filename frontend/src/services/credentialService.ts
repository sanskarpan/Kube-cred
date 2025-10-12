import { AxiosResponse } from 'axios';
import { issuanceAPI, verificationAPI } from '../config/api';
import { 
  Credential, 
  CreateCredentialRequest, 
  VerificationRequest, 
  VerificationResult, 
  ApiResponse 
} from '../types';

export class CredentialService {
  /**
   * Issue a new credential
   */
  static async issueCredential(request: CreateCredentialRequest): Promise<Credential> {
    try {
      // Remove empty expiry_date if present
      const payload: any = {
        holder_name: request.holder_name,
        credential_type: request.credential_type
      };
      
      if (request.expiry_date && request.expiry_date.trim() !== '') {
        payload.expiry_date = request.expiry_date;
      }
      
      const response: AxiosResponse<ApiResponse<Credential>> = await issuanceAPI.post(
        '/api/credentials',
        payload
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return response.data.data!;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to issue credential';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get credential by ID
   */
  static async getCredential(id: string): Promise<Credential> {
    try {
      const response: AxiosResponse<ApiResponse<Credential>> = await issuanceAPI.get(
        `/api/credentials/${id}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return response.data.data!;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get credential';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all credentials with pagination
   */
  static async getAllCredentials(page: number = 1, limit: number = 10): Promise<{
    credentials: Credential[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response: AxiosResponse<ApiResponse> = await issuanceAPI.get(
        `/api/credentials?page=${page}&limit=${limit}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return response.data.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get credentials';
      throw new Error(errorMessage);
    }
  }

  /**
   * Verify a credential
   */
  static async verifyCredential(credential: Credential): Promise<VerificationResult> {
    try {
      const request: VerificationRequest = { credential };
      
      const response: AxiosResponse<ApiResponse<VerificationResult>> = await verificationAPI.post(
        '/api/verifications',
        request
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return response.data.data!;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to verify credential';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get verification by ID
   */
  static async getVerification(id: string): Promise<VerificationResult> {
    try {
      const response: AxiosResponse<ApiResponse<VerificationResult>> = await verificationAPI.get(
        `/api/verifications/${id}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return response.data.data!;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get verification';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get verifications by credential ID
   */
  static async getVerificationsByCredentialId(credentialId: string): Promise<{
    credential_id: string;
    verifications: VerificationResult[];
    count: number;
  }> {
    try {
      const response: AxiosResponse<ApiResponse> = await verificationAPI.get(
        `/api/verifications/credential/${credentialId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return response.data.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get verifications';
      throw new Error(errorMessage);
    }
  }

  /**
   * Health check for issuance service
   */
  static async checkIssuanceServiceHealth(): Promise<boolean> {
    try {
      const response: AxiosResponse<ApiResponse> = await issuanceAPI.get('/health');
      return response.data.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Health check for verification service
   */
  static async checkVerificationServiceHealth(): Promise<boolean> {
    try {
      const response: AxiosResponse<ApiResponse> = await verificationAPI.get('/health');
      return response.data.success;
    } catch (error) {
      return false;
    }
  }
}
