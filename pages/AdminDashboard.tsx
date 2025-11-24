
import React, { useEffect, useState, useRef } from 'react';
import { User, Announcement, UserStatus, UserRole } from '../types';
import { getAdminUsers, updateUserStatus, createAnnouncement, getAllAnnouncements, deleteAnnouncement, updateAnnouncement, updateUser, getSiteConfig, updateSiteConfig, uploadImage } from '../services/mockBackend';
import { useApp } from '../utils/i18n';
import { ImagePreview } from '../components/ImagePreview';
import { Button, Badge, Spinner, useToast, Icons, CustomSelect, CustomDateInput, Card, cn } from '../components/UI';

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
                        <CustomSelect
                            value={role}
                            onChange={setRole}
                            options={[
                                { value: UserRole.USER, label: t('USER') },
                                { value: UserRole.ADMIN, label: t('ADMIN') }
                            ]}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">{t('status')}</label>
                        <CustomSelect
                            value={status}
                            onChange={setStatus}
                            options={[
                                { value: UserStatus.PENDING, label: t('PENDING') },
                                { value: UserStatus.ACTIVE, label: t('ACTIVE') },
                                { value: UserStatus.REJECTED, label: t('REJECTED') },
                                { value: UserStatus.DELETED, label: t('DELETED') },
                                { value: UserStatus.EXPIRED, label: t('EXPIRED') }
                            ]}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">{t('expiration_date')}</label>
                        <CustomDateInput
                            value={expirationDate}
                            onChange={setExpirationDate}
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
            addToast(t('future_date_error'), "error");
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
        if (!window.confirm(t('confirm_action').replace('{action}', action))) return;

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
            addToast(t('config_fail'), "error");
        } finally {
            setSavingConfig(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = await uploadImage(file, 'assets');
            if (url) {
                setLogoUrl(url);
            } else {
                addToast(t('logo_fail'), "error");
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
        if (!confirm(t('delete_ann_confirm'))) return;
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

    const newApplications = users.filter(u => u.status === UserStatus.PENDING && !u.isRenewal);
    const renewalApplications = users.filter(u => u.status === UserStatus.PENDING && u.isRenewal);
    const activeUsers = users.filter(u => u.status !== UserStatus.PENDING);

    return (
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-nothing-black transition-colors">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white dark:bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 flex flex-row md:flex-col shrink-0 sticky top-16 h-auto md:h-[calc(100vh-64px)] z-10">
                <div className="p-4 md:p-6 border-r md:border-r-0 border-zinc-200 dark:border-zinc-800 md:border-b hidden md:block">
                    <h2 className="text-lg font-bold text-black dark:text-white tracking-widest uppercase">{t('administration')}</h2>
                    <p className="text-xs text-zinc-500 mt-1">{t('control_center')}</p>
                </div>

                <nav className="flex-1 flex flex-row md:flex-col overflow-x-auto md:overflow-visible no-scrollbar">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={cn(
                            "flex-1 md:flex-none px-6 py-4 text-left text-sm font-bold uppercase tracking-wider transition-all border-b-2 md:border-b-0 md:border-l-2 whitespace-nowrap",
                            activeTab === 'users'
                                ? 'border-black dark:border-white text-black dark:text-white bg-zinc-50 dark:bg-zinc-800/50'
                                : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
                        )}
                    >
                        {t('members')}
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={cn(
                            "flex-1 md:flex-none px-6 py-4 text-left text-sm font-bold uppercase tracking-wider transition-all border-b-2 md:border-b-0 md:border-l-2 whitespace-nowrap",
                            activeTab === 'content'
                                ? 'border-black dark:border-white text-black dark:text-white bg-zinc-50 dark:bg-zinc-800/50'
                                : 'border-transparent text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
                        )}
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
                            <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
                                {/* Approval Modals & Logic remain same */}
                                {approvingUser && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-sm w-full max-w-md shadow-2xl">
                                            <h3 className="text-xl font-bold mb-2 text-black dark:text-white">{t('approve').toUpperCase()}</h3>
                                            <p className="text-sm text-zinc-500 mb-6">Set expiration for <span className="font-bold">{approvingUser.nickname}</span>.</p>

                                            <div className="mb-6">
                                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t('expiration_date')}</label>
                                                <CustomDateInput
                                                    value={approvalExpDate}
                                                    onChange={setApprovalExpDate}
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
                                    <Card noPadding className="border-l-4 border-l-blue-500">
                                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="dot" />
                                                <h2 className="text-lg font-bold text-black dark:text-white tracking-widest uppercase">{t('new_applications')}</h2>
                                            </div>
                                        </div>
                                        <UserTable users={newApplications} onStatusChange={handleStatusChange} onEdit={handleEditClick} onApprove={initiateApproval} />
                                    </Card>
                                )}

                                {renewalApplications.length > 0 && (
                                    <Card noPadding className="border-l-4 border-l-purple-500">
                                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="dot" />
                                                <h2 className="text-lg font-bold text-black dark:text-white tracking-widest uppercase">{t('renewal_requests')}</h2>
                                            </div>
                                        </div>
                                        <UserTable users={renewalApplications} onStatusChange={handleStatusChange} onEdit={handleEditClick} onApprove={initiateApproval} isRenewal />
                                    </Card>
                                )}

                                <Card noPadding>
                                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                                        <h2 className="text-lg font-bold text-zinc-500 dark:text-zinc-400 tracking-widest uppercase">{t('member_database')}</h2>
                                    </div>
                                    <UserTable users={activeUsers} onStatusChange={handleStatusChange} onEdit={handleEditClick} onApprove={initiateApproval} />
                                </Card>
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div className="space-y-10 max-w-7xl mx-auto animate-fadeIn pb-12">

                                {/* 1. Global Site Config Section */}
                                <Card>
                                    <div className="flex items-center justify-between mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-black dark:text-white uppercase tracking-wider">{t('site_config')}</h3>
                                            <p className="text-xs text-zinc-500 mt-1">{t('site_config_desc')}</p>
                                        </div>
                                        <Button onClick={handleSaveConfig} isLoading={savingConfig}>{t('save_changes')}</Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">{t('video_url')}</label>
                                            <input
                                                value={videoUrl}
                                                onChange={(e) => setVideoUrl(e.target.value)}
                                                placeholder="https://youtu.be/..."
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
                                </Card>

                                {/* 2. Announcements Section */}
                                <section>
                                    <h3 className="text-lg font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-6 px-1">{t('announcements_comm')}</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                                        {/* Editor Column (40%) */}
                                        <div className="lg:col-span-5 sticky top-24">
                                            <Card>
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
                                                                placeholder="Enter headline..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">{t('content')}</label>
                                                            <textarea
                                                                value={annContent}
                                                                onChange={e => setAnnContent(e.target.value)}
                                                                className="w-full h-48 bg-gray-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 p-3 text-black dark:text-white rounded-sm focus:border-black dark:focus:border-white outline-none resize-none disabled:opacity-50 transition-colors"
                                                                placeholder="Write your message here..."
                                                            />
                                                        </div>
                                                        <div className="flex gap-3 pt-2">
                                                            {editId && <Button variant="secondary" onClick={handleCancelEdit} className="flex-1" disabled={posting}>{t('cancel')}</Button>}
                                                            <Button variant="primary" type="submit" isLoading={posting} className="flex-1">{editId ? t('update') : t('publish')}</Button>
                                                        </div>
                                                    </form>
                                                </fieldset>
                                            </Card>
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
                                                    <Card key={ann.id} className="group hover:border-zinc-400 dark:hover:border-zinc-600 transition-all">
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
                                                    </Card>
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
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm border-collapse">
                <thead className="bg-zinc-100 dark:bg-zinc-900/50 text-xs font-mono uppercase tracking-wider text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                        <th className="px-6 py-3 font-medium">User</th>
                        <th className="px-6 py-3 font-medium">Info</th>
                        <th className="px-6 py-3 font-medium">{t('role')}</th>
                        <th className="px-6 py-3 font-medium">{t('status')}</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {users.map((user) => (
                        <tr key={user.id} className={`group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30 ${user.status === UserStatus.DELETED ? 'opacity-50 grayscale' : ''}`}>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold">{user.nickname?.charAt(0)}</div>}
                                    </div>
                                    <div>
                                        <div className="font-bold text-black dark:text-white text-sm">{user.nickname}</div>
                                        <div className="text-xs text-zinc-500 font-mono">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex flex-wrap gap-1">
                                        {user.jobTags && user.jobTags.length > 0 ? user.jobTags.map(tag => (
                                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-sm text-zinc-600 dark:text-zinc-400 font-mono">{tag}</span>
                                        )) : <span className="text-xs text-zinc-400">-</span>}
                                    </div>
                                    {user.credentialUrl && (
                                        <div className="flex items-center gap-2">
                                            <ImagePreview
                                                src={user.credentialUrl}
                                                alt="Credential"
                                                className="inline-block"
                                                thumbnailClassName="h-6 w-auto border border-zinc-200 dark:border-zinc-700 rounded-sm hover:scale-150 transition-transform origin-left"
                                            />
                                            {isRenewal && <span className="text-[10px] font-bold text-blue-500 animate-pulse">NEW</span>}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                                {t(user.role)}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col items-start gap-1">
                                    <span className={cn(
                                        "inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border",
                                        user.status === UserStatus.ACTIVE ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900' :
                                            user.status === UserStatus.REJECTED ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900' :
                                                user.status === UserStatus.DELETED ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700' :
                                                    user.status === UserStatus.EXPIRED ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900' :
                                                        'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900'
                                    )}>
                                        {t(user.status)}
                                    </span>
                                    {user.expirationDate && (
                                        <span className="text-[10px] text-zinc-400 font-mono">
                                            Exp: {new Date(user.expirationDate).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {user.status === UserStatus.PENDING && (
                                        <>
                                            <Button size="sm" onClick={() => onApprove(user)} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20">{t('approve')}</Button>
                                            <Button size="sm" variant="danger" onClick={() => onStatusChange(user.id, UserStatus.REJECTED)}>{t('reject')}</Button>
                                        </>
                                    )}

                                    {(user.status !== UserStatus.PENDING && user.status !== UserStatus.DELETED) && (
                                        <Button size="sm" variant="ghost" onClick={() => onEdit(user)}>{t('edit')}</Button>
                                    )}

                                    {user.status !== UserStatus.DELETED && (
                                        <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-red-500" onClick={() => onStatusChange(user.id, UserStatus.DELETED)}><Icons.Trash className="w-3 h-3" /></Button>
                                    )}

                                    {user.status === UserStatus.DELETED && (
                                        <Button size="sm" variant="ghost" onClick={() => onStatusChange(user.id, UserStatus.PENDING)}>{t('restore')}</Button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminDashboard;
