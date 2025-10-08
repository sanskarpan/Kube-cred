export interface Credential {
  id: string;
  holder_name: string;
  issuer: string;
  issued_date: string;
  credential_type: string;
  expiry_date: string;
  signature: string;
  worker_id: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationRequest {
  credential: Credential;
}

export interface VerificationResult {
  id: string;
  credential_id: string;
  is_valid: boolean;
  is_expired: boolean;
  verification_status: 'valid' | 'invalid' | 'expired' | 'not_found' | 'signature_mismatch';
  verified_by: string;
  verified_at: string;
  issuer_worker_id?: string;
  issued_date?: string;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  worker_id: string;
  timestamp: string;
}

export interface DatabaseVerification {
  id: string;
  credential_id: string;
  is_valid: boolean;
  is_expired: boolean;
  verification_status: string;
  verified_by: string;
  verified_at: string;
  issuer_worker_id?: string;
  issued_date?: string;
  created_at: string;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  worker_id: string;
  uptime: number;
  database: 'connected' | 'disconnected';
  issuance_service: 'reachable' | 'unreachable';
}

