import { Request, Response } from 'express';
import { CredentialModel } from '../models/Credential';
import { validateCredentialRequest } from '../utils/validation';
import { ApiResponse, CreateCredentialRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class CredentialController {
  /**
   * Issue a new credential
   */
  static issueCredential = asyncHandler(async (req: Request, res: Response) => {
    const workerId = process.env.WORKER_ID || `worker-${Math.floor(Math.random() * 1000)}`;
    
    // Validate request body
    const { error, value } = validateCredentialRequest(req.body);
    
    if (error) {
      const response: ApiResponse = {
        success: false,
        message: `Validation error: ${error.details.map(d => d.message).join(', ')}`,
        worker_id: workerId,
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    const credentialRequest: CreateCredentialRequest = value;

    try {
      // Check if credential already exists for this holder and type
      const existingCredential = await CredentialModel.findByHolderAndType(
        credentialRequest.holder_name,
        credentialRequest.credential_type
      );

      if (existingCredential) {
        const response: ApiResponse = {
          success: false,
          message: `Credential of type '${credentialRequest.credential_type}' already issued for ${credentialRequest.holder_name}`,
          data: {
            existing_credential_id: existingCredential.id,
            issued_date: existingCredential.issued_date,
            issued_by: existingCredential.worker_id
          },
          worker_id: workerId,
          timestamp: new Date().toISOString()
        };
        return res.status(409).json(response);
      }

      // Create new credential
      const credential = await CredentialModel.create(credentialRequest);

      const response: ApiResponse = {
        success: true,
        message: `Credential issued by ${workerId}`,
        data: credential,
        worker_id: workerId,
        timestamp: new Date().toISOString()
      };

      logger.info(`Credential issued successfully`, {
        credentialId: credential.id,
        holderName: credential.holder_name,
        workerId
      });

      res.status(201).json(response);
    } catch (error) {
      logger.error('Error issuing credential:', error);
      throw new AppError('Failed to issue credential', 500);
    }
  });

  /**
   * Get credential by ID
   */
  static getCredential = asyncHandler(async (req: Request, res: Response) => {
    const workerId = process.env.WORKER_ID || 'unknown-worker';
    const { id } = req.params;

    if (!id) {
      throw new AppError('Credential ID is required', 400);
    }

    try {
      const credential = await CredentialModel.findById(id);

      if (!credential) {
        const response: ApiResponse = {
          success: false,
          message: 'Credential not found',
          worker_id: workerId,
          timestamp: new Date().toISOString()
        };
        return res.status(404).json(response);
      }

      // Verify credential integrity
      const isValid = CredentialModel.verifyCredential(credential);
      const isExpired = CredentialModel.isExpired(credential);

      const response: ApiResponse = {
        success: true,
        message: 'Credential retrieved successfully',
        data: {
          ...credential,
          is_valid: isValid,
          is_expired: isExpired
        },
        worker_id: workerId,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error retrieving credential:', error);
      throw new AppError('Failed to retrieve credential', 500);
    }
  });

  /**
   * Get all credentials with pagination
   */
  static getAllCredentials = asyncHandler(async (req: Request, res: Response) => {
    const workerId = process.env.WORKER_ID || 'unknown-worker';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    try {
      const [credentials, total] = await Promise.all([
        CredentialModel.findAll(limit, offset),
        CredentialModel.count()
      ]);

      const response: ApiResponse = {
        success: true,
        message: 'Credentials retrieved successfully',
        data: {
          credentials,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        },
        worker_id: workerId,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error retrieving credentials:', error);
      throw new AppError('Failed to retrieve credentials', 500);
    }
  });

  /**
   * Health check endpoint
   */
  static healthCheck = asyncHandler(async (req: Request, res: Response) => {
    const workerId = process.env.WORKER_ID || 'unknown-worker';
    const uptime = process.uptime();

    try {
      // Test database connection
      await CredentialModel.count();
      
      const response: ApiResponse = {
        success: true,
        message: 'Service is healthy',
        data: {
          status: 'healthy',
          uptime: Math.floor(uptime),
          database: 'connected',
          worker_id: workerId,
          timestamp: new Date().toISOString()
        },
        worker_id: workerId,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: 'Service is unhealthy',
        data: {
          status: 'unhealthy',
          uptime: Math.floor(uptime),
          database: 'disconnected',
          worker_id: workerId,
          timestamp: new Date().toISOString()
        },
        worker_id: workerId,
        timestamp: new Date().toISOString()
      };

      res.status(503).json(response);
    }
  });
}
