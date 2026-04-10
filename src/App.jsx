import './App.css'
import { useState, useRef } from 'react';
import { ThemeProvider } from '@/lib/ThemeContext';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import SplashScreen from '@/components/SplashScreen';
import LoadingScreen from '@/components/LoadingScreen';

const SPLASH_KEY = "kandu_splash_v2";

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// splashActive: se true, suprime o LoadingScreen (a splash já cobre esse tempo)
const AuthenticatedApp = ({ splashActive }) => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    // Enquanto a splash está visível, não mostra nada por baixo
    if (splashActive) return null;
    return <LoadingScreen />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route key={path} path={`/${path}`} element={
          <LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>
        } />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  const [splashActive, setSplashActive] = useState(
    () => !sessionStorage.getItem(SPLASH_KEY)
  );

  return (
    <ThemeProvider>
      {/* Auth provider monta SEMPRE, em background — resolve o auth enquanto a splash corre */}
      <QueryClientProvider client={queryClientInstance}>
        <AuthProvider>
          <Router>
            <NavigationTracker />
            {/* Splash por cima de tudo — desaparece ao terminar */}
            {splashActive && (
              <SplashScreen onDone={() => setSplashActive(false)} />
            )}
            {/* App visível mas silencioso durante splash */}
            <div style={{ visibility: splashActive ? "hidden" : "visible" }}>
              <AuthenticatedApp splashActive={splashActive} />
            </div>
          </Router>
          <Toaster />
          <VisualEditAgent />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App
