import React, { useEffect, useState } from 'react';
import { User, Announcement, UserStatus, UserRole } from '../types';
import { getAdminUsers, updateUserStatus, createAnnouncement, getAllAnnouncements, deleteAnnouncement, updateAnnouncement, updateUser } from '../services/mockBackend';
import { useApp } from '../utils/i18n';
import { ImagePreview } from '../components/ImagePreview';
import { Button, Badge, Spinner, useToast } from '../components/UI';

// --- Edit User Modal Component ---
interface EditUserModalProps {
    user: User;
    onClose: () => void;
    onSave: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave }) => {
    const { addToast } = useToast();
    const [role, setRole] = useState<UserRole>(user.role);
    const [status, setStatus] = useState<UserStatus>(user.status);
    const initialDate = user.expirationDate 
        ? new Date(user.expirationDate).toISOString().split('T')[0] 
        : '';
    const [expirationDate, setExpirationDate] = useState(initialDate);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateUser(user.id, {
                role,
                status,
                expirationDate: expirationDate || null
            });
            addToast("User updated successfully", "success");
            onSave();
        } catch (e) {
            addToast("Failed to update user", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-sm w-full max-w-lg shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-black dark:text-white">EDIT USER</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
                </div>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nickname</label>
                            <div className="p-2 bg-gray-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sm text-zinc-700 dark:text-zinc-300">
                                {user.nickname}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Email</label>
                            <div className="p-2 bg-gray-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sm text-zinc-700 dark:text-zinc-300 truncate">
                                {user.email}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Role</label>
                        <select 
                            value={role} 
                            onChange={(e) => setRole(e.target.value as UserRole)}
                            className="w-full p-2 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-sm text-black dark:text-white"
                        >
                            <option value={UserRole.USER}>USER</option>
                            <option value={UserRole.ADMIN}>ADMIN</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Status</label>
                        <select 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value as UserStatus)}
                            className="w-full p-2 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-sm text-black dark:text-white"
                        >
                            <option value={UserStatus.PENDING}>PENDING</option>
                            <option value={UserStatus.ACTIVE}>ACTIVE</option>
                            <option value={UserStatus.REJECTED}>REJECTED</option>
                            <option value={UserStatus.DELETED}>DELETED</option>
                            <option value={UserStatus.EXPIRED}>EXPIRED</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Expiration Date</label>
                        <input 
                            type="date" 
                            value={expirationDate}
                            onChange={(e) => setExpirationDate(e.target.value)}
                            className="w-full p-2 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-sm text-black dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <Button variant="secondary" onClick={onClose} className="flex-1">CANCEL</Button>
                    <Button variant="primary" onClick={handleSave} isLoading={loading} className="flex-1">SAVE CHANGES</Button>
                </div>
            </div>
        </div>
    );
};


