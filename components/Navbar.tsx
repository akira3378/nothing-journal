


import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole, Notification } from '../types';
import { useApp } from '../utils/i18n';
import { getPendingUserCount, getNotifications, markNotificationRead, subscribeToNotifications, subscribeToAdminChanges } from '../services/mockBackend';
import { Badge, Icons, useToast } from './UI';
import { formatRelativeTime } from '../utils/formatters';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, theme, toggleTheme, language, setLanguage, siteConfig } = useApp();
  const { addToast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Data Fetching & Realtime
  useEffect(() => {
    if (!user) return;
    let notifSub: any = null;
    let adminSub: any = null;

    const fetchData = async () => {
        // Admin check
        if (user.role === UserRole.ADMIN) {
            const count = await getPendingUserCount();
            setPendingCount(count);
        }

        // Notification check
        const notifs = await getNotifications();
        setNotifications(notifs);
        setUnreadNotifs(notifs.filter(n => !n.isRead).length);
    };

    // Initial Load
    fetchData();
    
    // Backup Polling (just in case connection drops)
    const interval = setInterval(fetchData, 30000);

    // Realtime Setup
    const setupRealtime = async () => {
        notifSub = subscribeToNotifications(user.id, (newNotif) => {
            addToast(`New Notification: ${newNotif.content?.substring(0, 30)}...`, 'info');
            fetchData(); // Refresh list and counts
        });

        if (user.role === UserRole.ADMIN) {
            adminSub = subscribeToAdminChanges((payload) => {
                if (payload && payload.status === 'PENDING') {
                     addToast(`New Application: ${payload.nickname}`, 'info');
                     fetchData(); // Refresh admin badge
                }
            });
        }
    };

    setupRealtime();
    
    return () => {
        clearInterval(interval);
        if (notifSub) notifSub.unsubscribe();
        if (adminSub) adminSub.unsubscribe();
    };
  }, [user]);

  // Click outside for Notification Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
            setIsNotifOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
      // Mark read immediately in UI
      if (!notif.isRead) {
          setUnreadNotifs(prev => Math.max(0, prev - 1));
          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
          await markNotificationRead(notif.id);
      }
      setIsNotifOpen(false);
      
      if (notif.relatedPostId) {
          let url = `/post/${notif.relatedPostId}`;
          if (notif.relatedCommentId) {
              url += `?highlightCommentId=${notif.relatedCommentId}`;
          }
          navigate(url);
      }
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  if (isAuthPage) return null;

  // Filter list to only show UNREAD items in the dropdown view as requested
  const displayNotifications = notifications.filter(n => !n.isRead);

  // Components to reduce duplication
  const NavLinksDesktop = () => (
    <>
      {!user ? (
        <>
          <button onClick={() => navigate('/login')} className="text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">{t('login')}</button>
          <button onClick={() => navigate('/register')} className="bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-gray-200 px-4 py-2 rounded-sm text-sm font-bold transition-colors">{t('join_us')}</button>
        </>
      ) : (
        <>
          <button onClick={() => navigate('/feed')} className="text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white px-3 py-2 text-sm font-medium">{t('feed')}</button>
          <button onClick={() => navigate('/profile')} className="text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white px-3 py-2 text-sm font-medium">{t('profile')}</button>
          {user.role === 'ADMIN' && (
            <button onClick={() => navigate('/admin')} className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 px-3 py-2 text-sm font-medium flex items-center gap-1">
                {t('admin')}
                {pendingCount > 0 && <Badge variant="dot" />}
            </button>
          )}
          <button onClick={() => onLogout()} className="ml-4 border border-zinc-300 dark:border-white/20 hover:border-zinc-900 dark:hover:border-white/50 text-black dark:text-white px-3 py-1.5 rounded-sm text-xs transition-all">{t('logout')}</button>
        </>
      )}
    </>
  );

  const NavLinksMobile = () => (
      <>
        {!user ? (
          <>
            <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }} className="text-left w-full text-zinc-600 dark:text-zinc-300 px-3 py-2 text-sm font-medium">{t('login')}</button>
            <button onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }} className="text-left w-full text-zinc-600 dark:text-zinc-300 px-3 py-2 text-sm font-medium">{t('join_us')}</button>
          </>
        ) : (
          <>
            <button onClick={() => { navigate('/feed'); setIsMobileMenuOpen(false); }} className="text-left w-full text-zinc-600 dark:text-zinc-300 px-3 py-2 text-sm font-medium">{t('feed')}</button>
            <button onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }} className="text-left w-full text-zinc-600 dark:text-zinc-300 px-3 py-2 text-sm font-medium">{t('profile')}</button>
            {user.role === 'ADMIN' && (
              <button onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }} className="text-left w-full text-red-500 px-3 py-2 text-sm font-medium flex items-center gap-1">
                  {t('admin')}
                  {pendingCount > 0 && <Badge variant="dot" />}
              </button>
            )}
            <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="text-left w-full text-zinc-600 dark:text-zinc-300 px-3 py-2 text-sm font-medium">{t('logout')}</button>
          </>
        )}
      </>
  );

  const LanguageSwitcher = () => (
      <div className="flex items-center text-xs font-bold cursor-pointer border border-zinc-200 dark:border-zinc-700 rounded-sm overflow-hidden h-8">
          <button 
            onClick={() => setLanguage('zh')} 
            className={`px-2 h-full flex items-center transition-colors ${language === 'zh' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
          >
              ZH
          </button>
          <button 
            onClick={() => setLanguage('en')} 
            className={`px-2 h-full flex items-center transition-colors ${language === 'en' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
          >
              EN
          </button>
      </div>
  );

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-zinc-200 dark:border-white/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LEFT: Logo */}
          <div className="flex items-center cursor-pointer gap-2 shrink-0" onClick={() => navigate('/')}>
            {siteConfig.logoUrl ? (
                <img src={siteConfig.logoUrl} alt="Logo" className="w-8 h-8 object-contain dark:invert-0" />
            ) : (
                <Icons.Logo className="w-8 h-8 text-black dark:text-white" />
            )}
            <span className="text-xl font-bold tracking-tighter text-black dark:text-white hidden sm:block">{t('app_name')}</span>
          </div>
          
          {/* CENTER: Desktop Nav Links (Hidden on mobile) */}
          <div className="hidden md:flex items-center space-x-4">
             <NavLinksDesktop />
          </div>

          {/* RIGHT: Actions (Visible on ALL screens) */}
          <div className="flex items-center gap-3 sm:gap-4">
               {/* 1. Notifications (Shared) */}
               {user && (
                    <div className="relative" ref={notifRef}>
                        <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors p-1 relative flex items-center justify-center">
                            <Icons.Bell className="w-5 h-5" />
                            {unreadNotifs > 0 && (
                                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-black"></span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {isNotifOpen && (
                            <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-sm overflow-hidden animate-fadeIn z-50">
                                <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-black">
                                    <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Notifications</span>
                                    {unreadNotifs > 0 ? (
                                        <span className="text-xs text-red-500 font-bold">{unreadNotifs} NEW</span>
                                    ) : (
                                        <span className="text-xs text-zinc-400">All caught up</span>
                                    )}
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {displayNotifications.length === 0 ? (
                                        <div className="p-6 text-center text-zinc-400 text-xs italic">No new notifications</div>
                                    ) : (
                                        displayNotifications.map(notif => (
                                            <div 
                                                key={notif.id} 
                                                onClick={() => handleNotificationClick(notif)}
                                                className="p-3 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors flex gap-3 bg-blue-50/50 dark:bg-blue-900/10"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex-shrink-0 overflow-hidden">
                                                    {notif.triggerUser?.avatarUrl ? (
                                                        <img src={notif.triggerUser.avatarUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">{notif.triggerUser?.nickname?.charAt(0) || '?'}</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-xs text-black dark:text-white font-bold truncate pr-2">{notif.triggerUser?.nickname || 'Someone'}</span>
                                                        <span className="text-[9px] text-zinc-400 whitespace-nowrap">{formatRelativeTime(notif.createdAt)}</span>
                                                    </div>
                                                    <p className="text-xs mt-0.5 line-clamp-2 text-zinc-800 dark:text-zinc-200">
                                                        {notif.type === 'COMMENT' && 'commented: '}
                                                        {notif.content}
                                                    </p>
                                                </div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 self-center flex-shrink-0"></div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Theme Toggle */}
                <button onClick={toggleTheme} className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors p-1">
                    {theme === 'dark' ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
                </button>
                
                {/* 3. Lang Switcher */}
                <div className="hidden sm:block">
                     <LanguageSwitcher />
                </div>
                {/* Mobile simplified lang switcher */}
                <button 
                    onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} 
                    className="sm:hidden text-xs font-bold text-zinc-500 hover:text-black dark:hover:text-white p-1"
                >
                    {language === 'en' ? 'EN' : 'ZH'}
                </button>

                {/* 4. Hamburger (Mobile Only) */}
                <div className="md:hidden flex items-center border-l border-zinc-200 dark:border-zinc-800 pl-3">
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="text-black dark:text-white p-1 focus:outline-none"
                    >
                        {isMobileMenuOpen ? <Icons.X className="w-6 h-6" /> : <Icons.Menu className="w-6 h-6" />}
                    </button>
                </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown (Nav Links Only) */}
      {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 pt-2 pb-4 space-y-2 flex flex-col shadow-lg animate-slideUp">
              <NavLinksMobile />
          </div>
      )}
    </nav>
  );
};
