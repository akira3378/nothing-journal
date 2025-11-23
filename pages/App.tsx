import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { User, UserRole, UserStatus } from '../types';
import { getCurrentUser, logout, isBackendConfigured, configureBackend, getSession } from '../services/mockBackend';
import { AppProvider } from '../utils/i18n';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
  role?: UserRole;
  requireActive?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children, role, requireActive = false }) => {
  if (!user) return <Navigate to="/login" />;
  
  // Admin Role Check
  if (role && user.role !== role) return <Navigate to="/" />;
  
  // Active Status Check (e.g. for Feed)
  if (requireActive && user.status !== UserStatus.ACTIVE && user.role !== UserRole.ADMIN) {
       return <Navigate to="/profile" />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isBackendConfigured());
  const [configError, setConfigError] = useState(false);
  
  // Setup State
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');

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

  if (!isConfigured) {
      return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col items-center justify-center px-4 transition-colors duration-300">
            <div className="max-w-md w-full bg-gray-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 p-8 rounded-sm">
                <h1 className="text-2xl font-bold mb-2">SYSTEM INITIALIZATION</h1>
                <p className="text-zinc-500 text-sm mb-6">Connect to your Supabase Backend to deploy the NOTHING portal.</p>
                
                <form onSubmit={handleConfigure} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Supabase URL</label>
                        <input value={sbUrl} onChange={e => setSbUrl(e.target.value)} className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 p-2 text-black dark:text-white text-sm rounded-sm focus:border-black dark:focus:border-white outline-none" placeholder="https://xyz.supabase.co" required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Supabase Key</label>
                        <input value={sbKey} onChange={e => setSbKey(e.target.value)} className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 p-2 text-black dark:text-white text-sm rounded-sm focus:border-black dark:focus:border-white outline-none" placeholder="eyJh..." required />
                    </div>
                    <button type="submit" className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-2 rounded-sm hover:bg-zinc-800 dark:hover:bg-gray-200 text-sm mt-4 transition-colors">INITIALIZE SYSTEM</button>
                </form>
            </div>
        </div>
      );
  }

  if (loading) {
      return (
        <div className="h-screen w-full bg-white dark:bg-black flex flex-col items-center justify-center gap-4 transition-colors duration-300">
             <div className="text-zinc-400 dark:text-zinc-500 animate-pulse tracking-widest">CONNECTING TO NOTHING...</div>
             {configError && (
                 <button onClick={handleResetConfig} className="text-xs text-red-500 hover:text-red-400 underline">
                     Connection taking too long. Reset Configuration?
                 </button>
             )}
        </div>
      );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-white dark:bg-nothing-black text-black dark:text-nothing-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black font-sans transition-colors duration-300">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="w-full">
          <Routes>
            <Route path="/" element={<LandingPage user={user} />} />
            
            {/* Login Logic */}
            <Route path="/login" element={user ? <Navigate to="/feed" /> : <LoginPage onLoginSuccess={(u) => setUser(u)} />} />
            
            {/* Register/Onboarding Logic */}
            <Route path="/register" element={
                // If user is fully profiled, go to feed.
                user ? <Navigate to="/feed" /> : 
                // If user is NOT profiled, stay here (RegisterPage handles both Email entry AND Onboarding)
                <RegisterPage />
            } />
            
            <Route path="/feed" element={
              <ProtectedRoute user={user} requireActive={true}>
                <FeedPage user={user!} />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute user={user}>
                <ProfilePage user={user!} />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute user={user} role={UserRole.ADMIN}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;