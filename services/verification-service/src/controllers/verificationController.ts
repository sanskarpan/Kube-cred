import { Request, Response } from 'express';
import Joi from 'joi';
import { VerificationModel } from '../models/Verification';
import { ApiResponse, VerificationRequest, Credential } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { issuanceClient } from '../utils/issuanceClient';
import { logger } from '../utils/logger';

// Validation schema for credential verification
const credentialSchema = Joi.object({
  id: Joi.string().uuid().required(),
  holder_name: Joi.string().min(2).max(100).required(),
  issuer: Joi.string().required(),
  issued_date: Joi.string().isoDate().required(),
  credential_type: Joi.string().valid('certificate', 'license', 'badge', 'diploma', 'permit', 'qualification').required(),
  expiry_date: Joi.string().isoDate().required(),
  signature: Joi.string().required(),
  worker_id: Joi.string().required(),
  created_at: Joi.string().isoDate().required(),
  updated_at: Joi.string().isoDate().required()
});

const verificationRequestSchema = Joi.object({
  credential: credentialSchema.required()
});

export class VerificationController {
  /**
   * Verify a credential
   */
  static verifyCredential = asyncHandler(async (req: Request, res: Response) => {
    const workerId = process.env.WORKER_ID || `worker-${Math.floor(Math.random() * 1000)}`;
    
    // Validate request body
    const { error, value } = verificationRequestSchema.validate(req.body);
    
    if (error) {
      const response: ApiResponse = {
        success: false,
        message: `Validation error: ${error.details.map(d => d.message).join(', ')}`,
        worker_id: workerId,
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    const verificationRequest: VerificationRequest = value;
    const credential: Credential = verificationRequest.credential;

    try {
      // Perform verification
      const verificationResult = await VerificationModel.verifyCredential(credential);

      const response: ApiResponse = {
        success: true,
        message: `Credential verification completed by ${workerId}`,
        data: {
          verification_id: verificationResult.id,
          credential_id: verificationResult.credential_id,
          is_valid: verificationResult.is_valid,
          is_expired: verificationResult.is_expired,
          verification_status: verificationResult.verification_status,
          verified_by: verificationResult.verified_by,
          verified_at: verificationResult.verified_at,
          issuer_worker_id: verificationResult.issuer_worker_id,
          issued_date: verificationResult.issued_date
        },
        worker_id: workerId,
        timestamp: new Date().toISOString()
      };

      logger.info(`Credential verification completed`, {
        credentialId: credential.id,
        verificationId: verificationResult.id,
        isValid: verificationResult.is_valid,
        status: verificationResult.verification_status,
        workerId
      });

      res.json(response);
    } catch (error) {
      logger.error('Error verifying credential:', error);
      throw new AppError('Failed to verify credential', 500);
    }
  });

  /**
   * Get verification by ID
   */
  static getVerification = asyncHandler(async (req: Request, res: Response) => {
    const workerId = process.env.WORKER_ID || 'unknown-worker';
    const { id } = req.params;

    if (!id) {
      throw new AppError('Verification ID is required', 400);
    }

    try {
      const verification = await VerificationModel.findById(id);

      if (!verification) {
        const response: ApiResponse = {
          success: false,
          message: 'Verification not found',
          worker_id: workerId,
          timestamp: new Date().toISOString()
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Verification retrieved successfully',
        data: verification,
        worker_id: workerId,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error retrieving verification:', error);
      throw new AppError('Failed to retrieve verification', 500);
    }
  });

  /**
   * Get verifications by credential ID
   */
  static getVerificationsByCredentialId = asyncHandler(async (req: Request, res: Response) => {
    const workerId = process.env.WORKER_ID || 'unknown-worker';
    const { credentialId } = req.params;

    if (!credentialId) {
      throw new AppError('Credential ID is required', 400);
    }

    try {
      const verifications = await VerificationModel.findByCredentialId(credentialId);

      const response: ApiResponse = {
        success: true,
        message: 'Verifications retrieved successfully',
        data: {
          credential_id: credentialId,
          verifications,
          count: verifications.length
        },
        worker_id: workerId,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error retrieving verifications by credential ID:', error);
      throw new AppError('Failed to retrieve verifications', 500);
    }
  });

  /**
   * Get all verifications with pagination
   */
  static getAllVerifications = asyncHandler(async (req: Request, res: Response) => {
    const workerId = process.env.WORKER_ID || 'unknown-worker';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    try {
      const [verifications, total] = await Promise.all([
        VerificationModel.findAll(limit, offset),
        VerificationModel.count()
      ]);

      const response: ApiResponse = {
        success: true,
        message: 'Verifications retrieved successfully',
        data: {
          verifications,
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
      logger.error('Error retrieving verifications:', error);
      throw new AppError('Failed to retrieve verifications', 500);
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
      await VerificationModel.count();
      
      // Test issuance service connection
      const issuanceServiceHealthy = await issuanceClient.healthCheck();
      
      const response: ApiResponse = {
        success: true,
        message: 'Service is healthy',
        data: {
          status: 'healthy',
          uptime: Math.floor(uptime),
          database: 'connected',
          issuance_service: issuanceServiceHealthy ? 'reachable' : 'unreachable',
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
          issuance_service: 'unknown',
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

