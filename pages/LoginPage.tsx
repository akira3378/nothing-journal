import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sendOtp, verifyOtp, signInWithPassword, getCurrentUser, logout, renewMembership } from '../services/mockBackend';
import { User, UserStatus } from '../types';
import { useApp } from '../utils/i18n';
import { Icons } from '../components/UI';

interface LoginProps {
    onLoginSuccess: (user: User) => void;
}

const LoginPage: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'email' | 'otp' | 'renew'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Renewal State
    const [renewFile, setRenewFile] = useState<File | null>(null);
    const [renewPreview, setRenewPreview] = useState<string | null>(null);
    const [renewalSent, setRenewalSent] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useApp();

    useEffect(() => {
        // Check for messages passed from App.tsx logout logic
        if (location.state && location.state.message) {
            setError(location.state.message);
            // Clear state so it doesn't persist on reload
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await sendOtp(email, false); // false = Login mode (check if exists)
            if (res.success) {
                setStep('otp');
                setCountdown(60);
            } else {
                setError(res.error || 'Failed to send verification code.');
            }
        } catch (err) {
            setError('Network error.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await signInWithPassword(username, password);
            if (!res.success) {
                setError(res.error || t('invalid_credentials'));
                return;
            }

            const user = await getCurrentUser();
            if (!user) {
                setError(t('profile_not_found'));
            } else if (user.status === UserStatus.DELETED || user.status === UserStatus.REJECTED) {
                await logout();
                setError(t('account_unavailable'));
            } else {
                onLoginSuccess(user);
            }
        } catch {
            setError(t('invalid_credentials'));
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await verifyOtp(email, otp);
            if (res.success) {
                // Fetch full user profile to check Status
                const user = await getCurrentUser();

                if (user) {
                    if (user.status === UserStatus.DELETED) {
                        await logout();
                        setError('Account deactivated. Please contact support.');
                    } else if (user.status === UserStatus.REJECTED) {
                        await logout();
                        setError('Application was rejected.');
                    } else if (user.status === UserStatus.EXPIRED) {
                        // Do NOT logout yet, allow them to stay authenticated to upload renewal
                        setStep('renew');
                        setError(''); // Clear error if any
                    } else {
                        onLoginSuccess(user);
                    }
                } else {
                    setError('Failed to retrieve user profile.');
                }
            } else {
                setError(res.error || 'Invalid code.');
            }
        } catch (err) {
            setError('Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setRenewFile(f);
            setRenewPreview(URL.createObjectURL(f));
        }
    };

    const handleSubmitRenewal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!renewFile) return;

        setLoading(true);
        const res = await renewMembership(renewFile);
        setLoading(false);

        if (res.success) {
            setRenewalSent(true);
        } else {
            setError(res.error || "Failed to submit renewal.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-nothing-black px-4 transition-colors duration-300">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-4xl font-bold tracking-tighter text-black dark:text-white">
                        {step === 'renew' ? 'RENEWAL' : t('access_title')}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-500">
                        {step === 'renew' ? 'Update your credential to continue.' : t('enter_void')}
                    </p>
                </div>

                <div className="bg-gray-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-sm backdrop-blur-sm transition-colors shadow-sm dark:shadow-none">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-sm flex items-center">
                            <span className="mr-2"><Icons.AlertTriangle className="w-4 h-4" /></span> {error}
                        </div>
                    )}

                    {step === 'email' && loginMode === 'password' && (
                        <fieldset disabled={loading} className="group">
                            <form onSubmit={handlePasswordLogin} className="space-y-6">
                                <div>
                                    <label htmlFor="username" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('username')}</label>
                                    <input id="username" type="text" required value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" className="mt-1 block w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-sm py-3 px-4 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white" />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('password')}</label>
                                    <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder={t('password_placeholder')} className="mt-1 block w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-sm py-3 px-4 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white" />
                                </div>
                                <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3 px-4 text-sm font-bold rounded-sm text-white dark:text-black bg-black dark:bg-white disabled:opacity-50">
                                    {loading ? t('processing') : t('password_login')}
                                </button>
                                <button type="button" onClick={() => setLoginMode('otp')} className="w-full text-xs text-zinc-500 hover:text-black dark:hover:text-white underline">{t('use_otp')}</button>
                            </form>
                        </fieldset>
                    )}

                    {step === 'email' && loginMode === 'otp' && (
                        <fieldset disabled={loading} className="group">
                            <form onSubmit={handleSendCode} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('email_label')}</label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="mt-1 block w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-sm py-3 px-4 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-700 focus:outline-none focus:border-black dark:focus:border-white transition-colors disabled:opacity-50"
                                        placeholder={t('member_email_placeholder')}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-bold rounded-sm text-white dark:text-black bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading && <span className="animate-spin h-4 w-4 border-2 border-white dark:border-black border-t-transparent rounded-full"></span>}
                                    {loading ? t('processing') : 'SEND CODE'}
                                </button>
                                <button type="button" onClick={() => setLoginMode('password')} className="w-full text-xs text-zinc-500 hover:text-black dark:hover:text-white underline mt-4">{t('use_password')}</button>
                            </form>
                        </fieldset>
                    )}

                    {step === 'otp' && (
                        <fieldset disabled={loading} className="group">
                            <form onSubmit={handleVerify} className="space-y-6">
                                <div className="text-center mb-6">
                                    <p className="text-sm text-zinc-500">{t('link_sent_desc')} <span className="font-bold text-black dark:text-white">{email}</span></p>
                                    <button type="button" onClick={() => setStep('email')} className="text-xs text-blue-500 mt-2 hover:underline">{t('use_diff_email')}</button>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">VERIFICATION CODE</label>
                                        <button
                                            type="button"
                                            onClick={handleSendCode}
                                            disabled={countdown > 0 || loading}
                                            className="text-xs font-bold text-black dark:text-white hover:underline disabled:opacity-50 disabled:no-underline"
                                        >
                                            {countdown > 0 ? `RESEND IN ${countdown}s` : 'RESEND CODE'}
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="mt-1 block w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-sm py-3 px-4 text-black dark:text-white text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-black dark:focus:border-white transition-colors disabled:opacity-50"
                                        placeholder={t('verification_code_placeholder')}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || otp.length < 6}
                                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-bold rounded-sm text-white dark:text-black bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading && <span className="animate-spin h-4 w-4 border-2 border-white dark:border-black border-t-transparent rounded-full"></span>}
                                    {loading ? 'VERIFYING...' : 'ENTER'}
                                </button>
                            </form>
                        </fieldset>
                    )}

                    {step === 'renew' && !renewalSent && (
                        <fieldset disabled={loading} className="group">
                            <form onSubmit={handleSubmitRenewal} className="space-y-6">
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-3 rounded-sm">
                                    <p className="text-xs text-yellow-700 dark:text-yellow-500 leading-relaxed">
                                        <strong>MEMBERSHIP EXPIRED.</strong> To continue using the platform, please upload a new valid credential for administrator review.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('credential_upload')}</label>

                                    {!renewPreview ? (
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-300 dark:border-zinc-800 border-dashed rounded-sm hover:border-zinc-500 dark:hover:border-zinc-600 transition-colors cursor-pointer relative group">
                                            <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                onChange={handleFileChange} />
                                            <div className="space-y-1 text-center pointer-events-none">
                                                <Icons.Camera className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400" />
                                                <div className="flex text-sm text-zinc-500 dark:text-zinc-400 justify-center mt-2">
                                                    <span className="relative cursor-pointer font-medium text-black dark:text-white group-hover:underline">{t('upload_text')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-1 relative border border-zinc-300 dark:border-zinc-700 rounded-sm overflow-hidden group bg-black">
                                            <img src={renewPreview} alt="Preview" className="w-full h-auto max-h-64 object-contain" />
                                            <div className="absolute top-0 right-0 p-2">
                                                <button
                                                    type="button"
                                                    onClick={() => { setRenewFile(null); setRenewPreview(null); }}
                                                    className="bg-black/80 text-white p-1.5 rounded-full hover:bg-red-900 transition-colors border border-zinc-700 disabled:opacity-50"
                                                >
                                                    <Icons.X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !renewFile}
                                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-bold rounded-sm text-white dark:text-black bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading && <span className="animate-spin h-4 w-4 border-2 border-white dark:border-black border-t-transparent rounded-full"></span>}
                                    {loading ? 'SUBMITTING...' : 'SUBMIT RENEWAL'}
                                </button>
                            </form>
                        </fieldset>
                    )}

                    {step === 'renew' && renewalSent && (
                        <div className="text-center space-y-4 py-4">
                            <div className="inline-block p-4 rounded-full bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-900">
                                <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-black dark:text-white">RENEWAL SUBMITTED</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                                An administrator will review your credentials shortly. You will be notified via email upon approval.
                            </p>
                            <button onClick={() => window.location.reload()} className="text-sm font-bold underline decoration-2 text-black dark:text-white mt-4">
                                Return to Login
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default LoginPage;
