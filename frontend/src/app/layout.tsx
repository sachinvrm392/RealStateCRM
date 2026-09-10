'use client';
import { ReactNode } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from '../contexts/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { usePathname } from 'next/navigation';
import { AuthContext } from '../contexts/AuthContext';
import { useContext } from 'react';

const theme = createTheme({
  palette: {
    primary: { main: '#00796b' },
    secondary: { main: '#004d40' },
    background: { default: '#f4f6f8' },
  },
});

const LayoutContent = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { loading } = useContext(AuthContext);

  if (loading) return null;

  const isAuthPage = pathname === '/login';

  if (isAuthPage) {
    return <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>{children}</Box>;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', ml: '240px' }}>
        <Header />
        <Box component="main" sx={{ p: 3, flexGrow: 1, mt: '64px' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider maxSnack={3} autoHideDuration={3000}>
            <AuthProvider>
              <LayoutContent>{children}</LayoutContent>
            </AuthProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
