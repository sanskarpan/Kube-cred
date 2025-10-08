import { CreateCredentialRequest, FormErrors, CredentialType } from '../types';

export const validateCredentialForm = (data: CreateCredentialRequest): FormErrors => {
  const errors: FormErrors = {};

  // Validate holder name
  if (!data.holder_name) {
    errors.holder_name = 'Holder name is required';
  } else if (data.holder_name.length < 2) {
    errors.holder_name = 'Holder name must be at least 2 characters long';
  } else if (data.holder_name.length > 100) {
    errors.holder_name = 'Holder name must not exceed 100 characters';
  } else if (!/^[a-zA-Z\s]+$/.test(data.holder_name)) {
    errors.holder_name = 'Holder name must contain only letters and spaces';
  }

  // Validate credential type
  if (!data.credential_type) {
    errors.credential_type = 'Credential type is required';
  }

  // Validate expiry date (optional)
  if (data.expiry_date) {
    const expiryDate = new Date(data.expiry_date);
    const now = new Date();
    
    if (isNaN(expiryDate.getTime())) {
      errors.expiry_date = 'Invalid expiry date format';
    } else if (expiryDate <= now) {
      errors.expiry_date = 'Expiry date must be in the future';
    }
  }

  return errors;
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
};

export const formatDateInput = (dateString: string): string => {
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
};

export const isValidJSON = (jsonString: string): boolean => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const getCredentialTypeDisplayName = (type: CredentialType): string => {
  const displayNames: Record<CredentialType, string> = {
    certificate: 'Certificate',
    license: 'License',
    badge: 'Badge',
    diploma: 'Diploma',
    permit: 'Permit',
    qualification: 'Qualification'
  };
  
  return displayNames[type] || type;
};

export const getVerificationStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' => {
  switch (status) {
    case 'valid':
      return 'success';
    case 'invalid':
    case 'not_found':
    case 'signature_mismatch':
      return 'error';
    case 'expired':
      return 'warning';
    default:
      return 'info';
  }
};

export const getVerificationStatusMessage = (status: string): string => {
  switch (status) {
    case 'valid':
      return 'Credential is valid and verified';
    case 'invalid':
      return 'Credential is invalid';
    case 'expired':
      return 'Credential has expired';
    case 'not_found':
      return 'Credential not found in issuance records';
    case 'signature_mismatch':
      return 'Credential signature is invalid';
    default:
      return 'Unknown verification status';
  }
};
