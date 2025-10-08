import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock react-router-dom
jest.mock('react-router-dom');

// Mock components
jest.mock('./components/Layout/Layout', () => {
  return ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>;
});

jest.mock('./pages/HomePage', () => {
  return () => <div data-testid="home-page">Welcome to Kube Credential</div>;
});

jest.mock('./pages/IssuePage', () => {
  return () => <div data-testid="issue-page">Issue Page</div>;
});

jest.mock('./pages/VerifyPage', () => {
  return () => <div data-testid="verify-page">Verify Page</div>;
});

test('renders app without crashing', () => {
  render(<App />);
  const layoutElement = screen.getByTestId('layout');
  expect(layoutElement).toBeInTheDocument();
});
