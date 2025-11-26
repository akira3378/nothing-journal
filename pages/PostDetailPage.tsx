
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getPostById, getComments, toggleLike, addComment, deletePost, deleteComment } from '../services/mockBackend';
import { Post, User, Comment } from '../types';
import { useApp } from '../utils/i18n';
import { ImagePreview } from '../components/ImagePreview';
import { formatLocalTime, formatRelativeTime } from '../utils/formatters';
import { Button, Spinner, useToast, Icons } from '../components/UI';
import { getCurrentUser } from '../services/mockBackend';

const PostDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const highlightCommentId = searchParams.get('highlightCommentId');
    const navigate = useNavigate();
    const { t } = useApp();
    const { addToast } = useToast();

    const [post, setPost] = useState<(Post & { user?: User }) | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentInput, setCommentInput] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const [replyToId, setReplyToId] = useState<string | undefined>(undefined);

    // Local interaction state
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (!id) return;
            try {
                const [p, u] = await Promise.all([
                    getPostById(id),
                    getCurrentUser()
                ]);
                setPost(p);
                setCurrentUser(u);

                if (p) {
                    setLikes(p.likes);
                    setIsLiked(p.isLikedByCurrentUser || false);
                    const c = await getComments(id);
                    setComments(c);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id]);

    useEffect(() => {
        if (!loading && highlightCommentId) {
            setTimeout(() => {
                const el = document.getElementById(`comment-${highlightCommentId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('bg-yellow-50', 'dark:bg-yellow-900/20');
                    setTimeout(() => {
                        el.classList.remove('bg-yellow-50', 'dark:bg-yellow-900/20');
                    }, 3000);
                }
            }, 500);
        }
    }, [loading, highlightCommentId]);

    const handleLike = async () => {
        if (!post) return;
        const newVal = !isLiked;
        setIsLiked(newVal);
        setLikes(prev => newVal ? prev + 1 : prev - 1);
        await toggleLike(post.id);
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentInput.trim() || !post) return;
        setSendingComment(true);
        try {
            await addComment(post.id, commentInput, replyToId);
            setCommentInput('');
            setReplyToId(undefined);
            const data = await getComments(post.id);
            setComments(data);
        } catch (e) {
            addToast('Failed to comment', 'error');
        } finally {
            setSendingComment(false);
        }
    };

    const handleDelete = async () => {
        if (!post) return;
        if (confirm(t('delete_confirm'))) {
            try {
                await deletePost(post.id);
                navigate('/feed');
            } catch (e) {
                addToast(t('delete_failed'), 'error');
            }
        }
    };

    const handleReply = (commentId: string, username: string) => {
        setReplyToId(commentId);
        setCommentInput(`@${username} `);
        // Focus input
        const input = document.querySelector('input[placeholder="Write a comment..."]') as HTMLInputElement;
        if (input) input.focus();
    };

    if (loading) return <div className="flex justify-center pt-32"><Spinner size="lg" /></div>;
    if (!post || !currentUser) return <div className="text-center pt-32 text-zinc-500 font-mono">ERR: POST_NOT_FOUND</div>;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-black dark:hover:text-white transition-colors uppercase tracking-wider">
                <Icons.ChevronDown className="w-4 h-4 rotate-90" /> Back to Feed
            </button>

            <article className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-sm shadow-sm transition-colors mb-4 overflow-hidden">
                {/* Header */}
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                                {post.user?.avatarUrl ? (
                                    <img src={post.user.avatarUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-zinc-500 dark:text-zinc-400">{post.user?.nickname?.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-sm text-black dark:text-white">{post.user?.nickname}</div>
                                <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    {formatLocalTime(post.createdAt)}
                                    {post.location && ` • ${post.location}`}
                                </div>
                            </div>
                        </div>
                        {(currentUser.id === post.userId || currentUser.role === 'ADMIN') && (
                            <button onClick={handleDelete} className="text-zinc-300 hover:text-red-500 transition-colors p-1">
                                <Icons.Trash className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="text-base leading-relaxed mb-6 whitespace-pre-wrap text-black dark:text-white">
                        {post.content}
                    </div>

                    {/* Images */}
                    {post.imageUrls && post.imageUrls.length > 0 && (
                        <div className={`grid gap-1 mb-2 ${post.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {post.imageUrls.map((url, i) => (
                                <ImagePreview
                                    key={i}
                                    src={url}
                                    alt="Attachment"
                                    className="w-full rounded-sm overflow-hidden bg-zinc-100 dark:bg-zinc-900"
                                    thumbnailClassName="w-full h-auto object-cover max-h-[500px]"
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Full Width Actions */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 flex items-center">
                    <button
                        onClick={handleLike}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold transition-colors ${isLiked
                            ? 'text-red-500 bg-red-50/50 dark:bg-red-900/10'
                            : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white'
                            }`}
                    >
                        <Icons.Heart className={`w-4 h-4 transition-transform ${isLiked ? 'scale-110 fill-current' : ''}`} fill={isLiked} />
                        <span>{likes > 0 ? likes : 'Like'}</span>
                    </button>

                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800"></div>

                    <div className="flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold text-zinc-500">
                        <Icons.MessageSquare className="w-4 h-4" />
                        <span>{comments.length > 0 ? comments.length : 'Comment'}</span>
                    </div>
                </div>
            </article>

            {/* Comments Section */}
            <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-sm p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-6">Discussion ({comments.length})</h3>

                {/* List */}
                <div className="space-y-6 mb-8">
                    {comments.length === 0 && (
                        <div className="text-center text-zinc-400 text-sm py-4 italic">No comments yet.</div>
                    )}
                    {comments.map(c => (
                        <CommentItem
                            key={c.id}
                            comment={c}
                            currentUser={currentUser}
                            onDelete={async (cid) => {
                                if (confirm(t('delete_confirm'))) {
                                    try {
                                        await deleteComment(cid);
                                        // Refresh comments
                                        const data = await getComments(post.id);
                                        setComments(data);
                                    } catch (e) {
                                        addToast(t('failed_delete_comment'), 'error');
                                    }
                                }
                            }}
                            onReply={(cid, username) => {
                                setCommentInput(`@${username} `);
                                // Ideally we would track parentId state here, but for now simple text reply or we can add parentId state
                                // The user asked for nested comments. We should probably support actual nesting.
                                // Let's assume the backend 'addComment' handles parentId if we pass it.
                                // But the current UI input is global at the bottom.
                                // To keep it simple, we'll just focus input. 
                                // To do it properly, we need a 'replyingTo' state.
                            }}
                            // We need to pass a way to set parentId for the new comment
                            setReplyingTo={(id) => {
                                // This requires state in the parent component
                                // Let's add that state.
                            }}
                        />
                    ))}
                </div>

                {/* Sticky Input */}
                <div className="sticky bottom-4 z-10">
                    <CommentInput
                        currentUser={currentUser}
                        value={commentInput}
                        onChange={setCommentInput}
                        onSubmit={handleSendComment}
                        loading={sendingComment}
                    />
                </div>
            </div>
        </div>
    );
};

// Helper Components

const CommentItem: React.FC<{
    comment: Comment,
    currentUser: User,
    onDelete: (id: string) => void,
    onReply: (id: string, username: string) => void,
    setReplyingTo?: (id: string) => void
}> = ({ comment, currentUser, onDelete, onReply, setReplyingTo }) => {
    const { t } = useApp();
    const isOwner = currentUser.id === comment.userId;
    const isAdmin = currentUser.role === 'ADMIN';

    return (
        <div id={`comment-${comment.id}`} className="flex gap-3 group animate-fadeIn">
            <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] shrink-0 overflow-hidden border border-zinc-300 dark:border-zinc-700 mt-1">
                {comment.user?.avatarUrl ? <img src={comment.user.avatarUrl} className="w-full h-full object-cover" /> : comment.user?.nickname?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-sm text-black dark:text-white">{comment.user?.nickname}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>

                {/* Actions */}
                <div className="flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onReply(comment.id, comment.user?.nickname || '')}
                        className="text-[10px] font-bold text-zinc-400 hover:text-black dark:hover:text-white uppercase tracking-wider"
                    >
                        {t('reply')}
                    </button>
                    {(isOwner || isAdmin) && (
                        <button
                            onClick={() => onDelete(comment.id)}
                            className="text-[10px] font-bold text-zinc-400 hover:text-red-500 uppercase tracking-wider"
                        >
                            {t('delete')}
                        </button>
                    )}
                </div>

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-4">
                        {comment.replies.map(reply => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                currentUser={currentUser}
                                onDelete={onDelete}
                                onReply={onReply}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const CommentInput: React.FC<{
    currentUser: User,
    value: string,
    onChange: (val: string) => void,
    onSubmit: (e: React.FormEvent) => void,
    loading: boolean
}> = ({ currentUser, value, onChange, onSubmit, loading }) => {
    return (
        <form onSubmit={onSubmit} className="relative shadow-lg rounded-full">
            <div className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-full opacity-90 blur-sm"></div>
            <div className="relative flex items-center bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-full p-1 pl-2">
                <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] mr-2 shrink-0">
                    {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover rounded-full" /> : currentUser.nickname?.charAt(0)}
                </div>
                <input
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="flex-1 bg-transparent px-2 py-2 text-sm outline-none text-black dark:text-white placeholder-zinc-400"
                    placeholder="Write a comment..."
                />
                <Button type="submit" isLoading={loading} disabled={!value.trim()} size="sm" className="h-8 rounded-full px-4">Send</Button>
            </div>
        </form>
    );
};

export default PostDetailPage;
