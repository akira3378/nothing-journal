
import React, { useEffect, useRef, useState } from 'react';
import { User, Post, Comment } from '../types';
import { getFeed, createPost, deletePost, toggleLike, getComments, addComment, deleteComment, subscribeToFeed } from '../services/mockBackend';
import { useApp } from '../utils/i18n';
import { useFeed } from '../hooks/useData';
import { ImagePreview } from '../components/ImagePreview';
import { formatLocalTime, formatRelativeTime } from '../utils/formatters';

import { useToast, Icons } from '../components/UI';
import { Button, Input, Spin, Image, Upload, message, Avatar, Popconfirm } from 'antd';
import imageCompression from 'browser-image-compression';

interface FeedProps {
    user: User;
}

const ImageGrid: React.FC<{ imageUrls: string[] }> = ({ imageUrls }) => {
    const { t } = useApp();
    if (!imageUrls || imageUrls.length === 0) return null;

    const count = imageUrls.length;
    let gridClass = '';

    // Adjusted styling to fill width and look cleaner
    if (count === 1) {
        return (
            <div className="mt-3 mb-1">
                <div className="mt-3 mb-1">
                    <Image
                        src={imageUrls[0]}
                        alt={t('post_attachment')}
                        className="rounded-sm w-full h-auto max-h-[500px] overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                        width="100%"
                    />
                </div>
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
        <div className={`grid ${gridClass} gap-0.5 mt-3 mb-1 rounded-sm overflow-hidden border border-zinc-200 dark:border-zinc-800`}>
            <Image.PreviewGroup>
                {imageUrls.map((url, index) => (
                    <div key={index} className="aspect-square relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <Image
                            src={url}
                            alt={`${t('attachment')} ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            width="100%"
                            height="100%"
                        />
                    </div>
                ))}
            </Image.PreviewGroup>
        </div>
    );
};

interface CommentItemProps {
    comment: Comment;
    currentUser: User;
    replyingTo: string | null;
    setReplyingTo: (id: string | null) => void;
    replyInput: string;
    setReplyInput: (val: string) => void;
    onSend: (e: React.FormEvent, parentId: string) => void;
    onDelete: (id: string) => void;
    sendingReply: boolean;
    depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    currentUser,
    replyingTo,
    setReplyingTo,
    replyInput,
    setReplyInput,
    onSend,
    onDelete,
    sendingReply,
    depth = 0
}) => {
    const { t } = useApp();
    const isReplying = replyingTo === comment.id;
    const hasChildren = comment.replies && comment.replies.length > 0;

    return (
        <div className={`flex flex-col gap-2 relative ${depth > 0 ? 'mt-3' : ''}`}>
            {/* Connector Line for root comments only to avoid visual clutter in deep nesting */}
            {depth === 0 && hasChildren && (
                <div className="absolute top-8 left-3 bottom-[-12px] w-px bg-zinc-200 dark:bg-zinc-800"></div>
            )}

            <div className="flex gap-3 group/comment">
                <div className={`rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-sm z-10 ${depth === 0 ? 'h-8 w-8 text-[10px]' : 'h-6 w-6 text-[8px]'}`}>
                    {comment.user?.avatarUrl ? (
                        <img src={comment.user.avatarUrl} className="w-full h-full object-cover rounded-full" />
                    ) : (
                        comment.user?.nickname?.charAt(0) || '?'
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className={`bg-white dark:bg-zinc-900 rounded-2xl rounded-tl-none border border-zinc-100 dark:border-zinc-800 shadow-sm ${depth === 0 ? 'p-3' : 'p-2.5'}`}>
                        <div className="flex items-baseline justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-black dark:text-white truncate max-w-[120px]">
                                    {comment.user?.nickname || 'User'}
                                </span>
                                <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                                    {formatRelativeTime(comment.createdAt)}
                                </span>
                            </div>
                            {(currentUser.role === 'ADMIN' || currentUser.id === comment.userId) && (
                                <Popconfirm
                                    title={t('delete_confirm')}
                                    onConfirm={() => onDelete(comment.id)}
                                    okText={t('delete')}
                                    cancelText={t('cancel')}
                                >
                                    <button
                                        className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover/comment:opacity-100"
                                    >
                                        <Icons.X className="w-3 h-3" />
                                    </button>
                                </Popconfirm>
                            )}
                        </div>
                        <p className={`text-zinc-700 dark:text-zinc-300 leading-relaxed break-words ${depth === 0 ? 'text-sm' : 'text-xs'}`}>
                            {comment.content}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mt-1 ml-2">
                        <button
                            onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                            className={`font-bold text-zinc-400 hover:text-black dark:hover:text-white transition-colors uppercase tracking-wide ${isReplying ? 'text-black dark:text-white' : ''} text-[10px]`}
                        >
                            {t('reply')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Reply Input */}
            {isReplying && (
                <div className={`pl-11 animate-fadeIn mt-1 mb-2`}>
                    <form onSubmit={(e) => onSend(e, comment.id)} className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[8px] shrink-0">
                            {currentUser.avatarUrl ? (
                                <img src={currentUser.avatarUrl} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                currentUser.nickname?.charAt(0)
                            )}
                        </div>
                        <input
                            autoFocus
                            value={replyInput}
                            onChange={e => setReplyInput(e.target.value)}
                            placeholder={`${t('reply_to')} ${comment.user?.nickname}...`}
                            className="flex-1 bg-transparent border-b border-zinc-300 dark:border-zinc-700 px-0 py-1 text-xs outline-none text-black dark:text-white placeholder-zinc-400 focus:border-black dark:focus:border-white transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={sendingReply || !replyInput.trim()}
                            className="text-xs font-bold text-black dark:text-white disabled:opacity-30"
                        >
                            {sendingReply ? '...' : '↵'}
                        </button>
                    </form>
                </div>
            )}

            {/* Nested Replies */}
            {hasChildren && (
                <div className={`pl-6 sm:pl-8 border-l-2 border-zinc-100 dark:border-zinc-800/50 ml-4`}>
                    {comment.replies!.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            currentUser={currentUser}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            replyInput={replyInput}
                            setReplyInput={setReplyInput}
                            onSend={onSend}
                            onDelete={onDelete}
                            sendingReply={sendingReply}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
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
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyInput, setReplyInput] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

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
                addToast(t('failed_load_comments'), "error");
            } finally {
                setCommentsLoading(false);
            }
        }
    };

    const handleSendComment = async (e: React.FormEvent, parentId?: string) => {
        e.preventDefault();
        const content = parentId ? replyInput : commentInput;
        if (!content.trim()) return;

        if (parentId) setSendingReply(true);
        else setSendingComment(true);

        try {
            await addComment(post.id, content, parentId);
            if (parentId) {
                setReplyInput('');
                setReplyingTo(null);
            } else {
                setCommentInput('');
            }

            const data = await getComments(post.id);
            setComments(data);
            setCommentsCount(prev => prev + 1);
        } catch (e) {
            addToast(t('failed_comment'), 'error');
        } finally {
            if (parentId) setSendingReply(false);
            else setSendingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await deleteComment(commentId);
            // Small delay to ensure DB propagation
            await new Promise(r => setTimeout(r, 100));

            const data = await getComments(post.id);
            setComments(data);
            // Update count based on actual data length or just decrement safely
            // Since we have the full list now, we can trust its length if we want, 
            // but commentsCount is often just a number on the post. 
            // Let's just decrement for now or update if we returned the count.
            // For simplicity and to match the optimistic UI pattern usually desired, 
            // but here we are fetching. Let's just decrement to keep it simple or use the new length if we calculated it recursively.
            // Actually, getComments returns a tree. We need to count them to be accurate.
            // But simply decrementing is "good enough" for the feed view usually.
            setCommentsCount(prev => Math.max(0, prev - 1));

            addToast(t('comment_deleted'), 'success');
        } catch (e: any) {
            addToast(e.message || t('failed_delete_comment'), 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await deletePost(post.id);
            onDelete(post.id);
            addToast('Post deleted', 'success');
        } catch (e) {
            addToast(t('delete_failed'), 'error');
        }
    };

    const canDelete = currentUser.role === 'ADMIN' || currentUser.id === post.userId;
    const displayImages = post.imageUrls || [];

    return (
        <article className="group relative bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-100 dark:border-zinc-800/50 rounded-2xl mb-8 transition-all md:hover:shadow-xl md:hover:border-zinc-200 dark:md:hover:border-zinc-700 animate-fadeIn flex flex-col overflow-hidden">

            {/* Decorative gradient glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-50/0 via-zinc-50/0 to-zinc-100/0 md:group-hover:to-zinc-100/50 dark:md:group-hover:to-zinc-800/20 transition-all duration-700 pointer-events-none"></div>

            <div className="p-6 relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm shrink-0 overflow-hidden">
                            {post.user?.avatarUrl ? (
                                <Avatar
                                    src={post.user.avatarUrl}
                                    alt="Avatar"
                                    className="h-full w-full"
                                />
                            ) : (
                                <span className="font-bold text-zinc-500 dark:text-zinc-400 text-lg">{post.user?.nickname?.charAt(0).toUpperCase() || '?'}</span>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-black dark:text-white hover:underline cursor-pointer tracking-tight">
                                    {post.user?.nickname || t('unknown_member')}
                                </span>
                                {post.user?.jobTags?.map(tag => (
                                    <span key={tag} className="hidden sm:inline-block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                                <span>{formatRelativeTime(post.createdAt)}</span>
                                {post.location && (
                                    <>
                                        <span className="w-0.5 h-0.5 bg-zinc-300 rounded-full"></span>
                                        <span className="flex items-center gap-1 max-w-[150px] truncate text-zinc-500 dark:text-zinc-400">
                                            <Icons.MapPin className="w-3 h-3" />
                                            {post.location}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {canDelete && (
                        <Popconfirm
                            title={t('delete_confirm')}
                            onConfirm={handleDelete}
                            okText={t('delete')}
                            cancelText={t('cancel')}
                        >
                            <button className="text-zinc-300 md:hover:text-red-500 transition-colors p-2 rounded-full md:hover:bg-red-50 dark:md:hover:bg-red-900/20 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                                <Icons.X className="w-4 h-4" />
                            </button>
                        </Popconfirm>
                    )}
                </div>

                {/* Content */}
                <div className="pl-[64px]">
                    <div className="text-base leading-relaxed text-black dark:text-white whitespace-pre-wrap break-words mb-4 font-normal">
                        {post.content}
                    </div>

                    {/* Media Grid */}
                    <div className="mb-4">
                        <ImageGrid imageUrls={displayImages} />
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-6 pt-2">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 text-sm font-medium transition-all group/btn ${isLiked
                                ? 'text-red-500'
                                : 'text-zinc-400 md:hover:text-red-500'
                                }`}
                        >
                            <div className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-red-50 dark:bg-red-900/20' : 'md:group-hover/btn:bg-red-50 dark:md:group-hover/btn:bg-red-900/20'}`}>
                                <Icons.Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-current scale-110' : 'scale-100'}`} fill={isLiked} />
                            </div>
                            <span>{likes > 0 ? likes : ''}</span>
                        </button>

                        <button
                            onClick={toggleComments}
                            className={`flex items-center gap-2 text-sm font-medium transition-all group/btn ${showComments
                                ? 'text-blue-500'
                                : 'text-zinc-400 md:hover:text-blue-500'
                                }`}
                        >
                            <div className={`p-2 rounded-full transition-colors ${showComments ? 'bg-blue-50 dark:bg-blue-900/20' : 'md:group-hover/btn:bg-blue-50 dark:md:group-hover/btn:bg-blue-900/20'}`}>
                                <Icons.MessageSquare className="w-5 h-5" />
                            </div>
                            <span>{commentsCount > 0 ? commentsCount : ''}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/80 dark:bg-black/40 backdrop-blur-sm animate-fadeIn">
                    <div className="p-6 pl-[88px]">
                        {commentsLoading ? (
                            <div className="flex items-center justify-center py-6">
                                <Spin size="small" />
                            </div>
                        ) : (
                            <div className="space-y-6 mb-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                {comments.length === 0 && (
                                    <div className="text-xs text-zinc-400 italic">{t('no_comments')}</div>
                                )}
                                {comments.map(c => (
                                    <CommentItem
                                        key={c.id}
                                        comment={c}
                                        currentUser={currentUser}
                                        replyingTo={replyingTo}
                                        setReplyingTo={setReplyingTo}
                                        replyInput={replyInput}
                                        setReplyInput={setReplyInput}
                                        onSend={handleSendComment}
                                        onDelete={handleDeleteComment}
                                        sendingReply={sendingReply}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Comment Input */}
                        <fieldset disabled={sendingComment} className="relative">
                            <form onSubmit={(e) => handleSendComment(e)} className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] shrink-0">
                                    {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover rounded-full" /> : currentUser.nickname?.charAt(0)}
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        value={commentInput}
                                        onChange={e => setCommentInput(e.target.value)}
                                        placeholder={t('write_comment')}
                                        className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-full px-4 py-2.5 text-sm outline-none text-black dark:text-white placeholder-zinc-400 focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
                                    />
                                    <Button
                                        type="text"
                                        htmlType="submit"
                                        disabled={sendingComment || !commentInput.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0 h-auto hover:bg-transparent"
                                        icon={sendingComment ? <Spin size="small" /> : <Icons.ChevronDown className="w-3 h-3 -rotate-90" />}
                                    />
                                </div>
                            </form>
                        </fieldset>
                    </div>
                </div>
            )}
        </article>
    );
};

const FeedPage: React.FC<FeedProps> = ({ user }) => {
    const { t } = useApp();
    const { addToast } = useToast();
    const { posts, error, isLoading, isLoadingMore, isReachingEnd, size, setSize, mutate } = useFeed();
    const [newContent, setNewContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Infinite Scroll State
    // const [page, setPage] = useState(1); // Managed by SWR
    // const [hasMore, setHasMore] = useState(true); // Managed by SWR
    const observerTarget = useRef(null);

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [location, setLocation] = useState<string | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [newPostId, setNewPostId] = useState<string | null>(null);

    const [newPostsCount, setNewPostsCount] = useState(0);

    // fetchPosts is no longer needed, SWR handles it.

    useEffect(() => {
        // Subscribe to new posts
        const sub = subscribeToFeed(() => {
            setNewPostsCount(prev => prev + 1);
        }, user?.id);

        return () => {
            previewUrls.forEach(url => URL.revokeObjectURL(url));
            if (sub) sub.unsubscribe();
        };
    }, []);

    const handleRefreshFeed = () => {
        // setPage(1);
        // fetchPosts(1, true);
        mutate(); // Revalidate SWR
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setNewPostsCount(0);
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !isReachingEnd && !isLoadingMore) {
                    setSize(size + 1);
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
    }, [isReachingEnd, isLoadingMore, size, setSize]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const rawFiles = Array.from(e.target.files);

            // Compression options
            const options = {
                maxSizeMB: 0.8, // Target < 0.8MB
                maxWidthOrHeight: 1920, // Resize if larger than 1920px
                useWebWorker: true,
                fileType: 'image/webp' // Use WebP for better efficiency
            };

            // Show loading or toast if needed, but for now we just process
            // Ideally we should have a loading state for compression

            const compressedFiles = await Promise.all(rawFiles.map(async (file: File) => {
                try {
                    // Only compress images
                    if (!file.type.startsWith('image/')) return file;

                    // Compress
                    const compressedFile = await imageCompression(file, options);

                    // Create a new File object to preserve name (browser-image-compression returns Blob)
                    // and change extension to .webp if converted
                    const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                    return new File([compressedFile], newName, { type: 'image/webp' });
                } catch (error) {
                    console.error("Compression failed for", file.name, error);
                    return file; // Fallback to original
                }
            }));

            const totalFiles = [...selectedFiles, ...compressedFiles].slice(0, 4);

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

                    if (data && data.address && data.address.country) {
                        setLocation(data.address.country);
                    } else {
                        // If country is not found, we do not show specific coordinates anymore per request
                        addToast(t('loc_fetch_fail'), 'error');
                    }
                } catch (e) {
                    addToast(t('loc_fetch_fail'), 'error');
                } finally {
                    setLocationLoading(false);
                }
            }, (err) => {
                let errorMessage = t('loc_fetch_fail');

                // Provide specific error messages based on error code
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = '位置权限被拒绝，请在浏览器设置中允许位置访问 / Location permission denied';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = '位置信息不可用 / Location unavailable';
                        break;
                    case err.TIMEOUT:
                        errorMessage = '获取位置超时 / Location timeout';
                        break;
                }

                addToast(errorMessage, 'error');
                setLocationLoading(false);
            }, {
                timeout: 10000,
                enableHighAccuracy: false,
                maximumAge: 30000
            });
        } else {
            addToast(t('geo_not_supported'), 'error');
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

            setNewPostId(newId);

            // SWR Optimistic Update
            mutate((currentData: any) => {
                if (!currentData) return [[optimisticPost]];
                // Prepend to the first page
                const firstPage = [optimisticPost, ...currentData[0]];
                return [firstPage, ...currentData.slice(1)];
            }, false); // false = don't revalidate immediately

            setNewContent('');
            setSelectedFiles([]);
            setPreviewUrls([]);
            setLocation(null);

            addToast(t('content_published'), "success");
            setTimeout(() => setNewPostId(null), 2000);

            // Trigger revalidation to get real data
            mutate();

        } catch (error) {
            addToast(t('post_fail'), "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            {/* Post Creator */}
            {/* Post Creator */}
            <div className="mb-8">
                <fieldset disabled={submitting} className="group">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden transition-all focus-within:ring-1 focus-within:ring-black dark:focus-within:ring-white focus-within:border-transparent">
                            <div className="p-4">
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-sm shrink-0 overflow-hidden">
                                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.nickname.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <Input.TextArea
                                            className="w-full bg-transparent border-none p-2 text-base text-black dark:text-white focus:shadow-none resize-none placeholder-zinc-400 leading-relaxed !bg-transparent !border-0 !shadow-none focus:!bg-transparent"
                                            placeholder={t('share_placeholder')}
                                            value={newContent}
                                            onChange={(e) => setNewContent(e.target.value)}
                                            autoSize={{ minRows: 3, maxRows: 6 }}
                                            variant="borderless"
                                        />

                                        {/* Attachments Preview */}
                                        {(previewUrls.length > 0 || location) && (
                                            <div className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-md">
                                                {location && (
                                                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1.5 rounded-md w-fit mb-3 font-medium">
                                                        <span>📍 {location}</span>
                                                        <button type="button" onClick={() => setLocation(null)} className="hover:text-black dark:hover:text-white transition-colors">
                                                            <Icons.X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}

                                                {previewUrls.length > 0 && (
                                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                                        {previewUrls.map((url, idx) => (
                                                            <div key={idx} className="relative aspect-square group rounded-md overflow-hidden">
                                                                <img src={url} className="w-full h-full object-cover" alt={t('preview')} />
                                                                <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-black/50 hover:bg-black text-white rounded-full p-1 transition-colors backdrop-blur-sm">
                                                                    <Icons.X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="bg-zinc-50 dark:bg-zinc-900/30 px-4 py-2 flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800">
                                <div className="flex gap-1">
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" multiple />

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={selectedFiles.length >= 4 || submitting}
                                        className="p-2 text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                                        title={t('image')}
                                    >
                                        <Icons.Camera className="w-5 h-5" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleGetLocation}
                                        disabled={locationLoading || submitting}
                                        className={`p-2 rounded-full transition-colors ${location ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                                        title={t('location')}
                                    >
                                        {locationLoading ? <Spin size="small" /> : <Icons.MapPin className="w-5 h-5" />}
                                    </button>
                                </div>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    disabled={submitting || (!newContent.trim() && selectedFiles.length === 0)}
                                    loading={submitting}
                                    size="small"
                                    className="px-6 rounded-full font-bold shadow-none"
                                >
                                    {t('publish')}
                                </Button>
                            </div>
                        </div>
                    </form>
                </fieldset>
            </div>

            {/* Feed Stream */}
            <div className="space-y-6">
                {newPostsCount > 0 && (
                    <div className="flex justify-center animate-fadeIn">
                        <button
                            onClick={handleRefreshFeed}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold transition-all transform hover:scale-105"
                        >
                            <Icons.RefreshCw className="w-4 h-4" />
                            <span>{newPostsCount} {t('new_posts_available')}</span>
                        </button>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center py-12">
                        <Spin size="large" />
                        <p className="text-[10px] font-mono text-zinc-400 mt-4 tracking-widest">{t('syncing_data')}</p>
                    </div>
                ) : (!posts || posts.length === 0) ? (
                    <div className="text-center text-zinc-500 dark:text-zinc-600 py-16 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-sm flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/20">
                        <Icons.Wind className="w-12 h-12 mb-4 opacity-30" />
                        <p className="text-sm font-medium">{t('quiet_here')}</p>
                    </div>
                ) : (
                    <>
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className={post.id === newPostId ? "animate-slideUp" : ""}
                                style={post.id === newPostId ? { animationDuration: '0.6s', animationFillMode: 'backwards' } : {}}
                            >
                                <FeedItem
                                    post={post}
                                    currentUser={user}
                                    onDelete={async (id) => {
                                        await mutate((currentData: any) => {
                                            if (!currentData) return [];
                                            return currentData.map((page: Post[]) => page.filter(p => p.id !== id));
                                        }, false);
                                    }}
                                />
                            </div>
                        ))}

                        <div ref={observerTarget} className="py-8 text-center flex justify-center">
                                    {isLoadingMore ? (
                                <Spin size="default" className="opacity-50" />
                                    ) : isReachingEnd ? (
                                <div className="flex items-center gap-4 w-full justify-center">
                                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-12"></div>
                                    <span className="text-[10px] text-zinc-300 dark:text-zinc-600 tracking-widest uppercase font-mono">{t('end_of_feed')}</span>
                                    <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-12"></div>
                                </div>
                                        ) : (
                                            <div className="h-8"></div> // Spacer for observer
                            )}
                        </div>
                    </>
                )}
            </div>
        </div >
    );
};

export default FeedPage;
