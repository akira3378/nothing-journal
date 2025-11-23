import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';
import { useApp } from '../utils/i18n';
import { getPendingUserCount } from '../services/mockBackend';
import { Badge } from './UI';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, theme, toggleTheme, language, setLanguage } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Polling for Admin Badge
  useEffect(() => {
    let interval: any;
    if (user && user.role === UserRole.ADMIN) {
        const checkPending = async () => {
            const count = await getPendingUserCount();
            setPendingCount(count);
        };
        checkPending();
        interval = setInterval(checkPending, 30000); // Check every 30s
    }
    return () => clearInterval(interval);
  }, [user]);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  if (isAuthPage) return null;

  const NavLinks = () => (
    <>
      {!user ? (
        <>
          <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }} className="text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">{t('login')}</button>
          <button onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }} className="bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-gray-200 px-4 py-2 rounded-sm text-sm font-bold transition-colors">{t('join_us')}</button>
        </>
      ) : (
        <>
          <button onClick={() => { navigate('/feed'); setIsMobileMenuOpen(false); }} className="text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white px-3 py-2 text-sm font-medium">{t('feed')}</button>
          <button onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }} className="text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white px-3 py-2 text-sm font-medium">{t('profile')}</button>
          {user.role === 'ADMIN' && (
            <button onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 px-3 py-2 text-sm font-medium flex items-center gap-1">
                {t('admin')}
                {pendingCount > 0 && <Badge variant="dot" />}
            </button>
          )}
          <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="ml-0 md:ml-4 border border-zinc-300 dark:border-white/20 hover:border-zinc-900 dark:hover:border-white/50 text-black dark:text-white px-3 py-1.5 rounded-sm text-xs transition-all">{t('logout')}</button>
        </>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-zinc-200 dark:border-white/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-2xl font-bold tracking-tighter text-black dark:text-white">{t('app_name')}</span>
            <span className="ml-2 text-xs text-zinc-500 dark:text-gray-500 tracking-widest border border-zinc-300 dark:border-gray-700 px-1 rounded">CORP</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-baseline space-x-4">
               <NavLinks />
            </div>
            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-2"></div>
            <div className="flex items-center gap-2">
                <button onClick={toggleTheme} className="text-zinc-500 hover:text-black dark:hover:text-white p-1">
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>
                <button onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className="text-xs font-mono text-zinc-500 hover:text-black dark:hover:text-white border border-zinc-300 dark:border-zinc-700 px-1 rounded">
                    {language === 'en' ? 'CN' : 'EN'}
                </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={toggleTheme} className="text-zinc-500">
                {theme === 'dark' ? '☀️' : '🌙'}
            </button>
             <button onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className="text-xs font-mono text-zinc-500 border border-zinc-300 dark:border-zinc-700 px-1 rounded">
                {language === 'en' ? 'CN' : 'EN'}
            </button>
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-black dark:text-white p-2 focus:outline-none"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 pt-2 pb-4 space-y-2 flex flex-col shadow-lg">
              <NavLinks />
          </div>
      )}
    </nav>
  );
};