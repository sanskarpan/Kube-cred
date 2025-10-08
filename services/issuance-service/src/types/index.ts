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

export interface CreateCredentialRequest {
  holder_name: string;
  credential_type: string;
  expiry_date?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  worker_id: string;
  timestamp: string;
}

export interface DatabaseCredential {
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

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  worker_id: string;
  uptime: number;
  database: 'connected' | 'disconnected';
}

