import { Router } from 'express';
import { VerificationController } from '../controllers/verificationController';

const router = Router();

/**
 * @route   POST /api/verifications
 * @desc    Verify a credential
 * @access  Public
 */
router.post('/', VerificationController.verifyCredential);

/**
 * @route   GET /api/verifications/:id
 * @desc    Get verification by ID
 * @access  Public
 */
router.get('/:id', VerificationController.getVerification);

/**
 * @route   GET /api/verifications/credential/:credentialId
 * @desc    Get verifications by credential ID
 * @access  Public
 */
router.get('/credential/:credentialId', VerificationController.getVerificationsByCredentialId);

/**
 * @route   GET /api/verifications
 * @desc    Get all verifications with pagination
 * @access  Public
 */
router.get('/', VerificationController.getAllVerifications);

export default router;

