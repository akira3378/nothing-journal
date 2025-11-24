

import React, { useEffect, useRef, useState } from 'react';
import { User, Post, Comment } from '../types';
import { getFeed, createPost, deletePost, toggleLike, getComments, addComment } from '../services/mockBackend';
import { useApp } from '../utils/i18n';
import { ImagePreview } from '../components/ImagePreview';
import { formatLocalTime } from '../utils/formatters';
import { Button, Spinner, useToast, Icons } from '../components/UI';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface FeedProps {
    user: User;
}

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

const ImageGrid: React.FC<{ imageUrls: string[] }> = ({ imageUrls }) => {
    if (!imageUrls || imageUrls.length === 0) return null;

    const count = imageUrls.length;
    let gridClass = '';

    if (count === 1) {
        return (
            <div className="mb-4">
                <ImagePreview
                    src={imageUrls[0]}
                    alt="Post attachment"
                    className="rounded-sm w-full h-64 overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                    thumbnailClassName="w-full h-full object-cover"
                />
            </div>
        );
    }

    if (count === 2) {
        gridClass = 'grid-cols-2';
    } else if (count === 3) {
        gridClass = 'grid-cols-3';
    } else if (count === 4) {
        gridClass = 'grid-cols-2 md:grid-cols-4';
    } else {
        gridClass = 'grid-cols-3 md:grid-cols-4';
    }

    return (
        <div className={`grid ${gridClass} gap-1 mb-4 rounded-sm overflow-hidden`}>
            {imageUrls.map((url, index) => (
                <div key={index} className="aspect-square relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <ImagePreview
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-full"
                        thumbnailClassName="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                </div>
            ))}
        </div>
    );
};

