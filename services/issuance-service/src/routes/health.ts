import { Router } from 'express';
import { CredentialController } from '../controllers/credentialController';

const router = Router();

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', CredentialController.healthCheck);

export default router;

