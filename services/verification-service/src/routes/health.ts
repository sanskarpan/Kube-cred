import { Router } from 'express';
import { VerificationController } from '../controllers/verificationController';

const router = Router();

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', VerificationController.healthCheck);

export default router;