export const FeedItem: React.FC<{ post: Post & { user?: User }; currentUser: User; onDelete: (id: string) => void }> = ({ post, currentUser, onDelete }) => {
    const { t } = useApp();
    const { addToast } = useToast();
    const [likes, setLikes] = useState(post.likes);
    const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser);
    const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsLoaded, setCommentsLoaded] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [sendingComment, setSendingComment] = useState(false);

    const handleLike = async () => {
        const newVal = !isLiked;
        setIsLiked(newVal);
        setLikes(prev => newVal ? prev + 1 : prev - 1);

        try {
            await toggleLike(post.id);
        } catch (e) {
            setIsLiked(!newVal);
            setLikes(prev => newVal ? prev - 1 : prev + 1);
        }
    };

    const toggleComments = async () => {
        const nextState = !showComments;
        setShowComments(nextState);

        if (nextState && !commentsLoaded) {
            setCommentsLoading(true);
            try {
                const data = await getComments(post.id);
                setComments(data);
                setCommentsLoaded(true);
            } catch (e) {
                console.error(e);
                addToast("Failed to load comments", "error");
            } finally {
                setCommentsLoading(false);
            }
        }
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentInput.trim()) return;
        setSendingComment(true);
        try {
            await addComment(post.id, commentInput);
            setCommentInput('');
            const data = await getComments(post.id);
            setComments(data);
            setCommentsCount(prev => prev + 1);
        } catch (e) {
            addToast('Failed to comment', 'error');
        } finally {
            setSendingComment(false);
        }
    };

    const handleDelete = async () => {
        if (confirm(t('delete_confirm'))) {
            try {
                await deletePost(post.id);
                onDelete(post.id);
                addToast(t('post_deleted'), 'success');
            } catch (e) {
                addToast('Delete failed', 'error');
            }
        }
    };

    const canDelete = currentUser.role === 'ADMIN' || currentUser.id === post.userId;
    const displayImages = post.imageUrls || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-sm p-6 transition-all shadow-sm dark:shadow-none mb-6 hover:border-zinc-300 dark:hover:border-zinc-700"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-black dark:text-white font-bold border border-zinc-200 dark:border-zinc-700 shrink-0 overflow-hidden">
                        {post.user?.avatarUrl ? (
                            <ImagePreview
                                src={post.user.avatarUrl}
                                alt="Avatar"
                                className="h-full w-full"
                                thumbnailClassName="h-full w-full object-cover"
                            />
                        ) : (
                            <span>{post.user?.nickname?.charAt(0).toUpperCase() || '?'}</span>
                        )}
                    </div>

                    <div>
                        <div className="flex flex-wrap items-baseline gap-2">
                            <span className="text-black dark:text-white font-bold hover:underline cursor-pointer tracking-tight">{post.user?.nickname || t('unknown_member')}</span>
                            <div className="flex flex-wrap gap-1">
                                {post.user?.jobTags?.map(t => <span key={t} className="text-[10px] text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-800 px-1.5 py-0.5 rounded-[2px] bg-gray-100 dark:bg-zinc-900 font-mono">{t}</span>)}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-zinc-500 font-mono">{formatLocalTime(post.createdAt)}</span>
                            {post.location && (
                                <span className="text-[10px] text-blue-600 dark:text-blue-500 flex items-center gap-1 max-w-[150px] truncate bg-blue-50 dark:bg-blue-900/10 px-1.5 rounded-sm" title={post.location}>
                                    <Icons.MapPin className="w-3 h-3" /> {post.location}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {canDelete && (
                    <Button variant="ghost" size="sm" onClick={handleDelete} className="text-zinc-400 hover:text-red-500 p-0 h-8 w-8 rounded-full">
                        <Icons.Trash className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <div className="text-zinc-800 dark:text-zinc-300 mb-4 whitespace-pre-wrap leading-relaxed text-sm pl-14">
                {post.content}
            </div>

            <div className="pl-14">
                <ImageGrid imageUrls={displayImages} />

                <div className="flex items-center pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 font-bold select-none gap-6">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleLike}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors",
                            isLiked ? 'text-red-500 bg-red-50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                        )}
                    >
                        <Icons.Heart className={cn("w-4 h-4 transition-transform", isLiked && "fill-current")} />
                        <span>{likes > 0 ? likes : t('like')}</span>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleComments}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <Icons.MessageSquare className="w-4 h-4" />
                        <span>{commentsCount > 0 ? commentsCount : t('comment')}</span>
                    </motion.button>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                    {showComments && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                                {commentsLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Spinner size="sm" />
                                    </div>
                                ) : (
                                    <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {comments.length === 0 && !commentsLoading && <div className="text-xs text-zinc-400 italic text-center py-2">{t('no_comments')}</div>}
                                        {comments.map(c => (
                                            <div key={c.id} className="flex gap-3 group">
                                                <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] shrink-0 overflow-hidden">
                                                    {c.user?.avatarUrl ? <img src={c.user.avatarUrl} className="w-full h-full object-cover" /> : c.user?.nickname?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-baseline justify-between">
                                                        <span className="text-xs font-bold text-black dark:text-white mr-2">{c.user?.nickname || 'User'}</span>
                                                        <span className="text-[10px] text-zinc-400 font-mono">{formatLocalTime(c.createdAt)}</span>
                                                    </div>
                                                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-0.5">{c.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <fieldset disabled={sendingComment} className="group">
                                    <form onSubmit={handleSendComment} className="flex items-center bg-gray-50 dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-sm p-1 focus-within:border-black dark:focus-within:border-white transition-colors">
                                        <input
                                            value={commentInput}
                                            onChange={e => setCommentInput(e.target.value)}
                                            placeholder={t('write_comment')}
                                            className="flex-1 bg-transparent px-3 py-1.5 text-sm outline-none text-black dark:text-white placeholder-zinc-400"
                                        />
                                        <button
                                            type="submit"
                                            disabled={sendingComment || !commentInput.trim()}
                                            className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-sm text-xs font-bold hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity h-full"
                                        >
                                            {sendingComment ? <Spinner size="sm" className="border-white dark:border-black" /> : '→'}
                                        </button>
                                    </form>
                                </fieldset>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const FeedPage: React.FC<FeedProps> = ({ user }) => {
    const { t } = useApp();
    const { addToast } = useToast();
    const [posts, setPosts] = useState<(Post & { user?: User })[]>([]);
    const [newContent, setNewContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Infinite Scroll State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observerTarget = useRef(null);

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [location, setLocation] = useState<string | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchPosts = async (currentPage: number, reset: boolean = false) => {
        if (!reset && loading) return;
        if (currentPage === 1) setLoading(true);

        const { data } = await getFeed(currentPage, 10);

        if (reset) {
            setPosts(data);
        } else {
            setPosts(prev => [...prev, ...data]);
        }

        setHasMore(data.length > 0);
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts(1, true);
        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    setPage(prev => {
                        const nextPage = prev + 1;
                        fetchPosts(nextPage);
                        return nextPage;
                    });
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) observer.unobserve(observerTarget.current);
        };
    }, [hasMore, loading]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const totalFiles = [...selectedFiles, ...newFiles].slice(0, 9);

            setSelectedFiles(totalFiles);
            previewUrls.forEach(u => URL.revokeObjectURL(u));
            const newUrls = totalFiles.map(f => URL.createObjectURL(f));
            setPreviewUrls(newUrls);
        }
        e.target.value = '';
    };

    const removeFile = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        URL.revokeObjectURL(previewUrls[index]);
        const newUrls = previewUrls.filter((_, i) => i !== index);
        setPreviewUrls(newUrls);
    };

    const handleGetLocation = () => {
        setLocationLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const data = await response.json();

                    if (data && data.address) {
                        const city = data.address.city || data.address.town || data.address.village;
                        const district = data.address.suburb || data.address.county || '';

                        let displayLoc = city;
                        if (city && district) displayLoc = `${city}, ${district}`;
                        else if (!city) displayLoc = district || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

                        setLocation(displayLoc);
                    } else {
                        setLocation(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                    }
                } catch (e) {
                    setLocation(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                } finally {
                    setLocationLoading(false);
                }
            }, (err) => {
                addToast(t('loc_fail'), 'error');
                setLocationLoading(false);
            }, { timeout: 10000 });
        } else {
            addToast(t('geo_fail'), 'error');
            setLocationLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newContent.trim() && selectedFiles.length === 0) return;

        setSubmitting(true);
        try {
            const newId = await createPost(newContent, selectedFiles, location || undefined);

            const optimisticPost: Post & { user?: User } = {
                id: newId,
                userId: user.id,
                content: newContent,
                imageUrls: previewUrls,
                location: location || undefined,
                createdAt: Date.now(),
                likes: 0,
                commentsCount: 0,
                isLikedByCurrentUser: false,
                user: user
            };

            setPosts(prev => [optimisticPost, ...prev]);

            setNewContent('');
            setSelectedFiles([]);
            setPreviewUrls([]);
            setLocation(null);

            addToast(t('content_published'), "success");

        } catch (error) {
            addToast(t('post_fail'), "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Post Creator - Terminal Style */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black dark:bg-zinc-900 border border-zinc-800 rounded-sm p-1 mb-8 shadow-lg overflow-hidden"
            >
                <div className="bg-zinc-900 dark:bg-black px-4 py-2 flex items-center justify-between border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">TRANSMISSION_UPLINK</span>
                </div>

                <div className="p-4 bg-zinc-950">
                    <fieldset disabled={submitting} className="group">
                        <form onSubmit={handleSubmit}>
                            <div className="flex gap-2 mb-4">
                                <span className="text-green-500 font-mono text-sm pt-1">$</span>
                                <textarea
                                    className="w-full bg-transparent text-zinc-300 font-mono text-sm focus:outline-none resize-none h-24 placeholder-zinc-700"
                                    placeholder={t('share_placeholder')}
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                />
                            </div>

                            <AnimatePresence>
                                {(previewUrls.length > 0 || location) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mb-4 pl-6"
                                    >
                                        <div className="p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-sm">
                                            {location && (
                                                <div className="flex items-center gap-2 text-xs text-blue-400 font-mono mb-3">
                                                    <span>📍 {location}</span>
                                                    <button type="button" onClick={() => setLocation(null)} className="text-zinc-500 hover:text-white">
                                                        <Icons.X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}

                                            {previewUrls.length > 0 && (
                                                <div className="grid grid-cols-5 gap-2">
                                                    {previewUrls.map((url, idx) => (
                                                        <div key={idx} className="relative aspect-square group bg-zinc-800 rounded-sm overflow-hidden border border-zinc-700">
                                                            <img src={url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" alt={`Preview ${idx}`} />
                                                            <button type="button" onClick={() => removeFile(idx)} className="absolute top-0 right-0 bg-red-500/80 text-white p-0.5 w-4 h-4 flex items-center justify-center hover:bg-red-600">
                                                                <Icons.X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex justify-between items-center pl-6 border-t border-zinc-800/50 pt-3">
                                <div className="flex gap-2">
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" multiple />

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={selectedFiles.length >= 9 || submitting}
                                        className="text-zinc-500 hover:text-white hover:bg-zinc-800"
                                        leftIcon={<Icons.Camera className="w-4 h-4" />}
                                    >
                                        {selectedFiles.length > 0 && <span className="font-mono text-[10px] ml-1">[{selectedFiles.length}]</span>}
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        type="button"
                                        onClick={handleGetLocation}
                                        disabled={locationLoading || submitting}
                                        className="text-zinc-500 hover:text-white hover:bg-zinc-800"
                                    >
                                        {locationLoading ? <Spinner size="sm" className="border-zinc-500" /> : <Icons.MapPin className="w-4 h-4" />}
                                    </Button>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={submitting || (!newContent.trim() && selectedFiles.length === 0)}
                                    className="px-6 py-1.5 bg-white text-black font-bold font-mono text-xs uppercase tracking-wider hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'TRANSMITTING...' : t('publish')}
                                </motion.button>
                            </div>
                        </form>
                    </fieldset>
                </div>
            </motion.div>

            {/* Feed Stream */}
            <div className="space-y-6">
                {loading && page === 1 ? (
                    <div className="space-y-6 flex flex-col items-center py-12">
                        <Spinner size="lg" />
                        <p className="text-xs text-zinc-500 tracking-widest mt-4 font-mono animate-pulse">{t('syncing_feed')}</p>
                    </div>
                ) : (!posts || posts.length === 0) ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-zinc-500 dark:text-zinc-600 py-16 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-sm flex flex-col items-center justify-center"
                    >
                        <Icons.Wind className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-mono text-sm">{t('quiet_here')}</p>
                    </motion.div>
                ) : (
                    <AnimatePresence mode='popLayout'>
                        {posts.map((post) => (
                            <FeedItem
                                key={post.id}
                                post={post}
                                currentUser={user}
                                onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                            />
                        ))}

                        {/* Infinite Scroll Loader / End Message */}
                        <div ref={observerTarget} className="py-8 text-center flex justify-center w-full">
                            {hasMore ? (
                                <Spinner size="md" className="opacity-50" />
                            ) : (
                                <span className="text-xs text-zinc-400 tracking-widest uppercase">{t('end_of_feed')}</span>
                            )}
                        </div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default FeedPage;
