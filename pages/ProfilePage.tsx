import React, { useState } from 'react';
import { User } from '../types';
import { updateUserProfile } from '../services/mockBackend';

interface ProfileProps {
  user: User;
}

const ProfilePage: React.FC<ProfileProps> = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(user.nickname);
  const [tags, setTags] = useState<string[]>(user.jobTags);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddTag = () => {
    if (tags.length >= 3) return;
    const val = tagInput.trim();
    if (val && val.length <= 15 && !tags.includes(val)) {
      setTags([...tags, val]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        await updateUserProfile(user.id, { nickname, jobTags: tags });
        setIsEditing(false);
        // We need to reload to fetch the new user state since it's held in App.tsx
        window.location.reload(); 
    } catch (e) {
        alert("Failed to update profile");
    } finally {
        setSaving(false);
    }
  };

  const handleCancel = () => {
      setNickname(user.nickname);
      setTags(user.jobTags);
      setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-8 md:p-12 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-bold select-none text-white">
            ID
         </div>
         
         {/* Edit Toggle */}
         <div className="absolute top-4 right-4 z-20">
             {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="text-zinc-400 hover:text-white text-sm underline decoration-zinc-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    Edit Profile
                </button>
             ) : (
                 <div className="flex gap-2">
                     <button onClick={handleCancel} disabled={saving} className="text-zinc-400 hover:text-white text-xs px-2 py-1">Cancel</button>
                     <button onClick={handleSave} disabled={saving} className="bg-white text-black px-3 py-1 text-xs font-bold rounded-sm hover:bg-zinc-200">
                        {saving ? 'SAVING...' : 'SAVE CHANGES'}
                     </button>
                 </div>
             )}
         </div>

         <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
            <div className="h-32 w-32 md:h-48 md:w-48 bg-black border-2 border-zinc-700 rounded-sm flex items-center justify-center text-4xl text-zinc-500 shrink-0">
               {nickname.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 w-full">
                {isEditing ? (
                    <div className="mb-4">
                        <label className="block text-xs text-zinc-500 mb-1">Nickname</label>
                        <input 
                            value={nickname} 
                            onChange={(e) => setNickname(e.target.value)} 
                            className="text-2xl md:text-3xl font-bold text-white bg-black border border-zinc-600 p-2 w-full rounded-sm focus:border-blue-500 outline-none" 
                        />
                    </div>
                ) : (
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{user.nickname}</h1>
                )}
                
                <p className="text-zinc-400 font-mono mb-6 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    {user.email}
                </p>
                
                <div className="space-y-6">
                    <div>
                        <h4 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Status</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            user.status === 'ACTIVE' ? 'bg-green-900/20 text-green-200 border-green-900' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}>
                            {user.status}
                        </span>
                    </div>

                    <div>
                        <h4 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Identity Tags</h4>
                        <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                                <span key={tag} className="bg-zinc-800 border border-zinc-600 text-white px-3 py-1 rounded-sm text-sm flex items-center gap-2">
                                    {tag}
                                    {isEditing && <button onClick={() => removeTag(tag)} className="text-red-400 text-xs hover:text-red-300 ml-1">×</button>}
                                </span>
                            ))}
                        </div>
                        {isEditing && tags.length < 3 && (
                            <div className="mt-2 flex gap-2 max-w-xs">
                                <input 
                                    value={tagInput} 
                                    onChange={e => setTagInput(e.target.value)} 
                                    onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                                    placeholder="Add tag..." 
                                    className="bg-black border border-zinc-700 text-sm px-3 py-1 text-white flex-1 outline-none focus:border-zinc-500 rounded-sm" 
                                />
                                <button onClick={handleAddTag} className="text-xs bg-zinc-800 px-3 py-1 text-white border border-zinc-700 hover:bg-zinc-700 rounded-sm">Add</button>
                            </div>
                        )}
                    </div>

                    <div>
                         <h4 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Member Since</h4>
                         <p className="text-zinc-300">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
         </div>

         <div className="mt-12 pt-8 border-t border-zinc-800">
            <h3 className="text-xl font-bold text-white mb-4">Membership Credentials</h3>
             {user.credentialUrl ? (
                 <div className="w-full max-w-md bg-black p-2 border border-zinc-800 rounded-sm">
                    <img src={user.credentialUrl} alt="Credential" className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity" />
                 </div>
             ) : (
                 <p className="text-zinc-500">No visual credential on file.</p>
             )}
         </div>
      </div>
    </div>
  );
};

export default ProfilePage;