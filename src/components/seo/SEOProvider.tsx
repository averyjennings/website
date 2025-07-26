import { ReactNode } from 'react';

interface SEOProviderProps {
  children: ReactNode;
}

export function SEOProvider({ children }: SEOProviderProps) {
  // React 19 handles metadata natively, no wrapper needed
  return <>{children}</>;
}

export default SEOProvider;