const AdminDashboard: React.FC = () => {
  const { t } = useApp();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'announcements'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [approvingUser, setApprovingUser] = useState<User | null>(null);
  const [approvalExpDate, setApprovalExpDate] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
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
        addToast("Failed to fetch data", "error");
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
          addToast("Expiration date must be in the future", "error");
          return;
      }

      await updateUserStatus(approvingUser.id, UserStatus.ACTIVE, dateObj);
      setApprovingUser(null);
      addToast("User approved", "success");
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
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    
    await updateUserStatus(userId, newStatus);
    addToast(`User status updated to ${newStatus}`, "info");
    fetchData();
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    setPosting(true);
    
    if (editId) {
        await updateAnnouncement(editId, { title: annTitle, content: annContent });
        addToast("Announcement updated", "success");
    } else {
        await createAnnouncement({
            title: annTitle,
            content: annContent,
            type: 'text',
            isActive: true
        });
        addToast("Announcement published", "success");
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
      addToast("Announcement deleted", "info");
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
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-black dark:text-white">{t('administration')}</h1>
        <div className="flex space-x-2">
            <Button variant={activeTab === 'users' ? 'primary' : 'ghost'} onClick={() => setActiveTab('users')}>{t('members')}</Button>
            <Button variant={activeTab === 'announcements' ? 'primary' : 'ghost'} onClick={() => setActiveTab('announcements')}>{t('announcements')}</Button>
        </div>
      </div>

      {loading ? (
         <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
         </div>
      ) : (
        <>
          {activeTab === 'users' ? (
            <div className="space-y-12">
                {approvingUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-sm w-full max-w-md shadow-2xl">
                            <h3 className="text-xl font-bold mb-2 text-black dark:text-white">APPROVE MEMBER</h3>
                            <p className="text-sm text-zinc-500 mb-6">Set expiration for <span className="font-bold">{approvingUser.nickname}</span>.</p>
                            
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">EXPIRATION DATE</label>
                                <input 
                                    type="date" 
                                    required
                                    value={approvalExpDate}
                                    onChange={(e) => setApprovalExpDate(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 p-3 rounded-sm text-black dark:text-white focus:border-black dark:focus:border-white outline-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={cancelApproval} className="flex-1">CANCEL</Button>
                                <Button variant="primary" onClick={confirmApproval} className="flex-1">CONFIRM</Button>
                            </div>
                        </div>
                    </div>
                )}

                {editingUser && (
                    <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleEditSave} />
                )}

                {newApplications.length > 0 && (
                     <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Badge variant="dot" />
                            <h2 className="text-lg font-bold text-black dark:text-white tracking-widest uppercase">New Applications</h2>
                        </div>
                        <UserTable users={newApplications} onStatusChange={handleStatusChange} onEdit={handleEditClick} onApprove={initiateApproval} />
                     </div>
                )}

                {renewalApplications.length > 0 && (
                     <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Badge variant="dot" />
                            <h2 className="text-lg font-bold text-black dark:text-white tracking-widest uppercase">Renewal Requests</h2>
                        </div>
                        <UserTable users={renewalApplications} onStatusChange={handleStatusChange} onEdit={handleEditClick} onApprove={initiateApproval} isRenewal />
                     </div>
                )}

                <div>
                     <h2 className="text-lg font-bold text-zinc-500 dark:text-zinc-400 tracking-widest uppercase mb-4">Member Database</h2>
                     <UserTable users={activeUsers} onStatusChange={handleStatusChange} onEdit={handleEditClick} onApprove={initiateApproval} />
                </div>
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
                             {editId && <Button variant="secondary" onClick={handleCancelEdit} className="flex-1">{t('cancel')}</Button>}
                             <Button variant="primary" type="submit" isLoading={posting} className="flex-1">{editId ? t('update') : t('publish')}</Button>
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
                                        <Button variant="ghost" size="sm" onClick={() => handleEditAnn(ann)}>{t('edit')}</Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAnn(ann.id)} className="text-red-500">{t('delete')}</Button>
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

const UserTable = ({ users, onStatusChange, onEdit, onApprove, isRenewal = false }: { 
    users: User[], 
    onStatusChange: (id: string, s: UserStatus) => void, 
    onEdit: (user: User) => void,
    onApprove: (user: User) => void,
    isRenewal?: boolean
}) => {
    const { t } = useApp();
    return (
        <div className="overflow-x-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-sm dark:shadow-none transition-colors">
              <table className="min-w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                <thead className="bg-gray-50 dark:bg-black text-black dark:text-zinc-200 font-bold uppercase border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Info</th>
                    <th className="px-6 py-4">{t('role')}</th>
                    <th className="px-6 py-4">{t('status')}</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {users.map((user) => (
                    <tr key={user.id} className={`transition-colors ${user.status === UserStatus.DELETED ? 'opacity-40 grayscale bg-gray-100 dark:bg-zinc-950' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}>
                      <td className="px-6 py-4 font-medium text-black dark:text-white">
                          <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                {user.avatarUrl && <img src={user.avatarUrl} className="w-6 h-6 rounded-full object-cover" />}
                                <span>{user.nickname}</span>
                              </div>
                              <span className="text-xs text-zinc-500">{user.email}</span>
                          </div>
                      </td>
                      <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap gap-1">
                                {user.jobTags && user.jobTags.length > 0 ? user.jobTags.map(tag => (
                                    <Badge key={tag} variant="outline">{tag}</Badge>
                                )) : <span className="text-xs text-zinc-400">-</span>}
                            </div>
                            {user.credentialUrl && (
                                <div className="mt-1">
                                    <ImagePreview 
                                        src={user.credentialUrl} 
                                        alt="Credential"
                                        className="inline-block"
                                        thumbnailClassName="h-6 w-auto border border-zinc-300 dark:border-zinc-700 rounded-sm" 
                                    />
                                    <span className="text-[10px] ml-1 text-zinc-400 align-middle">{isRenewal ? 'NEW' : ''}</span>
                                </div>
                            )}
                          </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {user.role}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                user.status === UserStatus.ACTIVE ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 
                                user.status === UserStatus.REJECTED ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' : 
                                user.status === UserStatus.DELETED ? 'bg-gray-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-500' :
                                user.status === UserStatus.EXPIRED ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                                'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            }`}>
                                {t(user.status)}
                            </span>
                            {user.expirationDate && (
                                <span className="text-[10px] text-zinc-400">
                                    Exp: {new Date(user.expirationDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 flex flex-wrap gap-2">
                        {user.status === UserStatus.PENDING && (
                            <>
                                <Button size="sm" onClick={() => onApprove(user)} className="text-green-600 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20">{t('approve')}</Button>
                                <Button size="sm" variant="danger" onClick={() => onStatusChange(user.id, UserStatus.REJECTED)}>{t('reject')}</Button>
                            </>
                        )}
                        
                        {(user.status !== UserStatus.PENDING && user.status !== UserStatus.DELETED) && (
                            <Button size="sm" variant="secondary" onClick={() => onEdit(user)}>{t('edit')}</Button>
                        )}

                        {user.status !== UserStatus.DELETED && (
                            <Button size="sm" variant="danger" onClick={() => onStatusChange(user.id, UserStatus.DELETED)}>DELETE</Button>
                        )}
                        
                        {user.status === UserStatus.DELETED && (
                             <Button size="sm" variant="secondary" onClick={() => onStatusChange(user.id, UserStatus.PENDING)}>{t('restore')}</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        </div>
    );
}

export default AdminDashboard;