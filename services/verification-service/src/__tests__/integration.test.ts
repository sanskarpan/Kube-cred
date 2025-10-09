import request from 'supertest';
import { createApp } from '../app';
import { database } from '../config/database';
import { issuanceClient } from '../utils/issuanceClient';
import { CryptoUtils } from '../utils/crypto';
import fs from 'fs';
import path from 'path';

// Mock the issuance client
jest.mock('../utils/issuanceClient');

describe('Verification Service Integration Tests', () => {
  let app: any;
  const testDbPath = './data/test-verifications.db';

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.DB_PATH = testDbPath;
    process.env.JWT_SECRET = 'test-secret';
    process.env.WORKER_ID = 'test-verification-worker-1';

    // Ensure test data directory exists
    const dataDir = path.dirname(testDbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    app = await createApp();
  });

  afterAll(async () => {
    await database.close();
    
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  beforeEach(async () => {
    // Clean database before each test
    try {
      await database.run('DELETE FROM verifications');
    } catch (error) {
      // Table might not exist yet, ignore
    }
    jest.clearAllMocks();
  });

  describe('POST /api/verifications', () => {
    let validCredential: any;

    it('should verify a valid credential successfully', async () => {
      // Create a valid credential with proper signature
      const credentialData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        holder_name: 'John Doe',
        issuer: 'Kube Credential Authority',
        issued_date: '2024-01-01T00:00:00.000Z',
        credential_type: 'certificate',
        expiry_date: '2026-01-01T00:00:00.000Z',
        worker_id: 'issuer-worker-1'
      };
      
      validCredential = {
        ...credentialData,
        signature: CryptoUtils.generateCredentialSignature(credentialData),
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      // Mock issuance service response with the same credential
      (issuanceClient.getCredential as jest.Mock).mockResolvedValue(validCredential);

      const response = await request(app)
        .post('/api/verifications')
        .send({ credential: validCredential })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_valid).toBe(true);
      expect(response.body.data.verification_status).toBe('valid');
      expect(response.body.data.verified_by).toBe('test-verification-worker-1');
      expect(response.body.message).toContain('verification completed');
    });

    it('should detect invalid signature', async () => {
      // Create credential with invalid signature
      const credentialData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        holder_name: 'John Doe',
        issuer: 'Kube Credential Authority',
        issued_date: '2024-01-01T00:00:00.000Z',
        credential_type: 'certificate',
        expiry_date: '2026-01-01T00:00:00.000Z',
        worker_id: 'issuer-worker-1'
      };
      
      const validCredential = {
        ...credentialData,
        signature: CryptoUtils.generateCredentialSignature(credentialData),
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const invalidCredential = {
        ...validCredential,
        signature: 'invalid-signature'
      };

      // Mock issuance service response
      (issuanceClient.getCredential as jest.Mock).mockResolvedValue(validCredential);

      const response = await request(app)
        .post('/api/verifications')
        .send({ credential: invalidCredential })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_valid).toBe(false);
      expect(response.body.data.verification_status).toBe('signature_mismatch');
    });

    it('should detect credential not found in issuance service', async () => {
      // Create credential
      const credentialData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        holder_name: 'John Doe',
        issuer: 'Kube Credential Authority',
        issued_date: '2024-01-01T00:00:00.000Z',
        credential_type: 'certificate',
        expiry_date: '2026-01-01T00:00:00.000Z',
        worker_id: 'issuer-worker-1'
      };
      
      const validCredential = {
        ...credentialData,
        signature: CryptoUtils.generateCredentialSignature(credentialData),
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      // Mock issuance service returning null
      (issuanceClient.getCredential as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/verifications')
        .send({ credential: validCredential })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_valid).toBe(false);
      expect(response.body.data.verification_status).toBe('not_found');
    });

    it('should detect expired credentials', async () => {
      const expiredCredentialData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        holder_name: 'John Doe',
        issuer: 'Kube Credential Authority',
        issued_date: '2024-01-01T00:00:00.000Z',
        credential_type: 'certificate',
        expiry_date: '2020-01-01T00:00:00.000Z',
        worker_id: 'issuer-worker-1'
      };
      
      const expiredCredential = {
        ...expiredCredentialData,
        signature: CryptoUtils.generateCredentialSignature(expiredCredentialData),
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      // Mock issuance service response
      (issuanceClient.getCredential as jest.Mock).mockResolvedValue(expiredCredential);

      const response = await request(app)
        .post('/api/verifications')
        .send({ credential: expiredCredential })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.is_valid).toBe(false);
      expect(response.body.data.is_expired).toBe(true);
      expect(response.body.data.verification_status).toBe('expired');
    });

    it('should validate credential format', async () => {
      const invalidRequest = {
        credential: {
          id: 'test-id'
          // Missing required fields
        }
      };

      const response = await request(app)
        .post('/api/verifications')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });

    it('should handle missing credential in request', async () => {
      const response = await request(app)
        .post('/api/verifications')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('GET /api/verifications/:id', () => {
    it('should retrieve a verification by ID', async () => {
      // Create credential
      const credentialData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        holder_name: 'John Doe',
        issuer: 'Kube Credential Authority',
        issued_date: '2024-01-01T00:00:00.000Z',
        credential_type: 'certificate',
        expiry_date: '2026-01-01T00:00:00.000Z',
        worker_id: 'issuer-worker-1'
      };
      
      const validCredential = {
        ...credentialData,
        signature: CryptoUtils.generateCredentialSignature(credentialData),
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      // First create a verification
      (issuanceClient.getCredential as jest.Mock).mockResolvedValue(validCredential);

      const createResponse = await request(app)
        .post('/api/verifications')
        .send({ credential: validCredential });

      const verificationId = createResponse.body.data.verification_id;

      // Then retrieve it
      const response = await request(app)
        .get(`/api/verifications/${verificationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(verificationId);
    });

    it('should return 404 for non-existent verification', async () => {
      const response = await request(app)
        .get('/api/verifications/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /health', () => {
    it('should return healthy status with service checks', async () => {
      // Mock issuance service health check
      (issuanceClient.healthCheck as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.database).toBe('connected');
      expect(response.body.data.issuance_service).toBe('reachable');
      expect(response.body.worker_id).toBe('test-verification-worker-1');
    });

    it('should report unhealthy when issuance service is down', async () => {
      // Mock issuance service health check failure
      (issuanceClient.healthCheck as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.issuance_service).toBe('unreachable');
    });
  });
});
