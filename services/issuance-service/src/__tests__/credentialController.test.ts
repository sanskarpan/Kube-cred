import request from 'supertest';
import { createApp } from '../app';
import { CredentialModel } from '../models/Credential';

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

// Mock the CredentialModel
jest.mock('../models/Credential');

describe('Credential Controller', () => {
  let app: any;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/credentials', () => {
    it('should issue a new credential successfully', async () => {
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

      (CredentialModel.findByHolderAndType as jest.Mock).mockResolvedValue(null);
      (CredentialModel.create as jest.Mock).mockResolvedValue(mockCredential);

      const response = await request(app)
        .post('/api/credentials')
        .send({
          holder_name: 'John Doe',
          credential_type: 'certificate'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCredential);
      expect(response.body.message).toContain('issued by');
    });

    it('should reject duplicate credential', async () => {
      const existingCredential = {
        id: 'existing-id',
        holder_name: 'John Doe',
        credential_type: 'certificate'
      };

      (CredentialModel.findByHolderAndType as jest.Mock).mockResolvedValue(existingCredential);

      const response = await request(app)
        .post('/api/credentials')
        .send({
          holder_name: 'John Doe',
          credential_type: 'certificate'
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already issued');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/credentials')
        .send({
          holder_name: '',
          credential_type: 'invalid_type'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('GET /api/credentials/:id', () => {
    it('should retrieve a credential by ID', async () => {
      const mockCredential = {
        id: 'test-id',
        holder_name: 'John Doe',
        credential_type: 'certificate'
      };

      (CredentialModel.findById as jest.Mock).mockResolvedValue(mockCredential);
      (CredentialModel.verifyCredential as jest.Mock).mockReturnValue(true);
      (CredentialModel.isExpired as jest.Mock).mockReturnValue(false);

      const response = await request(app)
        .get('/api/credentials/test-id');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('test-id');
    });

    it('should return 404 for non-existent credential', async () => {
      (CredentialModel.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/credentials/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      (CredentialModel.count as jest.Mock).mockResolvedValue(5);

      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
    });
  });
});

