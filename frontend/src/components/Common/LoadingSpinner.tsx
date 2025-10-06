import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 40 
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <CircularProgress size={size} />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 2 }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;
