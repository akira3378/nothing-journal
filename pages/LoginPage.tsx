import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sendOtp, verifyOtp, getCurrentUser, createProfile } from '../services/supabaseBackend';
import { User } from '../types';
import { useApp } from '../utils/i18n';
import { Icons } from '../components/UI';

interface LoginProps {
    onLoginSuccess: (user: User) => void;
}

const LoginPage: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [loginMode, setLoginMode] = useState<'otp' | 'register'>('otp');
    const [registrationNickname, setRegistrationNickname] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

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
            const res = await sendOtp(email);
            if (res.success) {
                setStep('otp');
                setOtp('');
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

    const handleRegisterCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!registrationNickname.trim()) {
            setError(t('nickname_required'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await sendOtp(email, true);
            if (res.success) {
                setStep('otp');
                setOtp('');
                setCountdown(60);
            } else {
                setError(res.error || t('registration_failed'));
            }
        } catch {
            setError(t('registration_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await verifyOtp(email, otp, 'signup');
            if (!res.success) {
                setError(res.error || t('registration_failed'));
                return;
            }

            const profile = await createProfile(registrationNickname);
            if (!profile.success || !profile.data) {
                setError(profile.error || t('profile_creation_failed'));
                return;
            }

            onLoginSuccess(profile.data);
        } catch {
            setError(t('registration_failed'));
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
                // Load the user's profile after authentication.
                const user = await getCurrentUser();

                if (user) onLoginSuccess(user);
                else setError(t('profile_fetch_failed'));
            } else {
                setError(res.error || t('invalid_code'));
            }
        } catch (err) {
            setError(t('verification_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-nothing-black px-4 transition-colors duration-300">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="text-4xl font-bold tracking-tighter text-black dark:text-white">
                        {loginMode === 'register' ? t('register_title') : t('access_title')}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-500">
                        {loginMode === 'register' ? t('register_subtitle') : t('enter_void')}
                    </p>
                </div>

                <div className="bg-gray-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-sm backdrop-blur-sm transition-colors shadow-sm dark:shadow-none">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-sm flex items-center">
                            <span className="mr-2"><Icons.AlertTriangle className="w-4 h-4" /></span> {error}
                        </div>
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
                                        placeholder={t('email_placeholder')}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-bold rounded-sm text-white dark:text-black bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading && <span className="animate-spin h-4 w-4 border-2 border-white dark:border-black border-t-transparent rounded-full"></span>}
                                    {loading ? t('processing') : t('send_code')}
                                </button>
                                <button type="button" onClick={() => setLoginMode('register')} className="w-full text-xs text-zinc-500 hover:text-black dark:hover:text-white underline mt-4">{t('create_account')}</button>
                            </form>
                        </fieldset>
                    )}

                    {step === 'email' && loginMode === 'register' && (
                        <fieldset disabled={loading} className="group">
                            <form onSubmit={handleRegisterCode} className="space-y-6">
                                <div>
                                    <label htmlFor="registration-nickname" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('register_nickname')}</label>
                                    <input id="registration-nickname" type="text" required value={registrationNickname} onChange={e => setRegistrationNickname(e.target.value)} placeholder={t('nickname_placeholder')} className="mt-1 block w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-sm py-3 px-4 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white" />
                                </div>
                                <div>
                                    <label htmlFor="registration-email" className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('email_label')}</label>
                                    <input id="registration-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t('email_placeholder')} className="mt-1 block w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-sm py-3 px-4 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white" />
                                </div>
                                <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3 px-4 text-sm font-bold rounded-sm text-white dark:text-black bg-black dark:bg-white disabled:opacity-50">
                                    {loading ? t('processing') : t('send_code')}
                                </button>
                                <button type="button" onClick={() => setLoginMode('otp')} className="w-full text-xs text-zinc-500 hover:text-black dark:hover:text-white underline">{t('back_to_login')}</button>
                            </form>
                        </fieldset>
                    )}

                    {step === 'otp' && (
                        <fieldset disabled={loading} className="group">
                            <form onSubmit={loginMode === 'register' ? handleRegisterVerify : handleVerify} className="space-y-6">
                                <div className="text-center mb-6">
                                    <p className="text-sm text-zinc-500">{t('link_sent_desc')} <span className="font-bold text-black dark:text-white">{email}</span></p>
                                    <button type="button" onClick={() => setStep('email')} className="text-xs text-blue-500 mt-2 hover:underline">{t('use_diff_email')}</button>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('verification_code')}</label>
                                        <button
                                            type="button"
                                            onClick={loginMode === 'register' ? handleRegisterCode : handleSendCode}
                                            disabled={countdown > 0 || loading}
                                            className="text-xs font-bold text-black dark:text-white hover:underline disabled:opacity-50 disabled:no-underline"
                                        >
                                            {countdown > 0 ? `${t('resend_in')} ${countdown}s` : t('resend_code')}
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
                                    {loading ? t('verifying') : t('enter')}
                                </button>
                            </form>
                        </fieldset>
                    )}

                </div>
            </div>
        </div>
    );
};

export default LoginPage;
