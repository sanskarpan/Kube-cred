import axios from 'axios';
import { CredentialService } from '../../services/credentialService';
import { Credential } from '../../types';
import { issuanceAPI, verificationAPI } from '../../config/api';

// Mock axios
jest.mock('axios');

// Mock the API instances
jest.mock('../../config/api', () => ({
  issuanceAPI: {
    post: jest.fn(),
    get: jest.fn(),
  },
  verificationAPI: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('CredentialService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('issueCredential', () => {
    it('should issue a credential successfully', async () => {
      const mockCredential: Credential = {
        id: 'test-id',
        holder_name: 'John Doe',
        issuer: 'Test Issuer',
        issued_date: '2024-01-01T00:00:00.000Z',
        credential_type: 'certificate',
        expiry_date: '2025-01-01T00:00:00.000Z',
        signature: 'test-signature',
        worker_id: 'worker-1',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const mockResponse = {
        data: {
          success: true,
          data: mockCredential,
          message: 'Credential issued successfully'
        }
      };

      (issuanceAPI.post as jest.Mock).mockResolvedValue(mockResponse);

      const request = {
        holder_name: 'John Doe',
        credential_type: 'certificate' as const
      };

      const result = await CredentialService.issueCredential(request);

      expect(result).toEqual(mockCredential);
      expect(issuanceAPI.post).toHaveBeenCalledWith('/api/credentials', request);
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        response: {
          data: {
            success: false,
            message: 'Validation error'
          }
        }
      };

      (issuanceAPI.post as jest.Mock).mockRejectedValue(errorResponse);

      const request = {
        holder_name: '',
        credential_type: 'certificate' as const
      };

      await expect(CredentialService.issueCredential(request))
        .rejects.toThrow('Validation error');
    });
  });

  describe('verifyCredential', () => {
    it('should verify a credential successfully', async () => {
      const mockCredential: Credential = {
        id: 'test-id',
        holder_name: 'John Doe',
        issuer: 'Test Issuer',
        issued_date: '2024-01-01T00:00:00.000Z',
        credential_type: 'certificate',
        expiry_date: '2025-01-01T00:00:00.000Z',
        signature: 'test-signature',
        worker_id: 'worker-1',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const mockVerificationResult = {
        verification_id: 'verification-id',
        credential_id: 'test-id',
        is_valid: true,
        is_expired: false,
        verification_status: 'valid' as const,
        verified_by: 'worker-1',
        verified_at: '2024-01-01T00:00:00.000Z',
        issuer_worker_id: 'worker-1',
        issued_date: '2024-01-01T00:00:00.000Z'
      };

      const mockResponse = {
        data: {
          success: true,
          data: mockVerificationResult,
          message: 'Verification completed'
        }
      };

      (verificationAPI.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await CredentialService.verifyCredential(mockCredential);

      expect(result).toEqual(mockVerificationResult);
      expect(verificationAPI.post).toHaveBeenCalledWith('/api/verifications', {
        credential: mockCredential
      });
    });

    it('should handle verification errors', async () => {
      const mockCredential: Credential = {
        id: 'test-id',
        holder_name: 'John Doe',
        issuer: 'Test Issuer',
        issued_date: '2024-01-01T00:00:00.000Z',
        credential_type: 'certificate',
        expiry_date: '2025-01-01T00:00:00.000Z',
        signature: 'test-signature',
        worker_id: 'worker-1',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const errorResponse = {
        response: {
          data: {
            success: false,
            message: 'Invalid credential format'
          }
        }
      };

      (verificationAPI.post as jest.Mock).mockRejectedValue(errorResponse);

      await expect(CredentialService.verifyCredential(mockCredential))
        .rejects.toThrow('Invalid credential format');
    });
  });

  describe('health checks', () => {
    it('should check issuance service health', async () => {
      const mockResponse = {
        data: {
          success: true
        }
      };

      (issuanceAPI.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await CredentialService.checkIssuanceServiceHealth();

      expect(result).toBe(true);
      expect(issuanceAPI.get).toHaveBeenCalledWith('/health');
    });

    it('should handle health check failures', async () => {
      (issuanceAPI.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await CredentialService.checkIssuanceServiceHealth();

      expect(result).toBe(false);
    });

    it('should check verification service health', async () => {
      const mockResponse = {
        data: {
          success: true
        }
      };

      (verificationAPI.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await CredentialService.checkVerificationServiceHealth();

      expect(result).toBe(true);
      expect(verificationAPI.get).toHaveBeenCalledWith('/health');
    });
  });
});
