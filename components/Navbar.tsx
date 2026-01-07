
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Notification } from '../types';
import { LANGUAGE_OPTIONS, useApp } from '../utils/i18n';
import { getNotifications, markNotificationRead, subscribeToNotifications } from '../services/mockBackend';
import { formatRelativeTime, formatNotificationMessage } from '../utils/formatters';
import { Button, Badge, Popover, Drawer, Dropdown, Avatar, List, Empty } from 'antd';
import { Icons, useToast } from './UI';

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

    // Notification State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadNotifs, setUnreadNotifs] = useState(0);

    const [isNotifOpen, setIsNotifOpen] = useState(false);

    // Data Fetching & Realtime
    useEffect(() => {
        if (!user) return;
        let notifSub: any = null;

        const fetchData = async () => {
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
                // Use duration 0 for persistent notifications
                addToast(
                    formatNotificationMessage(newNotif),
                    'info',
                    5000
                );
                fetchData(); // Refresh list and counts
            });

        };

        setupRealtime();

        return () => {
            clearInterval(interval);
            if (notifSub) notifSub.unsubscribe();
        };
    }, [user]);



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

    // Show all notifications (limit handled by backend)
    const displayNotifications = notifications;

    const LanguageSwitcher = () => (
        <div className="flex items-center gap-1" aria-label={t('language_name')}>
            {LANGUAGE_OPTIONS.map((option, index) => (
                <React.Fragment key={option.code}>
                    {index > 0 && <div className="w-[1px] h-3 bg-zinc-200 dark:bg-zinc-800" />}
                    <button
                        onClick={() => setLanguage(option.code)}
                        aria-label={option.label}
                        aria-pressed={language === option.code}
                        className={`text-[10px] font-bold px-2 py-1 rounded-sm transition-all ${language === option.code ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-400 hover:text-black dark:hover:text-white'}`}
                    >
                        {option.shortLabel}
                    </button>
                </React.Fragment>
            ))}
        </div>
    );

    const NavLinksMobile = () => (
        <>
            {!user ? (
                <>
                    <button onClick={() => { navigate('/journal'); setIsMobileMenuOpen(false); }} className="text-left w-full text-zinc-600 dark:text-zinc-300 px-3 py-2 text-sm font-medium">{t('journal')}</button>
                    <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }} className="text-left w-full text-zinc-600 dark:text-zinc-300 px-3 py-2 text-sm font-medium">{t('write')}</button>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-3 px-3 py-3 border-b border-zinc-100 dark:border-zinc-800 mb-2" onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}>
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                            {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm font-bold">{user.nickname?.charAt(0)}</div>}
                        </div>
                        <div>
                            <div className="font-bold text-black dark:text-white">{user.nickname}</div>
                            <div className="text-xs text-zinc-500">{t('profile')}</div>
                        </div>
                    </div>
                    <button onClick={() => { navigate('/journal'); setIsMobileMenuOpen(false); }} className="text-left w-full text-zinc-600 dark:text-zinc-300 px-3 py-2 text-sm font-medium">{t('feed')}</button>
                    <div className="border-t border-zinc-100 dark:border-zinc-800 my-2 pt-2">
                        <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} className="text-left w-full text-zinc-600 dark:text-zinc-300 px-3 py-2 text-sm font-medium">{t('logout')}</button>
                    </div>
                        <div className="px-3 py-2 flex items-center justify-between">
                        <LanguageSwitcher />
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                {theme === 'dark' ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
                            </button>
                    </div>
                </>
            )}
        </>
    );

    return (
        <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-zinc-200 dark:border-white/10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* LEFT SIDE: Logo & Main Nav */}
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <div className="flex items-center cursor-pointer gap-2 shrink-0" onClick={() => navigate('/')}>
                            {siteConfig.logoUrl ? (
                                <img src={siteConfig.logoUrl} alt="Logo" className="w-8 h-8 object-contain dark:invert-0" />
                            ) : (
                                <Icons.Logo className="w-8 h-8 text-black dark:text-white" />
                            )}
                            <span className="text-xl font-bold tracking-tighter text-black dark:text-white hidden sm:block">{t('app_name')}</span>
                        </div>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex items-center space-x-4">
                            {!user ? (
                                location.pathname !== '/' && location.pathname !== '/journal' && (
                                    <>
                                        <button onClick={() => navigate('/journal')} className="text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">{t('journal')}</button>
                                        <button onClick={() => navigate('/login')} className="bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-gray-200 px-4 py-2 rounded-sm text-sm font-bold transition-colors">{t('write')}</button>
                                    </>
                                )
                            ) : (
                                <>
                                    <button onClick={() => navigate('/journal')} className="text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white px-3 py-2 text-sm font-medium">{t('feed')}</button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE: Utilities (Notification, Theme, Lang, Logout) */}
                    <div className="flex items-center gap-2 sm:gap-4">

                        {/* Notifications */}
                        {user && (
                            <Popover
                                content={
                                    <div className="w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto">
                                        <List<Notification>
                                            itemLayout="horizontal"
                                            dataSource={displayNotifications}
                                            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No new notifications" /> }}
                                            renderItem={(notif) => (
                                                <List.Item
                                                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors !px-4 !py-3"
                                                    onClick={() => handleNotificationClick(notif)}
                                                >
                                                    <List.Item.Meta
                                                        avatar={<Avatar src={notif.triggerUser?.avatarUrl}>{notif.triggerUser?.nickname?.charAt(0)}</Avatar>}
                                                        title={
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs font-bold">{notif.triggerUser?.nickname}</span>
                                                                <span className="text-[9px] text-zinc-400">{formatRelativeTime(notif.createdAt)}</span>
                                                            </div>
                                                        }
                                                        description={
                                                            <div className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                                                {formatNotificationMessage(notif)}
                                                            </div>
                                                        }
                                                    />
                                                    {!notif.isRead && <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 ml-2" />}
                                                </List.Item>
                                            )}
                                        />
                                    </div>
                                }
                                title={
                                    <div className="flex justify-between items-center">
                                        <span>Notifications</span>
                                        {unreadNotifs > 0 && <span className="text-xs text-red-500 font-bold">{unreadNotifs} NEW</span>}
                                    </div>
                                }
                                trigger="click"
                                open={isNotifOpen}
                                onOpenChange={setIsNotifOpen}
                                placement="bottomRight"
                            >
                                <Badge count={unreadNotifs} size="small" offset={[-2, 2]}>
                                    <Button type="text" icon={<Icons.Bell className="w-5 h-5" />} className="flex items-center justify-center" />
                                </Badge>
                            </Popover>
                        )}

                        {/* Theme Toggle - Desktop Only */}
                        <div className="hidden md:block">
                            <Button type="text" onClick={toggleTheme} icon={theme === 'dark' ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />} />
                        </div>

                        {/* Desktop Lang Switcher */}
                        <div className="hidden sm:block">
                            <LanguageSwitcher />
                        </div>

                        {/* User Profile & Logout (Desktop) */}
                        {user && (
                            <div className="hidden md:flex items-center gap-4 pl-4 border-l border-zinc-200 dark:border-zinc-800 ml-1">
                                <Dropdown
                                    menu={{
                                        items: [
                                            { key: 'profile', label: t('profile'), onClick: () => navigate('/profile') },
                                            { key: 'logout', label: t('logout'), onClick: onLogout, danger: true }
                                        ]
                                    }}
                                    placement="bottomRight"
                                >
                                    <div className="flex items-center gap-2 cursor-pointer group">
                                        <Avatar src={user.avatarUrl} className="border border-zinc-200 dark:border-zinc-700 group-hover:border-black dark:group-hover:border-white transition-colors">
                                            {user.nickname?.charAt(0)}
                                        </Avatar>
                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors max-w-[100px] truncate">
                                            {user.nickname}
                                        </span>
                                    </div>
                                </Dropdown>
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <div className="md:hidden flex items-center border-l border-zinc-200 dark:border-zinc-800 pl-3">
                            <Button type="text" onClick={() => setIsMobileMenuOpen(true)} icon={<Icons.Menu className="w-6 h-6" />} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            <Drawer
                title={t('app_name')}
                placement="right"
                onClose={() => setIsMobileMenuOpen(false)}
                open={isMobileMenuOpen}
                width={280}
            >
                <div className="flex flex-col gap-2">
                    <NavLinksMobile />
                </div>
            </Drawer>
        </nav>
    );
};
