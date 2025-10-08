import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from './logger';
import { Credential } from '../types';

export class IssuanceServiceClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.ISSUANCE_SERVICE_URL || 'http://localhost:3001';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`Making request to issuance service: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.info(`Received response from issuance service: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('Response interceptor error:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get credential by ID from issuance service
   */
  async getCredential(credentialId: string): Promise<Credential | null> {
    try {
      const response: AxiosResponse = await this.client.get(`/api/credentials/${credentialId}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data as Credential;
      }
      
      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.info(`Credential not found in issuance service: ${credentialId}`);
        return null;
      }
      
      logger.error('Error fetching credential from issuance service:', {
        credentialId,
        error: error.message,
        status: error.response?.status
      });
      
      throw new Error(`Failed to fetch credential from issuance service: ${error.message}`);
    }
  }

  /**
   * Health check for issuance service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response: AxiosResponse = await this.client.get('/health');
      return response.data.success === true;
    } catch (error: any) {
      logger.error('Issuance service health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get service info
   */
  async getServiceInfo(): Promise<any> {
    try {
      const response: AxiosResponse = await this.client.get('/');
      return response.data;
    } catch (error: any) {
      logger.error('Error getting issuance service info:', error.message);
      throw error;
    }
  }
}

export const issuanceClient = new IssuanceServiceClient();

