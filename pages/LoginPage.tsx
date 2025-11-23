import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp } from '../services/mockBackend';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const LoginPage: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if user was redirected from email
  useEffect(() => {
     // Note: App.tsx handles the actual session restoration. 
     // If session restores, the Route in App.tsx will redirect to /feed.
  }, []);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await sendOtp(email);
      if (res.success) {
        setSent(true);
      } else {
        setError(res.error || 'Failed to send Magic Link');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-nothing-black px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tighter text-white">ACCESS</h2>
          <p className="mt-2 text-sm text-zinc-500">Enter the void.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-sm backdrop-blur-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 text-red-400 text-sm rounded-sm flex items-center">
               <span className="mr-2">⚠️</span> {error}
            </div>
          )}

          {!sent ? (
            <form onSubmit={handleSendLink} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full bg-black border border-zinc-700 rounded-sm py-3 px-4 text-white placeholder-zinc-700 focus:outline-none focus:border-white transition-colors"
                  placeholder="member@nothing.tech"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-bold rounded-sm text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                 {loading && <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>}
                {loading ? 'PROCESSING...' : 'SEND MAGIC LINK'}
              </button>
            </form>
          ) : (
             <div className="text-center space-y-6">
                 <div className="inline-block p-4 rounded-full bg-black border border-zinc-700 animate-pulse">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                 </div>
                 <div>
                     <h3 className="text-xl font-bold text-white">Link Sent</h3>
                     <p className="text-zinc-500 text-sm mt-2">A magic link has been sent to <span className="text-white">{email}</span>.</p>
                     <p className="text-zinc-600 text-xs mt-4 bg-zinc-800/50 p-2 rounded">Click the link in the email to access your account immediately.</p>
                 </div>
                 <button onClick={() => setSent(false)} className="text-xs text-zinc-500 hover:text-white underline">Use different email</button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;