
import React, { useState, useEffect } from 'react';
import { User, UserStatus, Post } from '../types';
import { updateUserProfile, getUserPosts } from '../services/mockBackend';
import { useApp } from '../utils/i18n';
import { ImagePreview } from '../components/ImagePreview';
import { Icons, Spinner } from '../components/UI';
import { FeedItem } from './FeedPage'; // Reusing FeedItem
import { Country, City } from 'country-state-city';

interface ProfileProps {
    user: User;
}

const ProfilePage: React.FC<ProfileProps> = ({ user }) => {
    const { t } = useApp();
    const [isEditing, setIsEditing] = useState(false);
    const [nickname, setNickname] = useState(user.nickname);
    const [tags, setTags] = useState<string[]>(user.jobTags);
    const [tagInput, setTagInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [country, setCountry] = useState(user.country || '');
    const [city, setCity] = useState(user.city || '');
    const [countryCode, setCountryCode] = useState('');

    useEffect(() => {
        if (country) {
            const c = Country.getAllCountries().find(c => c.name === country);
            if (c) setCountryCode(c.isoCode);
        }
    }, [country]);

    // Posts State
    const [myPosts, setMyPosts] = useState<(Post & { user?: User })[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);

    useEffect(() => {
        const fetchMyPosts = async () => {
            setLoadingPosts(true);
            try {
                const posts = await getUserPosts(user.id);
                setMyPosts(posts);
            } catch (e) {
                console.error(t('fetch_posts_fail'));
            } finally {
                setLoadingPosts(false);
            }
        };
        fetchMyPosts();
    }, [user.id]);

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

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const [credentialFile, setCredentialFile] = useState<File | null>(null);
    const [credentialPreview, setCredentialPreview] = useState<string | null>(null);

    const handleRenew = async () => {
        if (!credentialFile) return;
        setSaving(true);
        try {
            await updateUserProfile(user.id, {
                credentialFile: credentialFile,
                status: UserStatus.PENDING,
                isRenewal: true
            });
            alert(t('renewal_submitted'));
            window.location.reload();
        } catch (e) {
            alert(t('renewal_fail'));
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUserProfile(user.id, {
                nickname,
                jobTags: tags,
                avatarFile: avatarFile || undefined,
                country,
                city
            });
            setIsEditing(false);
            window.location.reload();
        } catch (e) {
            alert(t('profile_update_fail'));
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
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
            {/* Pending Banner */}
            {user.status === UserStatus.PENDING && (
                <div className="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 flex items-start gap-4 animate-fadeIn">
                    <div className="text-yellow-600 dark:text-yellow-500">
                        <Icons.AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-yellow-800 dark:text-yellow-400 uppercase tracking-widest text-xs mb-1">{t('pending_banner')}</h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-500">{t('pending_banner_desc')}</p>
                    </div>
                </div>
            )}

            {/* Main Profile Card */}
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-sm overflow-hidden shadow-lg dark:shadow-none transition-colors relative mb-12">

                {/* Decorative Background */}
                <div className="h-32 bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 w-full relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    {isEditing && (
                        <div className="absolute top-4 right-4 flex gap-2 z-20">
                            <button onClick={handleCancel} disabled={saving} className="bg-white/80 dark:bg-black/50 text-black dark:text-white px-3 py-1 text-xs font-bold rounded-sm backdrop-blur border border-transparent hover:border-black dark:hover:border-white transition-all disabled:opacity-50">{t('cancel')}</button>
                            <button onClick={handleSave} disabled={saving} className="bg-black dark:bg-white text-white dark:text-black px-3 py-1 text-xs font-bold rounded-sm hover:opacity-80 transition-all shadow-md disabled:opacity-50">
                                {saving ? t('saving') : t('save_changes')}
                            </button>
                        </div>
                    )}
                    {!isEditing && user.status === UserStatus.ACTIVE && (
                        <button onClick={() => setIsEditing(true)} className="absolute top-4 right-4 bg-white/50 dark:bg-black/50 p-2 rounded-full hover:bg-white dark:hover:bg-black transition-all text-black dark:text-white border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                    )}
                </div>

                <div className="px-8 pb-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Avatar with Preview */}
                        <div className="-mt-16 relative">
                            <div className="h-32 w-32 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-black flex items-center justify-center text-4xl text-zinc-400 dark:text-zinc-500 overflow-hidden shadow-md">
                                {avatarPreview ? (
                                    <img src={avatarPreview} className="w-full h-full object-cover" />
                                ) : user.avatarUrl ? (
                                    <ImagePreview
                                        src={user.avatarUrl}
                                        alt="Profile"
                                        className="w-full h-full"
                                        thumbnailClassName="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span>{nickname.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="pt-4 flex-1">
                            {isEditing ? (
                                <fieldset disabled={saving} className="group">
                                    <div className="mb-4 flex items-center gap-4">
                                        <div className="relative group/avatar cursor-pointer h-16 w-16">
                                            <div className="h-full w-full rounded-full overflow-hidden border border-zinc-300 dark:border-zinc-700">
                                                {avatarPreview ? (
                                                    <img src={avatarPreview} className="w-full h-full object-cover" />
                                                ) : user.avatarUrl ? (
                                                    <img src={user.avatarUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                        <Icons.Camera className="w-4 h-4 text-zinc-400" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Overlay - pointer-events-none to let clicks pass through to input if input is below, 
                                                OR input on top with opacity 0. 
                                                Best practice: Input on top, z-index high. */}
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-full pointer-events-none">
                                                <Icons.Camera className="w-4 h-4 text-white" />
                                            </div>

                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        const f = e.target.files[0];
                                                        setAvatarFile(f);
                                                        setAvatarPreview(URL.createObjectURL(f));
                                                    }
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                        </div>
                                        <div className="text-xs text-zinc-500">Click to change avatar</div>
                                    </div>

                                    <div className="mb-2 max-w-sm">
                                        <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-1 block">{t('nickname')}</label>
                                        <input
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            className="text-2xl font-bold text-black dark:text-white bg-transparent border-b border-zinc-300 dark:border-zinc-700 w-full focus:border-black dark:focus:border-white outline-none py-1 disabled:opacity-50"
                                        />
                                    </div>

                                    <div className="mb-4 grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-1 block">{t('select_country')}</label>
                                            <input
                                                list="profile-country-list"
                                                value={country}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCountry(val);
                                                    const c = Country.getAllCountries().find(c => c.name === val);
                                                    setCountryCode(c ? c.isoCode : '');
                                                    setCity('');
                                                }}
                                                className="bg-transparent border-b border-zinc-300 dark:border-zinc-700 w-full text-sm py-1 outline-none focus:border-black dark:focus:border-white"
                                            />
                                            <datalist id="profile-country-list">
                                                {Country.getAllCountries().map(c => (
                                                    <option key={c.isoCode} value={c.name} />
                                                ))}
                                            </datalist>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-1 block">{t('select_city')}</label>
                                            <input
                                                list="profile-city-list"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                disabled={!countryCode}
                                                className="bg-transparent border-b border-zinc-300 dark:border-zinc-700 w-full text-sm py-1 outline-none focus:border-black dark:focus:border-white disabled:opacity-50"
                                            />
                                            <datalist id="profile-city-list">
                                                {countryCode && City.getCitiesOfCountry(countryCode)?.map(c => (
                                                    <option key={c.name} value={c.name} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                </fieldset>
                            ) : (
                                <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">{user.nickname}</h1>
                            )}

                            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm font-mono mt-1">
                                <span>{user.email}</span>
                                {user.country && (
                                    <>
                                        <span className="w-1 h-1 bg-zinc-400 rounded-full"></span>
                                        <span>{user.city ? `${user.city}, ${user.country}` : user.country}</span>
                                    </>
                                )}
                                <span className="w-1 h-1 bg-zinc-400 rounded-full"></span>
                                <span>{new Date(user.createdAt).getFullYear()}</span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <span key={tag} className="inline-flex items-center px-3 py-1 rounded-sm text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-black dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                                        {tag}
                                        {isEditing && <button onClick={() => removeTag(tag)} disabled={saving} className="ml-2 text-zinc-400 hover:text-red-500 disabled:opacity-50">×</button>}
                                    </span>
                                ))}
                                {isEditing && tags.length < 3 && (
                                    <fieldset disabled={saving} className="flex items-center gap-2 group">
                                        <input
                                            value={tagInput}
                                            onChange={e => setTagInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                                            placeholder={t('add_tag_placeholder')}
                                            className="bg-transparent border-b border-zinc-300 dark:border-zinc-700 text-sm px-2 py-1 text-black dark:text-white w-32 outline-none focus:border-black disabled:opacity-50"
                                        />
                                        <button onClick={handleAddTag} className="text-xs bg-black dark:bg-white text-white dark:text-black px-2 py-1 rounded-sm disabled:opacity-50">{t('add')}</button>
                                    </fieldset>
                                )}
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="pt-4 flex md:flex-col items-center md:items-end gap-2">
                            <span className="text-xs uppercase tracking-widest text-zinc-400">{t('status')}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${user.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                                'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                                }`}>
                                {t(user.status)}
                            </span>
                        </div>
                    </div>

                    {/* Credential Section */}
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-6 bg-gray-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sm">
                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">{t('credentials')}</h3>
                            {user.status === UserStatus.EXPIRED ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-sm">
                                        <h4 className="text-sm font-bold text-orange-800 dark:text-orange-400 mb-2">{t('membership_expired')}</h4>
                                        <p className="text-xs text-orange-700 dark:text-orange-300 mb-4">{t('renew_desc')}</p>

                                        <div className="flex flex-col gap-3">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        setCredentialFile(e.target.files[0]);
                                                        setCredentialPreview(URL.createObjectURL(e.target.files[0]));
                                                    }
                                                }}
                                                className="text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-zinc-800 dark:file:bg-white dark:file:text-black"
                                            />

                                            {credentialPreview && (
                                                <div className="relative h-32 w-full bg-zinc-100 dark:bg-black rounded-sm overflow-hidden border border-zinc-200 dark:border-zinc-800">
                                                    <img src={credentialPreview} className="w-full h-full object-contain" />
                                                </div>
                                            )}

                                            <button
                                                onClick={handleRenew}
                                                disabled={!credentialFile || saving}
                                                className="w-full py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wider rounded-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                {saving ? <Spinner size="sm" className="border-white dark:border-black" /> : t('submit_renewal')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : user.credentialUrl ? (
                                <div className="relative group overflow-hidden rounded-sm border border-zinc-300 dark:border-zinc-700 flex justify-center bg-zinc-100 dark:bg-zinc-900 p-2">
                                    <ImagePreview
                                        src={user.credentialUrl}
                                        alt="Credential"
                                        className="w-full max-w-[200px]"
                                        thumbnailClassName="w-full h-auto object-contain transition-all duration-300"
                                    />
                                </div>
                            ) : (
                                <div className="h-32 flex items-center justify-center text-zinc-400 text-sm italic bg-zinc-100 dark:bg-zinc-900 rounded-sm">
                                    {t('no_cred')}
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sm flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">{t('account_id')}</h3>
                                <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400 break-all select-all">{user.id}</p>
                            </div>
                            <div className="mt-8">
                                <div className="w-full h-1 bg-gradient-to-r from-transparent via-zinc-300 dark:via-zinc-700 to-transparent opacity-50"></div>
                                <p className="text-[10px] text-center text-zinc-400 mt-2 tracking-[0.2em]">{t('auth_member')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Posts Section */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-12">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-black dark:text-white tracking-tight">{t('my_transmissions')}</h3>
                    <div className="text-xs text-zinc-500 uppercase tracking-widest">{myPosts.length} {t('records')}</div>
                </div>

                {loadingPosts ? (
                    <div className="flex justify-center py-12">
                        <Spinner />
                    </div>
                ) : myPosts.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-sm">
                        <p className="text-zinc-400 text-sm italic">{t('no_broadcasts')}</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {myPosts.map(post => (
                            <div key={post.id} className="relative">
                                {/* Simplified Feed Item Wrapper for Profile */}
                                <FeedItem
                                    post={post}
                                    currentUser={user}
                                    onDelete={(id) => setMyPosts(prev => prev.filter(p => p.id !== id))}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
