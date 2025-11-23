import React, { useEffect, useState } from 'react';
import { User, Announcement, UserStatus } from '../types';
import { getAdminUsers, updateUserStatus, createAnnouncement, getAllAnnouncements } from '../services/mockBackend';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'announcements'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Announcement Form
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
    // Silent refresh
    const u = await getAdminUsers();
    setUsers(u);
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    setPosting(true);
    await createAnnouncement({
        title: annTitle,
        content: annContent,
        type: 'text',
        isActive: true
    });
    setAnnTitle('');
    setAnnContent('');
    setPosting(false);
    
    const a = await getAllAnnouncements();
    setAnnouncements(a);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">ADMINISTRATION</h1>
        <div className="flex space-x-2">
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-sm text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>MEMBERS</button>
            <button onClick={() => setActiveTab('announcements')} className={`px-4 py-2 rounded-sm text-sm font-bold transition-colors ${activeTab === 'announcements' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}>ANNOUNCEMENTS</button>
        </div>
      </div>

      {loading ? (
         // Loading Skeleton
         <div className="w-full space-y-4">
            <div className="h-12 bg-zinc-900/50 rounded-sm animate-pulse"></div>
            <div className="h-64 bg-zinc-900/50 border border-zinc-800 rounded-sm animate-pulse flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin h-6 w-6 border-2 border-zinc-600 border-t-transparent rounded-full"></div>
                    <div className="text-zinc-600 font-mono text-xs">FETCHING SYSTEM DATA...</div>
                </div>
            </div>
         </div>
      ) : (
        <>
          {activeTab === 'users' ? (
            <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-sm">
              <table className="min-w-full text-left text-sm text-zinc-400">
                <thead className="bg-black text-zinc-200 font-bold uppercase">
                  <tr>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Nickname</th>
                    <th className="px-6 py-4">Tags</th>
                    <th className="px-6 py-4">Credential</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {users.map((user) => (
                    <tr key={user.id} className={`transition-colors ${user.status === UserStatus.DELETED ? 'opacity-40 grayscale bg-zinc-950' : 'hover:bg-zinc-800/50'}`}>
                      <td className="px-6 py-4 font-medium text-white">
                          {user.email}
                          {user.status === UserStatus.DELETED && <span className="ml-2 text-xs text-red-500 font-bold">(DELETED)</span>}
                      </td>
                      <td className="px-6 py-4">{user.nickname}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                            {user.jobTags.map(t => <span key={t} className="text-xs border border-zinc-700 px-1 rounded">{t}</span>)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.credentialUrl && (
                            <a href={user.credentialUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                View
                            </a>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.status === UserStatus.ACTIVE ? 'bg-green-900 text-green-200' : 
                            user.status === UserStatus.REJECTED ? 'bg-red-900 text-red-200' : 
                            user.status === UserStatus.DELETED ? 'bg-zinc-800 text-zinc-500' :
                            'bg-yellow-900 text-yellow-200'
                        }`}>
                            {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex flex-wrap gap-2">
                        {user.status === UserStatus.PENDING && (
                            <>
                                <button onClick={() => handleStatusChange(user.id, UserStatus.ACTIVE)} className="text-green-400 hover:text-green-300 border border-green-900 hover:bg-green-900/30 px-2 py-1 rounded-sm transition-colors">Approve</button>
                                <button onClick={() => handleStatusChange(user.id, UserStatus.REJECTED)} className="text-red-400 hover:text-red-300 border border-red-900 hover:bg-red-900/30 px-2 py-1 rounded-sm transition-colors">Reject</button>
                            </>
                        )}
                        
                        {user.status === UserStatus.ACTIVE && (
                            <button onClick={() => handleStatusChange(user.id, UserStatus.REJECTED)} className="text-yellow-400 hover:text-yellow-300 text-xs border border-transparent hover:border-yellow-900 px-2 py-1 rounded-sm transition-colors">Suspend</button>
                        )}

                        {/* Soft Delete Button */}
                        {user.status !== UserStatus.DELETED && user.role !== 'ADMIN' && (
                            <button onClick={() => handleStatusChange(user.id, UserStatus.DELETED)} className="text-white bg-red-900/50 hover:bg-red-900 px-2 py-1 rounded-sm text-xs transition-colors border border-red-900">
                                Delete
                            </button>
                        )}
                        
                        {/* Restore Button for Deleted Users (Optional but good for UX) */}
                        {user.status === UserStatus.DELETED && (
                             <button onClick={() => handleStatusChange(user.id, UserStatus.ACTIVE)} className="text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded-sm text-xs transition-colors">
                                Restore
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
                <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-sm border border-zinc-800">
                    <h3 className="text-xl font-bold text-white mb-4">New Announcement</h3>
                    <form onSubmit={handlePostAnnouncement} className="space-y-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Title</label>
                            <input value={annTitle} onChange={e => setAnnTitle(e.target.value)} className="w-full bg-black border border-zinc-700 p-2 text-white rounded-sm focus:border-white outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Content</label>
                            <textarea value={annContent} onChange={e => setAnnContent(e.target.value)} className="w-full h-32 bg-black border border-zinc-700 p-2 text-white rounded-sm focus:border-white outline-none resize-none" />
                        </div>
                        <button type="submit" disabled={posting} className="w-full bg-white text-black font-bold py-2 rounded-sm hover:bg-gray-200 flex justify-center items-center gap-2">
                            {posting && <span className="animate-spin h-3 w-3 border-2 border-black border-t-transparent rounded-full"></span>}
                            PUBLISH
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold text-white mb-4">History</h3>
                    {announcements.map(ann => (
                        <div key={ann.id} className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800 hover:border-zinc-600 transition-colors">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-white">{ann.title}</h4>
                                <span className="text-xs text-zinc-500">{new Date(ann.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-zinc-400 text-sm mt-2">{ann.content}</p>
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