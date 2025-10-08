import crypto from 'crypto';
import { Credential } from '../types';

export class CryptoUtils {
  /**
   * Generate a secure signature for a credential
   */
  static generateCredentialSignature(credential: Omit<Credential, 'signature' | 'created_at' | 'updated_at'>): string {
    const data = JSON.stringify({
      id: credential.id,
      holder_name: credential.holder_name,
      issuer: credential.issuer,
      issued_date: credential.issued_date,
      credential_type: credential.credential_type,
      expiry_date: credential.expiry_date,
      worker_id: credential.worker_id
    });
    
    return crypto
      .createHash('sha256')
      .update(data + (process.env.JWT_SECRET || 'default-secret'))
      .digest('hex');
  }

  /**
   * Verify a credential signature
   */
  static verifyCredentialSignature(credential: Credential): boolean {
    const expectedSignature = this.generateCredentialSignature({
      id: credential.id,
      holder_name: credential.holder_name,
      issuer: credential.issuer,
      issued_date: credential.issued_date,
      credential_type: credential.credential_type,
      expiry_date: credential.expiry_date,
      worker_id: credential.worker_id
    });
    
    return expectedSignature === credential.signature;
  }

  /**
   * Generate a secure random ID
   */
  static generateSecureId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Hash sensitive data
   */
  static hashData(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
}

