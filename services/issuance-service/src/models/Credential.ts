import { v4 as uuidv4 } from 'uuid';
import { database } from '../config/database';
import { Credential, CreateCredentialRequest, DatabaseCredential } from '../types';
import { CryptoUtils } from '../utils/crypto';
import { logger } from '../utils/logger';

export class CredentialModel {
  /**
   * Create a new credential
   */
  static async create(request: CreateCredentialRequest): Promise<Credential> {
    const now = new Date().toISOString();
    const workerId = process.env.WORKER_ID || `worker-${Math.floor(Math.random() * 1000)}`;
    
    // Set default expiry date to 1 year from now if not provided
    const expiryDate = request.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    
    const credentialData: Omit<Credential, 'signature' | 'created_at' | 'updated_at'> = {
      id: uuidv4(),
      holder_name: request.holder_name,
      issuer: 'Kube Credential Authority',
      issued_date: now,
      credential_type: request.credential_type,
      expiry_date: expiryDate,
      worker_id: workerId
    };

    // Generate signature
    const signature = CryptoUtils.generateCredentialSignature(credentialData);

    const credential: Credential = {
      ...credentialData,
      signature,
      created_at: now,
      updated_at: now
    };

    // Insert into database
    const insertQuery = `
      INSERT INTO credentials (
        id, holder_name, issuer, issued_date, credential_type, 
        expiry_date, signature, worker_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      credential.id,
      credential.holder_name,
      credential.issuer,
      credential.issued_date,
      credential.credential_type,
      credential.expiry_date,
      credential.signature,
      credential.worker_id,
      credential.created_at,
      credential.updated_at
    ];

    try {
      await database.run(insertQuery, params);
      logger.info(`Credential created successfully: ${credential.id}`, { 
        credentialId: credential.id,
        workerId: credential.worker_id 
      });
      return credential;
    } catch (error) {
      logger.error('Error creating credential:', error);
      throw new Error('Failed to create credential');
    }
  }

  /**
   * Find credential by ID
   */
  static async findById(id: string): Promise<Credential | null> {
    try {
      const query = 'SELECT * FROM credentials WHERE id = ?';
      const result = await database.get<DatabaseCredential>(query, [id]);
      
      if (!result) {
        return null;
      }

      return result as Credential;
    } catch (error) {
      logger.error('Error finding credential by ID:', error);
      throw new Error('Failed to find credential');
    }
  }

  /**
   * Find credential by holder name and type (to check for duplicates)
   */
  static async findByHolderAndType(holderName: string, credentialType: string): Promise<Credential | null> {
    try {
      const query = 'SELECT * FROM credentials WHERE holder_name = ? AND credential_type = ?';
      const result = await database.get<DatabaseCredential>(query, [holderName, credentialType]);
      
      if (!result) {
        return null;
      }

      return result as Credential;
    } catch (error) {
      logger.error('Error finding credential by holder and type:', error);
      throw new Error('Failed to find credential');
    }
  }

  /**
   * Get all credentials (with pagination)
   */
  static async findAll(limit: number = 50, offset: number = 0): Promise<Credential[]> {
    try {
      const query = 'SELECT * FROM credentials ORDER BY created_at DESC LIMIT ? OFFSET ?';
      const results = await database.all<DatabaseCredential>(query, [limit, offset]);
      
      return results as Credential[];
    } catch (error) {
      logger.error('Error finding all credentials:', error);
      throw new Error('Failed to retrieve credentials');
    }
  }

  /**
   * Get credentials count
   */
  static async count(): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM credentials';
      const result = await database.get<{ count: number }>(query);
      
      return result?.count || 0;
    } catch (error) {
      logger.error('Error counting credentials:', error);
      throw new Error('Failed to count credentials');
    }
  }

  /**
   * Verify credential integrity
   */
  static verifyCredential(credential: Credential): boolean {
    return CryptoUtils.verifyCredentialSignature(credential);
  }

  /**
   * Check if credential is expired
   */
  static isExpired(credential: Credential): boolean {
    return new Date(credential.expiry_date) < new Date();
  }
}
