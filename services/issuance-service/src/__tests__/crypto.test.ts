import { CryptoUtils } from '../utils/crypto';
import { Credential } from '../types';

describe('CryptoUtils', () => {
  const mockCredential = {
    id: 'test-id',
    holder_name: 'John Doe',
    issuer: 'Test Issuer',
    issued_date: '2024-01-01T00:00:00.000Z',
    credential_type: 'certificate',
    expiry_date: '2025-01-01T00:00:00.000Z',
    worker_id: 'worker-1'
  };

  describe('generateCredentialSignature', () => {
    it('should generate a consistent signature for the same input', () => {
      const signature1 = CryptoUtils.generateCredentialSignature(mockCredential);
      const signature2 = CryptoUtils.generateCredentialSignature(mockCredential);
      
      expect(signature1).toBe(signature2);
      expect(signature1).toHaveLength(64); // SHA256 hex string length
    });

    it('should generate different signatures for different inputs', () => {
      const credential2 = { ...mockCredential, holder_name: 'Jane Doe' };
      
      const signature1 = CryptoUtils.generateCredentialSignature(mockCredential);
      const signature2 = CryptoUtils.generateCredentialSignature(credential2);
      
      expect(signature1).not.toBe(signature2);
    });
  });

  describe('verifyCredentialSignature', () => {
    it('should verify a valid signature', () => {
      const signature = CryptoUtils.generateCredentialSignature(mockCredential);
      const fullCredential: Credential = {
        ...mockCredential,
        signature,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const isValid = CryptoUtils.verifyCredentialSignature(fullCredential);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid signature', () => {
      const fullCredential: Credential = {
        ...mockCredential,
        signature: 'invalid-signature',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const isValid = CryptoUtils.verifyCredentialSignature(fullCredential);
      expect(isValid).toBe(false);
    });
  });

  describe('generateSecureId', () => {
    it('should generate unique IDs', () => {
      const id1 = CryptoUtils.generateSecureId();
      const id2 = CryptoUtils.generateSecureId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toHaveLength(32); // 16 bytes as hex string
    });
  });

  describe('hashData', () => {
    it('should hash data consistently', () => {
      const data = 'test data';
      const hash1 = CryptoUtils.hashData(data);
      const hash2 = CryptoUtils.hashData(data);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 hex string length
    });
  });
});

