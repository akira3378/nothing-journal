
import React, { useEffect, useState, useRef } from 'react';
import { User, Announcement, UserStatus, UserRole } from '../types';
import { getAdminUsers, updateUserStatus, createAnnouncement, getAllAnnouncements, deleteAnnouncement, updateAnnouncement, updateUser, getSiteConfig, updateSiteConfig, uploadImage } from '../services/mockBackend';
import { useApp } from '../utils/i18n';
import { ImagePreview } from '../components/ImagePreview';
import { Button, Badge, Spinner, useToast, Icons } from '../components/UI';
import { Table, Input, Select, DatePicker, Button as AntButton, Tag, Space, Modal, Form, message } from 'antd';
import { Country, City } from 'country-state-city';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// --- Edit User Modal Component ---
interface EditUserModalProps {
    user: User;
    onClose: () => void;
    onSave: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
    const { addToast } = useToast();
    const { t } = useApp();
    const [role, setRole] = useState<string>(user.role);
    const [status, setStatus] = useState<string>(user.status);
    const initialDate = user.expirationDate
        ? new Date(user.expirationDate).toISOString().split('T')[0]
        : '';
    const [expirationDate, setExpirationDate] = useState(initialDate);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateUser(user.id, {
                role: role as UserRole,
                status: status as UserStatus,
                expirationDate: expirationDate || null
            });
            addToast(t('user_updated'), "success");
            onSave();
        } catch (e) {
            addToast(t('user_update_fail'), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-sm w-full max-w-lg shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-black dark:text-white uppercase">{t('edit_user')}</h3>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>✕</Button>
                </div>

                <fieldset disabled={loading} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">{t('nickname')}</label>
                            <div className="p-2 bg-gray-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sm text-zinc-700 dark:text-zinc-300">
                                {user.nickname}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">{t('email_label')}</label>
                            <div className="p-2 bg-gray-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sm text-zinc-700 dark:text-zinc-300 truncate">
                                {user.email}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">{t('role')}</label>
                        <Select
                            value={role}
                            onChange={setRole}
                            options={[
                                { value: UserRole.USER, label: t('USER') },
                                { value: UserRole.ADMIN, label: t('ADMIN') }
                            ]}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">{t('status')}</label>
                        <Select
                            value={status}
                            onChange={setStatus}
                            options={[
                                { value: UserStatus.PENDING, label: t('PENDING') },
                                { value: UserStatus.ACTIVE, label: t('ACTIVE') },
                                { value: UserStatus.REJECTED, label: t('REJECTED') },
                                { value: UserStatus.DELETED, label: t('DELETED') },
                                { value: UserStatus.EXPIRED, label: t('EXPIRED') }
                            ]}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">{t('expiration_date')}</label>
                        <DatePicker
                            value={expirationDate ? dayjs(expirationDate) : null}
                            onChange={(date) => setExpirationDate(date ? date.format('YYYY-MM-DD') : '')}
                            style={{ width: '100%' }}
                        />
                    </div>
                </fieldset>

                <div className="flex gap-3 mt-8">
                    <Button variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>{t('cancel')}</Button>
                    <Button variant="primary" onClick={handleSave} isLoading={loading} className="flex-1">{t('save_changes')}</Button>
                </div>
            </div>
        </div>
    );
};


