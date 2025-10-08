import { Router } from 'express';
import { CredentialController } from '../controllers/credentialController';

const router = Router();

/**
 * @route   POST /api/credentials
 * @desc    Issue a new credential
 * @access  Public
 */
router.post('/', CredentialController.issueCredential);

/**
 * @route   GET /api/credentials/:id
 * @desc    Get credential by ID
 * @access  Public
 */
router.get('/:id', CredentialController.getCredential);

/**
 * @route   GET /api/credentials
 * @desc    Get all credentials with pagination
 * @access  Public
 */
router.get('/', CredentialController.getAllCredentials);

export default router;

