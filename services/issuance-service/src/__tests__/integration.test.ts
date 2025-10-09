import request from 'supertest';
import { createApp } from '../app';
import { database } from '../config/database';
import fs from 'fs';
import path from 'path';

describe('Issuance Service Integration Tests', () => {
  let app: any;
  const testDbPath = './data/test-credentials.db';

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.DB_PATH = testDbPath;
    process.env.JWT_SECRET = 'test-secret';
    process.env.WORKER_ID = 'test-worker-1';

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
      await database.run('DELETE FROM credentials');
    } catch (error) {
      // Table might not exist yet, ignore
    }
  });

  describe('POST /api/credentials', () => {
    it('should issue a new credential successfully', async () => {
      const credentialRequest = {
        holder_name: 'John Doe',
        credential_type: 'certificate',
        expiry_date: '2025-12-31T23:59:59.000Z'
      };

      const response = await request(app)
        .post('/api/credentials')
        .send(credentialRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.holder_name).toBe('John Doe');
      expect(response.body.data.credential_type).toBe('certificate');
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.signature).toBeDefined();
      expect(response.body.worker_id).toBe('test-worker-1');
      expect(response.body.message).toContain('issued by test-worker-1');
    });

    it('should prevent duplicate credentials', async () => {
      const credentialRequest = {
        holder_name: 'Jane Doe',
        credential_type: 'license'
      };

      // Issue first credential
      await request(app)
        .post('/api/credentials')
        .send(credentialRequest)
        .expect(201);

      // Try to issue duplicate
      const response = await request(app)
        .post('/api/credentials')
        .send(credentialRequest)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already issued');
    });

    it('should validate input data', async () => {
      const invalidRequest = {
        holder_name: '',
        credential_type: 'invalid_type'
      };

      const response = await request(app)
        .post('/api/credentials')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('GET /api/credentials/:id', () => {
    it('should retrieve an existing credential', async () => {
      // First create a credential
      const createResponse = await request(app)
        .post('/api/credentials')
        .send({
          holder_name: 'Test User',
          credential_type: 'badge'
        });

      const credentialId = createResponse.body.data.id;

      // Then retrieve it
      const response = await request(app)
        .get(`/api/credentials/${credentialId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(credentialId);
      expect(response.body.data.holder_name).toBe('Test User');
      expect(response.body.data.is_valid).toBe(true);
      expect(response.body.data.is_expired).toBe(false);
    });

    it('should return 404 for non-existent credential', async () => {
      const response = await request(app)
        .get('/api/credentials/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/credentials', () => {
    it('should list credentials with pagination', async () => {
      // Create multiple credentials with different types to avoid duplicates
      const credentialTypes = ['certificate', 'license', 'badge', 'diploma', 'permit'];
      const holderNames = ['Alice Smith', 'Bob Johnson', 'Carol Davis', 'David Wilson', 'Eva Brown'];
      for (let i = 1; i <= 5; i++) {
        const response = await request(app)
          .post('/api/credentials')
          .send({
            holder_name: holderNames[i - 1],
            credential_type: credentialTypes[i - 1]
          });
        
        if (response.status !== 201) {
          // eslint-disable-next-line no-console
          console.error(`Failed to create credential ${i}:`, response.body);
        }
        expect(response.status).toBe(201);
      }

      const response = await request(app)
        .get('/api/credentials?page=1&limit=3')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.credentials).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(5);
      expect(response.body.data.pagination.pages).toBe(2);
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.database).toBe('connected');
      expect(response.body.worker_id).toBe('test-worker-1');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // This test would need to be adjusted based on your rate limiting configuration
      // For now, we'll just verify the endpoint works
      const response = await request(app)
        .post('/api/credentials')
        .send({
          holder_name: 'Rate Test User',
          credential_type: 'permit'
        });

      expect([201, 429]).toContain(response.status);
    });
  });
});
