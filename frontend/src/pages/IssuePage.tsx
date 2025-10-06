import React, { useState } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Alert,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { CredentialService } from '../services/credentialService';
import { CreateCredentialRequest, Credential, CredentialType, FormErrors } from '../types';
import { validateCredentialForm, formatDate, getCredentialTypeDisplayName } from '../utils/validation';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorAlert from '../components/Common/ErrorAlert';

const IssuePage: React.FC = () => {
  const [formData, setFormData] = useState<CreateCredentialRequest>({
    holder_name: '',
    credential_type: 'certificate' as CredentialType,
    expiry_date: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedCredential, setIssuedCredential] = useState<Credential | null>(null);

  const credentialTypes: CredentialType[] = [
    'certificate',
    'license',
    'badge',
    'diploma',
    'permit',
    'qualification'
  ];

  const handleInputChange = (field: keyof CreateCredentialRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateCredentialForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrors({});

    try {
      const credential = await CredentialService.issueCredential(formData);
      setIssuedCredential(credential);
      
      // Reset form
      setFormData({
        holder_name: '',
        credential_type: 'certificate',
        expiry_date: ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCredentialToClipboard = () => {
    if (issuedCredential) {
      navigator.clipboard.writeText(JSON.stringify(issuedCredential, null, 2));
    }
  };

  const resetForm = () => {
    setIssuedCredential(null);
    setError(null);
    setErrors({});
  };

  if (issuedCredential) {
    return (
      <Box>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Credential Issued Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            The credential has been securely created and signed.
          </Typography>
        </Box>

        <Card elevation={3} sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Credential Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Credential ID
                </Typography>
                <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
                  {issuedCredential.id}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Holder Name
                </Typography>
                <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
                  {issuedCredential.holder_name}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Credential Type
                </Typography>
                <Chip 
                  label={getCredentialTypeDisplayName(issuedCredential.credential_type as CredentialType)}
                  color="primary"
                  size="small"
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Issued By
                </Typography>
                <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
                  {issuedCredential.worker_id}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Issued Date
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {formatDate(issuedCredential.issued_date)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Expiry Date
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {formatDate(issuedCredential.expiry_date)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
          
          <CardActions sx={{ p: 3, pt: 0 }}>
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={copyCredentialToClipboard}
              sx={{ mr: 2 }}
            >
              Copy JSON
            </Button>
            <Button
              variant="contained"
              onClick={resetForm}
            >
              Issue Another Credential
            </Button>
          </CardActions>
        </Card>

        <Alert severity="info">
          <Typography variant="body2">
            <strong>Important:</strong> Save this credential information securely. 
            You can use this JSON data to verify the credential later.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <AssignmentIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Issue New Credential
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create a new digital credential with secure cryptographic signature
        </Typography>
      </Box>

      {error && (
        <ErrorAlert 
          error={error} 
          onRetry={() => setError(null)}
          title="Failed to Issue Credential"
        />
      )}

      <Card elevation={3}>
        <form onSubmit={handleSubmit}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Holder Name"
                  value={formData.holder_name}
                  onChange={(e) => handleInputChange('holder_name', e.target.value)}
                  error={!!errors.holder_name}
                  helperText={errors.holder_name || 'Enter the full name of the credential holder'}
                  required
                  disabled={isLoading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.credential_type}>
                  <InputLabel>Credential Type</InputLabel>
                  <Select
                    value={formData.credential_type}
                    label="Credential Type"
                    onChange={(e) => handleInputChange('credential_type', e.target.value)}
                    required
                    disabled={isLoading}
                  >
                    {credentialTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {getCredentialTypeDisplayName(type)}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.credential_type && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                      {errors.credential_type}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Expiry Date (Optional)"
                  value={formData.expiry_date}
                  onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                  error={!!errors.expiry_date}
                  helperText={errors.expiry_date || 'Leave empty for 1-year default expiry'}
                  InputLabelProps={{ shrink: true }}
                  disabled={isLoading}
                />
              </Grid>
            </Grid>
          </CardContent>

          <CardActions sx={{ p: 4, pt: 0 }}>
            {isLoading ? (
              <LoadingSpinner message="Issuing credential..." />
            ) : (
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                fullWidth
                sx={{ py: 1.5 }}
              >
                Issue Credential
              </Button>
            )}
          </CardActions>
        </form>
      </Card>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Each credential is uniquely signed and tracked. 
          Duplicate credentials for the same holder and type will be rejected.
        </Typography>
      </Alert>
    </Box>
  );
};

export default IssuePage;
