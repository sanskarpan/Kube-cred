import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // In production, you would send this to an error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { errorInfo } });
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4 }}>
          <Alert 
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
              >
                Retry
              </Button>
            }
          >
            <AlertTitle>Something went wrong</AlertTitle>
            {process.env.NODE_ENV === 'development' && this.state.error ? (
              <Box sx={{ mt: 2, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {this.state.error.message}
              </Box>
            ) : (
              'An unexpected error occurred. Please try refreshing the page.'
            )}
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

