import Joi from 'joi';

export const credentialValidationSchema = Joi.object({
  holder_name: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Holder name must contain only letters and spaces',
      'string.min': 'Holder name must be at least 2 characters long',
      'string.max': 'Holder name must not exceed 100 characters'
    }),
  
  credential_type: Joi.string()
    .valid('certificate', 'license', 'badge', 'diploma', 'permit', 'qualification')
    .required()
    .messages({
      'any.only': 'Credential type must be one of: certificate, license, badge, diploma, permit, qualification'
    }),
  
  expiry_date: Joi.date()
    .iso()
    .min('now')
    .optional()
    .messages({
      'date.min': 'Expiry date must be in the future'
    })
});

export const validateCredentialRequest = (data: any) => {
  return credentialValidationSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

