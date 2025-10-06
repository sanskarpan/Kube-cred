import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  VerifiedUser as VerifiedIcon,
  Security as SecurityIcon,
  CloudQueue as CloudIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CredentialService } from '../services/credentialService';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [serviceStatus, setServiceStatus] = useState({
    issuance: false,
    verification: false,
    loading: true
  });

  useEffect(() => {
    checkServiceHealth();
  }, []);

  const checkServiceHealth = async () => {
    try {
      const [issuanceHealthy, verificationHealthy] = await Promise.all([
        CredentialService.checkIssuanceServiceHealth(),
        CredentialService.checkVerificationServiceHealth()
      ]);

      setServiceStatus({
        issuance: issuanceHealthy,
        verification: verificationHealthy,
        loading: false
      });
    } catch (error) {
      setServiceStatus({
        issuance: false,
        verification: false,
        loading: false
      });
    }
  };

  if (serviceStatus.loading) {
    return <LoadingSpinner message="Checking service status..." />;
  }

  return (
    <Box>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <SecurityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Kube Credential System
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          A secure, scalable microservice-based platform for issuing and verifying digital credentials
        </Typography>
        
        {/* Service Status */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
          <Chip
            icon={<AssignmentIcon />}
            label={`Issuance Service: ${serviceStatus.issuance ? 'Online' : 'Offline'}`}
            color={serviceStatus.issuance ? 'success' : 'error'}
            variant="outlined"
          />
          <Chip
            icon={<VerifiedIcon />}
            label={`Verification Service: ${serviceStatus.verification ? 'Online' : 'Offline'}`}
            color={serviceStatus.verification ? 'success' : 'error'}
            variant="outlined"
          />
        </Box>

        {(!serviceStatus.issuance || !serviceStatus.verification) && (
          <Alert severity="warning" sx={{ mb: 4 }}>
            Some services are currently offline. Please ensure all microservices are running.
          </Alert>
        )}
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Action Cards */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 4 }}>
              <AssignmentIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                Issue Credential
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Create and issue new digital credentials with cryptographic signatures. 
                Each credential is securely stored and tracked by worker pods.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                <Chip label="Secure Signatures" size="small" />
                <Chip label="Worker Tracking" size="small" />
                <Chip label="Duplicate Prevention" size="small" />
              </Box>
            </CardContent>
            <CardActions sx={{ p: 3, pt: 0 }}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<AssignmentIcon />}
                onClick={() => navigate('/issue')}
                disabled={!serviceStatus.issuance}
              >
                Issue New Credential
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
              }
            }}
          >
            <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 4 }}>
              <VerifiedIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                Verify Credential
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Validate the authenticity and integrity of digital credentials. 
                Cross-reference with issuance records and check expiration status.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                <Chip label="Signature Verification" size="small" />
                <Chip label="Expiration Check" size="small" />
                <Chip label="Audit Trail" size="small" />
              </Box>
            </CardContent>
            <CardActions sx={{ p: 3, pt: 0 }}>
              <Button
                variant="contained"
                color="success"
                fullWidth
                size="large"
                startIcon={<VerifiedIcon />}
                onClick={() => navigate('/verify')}
                disabled={!serviceStatus.verification}
              >
                Verify Credential
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Features Section */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
          System Features
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2 }}>
              <CloudIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Microservices
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Independent, scalable services for issuance and verification
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2 }}>
              <SecurityIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Secure
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cryptographic signatures and comprehensive validation
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2 }}>
              <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Traceable
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete audit trail with worker identification
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2 }}>
              <VerifiedIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Reliable
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Production-ready with comprehensive error handling
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default HomePage;
