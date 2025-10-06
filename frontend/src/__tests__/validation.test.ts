import {
    validateCredentialForm,
    formatDate,
    isValidJSON,
    getVerificationStatusColor,
    getVerificationStatusMessage
  } from '../utils/validation';
  
  describe('Frontend Validation Utils', () => {
    describe('validateCredentialForm', () => {
      it('should validate a correct form', () => {
        const validForm = {
          holder_name: 'John Doe',
          credential_type: 'certificate' as const,
          expiry_date: '2025-12-31'
        };
  
        const errors = validateCredentialForm(validForm);
        expect(Object.keys(errors)).toHaveLength(0);
      });
  
      it('should reject empty holder name', () => {
        const invalidForm = {
          holder_name: '',
          credential_type: 'certificate' as const
        };
  
        const errors = validateCredentialForm(invalidForm);
        expect(errors.holder_name).toContain('required');
      });
  
      it('should reject holder name with invalid characters', () => {
        const invalidForm = {
          holder_name: 'John123',
          credential_type: 'certificate' as const
        };
  
        const errors = validateCredentialForm(invalidForm);
        expect(errors.holder_name).toContain('letters and spaces');
      });
  
      it('should reject past expiry date', () => {
        const invalidForm = {
          holder_name: 'John Doe',
          credential_type: 'certificate' as const,
          expiry_date: '2020-01-01'
        };
  
        const errors = validateCredentialForm(invalidForm);
        expect(errors.expiry_date).toContain('future');
      });
    });
  
    describe('formatDate', () => {
      it('should format ISO date string correctly', () => {
        const isoDate = '2024-01-15T10:30:00.000Z';
        const formatted = formatDate(isoDate);
        
        expect(formatted).toContain('January');
        expect(formatted).toContain('15');
        expect(formatted).toContain('2024');
      });
  
      it('should return original string for invalid date', () => {
        const invalidDate = 'invalid-date';
        const formatted = formatDate(invalidDate);
        
        expect(formatted).toBe(invalidDate);
      });
    });
  
    describe('isValidJSON', () => {
      it('should validate correct JSON', () => {
        const validJson = '{"key": "value"}';
        expect(isValidJSON(validJson)).toBe(true);
      });
  
      it('should reject invalid JSON', () => {
        const invalidJson = '{"key": value}';
        expect(isValidJSON(invalidJson)).toBe(false);
      });
  
      it('should handle empty string', () => {
        expect(isValidJSON('')).toBe(false);
      });
    });
  
    describe('getVerificationStatusColor', () => {
      it('should return correct colors for different statuses', () => {
        expect(getVerificationStatusColor('valid')).toBe('success');
        expect(getVerificationStatusColor('expired')).toBe('warning');
        expect(getVerificationStatusColor('invalid')).toBe('error');
        expect(getVerificationStatusColor('not_found')).toBe('error');
        expect(getVerificationStatusColor('signature_mismatch')).toBe('error');
        expect(getVerificationStatusColor('unknown')).toBe('info');
      });
    });
  
    describe('getVerificationStatusMessage', () => {
      it('should return correct messages for different statuses', () => {
        expect(getVerificationStatusMessage('valid')).toContain('valid and verified');
        expect(getVerificationStatusMessage('expired')).toContain('expired');
        expect(getVerificationStatusMessage('invalid')).toContain('invalid');
        expect(getVerificationStatusMessage('not_found')).toContain('not found');
        expect(getVerificationStatusMessage('signature_mismatch')).toContain('signature is invalid');
        expect(getVerificationStatusMessage('unknown')).toContain('Unknown');
      });
    });
  });
  