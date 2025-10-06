import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_CONFIG = {
  ISSUANCE_SERVICE_URL: process.env.REACT_APP_ISSUANCE_SERVICE_URL || 'http://localhost:3001',
  VERIFICATION_SERVICE_URL: process.env.REACT_APP_VERIFICATION_SERVICE_URL || 'http://localhost:3002',
  TIMEOUT: 10000,
};

// Create axios instances for each service
export const issuanceAPI: AxiosInstance = axios.create({
  baseURL: API_CONFIG.ISSUANCE_SERVICE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const verificationAPI: AxiosInstance = axios.create({
  baseURL: API_CONFIG.VERIFICATION_SERVICE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptors
issuanceAPI.interceptors.request.use(
  (config) => {
    console.log(`🚀 Issuance API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Issuance API Request Error:', error);
    return Promise.reject(error);
  }
);

verificationAPI.interceptors.request.use(
  (config) => {
    console.log(`🚀 Verification API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Verification API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptors
issuanceAPI.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ Issuance API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Issuance API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

verificationAPI.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ Verification API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Verification API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export { API_CONFIG };
