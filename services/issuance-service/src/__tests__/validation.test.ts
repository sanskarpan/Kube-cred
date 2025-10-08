import { validateCredentialRequest } from '../utils/validation';

describe('Validation Utils', () => {
  describe('validateCredentialRequest', () => {
    it('should validate a correct credential request', () => {
      const validRequest = {
        holder_name: 'John Doe',
        credential_type: 'certificate',
        expiry_date: '2025-12-31'
      };

      const { error } = validateCredentialRequest(validRequest);
      expect(error).toBeUndefined();
    });

    it('should reject empty holder name', () => {
      const invalidRequest = {
        holder_name: '',
        credential_type: 'certificate'
      };

      const { error } = validateCredentialRequest(invalidRequest);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('required');
    });

    it('should reject invalid holder name with numbers', () => {
      const invalidRequest = {
        holder_name: 'John123',
        credential_type: 'certificate'
      };

      const { error } = validateCredentialRequest(invalidRequest);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('letters and spaces');
    });

    it('should reject holder name that is too short', () => {
      const invalidRequest = {
        holder_name: 'J',
        credential_type: 'certificate'
      };

      const { error } = validateCredentialRequest(invalidRequest);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 2 characters');
    });

    it('should reject invalid credential type', () => {
      const invalidRequest = {
        holder_name: 'John Doe',
        credential_type: 'invalid_type'
      };

      const { error } = validateCredentialRequest(invalidRequest);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be one of');
    });

    it('should reject past expiry date', () => {
      const invalidRequest = {
        holder_name: 'John Doe',
        credential_type: 'certificate',
        expiry_date: '2020-01-01'
      };

      const { error } = validateCredentialRequest(invalidRequest);
      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('future');
    });

    it('should accept valid credential types', () => {
      const validTypes = ['certificate', 'license', 'badge', 'diploma', 'permit', 'qualification'];
      
      validTypes.forEach(type => {
        const request = {
          holder_name: 'John Doe',
          credential_type: type
        };

        const { error } = validateCredentialRequest(request);
        expect(error).toBeUndefined();
      });
    });
  });
});

