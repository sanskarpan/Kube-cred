import React, { useState } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Alert,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import {
  VerifiedUser as VerifiedIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { CredentialService } from '../services/credentialService';
import { Credential, VerificationResult } from '../types';
import { 
  formatDate, 
  isValidJSON, 
  getVerificationStatusColor, 
  getVerificationStatusMessage,
  getCredentialTypeDisplayName 
} from '../utils/validation';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorAlert from '../components/Common/ErrorAlert';

const VerifyPage: React.FC = () => {
  const [credentialJson, setCredentialJson] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [parsedCredential, setParsedCredential] = useState<Credential | null>(null);

  const handleInputChange = (value: string) => {
    setCredentialJson(value);
    
    // Clear errors when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate JSON format
    if (!credentialJson.trim()) {
      setError('Please enter credential JSON data');
      return;
    }

    if (!isValidJSON(credentialJson)) {
      setError('Invalid JSON format. Please check your credential data.');
      return;
    }

    let credential: Credential;
    try {
      credential = JSON.parse(credentialJson);
      
      // Basic validation of required fields
      const requiredFields = ['id', 'holder_name', 'issuer', 'issued_date', 'credential_type', 'expiry_date', 'signature', 'worker_id'];
      const missingFields = requiredFields.filter(field => !credential[field as keyof Credential]);
      
      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }
      
      setParsedCredential(credential);
    } catch (err) {
      setError('Failed to parse credential JSON. Please check the format.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await CredentialService.verifyCredential(credential);
      setVerificationResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCredentialJson('');
    setVerificationResult(null);
    setParsedCredential(null);
    setError(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckIcon sx={{ fontSize: 64, color: 'success.main' }} />;
      case 'expired':
        return <WarningIcon sx={{ fontSize: 64, color: 'warning.main' }} />;
      case 'invalid':
      case 'not_found':
      case 'signature_mismatch':
        return <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />;
      default:
        return <CancelIcon sx={{ fontSize: 64, color: 'grey.500' }} />;
    }
  };

  const loadSampleCredential = () => {
    const sampleCredential = {
      "id": "sample-credential-id",
      "holder_name": "John Doe",
      "issuer": "Kube Credential Authority",
      "issued_date": "2024-01-15T10:30:00.000Z",
      "credential_type": "certificate",
      "expiry_date": "2025-01-15T10:30:00.000Z",
      "signature": "sample-signature-hash",
      "worker_id": "worker-1",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    };
    
    setCredentialJson(JSON.stringify(sampleCredential, null, 2));
  };

  if (verificationResult && parsedCredential) {
    return (
      <Box>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          {getStatusIcon(verificationResult.verification_status)}
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Verification Complete
          </Typography>
          <Chip
            label={getVerificationStatusMessage(verificationResult.verification_status)}
            color={getVerificationStatusColor(verificationResult.verification_status)}
            size="medium"
            sx={{ fontSize: '1rem', py: 2 }}
          />
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Credential Information */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Credential Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Credential ID
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {parsedCredential.id}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Holder Name
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {parsedCredential.holder_name}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Credential Type
                  </Typography>
                  <Chip 
                    label={getCredentialTypeDisplayName(parsedCredential.credential_type as any)}
                    color="primary"
                    size="small"
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Issued Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(parsedCredential.issued_date)}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Expiry Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(parsedCredential.expiry_date)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Verification Results */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verification Results
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Verification ID
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {verificationResult.verification_id}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip 
                    label={verificationResult.verification_status.toUpperCase()}
                    color={getVerificationStatusColor(verificationResult.verification_status)}
                    size="small"
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Valid
                  </Typography>
                  <Typography variant="body1" color={verificationResult.is_valid ? 'success.main' : 'error.main'}>
                    {verificationResult.is_valid ? 'Yes' : 'No'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Expired
                  </Typography>
                  <Typography variant="body1" color={verificationResult.is_expired ? 'warning.main' : 'success.main'}>
                    {verificationResult.is_expired ? 'Yes' : 'No'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Verified By
                  </Typography>
                  <Typography variant="body1">
                    {verificationResult.verified_by}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Verified At
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(verificationResult.verified_at)}
                  </Typography>
                </Box>
                
                {verificationResult.issuer_worker_id && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Originally Issued By
                    </Typography>
                    <Typography variant="body1">
                      {verificationResult.issuer_worker_id}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            onClick={resetForm}
            size="large"
          >
            Verify Another Credential
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <VerifiedIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Verify Credential
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Validate the authenticity and integrity of a digital credential
        </Typography>
      </Box>

      {error && (
        <ErrorAlert 
          error={error} 
          onRetry={() => setError(null)}
          title="Verification Failed"
        />
      )}

      <Card elevation={3}>
        <form onSubmit={handleSubmit}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Credential JSON Data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Paste the complete credential JSON object that you want to verify.
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={12}
                value={credentialJson}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder='Paste credential JSON here, e.g.:
{
  "id": "credential-id",
  "holder_name": "John Doe",
  "issuer": "Kube Credential Authority",
  "issued_date": "2024-01-15T10:30:00.000Z",
  "credential_type": "certificate",
  "expiry_date": "2025-01-15T10:30:00.000Z",
  "signature": "signature-hash",
  "worker_id": "worker-1",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}'
                disabled={isLoading}
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                  }
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="outlined"
                onClick={loadSampleCredential}
                disabled={isLoading}
              >
                Load Sample
              </Button>
              <Button
                variant="outlined"
                onClick={() => setCredentialJson('')}
                disabled={isLoading || !credentialJson}
              >
                Clear
              </Button>
            </Box>
          </CardContent>

          <CardActions sx={{ p: 4, pt: 0 }}>
            {isLoading ? (
              <LoadingSpinner message="Verifying credential..." />
            ) : (
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<SendIcon />}
                fullWidth
                sx={{ py: 1.5 }}
                disabled={!credentialJson.trim()}
              >
                Verify Credential
              </Button>
            )}
          </CardActions>
        </form>
      </Card>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Security Note:</strong> Verification checks the credential signature, 
          cross-references with issuance records, and validates expiration status.
        </Typography>
      </Alert>
    </Box>
  );
};

export default VerifyPage;
