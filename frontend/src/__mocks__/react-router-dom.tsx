import React from 'react';

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="router">{children}</div>
);

export const Routes = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="routes">{children}</div>
);

export const Route = ({ element }: { element: React.ReactNode }) => (
  <div data-testid="route">{element}</div>
);

export const useNavigate = () => jest.fn();
export const useLocation = () => ({ pathname: '/' });
export const useParams = () => ({});

