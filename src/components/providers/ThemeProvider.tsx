import { useEffect } from 'react';
import { useThemeStore } from '@/store/theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const mode = useThemeStore((state) => state.mode);

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  return <>{children}</>;
};