import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtp, createProfile, getSession, logout } from '../services/mockBackend';
import { useApp } from '../utils/i18n';
import { Icons } from '../components/UI';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useApp();

    // Form State
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [nickname, setNickname] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    // Files
    const [credFile, setCredFile] = useState<File | null>(null);
    const [credPreview, setCredPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // UI State
    const [step, setStep] = useState<'enter_email' | 'enter_otp' | 'fill_profile' | 'submitted'>('enter_email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    useEffect(() => {
        // Check if session exists (e.g. reload during profile fill)
        const checkSession = async () => {
            const session = await getSession();
            if (session && step === 'enter_email') {
                setStep('fill_profile');
                setEmail(session.user.email || '');
            }
        };
        checkSession();

        return () => {
            if (credPreview) URL.revokeObjectURL(credPreview);
            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        };
    }, []);

    const handleAddTag = () => {
        if (tags.length >= 3) return;
        const val = tagInput.trim();
        if (val && val.length <= 15 && !tags.includes(val)) {
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cred' | 'avatar') => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            const url = URL.createObjectURL(f);
            if (type === 'cred') {
                setCredFile(f);
                setCredPreview(url);
            } else {
                setAvatarFile(f);
                setAvatarPreview(url);
            }
        }
    };

    // Step 1: Send Code
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await sendOtp(email, true); // true = Registration (check if NOT exists)
            if (res.success) {
                setStep('enter_otp');
                setCountdown(60);
            } else {
                setError(res.error || 'Could not send verification code.');
            }
        } catch (err) {
            setError('System error.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify Code
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await verifyOtp(email, otp, 'signup');
            if (res.success) {
                setStep('fill_profile');
            } else {
                setError(res.error || 'Invalid code.');
            }
        } catch (e) {
            setError('Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Create Profile
    const handleCompleteProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (tags.length === 0) {
            setError('Please add at least one profession tag.');
            return;
        }
        if (!credFile) {
            setError('Membership credential image is required.');
            return;
        }

        setLoading(true);

        try {
            const res = await createProfile({
                nickname,
                jobTags: tags,
                credentialFile: credFile,
                avatarFile: avatarFile || undefined
            });

            if (res.success) {
                setStep('submitted');
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

    const handleGoHome = () => {
        navigate('/');
        window.location.reload();
    };

    return (
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex justify-center bg-gray-50 dark:bg-nothing-black transition-colors duration-300">
            <div className="max-w-xl w-full space-y-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tighter text-black dark:text-white">
                        {step === 'fill_profile' ? t('complete_reg') : step === 'submitted' ? t('pending_title') : t('apply_membership')}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-500">
                        {step === 'fill_profile' ? `${email}` : step === 'submitted' ? '' : t('join_2000')}
                    </p>
                </div>

                <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 p-8 rounded-sm backdrop-blur-sm shadow-sm dark:shadow-none transition-colors">
                    {error && (
                        <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-sm flex items-center">
                            <span className="mr-2"><Icons.AlertTriangle className="w-4 h-4" /></span> {error}
                        </div>
                    )}

                    {step === 'enter_email' && (
                        <fieldset disabled={loading} className="group">
                            <form onSubmit={handleSendCode} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('email_label')}</label>
                                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                        className="mt-1 block w-full bg-gray-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-sm py-3 px-4 text-black dark:text-white focus:border-black dark:focus:border-white focus:outline-none transition-colors placeholder-zinc-400 dark:placeholder-zinc-700 disabled:opacity-50" placeholder="you@example.com" />
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-3 rounded-sm">
                                    <p className="text-xs text-yellow-700 dark:text-yellow-500 leading-relaxed">
                                        <strong>{t('security_notice')}</strong> We will verify your email with a one-time code.
                                    </p>
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent text-sm font-bold rounded-sm text-white dark:text-black bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {loading ? t('processing') : 'SEND CODE'}
                                </button>
                            </form>
                        </fieldset>
                    )}

                    {step === 'enter_otp' && (
                        <fieldset disabled={loading} className="group">
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div className="text-center mb-4">
                                    <p className="text-sm text-zinc-500">Code sent to {email}</p>
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
                                        placeholder="000000"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setStep('enter_email')} className="px-4 py-4 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white text-sm font-bold rounded-sm disabled:opacity-50">
                                        BACK
                                    </button>
                                    <button type="submit" disabled={loading || otp.length < 6}
                                        className="flex-1 flex justify-center items-center gap-2 py-4 px-4 border border-transparent text-sm font-bold rounded-sm text-white dark:text-black bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50">
                                        {loading ? t('processing') : 'VERIFY & CONTINUE'}
                                    </button>
                                </div>
                            </form>
                        </fieldset>
                    )}

                    {step === 'fill_profile' && (
                        <fieldset disabled={loading} className="group">
                            <form onSubmit={handleCompleteProfile} className="space-y-6 animate-fadeIn">

                                {/* Avatar */}
                                <div className="flex justify-center mb-6">
                                    <div className="relative group cursor-pointer">
                                        <div className={`w-24 h-24 rounded-full overflow-hidden border-2 ${avatarPreview ? 'border-black dark:border-white' : 'border-zinc-300 dark:border-zinc-700 border-dashed'} flex items-center justify-center bg-gray-50 dark:bg-black`}>
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs text-zinc-400 text-center px-2">{t('avatar_upload')}</span>
                                            )}
                                        </div>
                                        <input type="file" onChange={(e) => handleFileChange(e, 'avatar')} className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" accept="image/*" />
                                        <div className="absolute bottom-0 right-0 bg-black dark:bg-white text-white dark:text-black rounded-full p-1 border border-white dark:border-black">
                                            <Icons.Camera className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>

                                {/* Nickname */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('nickname')}</label>
                                    <input type="text" required value={nickname} onChange={e => setNickname(e.target.value)}
                                        className="mt-1 block w-full bg-gray-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-sm py-3 px-4 text-black dark:text-white focus:border-black dark:focus:border-white focus:outline-none transition-colors placeholder-zinc-400 dark:placeholder-zinc-700 disabled:opacity-50" placeholder="CyberPunk2077" />
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('profession_tags')}</label>
                                    <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
                                        {tags.map(tag => (
                                            <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-bold bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white animate-fadeIn">
                                                {tag}
                                                <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-zinc-300 dark:text-zinc-500 hover:text-red-500 font-bold disabled:pointer-events-none">
                                                    <Icons.X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleKeyDown}
                                            disabled={tags.length >= 3}
                                            placeholder={tags.length >= 3 ? "Max tags reached" : t('add_tag_placeholder')}
                                            className="flex-1 bg-gray-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-sm py-2 px-4 text-black dark:text-white text-sm focus:border-black dark:focus:border-white focus:outline-none disabled:opacity-50 transition-colors" />
                                        <button type="button" onClick={handleAddTag} disabled={tags.length >= 3}
                                            className="bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-4 py-2 rounded-sm text-black dark:text-white text-sm hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 font-bold transition-colors">{t('add')}</button>
                                    </div>
                                </div>

                                {/* Credential Image */}
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{t('credential_upload')}</label>

                                    {!credPreview ? (
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-zinc-300 dark:border-zinc-800 border-dashed rounded-sm hover:border-zinc-500 dark:hover:border-zinc-600 transition-colors cursor-pointer relative group">
                                            <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                onChange={(e) => handleFileChange(e, 'cred')} />
                                            <div className="space-y-1 text-center pointer-events-none">
                                                <Icons.Camera className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400" />
                                                <div className="flex text-sm text-zinc-500 dark:text-zinc-400 justify-center mt-2">
                                                    <span className="relative cursor-pointer font-medium text-black dark:text-white group-hover:underline">{t('upload_text')}</span>
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-600">{t('upload_hint')}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-1 relative border border-zinc-300 dark:border-zinc-700 rounded-sm overflow-hidden group bg-black">
                                            <img src={credPreview} alt="Preview" className="w-full h-auto max-h-64 object-contain" />
                                            <div className="absolute top-0 right-0 p-2">
                                                <button
                                                    type="button"
                                                    onClick={() => { setCredFile(null); setCredPreview(null); }}
                                                    className="bg-black/80 text-white p-1.5 rounded-full hover:bg-red-900 transition-colors border border-zinc-700 disabled:opacity-50"
                                                >
                                                    <Icons.X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <button type="button" onClick={handleCancelOnboarding} className="px-4 py-4 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white text-sm font-bold rounded-sm hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50">
                                        {t('cancel')}
                                    </button>
                                    <button type="submit" disabled={loading}
                                        className="flex-1 flex justify-center items-center gap-2 py-4 px-4 border border-transparent text-sm font-bold rounded-sm text-white dark:text-black bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        {loading && <span className="animate-spin h-4 w-4 border-2 border-white dark:border-black border-t-transparent rounded-full"></span>}
                                        {loading ? t('finalizing') : t('complete_btn')}
                                    </button>
                                </div>
                            </form>
                        </fieldset>
                    )}

                    {step === 'submitted' && (
                        <div className="text-center space-y-6 py-8">
                            <div className="inline-block p-4 rounded-full bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-900">
                                <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-black dark:text-white">{t('reg_success_title')}</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 text-base mt-4 max-w-xs mx-auto leading-relaxed">
                                    {t('reg_success_desc')}
                                </p>
                            </div>
                            <button onClick={handleGoHome} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-sm hover:opacity-80 transition-opacity">
                                {t('start_exploring')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;