const AdminDashboard: React.FC = () => {
    const { t, refreshConfig } = useApp();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'users' | 'content'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    // Filters
    const [filterEmail, setFilterEmail] = useState('');
    const [filterCountry, setFilterCountry] = useState<string | null>(null);
    const [filterCity, setFilterCity] = useState<string | null>(null);
    const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
    const [filterRole, setFilterRole] = useState<UserRole | null>(null);
    const [countryCode, setCountryCode] = useState('');

    // Filtered Data State
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

    useEffect(() => {
        if (filterCountry) {
            const c = Country.getAllCountries().find(c => c.name === filterCountry);
            setCountryCode(c ? c.isoCode : '');
            setFilterCity(null);
        } else {
            setCountryCode('');
            setFilterCity(null);
        }
    }, [filterCountry]);

    const handleSearch = () => {
        const res = users.filter(user => {
            // Email Filter
            if (filterEmail && !user.email.toLowerCase().includes(filterEmail.toLowerCase())) return false;

            // Location Filter
            if (filterCountry && user.country !== filterCountry) return false;
            if (filterCity && user.city !== filterCity) return false;

            // Role Filter
            if (filterRole && user.role !== filterRole) return false;

            // Expiration Filter
            if (filterDateRange && filterDateRange[0] && filterDateRange[1]) {
                if (!user.expirationDate) return false;
                const exp = user.expirationDate;
                const start = filterDateRange[0].startOf('day').valueOf();
                const end = filterDateRange[1].endOf('day').valueOf();
                if (exp < start || exp > end) return false;
            }

            return true;
        });
        setFilteredUsers(res);
    };

    // Initial load or when users change, update filtered list (optional, or keep manual search)
    useEffect(() => {
        setFilteredUsers(users);
    }, [users]);

    const clearFilters = () => {
        setFilterEmail('');
        setFilterCountry(null);
        setFilterCity(null);
        setFilterRole(null);
        setFilterDateRange(null);
        setFilteredUsers(users);
    };

    const newApplications = filteredUsers.filter(u => u.status === UserStatus.PENDING && !u.isRenewal);
    const renewalApplications = filteredUsers.filter(u => u.status === UserStatus.PENDING && u.isRenewal);
    const activeUsers = filteredUsers.filter(u => u.status !== UserStatus.PENDING);

    // Site Config State
    const [videoUrl, setVideoUrl] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    const [loading, setLoading] = useState(true);

    const [approvingUser, setApprovingUser] = useState<User | null>(null);
    const [approvalExpDate, setApprovalExpDate] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [editId, setEditId] = useState<string | null>(null);
    const [annTitle, setAnnTitle] = useState('');
    const [annContent, setAnnContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);

    const logoInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const u = await getAdminUsers();
            const a = await getAllAnnouncements();
            const config = await getSiteConfig();
            setUsers(u);
            setAnnouncements(a);
            setVideoUrl(config.landingVideoUrl || '');
            setLogoUrl(config.logoUrl || '');
        } catch (e) {
            addToast(t('fetch_fail'), "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        setApprovalExpDate(d.toISOString().split('T')[0]);
    }, []);

    const initiateApproval = (user: User) => {
        setApprovingUser(user);
    };

    const cancelApproval = () => {
        setApprovingUser(null);
    };

    const confirmApproval = async () => {
        if (!approvingUser || !approvalExpDate) return;
        const dateObj = new Date(approvalExpDate);
        if (dateObj.getTime() < Date.now()) {
            addToast(t('exp_date_future_error'), "error");
            return;
        }

        await updateUserStatus(approvingUser.id, UserStatus.ACTIVE, dateObj);
        setApprovingUser(null);
        addToast(t('user_approved'), "success");
        fetchData();
    };

    const handleEditClick = (user: User) => {
        setEditingUser(user);
    };

    const handleEditSave = async () => {
        setEditingUser(null);
        await fetchData();
    };

    const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
        const action = newStatus === UserStatus.DELETED ? 'DELETE' : 'UPDATE';
        if (!window.confirm(`${t('confirm_action')} ${action}?`)) return;

        await updateUserStatus(userId, newStatus);
        addToast(`${t('status_updated')} ${newStatus}`, "info");
        fetchData();
    };

    const handlePostAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!annTitle || !annContent) return;
        setPosting(true);

        if (editId) {
            await updateAnnouncement(editId, { title: annTitle, content: annContent });
            addToast(t('announcement_updated'), "success");
        } else {
            await createAnnouncement({
                title: annTitle,
                content: annContent,
                type: 'text',
                isActive: true
            });
            addToast(t('announcement_published'), "success");
        }

        setAnnTitle('');
        setAnnContent('');
        setEditId(null);
        setPosting(false);

        const a = await getAllAnnouncements();
        setAnnouncements(a);
    };

    const handleSaveConfig = async () => {
        setSavingConfig(true);
        try {
            await updateSiteConfig({ landingVideoUrl: videoUrl, logoUrl: logoUrl });
            await refreshConfig(); // Important to update context
            addToast(t('config_saved'), "success");
        } catch (e) {
            addToast(t('config_save_fail'), "error");
        } finally {
            setSavingConfig(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = await uploadImage(file, 'credentials');
            if (url) {
                setLogoUrl(url);
            } else {
                addToast(t('logo_upload_fail'), "error");
            }
        }
    };

    const handleRemoveLogo = () => {
        setLogoUrl('');
    };

    const handleEditAnn = (ann: Announcement) => {
        setEditId(ann.id);
        setAnnTitle(ann.title);
        setAnnContent(ann.content);
    };

    const handleDeleteAnn = async (id: string) => {
        if (!confirm(t('delete_announcement_confirm'))) return;
        await deleteAnnouncement(id);
        addToast(t('announcement_deleted'), "info");
        const a = await getAllAnnouncements();
        setAnnouncements(a);
    };

    const handleCancelEdit = () => {
        setEditId(null);
        setAnnTitle('');
        setAnnContent('');
    }



    return (
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-nothing-black transition-colors">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white dark:bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 flex flex-row md:flex-col shrink-0">
                <div className="p-4 md:p-6 border-r md:border-r-0 border-zinc-200 dark:border-zinc-800 md:border-b">
                    <h2 className="text-lg font-bold text-black dark:text-white tracking-widest uppercase">{t('administration')}</h2>
                    <p className="text-xs text-zinc-500 mt-1">{t('control_center')}</p>
                </div>

                <nav className="flex-1 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 md:flex-none px-6 py-4 text-left text-sm font-bold uppercase tracking-wider transition-colors border-b-2 md:border-b-0 md:border-l-2 ${activeTab === 'users' ? 'border-black dark:border-white text-black dark:text-white bg-zinc-50 dark:bg-zinc-800' : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'}`}
                    >
                        {t('members')}
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`flex-1 md:flex-none px-6 py-4 text-left text-sm font-bold uppercase tracking-wider transition-colors border-b-2 md:border-b-0 md:border-l-2 ${activeTab === 'content' ? 'border-black dark:border-white text-black dark:text-white bg-zinc-50 dark:bg-zinc-800' : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white'}`}
                    >
                        {t('content_config')}
                    </button>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <>
                        {activeTab === 'users' && (
                            <div className="space-y-8 animate-fadeIn">
                                {/* Filter Bar */}
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-sm shadow-sm mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                                        <div className="md:col-span-1">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">{t('filter_email')}</label>
                                            <Input
                                                value={filterEmail}
                                                onChange={e => setFilterEmail(e.target.value)}
                                                prefix={<Icons.Search className="w-4 h-4 text-zinc-400" />}
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">{t('filter_country')}</label>
                                            <Select
                                                showSearch
                                                style={{ width: '100%' }}
                                                optionFilterProp="children"
                                                value={filterCountry}
                                                onChange={setFilterCountry}
                                                filterOption={(input, option) =>
                                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                }
                                                options={Country.getAllCountries().map(c => ({ value: c.name, label: c.name }))}
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">{t('filter_city')}</label>
                                            <Select
                                                showSearch
                                                style={{ width: '100%' }}
                                                optionFilterProp="children"
                                                value={filterCity}
                                                onChange={setFilterCity}
                                                disabled={!countryCode}
                                                filterOption={(input, option) =>
                                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                }
                                                options={countryCode ? City.getCitiesOfCountry(countryCode)?.map(c => ({ value: c.name, label: c.name })) : []}
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">{t('filter_role')}</label>
                                            <Select
                                                allowClear
                                                style={{ width: '100%' }}
                                                placeholder={t('filter_role')}
                                                value={filterRole}
                                                onChange={setFilterRole}
                                                options={[
                                                    { value: UserRole.USER, label: t('USER') },
                                                    { value: UserRole.ADMIN, label: t('ADMIN') }
                                                ]}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">{t('expiration_date')}</label>
                                            <DatePicker.RangePicker
                                                style={{ width: '100%' }}
                                                value={filterDateRange}
                                                onChange={setFilterDateRange}
                                            />
                                        </div>
                                        <div className="md:col-span-1 flex gap-2">
                                            <AntButton type="primary" onClick={handleSearch} block>
                                                Search
                                            </AntButton>
                                            <AntButton onClick={clearFilters}>
                                                Clear
                                            </AntButton>
                                        </div>
                                    </div>
                                </div>

                                {/* Approval Modals & Logic remain same */}
                                {approvingUser && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-sm w-full max-w-md shadow-2xl">
                                            <h3 className="text-xl font-bold mb-2 text-black dark:text-white">{t('approve').toUpperCase()}</h3>
                                            <p className="text-sm text-zinc-500 mb-6">{t('set_expiration_for')} <span className="font-bold">{approvingUser.nickname}</span>.</p>

                                            <div className="mb-6">
                                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t('expiration_date')}</label>
                                                <DatePicker
                                                    value={approvalExpDate ? dayjs(approvalExpDate) : null}
                                                    onChange={(date) => setApprovalExpDate(date ? date.format('YYYY-MM-DD') : '')}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>

                                            <div className="flex gap-3">
                                                <Button variant="secondary" onClick={cancelApproval} className="flex-1">{t('cancel')}</Button>
                                                <Button variant="primary" onClick={confirmApproval} className="flex-1">{t('approve')}</Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {editingUser && (
                                    <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleEditSave} />
                                )}

                                {/* Pending Section */}
                                {newApplications.length > 0 && (
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                            <Badge variant="dot" />
                                            <h2 className="text-lg font-bold text-black dark:text-white tracking-widest uppercase">{t('new_applications')}</h2>
                                        </div>
                                        <UserTable users={newApplications} onStatusChange={handleStatusChange} onEdit={handleEditClick} onApprove={initiateApproval} />
                                    </div>
                                )}

                                {renewalApplications.length > 0 && (
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                            <Badge variant="dot" />
                                            <h2 className="text-lg font-bold text-black dark:text-white tracking-widest uppercase">{t('renewal_requests')}</h2>
                                        </div>
                                        <UserTable users={renewalApplications} onStatusChange={handleStatusChange} onEdit={handleEditClick} onApprove={initiateApproval} isRenewal />
                                    </div>
                                )}

                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-6 shadow-sm">
                                    <h2 className="text-lg font-bold text-zinc-500 dark:text-zinc-400 tracking-widest uppercase mb-6">{t('member_database')}</h2>
                                    <UserTable users={activeUsers} onStatusChange={handleStatusChange} onEdit={handleEditClick} onApprove={initiateApproval} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div className="space-y-10 max-w-7xl mx-auto animate-fadeIn pb-12">

                                {/* 1. Global Site Config Section */}
                                <section className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-sm border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
                                    <div className="flex items-center justify-between mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-black dark:text-white uppercase tracking-wider">{t('site_config')}</h3>
                                            <p className="text-xs text-zinc-500 mt-1">{t('general_settings_desc')}</p>
                                        </div>
                                        <Button onClick={handleSaveConfig} isLoading={savingConfig}>{t('save_changes')}</Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">{t('video_url')}</label>
                                            <input
                                                value={videoUrl}
                                                onChange={(e) => setVideoUrl(e.target.value)}
                                                    placeholder={t('youtube_url_placeholder')}
                                                className="w-full bg-gray-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 p-3 text-sm text-black dark:text-white rounded-sm focus:border-black dark:focus:border-white outline-none transition-colors"
                                            />
                                            <p className="text-[10px] text-zinc-500 mt-2">{t('video_hint')}</p>
                                        </div>

                                        {/* Logo Upload Section */}
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">{t('logo_upload')}</label>

                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-gray-100 dark:bg-black border border-zinc-300 dark:border-zinc-700 flex items-center justify-center rounded-sm overflow-hidden">
                                                    {logoUrl ? (
                                                        <img src={logoUrl} alt="Site Logo" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Icons.Logo className="w-8 h-8 text-zinc-400" />
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <input
                                                        type="file"
                                                        ref={logoInputRef}
                                                        onChange={handleLogoUpload}
                                                        accept="image/*"
                                                        className="hidden"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="secondary" onClick={() => logoInputRef.current?.click()} leftIcon={<Icons.Upload className="w-3 h-3" />}>
                                                            Upload
                                                        </Button>
                                                        {logoUrl && (
                                                            <Button size="sm" variant="danger" onClick={handleRemoveLogo}>
                                                                Remove
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-zinc-500 mt-2">{t('logo_desc')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* 2. Announcements Section */}
                                <section>
                                    <h3 className="text-lg font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-6 px-1">{t('announcements_comm')}</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                                        {/* Editor Column (40%) */}
                                        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-sm border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors sticky top-8">
                                            <h3 className="text-md font-bold text-black dark:text-white mb-6 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                                {editId ? t('edit_announcement') : t('new_announcement')}
                                            </h3>
                                            <fieldset disabled={posting} className="space-y-6">
                                                <form onSubmit={handlePostAnnouncement} className="space-y-6">
                                                    <div>
                                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">{t('title')}</label>
                                                        <input
                                                            value={annTitle}
                                                            onChange={e => setAnnTitle(e.target.value)}
                                                            className="w-full bg-gray-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 p-3 text-black dark:text-white rounded-sm focus:border-black dark:focus:border-white outline-none disabled:opacity-50 transition-colors"
                                                                placeholder={t('announcement_title_placeholder')}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">{t('content')}</label>
                                                        <textarea
                                                            value={annContent}
                                                            onChange={e => setAnnContent(e.target.value)}
                                                            className="w-full h-48 bg-gray-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 p-3 text-black dark:text-white rounded-sm focus:border-black dark:focus:border-white outline-none resize-none disabled:opacity-50 transition-colors"
                                                                placeholder={t('announcement_content_placeholder')}
                                                        />
                                                    </div>
                                                    <div className="flex gap-3 pt-2">
                                                        {editId && <Button variant="secondary" onClick={handleCancelEdit} className="flex-1" disabled={posting}>{t('cancel')}</Button>}
                                                        <Button variant="primary" type="submit" isLoading={posting} className="flex-1">{editId ? t('update') : t('publish')}</Button>
                                                    </div>
                                                </form>
                                            </fieldset>
                                        </div>

                                        {/* History List Column (60%) */}
                                        <div className="lg:col-span-7 space-y-4">
                                            <div className="flex items-center justify-between mb-2 px-1">
                                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('history')}</h4>
                                                <span className="text-xs text-zinc-400">{announcements.length} {t('records')}</span>
                                            </div>

                                            {announcements.length === 0 && (
                                                <div className="text-zinc-400 text-sm italic p-8 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-sm text-center">
                                                    {t('no_announcements')}
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                {announcements.map(ann => (
                                                    <div key={ann.id} className="bg-white dark:bg-zinc-900 p-6 rounded-sm border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all shadow-sm group">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <h4 className="font-bold text-black dark:text-white text-lg">{ann.title}</h4>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-mono text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded-sm">
                                                                    {new Date(ann.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap mb-4">{ann.content}</p>

                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="sm" onClick={() => handleEditAnn(ann)}>
                                                                <Icons.Sun className="w-3 h-3 mr-1" /> {t('edit')}
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAnn(ann.id)} className="text-red-500 hover:text-red-600">
                                                                <Icons.Trash className="w-3 h-3 mr-1" /> {t('delete')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const UserTable = ({ users, onStatusChange, onEdit, onApprove, isRenewal = false }: {
    users: User[],
    onStatusChange: (id: string, s: UserStatus) => void,
    onEdit: (user: User) => void,
    onApprove: (user: User) => void,
    isRenewal?: boolean
}) => {
    const { t } = useApp();

    const columns: ColumnsType<User> = [
        {
            title: t('user_col'),
            key: 'user',
            render: (_, user) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        {user.avatarUrl && <img src={user.avatarUrl} className="w-6 h-6 rounded-full object-cover" />}
                        <span className="font-bold">{user.nickname}</span>
                    </div>
                    <span className="text-xs text-zinc-500">{user.email}</span>
                    {user.country && <span className="text-[10px] text-zinc-400">{user.city ? `${user.city}, ` : ''}{user.country}</span>}
                </div>
            ),
        },
        {
            title: t('profession_tags'),
            key: 'tags',
            render: (_, user) => (
                <div className="flex flex-wrap gap-1">
                    {user.jobTags && user.jobTags.length > 0 ? user.jobTags.map(tag => (
                        <Tag key={tag}>{tag}</Tag>
                    )) : <span className="text-xs text-zinc-400">-</span>}
                </div>
            ),
        },
        {
            title: t('credential_upload'),
            key: 'credential',
            render: (_, user) => (
                user.credentialUrl ? (
                    <div>
                        <ImagePreview
                            src={user.credentialUrl}
                            alt="Credential"
                            className="inline-block"
                            thumbnailClassName="h-8 w-auto border border-zinc-300 dark:border-zinc-700 rounded-sm"
                        />
                        {isRenewal && <span className="text-[10px] ml-1 text-red-500 font-bold align-middle">NEW</span>}
                    </div>
                ) : <span className="text-xs text-zinc-400">-</span>
            ),
        },
        {
            title: t('role'),
            dataIndex: 'role',
            key: 'role',
            render: (role) => <Tag color={role === 'ADMIN' ? 'gold' : 'default'}>{role}</Tag>,
        },
        {
            title: t('last_login'),
            key: 'lastLogin',
            render: (_, user) => (
                <span className="text-xs text-zinc-500">
                    {user.lastLogin ? dayjs(user.lastLogin).format('YYYY-MM-DD HH:mm') : '-'}
                </span>
            ),
        },
        {
            title: t('status'),
            key: 'status',
            render: (_, user) => (
                <div className="flex flex-col items-start gap-1">
                    <Tag color={
                        user.status === UserStatus.ACTIVE ? 'green' :
                            user.status === UserStatus.REJECTED ? 'red' :
                                user.status === UserStatus.DELETED ? 'default' :
                                    user.status === UserStatus.EXPIRED ? 'orange' : 'gold'
                    }>
                        {t(user.status)}
                    </Tag>
                    {user.expirationDate && (
                        <span className="text-[10px] text-zinc-400">
                            {dayjs(user.expirationDate).format('YYYY-MM-DD')}
                        </span>
                    )}
                </div>
            ),
        },
        {
            title: t('actions_col'),
            key: 'actions',
            fixed: 'right',
            width: 200,
            render: (_, user) => (
                <Space size="small">
                    {user.status === UserStatus.PENDING && (
                        <>
                            <AntButton size="small" type="primary" onClick={() => onApprove(user)}>{t('approve')}</AntButton>
                            <AntButton size="small" danger onClick={() => onStatusChange(user.id, UserStatus.REJECTED)}>{t('reject')}</AntButton>
                        </>
                    )}

                    {(user.status !== UserStatus.PENDING && user.status !== UserStatus.DELETED) && (
                        <AntButton size="small" onClick={() => onEdit(user)}>{t('edit')}</AntButton>
                    )}

                    {user.status !== UserStatus.DELETED && (
                        <AntButton size="small" danger onClick={() => onStatusChange(user.id, UserStatus.DELETED)}>{t('deactivate')}</AntButton>
                    )}

                    {user.status === UserStatus.DELETED && (
                        <AntButton size="small" onClick={() => onStatusChange(user.id, UserStatus.PENDING)}>{t('restore')}</AntButton>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 10 }}
        />
    );
}

export default AdminDashboard;
