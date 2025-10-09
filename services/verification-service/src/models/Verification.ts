import { v4 as uuidv4 } from 'uuid';
import { database } from '../config/database';
import { VerificationResult, Credential, DatabaseVerification } from '../types';
import { CryptoUtils } from '../utils/crypto';
import { issuanceClient } from '../utils/issuanceClient';
import { logger } from '../utils/logger';

export class VerificationModel {
  /**
   * Verify a credential
   */
  static async verifyCredential(credential: Credential): Promise<VerificationResult> {
    const now = new Date().toISOString();
    const workerId = process.env.WORKER_ID || `worker-${Math.floor(Math.random() * 1000)}`;
    
    let verificationStatus: 'valid' | 'invalid' | 'expired' | 'not_found' | 'signature_mismatch' = 'invalid';
    let isValid = false;
    let isExpired = false;
    let issuerWorkerId: string | undefined;
    let issuedDate: string | undefined;

    try {
      // First, verify the signature
      const signatureValid = CryptoUtils.verifyCredentialSignature(credential);
      
      if (!signatureValid) {
        verificationStatus = 'signature_mismatch';
        logger.warn(`Signature verification failed for credential: ${credential.id}`);
      } else {
        // Check if credential exists in issuance service
        const issuedCredential = await issuanceClient.getCredential(credential.id);
        
        if (!issuedCredential) {
          verificationStatus = 'not_found';
          logger.warn(`Credential not found in issuance service: ${credential.id}`);
        } else {
          // Verify all fields match
          const fieldsMatch = this.compareCredentials(credential, issuedCredential);
          
          if (!fieldsMatch) {
            verificationStatus = 'invalid';
            logger.warn(`Credential fields do not match issued credential: ${credential.id}`);
          } else {
            // Check if expired
            isExpired = new Date(credential.expiry_date) < new Date();
            issuerWorkerId = issuedCredential.worker_id;
            issuedDate = issuedCredential.issued_date;
            
            if (isExpired) {
              verificationStatus = 'expired';
              logger.info(`Credential is expired: ${credential.id}`);
            } else {
              verificationStatus = 'valid';
              isValid = true;
              logger.info(`Credential verified successfully: ${credential.id}`);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error during credential verification:', error);
      verificationStatus = 'invalid';
    }

    // Create verification record
    const verification: VerificationResult = {
      id: uuidv4(),
      credential_id: credential.id,
      is_valid: isValid,
      is_expired: isExpired,
      verification_status: verificationStatus,
      verified_by: workerId,
      verified_at: now,
      ...(issuerWorkerId && { issuer_worker_id: issuerWorkerId }),
      ...(issuedDate && { issued_date: issuedDate }),
      created_at: now
    };

    // Save verification record to database
    await this.saveVerification(verification);

    return verification;
  }

  /**
   * Compare two credentials for equality
   */
  private static compareCredentials(credential1: Credential, credential2: Credential): boolean {
    return (
      credential1.id === credential2.id &&
      credential1.holder_name === credential2.holder_name &&
      credential1.issuer === credential2.issuer &&
      credential1.issued_date === credential2.issued_date &&
      credential1.credential_type === credential2.credential_type &&
      credential1.expiry_date === credential2.expiry_date &&
      credential1.signature === credential2.signature
    );
  }

  /**
   * Save verification record to database
   */
  private static async saveVerification(verification: VerificationResult): Promise<void> {
    const insertQuery = `
      INSERT INTO verifications (
        id, credential_id, is_valid, is_expired, verification_status,
        verified_by, verified_at, issuer_worker_id, issued_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      verification.id,
      verification.credential_id,
      verification.is_valid ? 1 : 0,
      verification.is_expired ? 1 : 0,
      verification.verification_status,
      verification.verified_by,
      verification.verified_at,
      verification.issuer_worker_id,
      verification.issued_date,
      verification.created_at
    ];

    try {
      await database.run(insertQuery, params);
      logger.info(`Verification record saved: ${verification.id}`);
    } catch (error) {
      logger.error('Error saving verification record:', error);
      throw new Error('Failed to save verification record');
    }
  }

  /**
   * Get verification by ID
   */
  static async findById(id: string): Promise<VerificationResult | null> {
    try {
      const query = 'SELECT * FROM verifications WHERE id = ?';
      const result = await database.get<DatabaseVerification>(query, [id]);
      
      if (!result) {
        return null;
      }

      return {
        ...result,
        is_valid: Boolean(result.is_valid),
        is_expired: Boolean(result.is_expired)
      } as VerificationResult;
    } catch (error) {
      logger.error('Error finding verification by ID:', error);
      throw new Error('Failed to find verification');
    }
  }

  /**
   * Get verifications by credential ID
   */
  static async findByCredentialId(credentialId: string): Promise<VerificationResult[]> {
    try {
      const query = 'SELECT * FROM verifications WHERE credential_id = ? ORDER BY created_at DESC';
      const results = await database.all<DatabaseVerification>(query, [credentialId]);
      
      return results.map(result => ({
        ...result,
        is_valid: Boolean(result.is_valid),
        is_expired: Boolean(result.is_expired)
      })) as VerificationResult[];
    } catch (error) {
      logger.error('Error finding verifications by credential ID:', error);
      throw new Error('Failed to find verifications');
    }
  }

  /**
   * Get all verifications with pagination
   */
  static async findAll(limit: number = 50, offset: number = 0): Promise<VerificationResult[]> {
    try {
      const query = 'SELECT * FROM verifications ORDER BY created_at DESC LIMIT ? OFFSET ?';
      const results = await database.all<DatabaseVerification>(query, [limit, offset]);
      
      return results.map(result => ({
        ...result,
        is_valid: Boolean(result.is_valid),
        is_expired: Boolean(result.is_expired)
      })) as VerificationResult[];
    } catch (error) {
      logger.error('Error finding all verifications:', error);
      throw new Error('Failed to retrieve verifications');
    }
  }

  /**
   * Get verifications count
   */
  static async count(): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM verifications';
      const result = await database.get<{ count: number }>(query);
      
      return result?.count || 0;
    } catch (error) {
      logger.error('Error counting verifications:', error);
      throw new Error('Failed to count verifications');
    }
  }
}

