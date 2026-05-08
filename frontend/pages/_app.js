import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import '../styles/globals.css';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

// Pages that don't require authentication
const PUBLIC_PAGES = ['/login'];

function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isPublic = PUBLIC_PAGES.includes(router.pathname);

  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.replace('/login');
    }
  }, [loading, user, isPublic, router]);

  // Show nothing while checking auth (prevents flash)
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary, #060a14)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading NexTrade…
          </p>
        </div>
      </div>
    );
  }

  // Not logged in + not a public page → don't render (redirect is happening)
  if (!user && !isPublic) {
    return null;
  }

  return children;
}

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
      </Head>
      <ThemeProvider>
        <AuthProvider>
          <AuthGuard>
            <Component {...pageProps} />
          </AuthGuard>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}