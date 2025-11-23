import React, { useEffect, useState } from 'react';
import { User, Announcement, UserStatus, UserRole } from '../types';
import { getAdminUsers, updateUserStatus, createAnnouncement, getAllAnnouncements, updateUserRole, deleteAnnouncement, updateAnnouncement } from '../services/mockBackend';
import { useApp } from '../utils/i18n';

const AdminDashboard: React.FC = () => {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState<'users' | 'announcements'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Announcement Form
  const [editId, setEditId] = useState<string | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
        const u = await getAdminUsers();
        const a = await getAllAnnouncements();
        setUsers(u);
        setAnnouncements(a);
    } catch (e) {
        console.error("Failed to fetch admin data");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    const action = newStatus === UserStatus.DELETED ? 'DELETE' : 'UPDATE';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    
    await updateUserStatus(userId, newStatus);
    const u = await getAdminUsers();
    setUsers(u);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
      await updateUserRole(userId, newRole as UserRole);
      const u = await getAdminUsers();
      setUsers(u);
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    setPosting(true);
    
    if (editId) {
        await updateAnnouncement(editId, { title: annTitle, content: annContent });
    } else {
        await createAnnouncement({
            title: annTitle,
            content: annContent,
            type: 'text',
            isActive: true
        });
    }

    setAnnTitle('');
    setAnnContent('');
    setEditId(null);
    setPosting(false);
    
    const a = await getAllAnnouncements();
    setAnnouncements(a);
  };

  const handleEditAnn = (ann: Announcement) => {
      setEditId(ann.id);
      setAnnTitle(ann.title);
      setAnnContent(ann.content);
  };

  const handleDeleteAnn = async (id: string) => {
      if(!confirm("Delete this announcement?")) return;
      await deleteAnnouncement(id);
      const a = await getAllAnnouncements();
      setAnnouncements(a);
  };

  const handleCancelEdit = () => {
      setEditId(null);
      setAnnTitle('');
      setAnnContent('');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-black dark:text-white">{t('administration')}</h1>
        <div className="flex space-x-2">
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-sm text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}>{t('members')}</button>
            <button onClick={() => setActiveTab('announcements')} className={`px-4 py-2 rounded-sm text-sm font-bold transition-colors ${activeTab === 'announcements' ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}>{t('announcements')}</button>
        </div>
      </div>

      {loading ? (
         // Loading Skeleton
         <div className="w-full space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-zinc-900/50 rounded-sm animate-pulse"></div>
            <div className="h-64 bg-gray-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-sm animate-pulse flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin h-6 w-6 border-2 border-zinc-400 dark:border-zinc-600 border-t-transparent rounded-full"></div>
                    <div className="text-zinc-500 dark:text-zinc-600 font-mono text-xs">FETCHING SYSTEM DATA...</div>
                </div>
            </div>
         </div>
      ) : (
        <>
          {activeTab === 'users' ? (
            <div className="overflow-x-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-sm dark:shadow-none transition-colors">
              <table className="min-w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                <thead className="bg-gray-50 dark:bg-black text-black dark:text-zinc-200 font-bold uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">{t('nickname')}</th>
                    <th className="px-6 py-4">{t('role')}</th>
                    <th className="px-6 py-4">{t('status')}</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {users.map((user) => (
                    <tr key={user.id} className={`transition-colors ${user.status === UserStatus.DELETED ? 'opacity-40 grayscale bg-gray-100 dark:bg-zinc-950' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}>
                      <td className="px-6 py-4 font-medium text-black dark:text-white">
                          <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                {user.avatarUrl && <img src={user.avatarUrl} className="w-6 h-6 rounded-full object-cover" />}
                                <span>{user.email}</span>
                              </div>
                              {user.credentialUrl && (
                                <a href={user.credentialUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1">{t('view')} Credential</a>
                              )}
                          </div>
                      </td>
                      <td className="px-6 py-4">
                          {user.nickname}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.jobTags.map(t => <span key={t} className="text-[10px] border border-zinc-300 dark:border-zinc-700 px-1 rounded">{t}</span>)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                            value={user.role} 
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-sm px-2 py-1 text-xs outline-none focus:border-black dark:focus:border-white"
                        >
                            <option value="USER">{t('USER')}</option>
                            <option value="ADMIN">{t('ADMIN')}</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.status === UserStatus.ACTIVE ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 
                            user.status === UserStatus.REJECTED ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' : 
                            user.status === UserStatus.DELETED ? 'bg-gray-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-500' :
                            'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        }`}>
                            {t(user.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex flex-wrap gap-2">
                        {user.status === UserStatus.PENDING && (
                            <>
                                <button onClick={() => handleStatusChange(user.id, UserStatus.ACTIVE)} className="text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 border border-green-600 dark:border-green-900 hover:bg-green-50 dark:hover:bg-green-900/30 px-2 py-1 rounded-sm transition-colors">{t('approve')}</button>
                                <button onClick={() => handleStatusChange(user.id, UserStatus.REJECTED)} className="text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 border border-red-600 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded-sm transition-colors">{t('reject')}</button>
                            </>
                        )}
                        
                        {user.status === UserStatus.ACTIVE && (
                            <button onClick={() => handleStatusChange(user.id, UserStatus.REJECTED)} className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 dark:hover:text-yellow-300 text-xs border border-transparent hover:border-yellow-600 dark:hover:border-yellow-900 px-2 py-1 rounded-sm transition-colors">{t('suspend')}</button>
                        )}

                        {user.status !== UserStatus.DELETED && (
                            <button onClick={() => handleStatusChange(user.id, UserStatus.DELETED)} className="text-white bg-red-600 dark:bg-red-900/50 hover:bg-red-700 dark:hover:bg-red-900 px-2 py-1 rounded-sm text-xs transition-colors border border-red-600 dark:border-red-900">
                                {t('delete')}
                            </button>
                        )}
                        
                        {user.status === UserStatus.DELETED && (
                             <button onClick={() => handleStatusChange(user.id, UserStatus.ACTIVE)} className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 px-2 py-1 rounded-sm text-xs transition-colors">
                                {t('restore')}
                             </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 bg-white dark:bg-zinc-900 p-6 rounded-sm border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none transition-colors">
                    <h3 className="text-xl font-bold text-black dark:text-white mb-4">{editId ? t('edit_announcement') : t('new_announcement')}</h3>
                    <form onSubmit={handlePostAnnouncement} className="space-y-4">
                        <div>
                            <label className="block text-sm text-zinc-500 dark:text-zinc-400 mb-1">{t('title')}</label>
                            <input value={annTitle} onChange={e => setAnnTitle(e.target.value)} className="w-full bg-gray-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 p-2 text-black dark:text-white rounded-sm focus:border-black dark:focus:border-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-500 dark:text-zinc-400 mb-1">{t('content')}</label>
                            <textarea value={annContent} onChange={e => setAnnContent(e.target.value)} className="w-full h-32 bg-gray-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 p-2 text-black dark:text-white rounded-sm focus:border-black dark:focus:border-white outline-none resize-none" />
                        </div>
                        <div className="flex gap-2">
                             {editId && (
                                 <button type="button" onClick={handleCancelEdit} className="flex-1 bg-gray-200 dark:bg-zinc-800 text-black dark:text-white font-bold py-2 rounded-sm text-sm">
                                     {t('cancel')}
                                 </button>
                             )}
                             <button type="submit" disabled={posting} className="flex-1 bg-black dark:bg-white text-white dark:text-black font-bold py-2 rounded-sm hover:bg-zinc-800 dark:hover:bg-gray-200 flex justify-center items-center gap-2 transition-colors text-sm">
                                {posting && <span className="animate-spin h-3 w-3 border-2 border-white dark:border-black border-t-transparent rounded-full"></span>}
                                {editId ? t('update') : t('publish')}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold text-black dark:text-white mb-4">{t('history')}</h3>
                    {announcements.map(ann => (
                        <div key={ann.id} className="bg-white dark:bg-zinc-900/50 p-4 rounded-sm border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-sm dark:shadow-none relative group">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-black dark:text-white">{ann.title}</h4>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-zinc-500">{new Date(ann.createdAt).toLocaleDateString()}</span>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <button onClick={() => handleEditAnn(ann)} className="text-xs text-blue-500 hover:underline">{t('edit')}</button>
                                        <button onClick={() => handleDeleteAnn(ann.id)} className="text-xs text-red-500 hover:underline">{t('delete')}</button>
                                    </div>
                                </div>
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-2">{ann.content}</p>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;