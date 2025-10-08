import request from 'supertest';
import { createApp } from '../app';
import { VerificationModel } from '../models/Verification';
import { issuanceClient } from '../utils/issuanceClient';

// Mock the database
jest.mock('../config/database', () => ({
  database: {
    connect: jest.fn(),
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    close: jest.fn(),
    isConnected: jest.fn(() => true)
  }
}));

// Mock the VerificationModel
jest.mock('../models/Verification');

// Mock the issuanceClient
jest.mock('../utils/issuanceClient');

describe('Verification Controller', () => {
  let app: any;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/verifications', () => {
    const mockCredential = {
      id: 'test-id',
      holder_name: 'John Doe',
      issuer: 'Kube Credential Authority',
      issued_date: '2024-01-01T00:00:00.000Z',
      credential_type: 'certificate',
      expiry_date: '2025-01-01T00:00:00.000Z',
      signature: 'test-signature',
      worker_id: 'worker-1',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };

    it('should verify a valid credential successfully', async () => {
      const mockVerificationResult = {
        id: 'verification-id',
        credential_id: 'test-id',
        is_valid: true,
        is_expired: false,
        verification_status: 'valid',
        verified_by: 'worker-1',
        verified_at: '2024-01-01T00:00:00.000Z',
        issuer_worker_id: 'worker-1',
        issued_date: '2024-01-01T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z'
      };

      (VerificationModel.verifyCredential as jest.Mock).mockResolvedValue(mockVerificationResult);

      const response = await request(app)
        .post('/api/verifications')
        .send({
          credential: mockCredential
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_valid).toBe(true);
      expect(response.body.message).toContain('verification completed');
    });

    it('should validate credential format', async () => {
      const response = await request(app)
        .post('/api/verifications')
        .send({
          credential: {
            id: 'test-id'
            // Missing required fields
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });

    it('should handle missing credential in request', async () => {
      const response = await request(app)
        .post('/api/verifications')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('GET /api/verifications/:id', () => {
    it('should retrieve a verification by ID', async () => {
      const mockVerification = {
        id: 'verification-id',
        credential_id: 'test-id',
        is_valid: true,
        verification_status: 'valid'
      };

      (VerificationModel.findById as jest.Mock).mockResolvedValue(mockVerification);

      const response = await request(app)
        .get('/api/verifications/verification-id');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('verification-id');
    });

    it('should return 404 for non-existent verification', async () => {
      (VerificationModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/verifications/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /health', () => {
    it('should return health status with service checks', async () => {
      (VerificationModel.count as jest.Mock).mockResolvedValue(3);
      (issuanceClient.healthCheck as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.issuance_service).toBe('reachable');
    });

    it('should report unhealthy status when database is down', async () => {
      (VerificationModel.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('unhealthy');
    });
  });
});

