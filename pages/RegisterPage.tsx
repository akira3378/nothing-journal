import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp, createProfile, getSession, logout } from '../services/mockBackend';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State to track if we are in "Email" mode or "Onboarding" mode
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Form State
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // UI State
  const [step, setStep] = useState<'enter_email' | 'email_sent' | 'onboarding'>('enter_email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for existing session on mount
  useEffect(() => {
      const check = async () => {
          const session = await getSession();
          if (session) {
              setIsAuthenticated(true);
              setStep('onboarding');
              setEmail(session.user.email || '');
          }
          setCheckingAuth(false);
      };
      check();
  }, []);

  useEffect(() => {
    return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleAddTag = () => {
    if (tags.length >= 3) return;
    const val = tagInput.trim();
    if (val && val.length <= 10 && !tags.includes(val)) {
      setTags([...tags, val]);
      setTagInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const selectedFile = e.target.files[0];
          setFile(selectedFile);
          const url = URL.createObjectURL(selectedFile);
          setPreviewUrl(url);
      }
  };

  // Step 1: Send Magic Link
  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await sendOtp(email, true); // true = isRegistration
      if (res.success) {
        setStep('email_sent');
      } else {
        setError(res.error || 'Could not send verification code.');
      }
    } catch (err) {
      setError('System error.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Create Profile (After Magic Link Click)
  const handleCompleteProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (tags.length === 0) {
        setError('Please add at least one profession tag.');
        return;
      }
      if (!file) {
        setError('Membership credential image is required.');
        return;
      }

      setLoading(true);

      try {
          const res = await createProfile({
              nickname,
              jobTags: tags,
              credentialFile: file
          });

          if (res.success) {
              // Force reload to update App.tsx state
              window.location.reload();
          } else {
              setError(res.error || 'Profile creation failed.');
          }
      } catch (err) {
          setError('Failed to connect to server.');
      } finally {
          setLoading(false);
      }
  };

  const handleCancelOnboarding = async () => {
      await logout();
      window.location.reload();
  };

  if (checkingAuth) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">LOADING...</div>;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-xl w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tighter text-white">
              {step === 'onboarding' ? 'COMPLETE REGISTRATION' : 'APPLY FOR MEMBERSHIP'}
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
              {step === 'onboarding' ? `Authenticated as ${email}` : 'Join the 2,000.'}
          </p>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-sm backdrop-blur-sm">
           {error && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-800 text-red-400 text-sm rounded-sm flex items-center">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          {step === 'enter_email' && (
            <form onSubmit={handleSendLink} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="mt-1 block w-full bg-black border border-zinc-700 rounded-sm py-3 px-4 text-white focus:border-white focus:outline-none transition-colors placeholder-zinc-700" placeholder="you@example.com" />
              </div>
               <div className="bg-yellow-900/10 border border-yellow-900/30 p-3 rounded-sm">
                   <p className="text-xs text-yellow-500 leading-relaxed">
                       <strong>Security Notice:</strong> We use Magic Links for passwordless access. Anyone with the link can access your account. Do not share the email link with anyone.
                   </p>
               </div>

              <button type="submit" disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent text-sm font-bold rounded-sm text-black bg-white hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'SENDING...' : 'SEND VERIFICATION LINK'}
              </button>
            </form>
          )}

          {step === 'email_sent' && (
            <div className="text-center space-y-6">
                <div className="inline-block p-4 rounded-full bg-black border border-zinc-700 animate-pulse">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Check your email</h3>
                    <p className="text-zinc-500 text-sm mt-2">We've sent a confirmation link to <span className="text-white">{email}</span>.</p>
                    <p className="text-zinc-400 text-xs mt-4 bg-zinc-900 p-2 rounded border border-zinc-800">
                       Click the link in the email to return here and complete your profile setup.
                    </p>
                </div>
            </div>
          )}

          {step === 'onboarding' && (
            <form onSubmit={handleCompleteProfile} className="space-y-6">
                {/* Nickname */}
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Nickname</label>
                    <input type="text" required value={nickname} onChange={e => setNickname(e.target.value)}
                    className="mt-1 block w-full bg-black border border-zinc-700 rounded-sm py-3 px-4 text-white focus:border-white focus:outline-none transition-colors placeholder-zinc-700" placeholder="CyberPunk2077" />
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Profession / Identity (Max 3)</label>
                    <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
                    {tags.map(tag => (
                        <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-bold bg-white text-black border border-white animate-fadeIn">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-zinc-500 hover:text-red-500 font-bold">×</button>
                        </span>
                    ))}
                    </div>
                    <div className="flex gap-2">
                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleKeyDown}
                        disabled={tags.length >= 3}
                        placeholder={tags.length >= 3 ? "Max tags reached" : "Type and press Enter"}
                        className="flex-1 bg-black border border-zinc-700 rounded-sm py-2 px-4 text-white text-sm focus:border-white focus:outline-none disabled:opacity-50 transition-colors" />
                    <button type="button" onClick={handleAddTag} disabled={tags.length >= 3}
                        className="bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-sm text-white text-sm hover:bg-zinc-700 disabled:opacity-50 font-bold transition-colors">ADD</button>
                    </div>
                </div>

                {/* Credential Image */}
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Credential Upload</label>
                    
                    {!previewUrl ? (
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-800 border-dashed rounded-sm hover:border-zinc-600 transition-colors cursor-pointer relative group">
                            <input id="file-upload" name="file-upload" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                onChange={handleFileChange} />
                            <div className="space-y-1 text-center pointer-events-none">
                                <svg className="mx-auto h-12 w-12 text-zinc-600 group-hover:text-zinc-400 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-zinc-400 justify-center">
                                    <span className="relative cursor-pointer font-medium text-white group-hover:underline">Upload Image</span>
                                </div>
                                <p className="text-xs text-zinc-600">PNG, JPG up to 10MB</p>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-1 relative border border-zinc-700 rounded-sm overflow-hidden group bg-black">
                            <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-64 object-contain" />
                            <div className="absolute top-0 right-0 p-2">
                                <button 
                                    type="button"
                                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                                    className="bg-black/80 text-white p-1.5 rounded-full hover:bg-red-900 transition-colors border border-zinc-700"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    <button type="button" onClick={handleCancelOnboarding} className="px-4 py-4 bg-zinc-800 text-white text-sm font-bold rounded-sm hover:bg-zinc-700">
                        CANCEL
                    </button>
                    <button type="submit" disabled={loading}
                        className="flex-1 flex justify-center items-center gap-2 py-4 px-4 border border-transparent text-sm font-bold rounded-sm text-black bg-white hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading && <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>}
                        {loading ? 'FINALIZING...' : 'COMPLETE REGISTRATION'}
                    </button>
                </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;