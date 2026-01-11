
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { User } from './types';
import { getCurrentUser, logout, isBackendConfigured, configureBackend, getSession, SYSTEM_ERROR_EVENT } from './services/supabaseBackend';
import { AppProvider, useApp } from './utils/i18n';
import { Icons, ToastProvider } from './components/UI';
import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import jaJP from 'antd/locale/ja_JP';
import enUS from 'antd/locale/en_US';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/ja';
import dayjs from 'dayjs';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import PostDetailPage from './pages/PostDetailPage';

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children }) => {
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
};

const SystemErrorScreen: React.FC<{ error: any, onReset: () => void }> = ({ error, onReset }) => {
  const { t } = useApp();

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-red-500 p-4 font-mono">
      <div className="max-w-2xl w-full border border-red-900 bg-red-950/10 p-8 rounded-sm shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>

        <div className="flex items-center gap-4 mb-6">
          <Icons.AlertTriangle className="w-12 h-12" />
          <div>
            <h1 className="text-2xl font-bold tracking-widest uppercase">{error.title || t('system_failure')}</h1>
            <p className="text-xs text-red-400">{t('error_code')}: {error.code || t('unknown_error')}</p>
          </div>
        </div>

        <div className="mb-8 space-y-4">
          <div className="bg-black/50 p-4 border border-red-900/50 rounded text-sm leading-relaxed text-red-300 break-all">
            {error.message}
          </div>
          {error.hint && (
            <div className="flex items-start gap-2 text-sm text-yellow-500 bg-yellow-900/20 p-3 rounded border border-yellow-900/30">
              <span className="font-bold">{t('hint')}:</span>
              <span>{error.hint}</span>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={onReset}
            className="px-6 py-3 bg-red-600 text-black font-bold uppercase tracking-wider hover:bg-red-500 transition-colors"
          >
            {t('reboot_system')}
          </button>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isBackendConfigured());
  const [configError, setConfigError] = useState(false);
  const { siteConfig, theme, language, t } = useApp();

  // Update dayjs locale
  useEffect(() => {
    if (language === 'zh') {
      dayjs.locale('zh-cn');
    } else if (language === 'ja') {
      dayjs.locale('ja');
    } else {
      dayjs.locale('en');
    }
  }, [language]);

  // Global System Error State
  const [systemError, setSystemError] = useState<any>(null);

  // Setup State
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');

  // Listen for Global Errors
  useEffect(() => {
    const handleSystemError = (e: CustomEvent) => {
      setSystemError(e.detail);
    };

    window.addEventListener(SYSTEM_ERROR_EVENT as any, handleSystemError);
    return () => window.removeEventListener(SYSTEM_ERROR_EVENT as any, handleSystemError);
  }, []);

  // Dynamic Favicon Effect
  useEffect(() => {
    const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (link) {
      if (siteConfig.logoUrl) {
        link.href = siteConfig.logoUrl;
      } else {
        // Default Dot Matrix N if no logo uploaded (reverting)
        link.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='black'><path d='M4 4h4v4H4zM4 10h4v4H4zM4 16h4v4H4zM10 16h4v4h-4zM16 4h4v4h-4zM16 10h4v4h-4zM16 16h4v4h-4zM10 4h4v4h-4z'/></svg>";
      }
    }
  }, [siteConfig.logoUrl]);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const session = await getSession();
        setHasSession(!!session);

        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000));
        const userPromise = getCurrentUser();
        const currentUser = await Promise.race([userPromise, timeout]) as User | null;

        setUser(currentUser);
      } catch (e) {
        console.error("Auth check failed", e);
        setConfigError(true);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [isConfigured]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setHasSession(false);
    window.location.hash = '/';
  };

  const handleConfigure = (e: React.FormEvent) => {
    e.preventDefault();
    if (sbUrl && sbKey) {
      configureBackend(sbUrl, sbKey);
      setIsConfigured(true);
      setLoading(true);
      window.location.reload();
    }
  };

  const handleResetConfig = () => {
    localStorage.removeItem('nothing_sb_url');
    localStorage.removeItem('nothing_sb_key');
    window.location.reload();
  };

  const handleSystemReboot = () => {
    setSystemError(null);
    window.location.hash = '/'; // Force back to home
    window.location.reload(); // Full reload to clear any bad state
  };

  // Render Critical Error Screen if present
  if (systemError) {
    return <SystemErrorScreen error={systemError} onReset={handleSystemReboot} />;
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col items-center justify-center px-4 transition-colors duration-300">
        <div className="max-w-md w-full bg-gray-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 p-8 rounded-sm">
          <h1 className="text-2xl font-bold mb-2">{t('system_initialization')}</h1>
          <p className="text-zinc-500 text-sm mb-6">{t('system_initialization_desc')}</p>

          <form onSubmit={handleConfigure} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">{t('supabase_url_label')}</label>
              <input value={sbUrl} onChange={e => setSbUrl(e.target.value)} className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 p-2 text-black dark:text-white text-sm rounded-sm focus:border-black dark:focus:border-white outline-none" placeholder={t('supabase_url_placeholder')} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">{t('supabase_key_label')}</label>
              <input value={sbKey} onChange={e => setSbKey(e.target.value)} className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 p-2 text-black dark:text-white text-sm rounded-sm focus:border-black dark:focus:border-white outline-none" placeholder={t('supabase_key_placeholder')} required />
            </div>
            <button type="submit" className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-2 rounded-sm hover:bg-zinc-800 dark:hover:bg-gray-200 text-sm mt-4 transition-colors">{t('initialize_system')}</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-full bg-white dark:bg-black flex flex-col items-center justify-center gap-4 transition-colors duration-300">
        <div className="text-zinc-400 dark:text-zinc-500 animate-pulse tracking-widest">{t('connecting')}</div>
        {configError && (
          <button onClick={handleResetConfig} className="text-xs text-red-500 hover:text-red-400 underline">
            {t('connection_timeout')}
          </button>
        )}
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
      locale={language === 'zh' ? zhCN : language === 'ja' ? jaJP : enUS}
    >
      <HashRouter>
        <div className="min-h-screen bg-white dark:bg-nothing-black text-black dark:text-nothing-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black font-sans transition-colors duration-300">
          <Navbar user={user} onLogout={handleLogout} />

          <main className="w-full">
            <Routes>
              <Route path="/" element={<LandingPage user={user} />} />

              {/* Login Logic */}
              <Route path="/login" element={user ? <Navigate to="/journal" /> : <LoginPage onLoginSuccess={(u) => setUser(u)} />} />

              <Route path="/register" element={<Navigate to="/login" replace />} />
              <Route path="/admin" element={<Navigate to="/journal" replace />} />

              <Route path="/journal" element={<FeedPage user={user} />} />
              <Route path="/feed" element={<Navigate to="/journal" replace />} />

              <Route path="/profile" element={
                <ProtectedRoute user={user}>
                  <ProfilePage user={user!} />
                </ProtectedRoute>
              } />

              <Route path="/post/:id" element={<PostDetailPage />} />

            </Routes>
          </main>
        </div>
      </HashRouter>
    </ConfigProvider>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
};

export default App;
