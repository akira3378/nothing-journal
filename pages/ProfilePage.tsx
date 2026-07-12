import React, { useEffect, useState } from 'react';
import { Select } from 'antd';
import { Country, City } from 'country-state-city';
import { User, Post } from '../types';
import { updateUserProfile } from '../services/supabaseBackend';
import { useUserPosts } from '../hooks/useData';
import { useApp } from '../utils/i18n';
import { ImagePreview } from '../components/ImagePreview';
import { Icons, Spinner } from '../components/UI';
import { FeedItem } from './FeedPage';

interface ProfileProps {
    user: User;
}

const ProfilePage: React.FC<ProfileProps> = ({ user }) => {
    const { t } = useApp();
    const { posts: myPosts, isLoading: loadingPosts, mutate } = useUserPosts(user.id);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [nickname, setNickname] = useState(user.nickname);
    const [tags, setTags] = useState<string[]>(user.jobTags);
    const [tagInput, setTagInput] = useState('');
    const [country, setCountry] = useState(user.country || '');
    const [city, setCity] = useState(user.city || '');
    const [countryCode, setCountryCode] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        const selectedCountry = Country.getAllCountries().find(item => item.name === country);
        setCountryCode(selectedCountry?.isoCode || '');
    }, [country]);

    useEffect(() => () => {
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    }, [avatarPreview]);

    const handleAddTag = () => {
        const value = tagInput.trim();
        if (tags.length >= 3 || !value || value.length > 15 || tags.includes(value)) return;
        setTags(current => [...current, value]);
        setTagInput('');
    };

    const handleRemoveTag = (tag: string) => {
        setTags(current => current.filter(item => item !== tag));
    };

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateUserProfile(user.id, {
                nickname: nickname.trim() || user.nickname,
                jobTags: tags,
                avatarFile: avatarFile || undefined,
                country,
                city
            });
            setIsEditing(false);
            window.location.reload();
        } catch {
            alert(t('profile_update_fail'));
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setNickname(user.nickname);
        setTags(user.jobTags);
        setTagInput('');
        setCountry(user.country || '');
        setCity(user.city || '');
        setAvatarFile(null);
        setAvatarPreview(null);
        setIsEditing(false);
    };

    const locationLabel = user.city && user.country
        ? `${user.city}, ${user.country}`
        : user.country || t('no_location');
    const displayAvatar = avatarPreview || user.avatarUrl;

    return (
        <main className="min-h-screen bg-[#f7f7f5] dark:bg-nothing-black px-4 py-8 md:px-8 md:py-14 transition-colors">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 max-w-2xl">
                    <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-zinc-400 dark:text-zinc-600">{t('profile_identity')}</p>
                    <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-[-0.06em] text-black dark:text-white">{t('profile_title')}</h1>
                    <p className="mt-4 text-sm md:text-base leading-7 text-zinc-500 dark:text-zinc-400">{t('profile_intro')}</p>
                </header>

                <section className="overflow-hidden rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-[0_20px_80px_rgba(0,0,0,0.06)] dark:shadow-none">
                    <div className="relative h-36 md:h-48 bg-black dark:bg-white overflow-hidden">
                        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_15%_20%,#ffffff_0,transparent_28%),radial-gradient(circle_at_80%_80%,#777_0,transparent_34%)]" />
                        <div className="absolute -right-16 -top-28 h-80 w-80 rounded-full border border-white/20 dark:border-black/10" />
                        <div className="absolute left-6 bottom-5 text-[10px] font-mono tracking-[0.3em] text-white/50 dark:text-black/40">NOTHING / JOURNAL</div>
                        {!isEditing && (
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/30 dark:border-black/20 bg-white/10 dark:bg-black/10 px-4 py-2 text-xs font-bold text-white dark:text-black backdrop-blur hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                            >
                                <span aria-hidden="true">✎</span>{t('edit_profile')}
                            </button>
                        )}
                        {isEditing && (
                            <div className="absolute right-5 top-5 flex gap-2">
                                <button type="button" onClick={handleCancel} disabled={saving} className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur hover:bg-white/20 disabled:opacity-50">{t('cancel')}</button>
                                <button type="button" onClick={handleSave} disabled={saving} className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200 disabled:opacity-50">{saving ? t('saving') : t('save_changes')}</button>
                            </div>
                        )}
                    </div>

                    <div className="px-5 pb-7 md:px-10 md:pb-10">
                        <div className="-mt-14 flex flex-col gap-6 md:-mt-20 md:flex-row md:items-end">
                            <div className="relative h-28 w-28 shrink-0 rounded-[1.75rem] border-4 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-black shadow-xl overflow-hidden">
                                {displayAvatar ? (
                                    avatarPreview ? <img src={displayAvatar} alt={t('profile')} className="h-full w-full object-cover" /> : <ImagePreview src={displayAvatar} alt={t('profile')} className="h-full w-full" thumbnailClassName="h-full w-full object-cover" />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center text-4xl font-black text-zinc-300 dark:text-zinc-700">{nickname.charAt(0).toUpperCase()}</span>
                                )}
                                {isEditing && (
                                    <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 bg-black/60 text-[10px] font-bold text-white opacity-0 hover:opacity-100 transition-opacity">
                                        <Icons.Camera className="h-5 w-5" />
                                        {t('edit_avatar')}
                                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
                                    </label>
                                )}
                            </div>

                            <div className="min-w-0 flex-1 pb-1">
                                {isEditing ? (
                                    <div className="w-full max-w-xl">
                                        <label htmlFor="profile-nickname" className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                                            {t('nickname')}
                                        </label>
                                        <input
                                            id="profile-nickname"
                                            value={nickname}
                                            onChange={event => setNickname(event.target.value)}
                                            placeholder={t('nickname_placeholder')}
                                            maxLength={40}
                                            className="w-full border-b-2 border-zinc-300 bg-transparent py-1 text-3xl font-black tracking-[-0.04em] text-black outline-none focus:border-black dark:border-zinc-700 dark:text-white dark:focus:border-white"
                                        />
                                    </div>
                                ) : (
                                    <h2 className="truncate text-3xl font-black tracking-[-0.04em] text-black dark:text-white">{user.nickname}</h2>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                                    <span className="font-mono">{user.email}</span>
                                    <span className="inline-flex items-center gap-1"><Icons.MapPin className="h-3.5 w-3.5" />{locationLabel}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 grid gap-8 border-t border-zinc-100 pt-7 dark:border-zinc-800 md:grid-cols-[1fr_auto]">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">{t('profile_identity')}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                                            {tag}
                                            {isEditing && <button type="button" onClick={() => handleRemoveTag(tag)} disabled={saving} aria-label={`${t('delete')} ${tag}`} className="ml-2 text-zinc-400 hover:text-red-500">×</button>}
                                        </span>
                                    ))}
                                    {isEditing && tags.length < 3 && (
                                        <div className="flex items-center gap-2">
                                            <input value={tagInput} onChange={event => setTagInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); handleAddTag(); } }} placeholder={t('add_tag_placeholder')} aria-label={t('identity_tags')} className="w-36 border-b border-zinc-300 bg-transparent px-1 py-1 text-xs outline-none focus:border-black dark:border-zinc-700 dark:text-white dark:focus:border-white" />
                                            <button type="button" onClick={handleAddTag} disabled={saving} className="rounded-full bg-black px-3 py-1.5 text-xs font-bold text-white dark:bg-white dark:text-black">{t('add')}</button>
                                        </div>
                                    )}
                                    {!isEditing && tags.length === 0 && <span className="text-sm italic text-zinc-400">—</span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-6 border-t border-zinc-100 pt-5 dark:border-zinc-800 md:min-w-[330px] md:border-l md:border-t-0 md:pl-8 md:pt-0">
                                <div><p className="text-2xl font-black text-black dark:text-white">{myPosts.length}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-400">{t('profile_notes')}</p></div>
                                <div><p className="text-2xl font-black text-black dark:text-white">{new Date(user.createdAt).getFullYear()}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-400">{t('profile_joined')}</p></div>
                                <div><p className="text-2xl font-black text-black dark:text-white">{user.jobTags.length}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-400">{t('identity_tags')}</p></div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="mt-8 rounded-2xl bg-zinc-50 p-5 dark:bg-black/30">
                                <p className="mb-5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{t('profile_edit_hint')}</p>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{t('select_country')}</label>
                                        <Select showSearch value={country || undefined} onChange={value => { setCountry(value); setCity(''); }} placeholder={t('select_country')} optionFilterProp="label" className="w-full" options={Country.getAllCountries().map(item => ({ value: item.name, label: item.name }))} />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{t('select_city')}</label>
                                        <Select showSearch value={city || undefined} onChange={setCity} disabled={!countryCode} placeholder={t('select_city')} optionFilterProp="label" className="w-full" options={countryCode ? (City.getCitiesOfCountry(countryCode) || []).map(item => ({ value: item.name, label: item.name })) : []} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="mt-14">
                    <div className="mb-6 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">{t('profile_notes')}</p>
                            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-black dark:text-white">{t('my_transmissions')}</h2>
                        </div>
                        <span className="font-mono text-xs text-zinc-400">{myPosts.length} {t('records')}</span>
                    </div>

                    {loadingPosts ? (
                        <div className="flex justify-center rounded-2xl border border-zinc-200 py-16 dark:border-zinc-800"><Spinner /></div>
                    ) : myPosts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-20 text-center dark:border-zinc-700"><p className="text-sm italic text-zinc-400">{t('no_broadcasts')}</p></div>
                    ) : (
                        <div className="space-y-8">
                            {myPosts.map(post => (
                                <FeedItem key={post.id} post={post} currentUser={user} onDelete={async id => {
                                    await mutate((currentData: any) => currentData ? currentData.filter((item: Post) => item.id !== id) : [], false);
                                }} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
};

export default ProfilePage;
