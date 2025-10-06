import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Security as SecurityIcon,
  VerifiedUser as VerifiedIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isActive = (path: string) => location.pathname === path;

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => navigate('/')}
          sx={{ mr: 2 }}
        >
          <SecurityIcon />
        </IconButton>
        
        <Typography
          variant="h6"
          component="div"
          sx={{ 
            flexGrow: 1,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onClick={() => navigate('/')}
        >
          Kube Credential
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={!isMobile ? <AssignmentIcon /> : undefined}
            onClick={() => navigate('/issue')}
            variant={isActive('/issue') ? 'outlined' : 'text'}
            sx={{
              borderColor: isActive('/issue') ? 'white' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {isMobile ? 'Issue' : 'Issue Credential'}
          </Button>
          
          <Button
            color="inherit"
            startIcon={!isMobile ? <VerifiedIcon /> : undefined}
            onClick={() => navigate('/verify')}
            variant={isActive('/verify') ? 'outlined' : 'text'}
            sx={{
              borderColor: isActive('/verify') ? 'white' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {isMobile ? 'Verify' : 'Verify Credential'}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
