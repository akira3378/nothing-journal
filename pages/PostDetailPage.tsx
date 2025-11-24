
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getPostById, getComments, toggleLike, addComment, deletePost } from '../services/mockBackend';
import { Post, User, Comment } from '../types';
import { useApp } from '../utils/i18n';
import { ImagePreview } from '../components/ImagePreview';
import { formatLocalTime } from '../utils/formatters';
import { Button, Spinner, useToast, Icons } from '../components/UI';
import { getCurrentUser } from '../services/mockBackend';
import { motion, AnimatePresence } from 'framer-motion';

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

    // Auto-scroll to highlighted comment
    useEffect(() => {
        if (!loading && highlightCommentId) {
            setTimeout(() => {
                const el = document.getElementById(`comment-${highlightCommentId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('bg-yellow-100', 'dark:bg-yellow-900/30');
                    setTimeout(() => {
                        el.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/30');
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
            await addComment(post.id, commentInput);
            setCommentInput('');
            const data = await getComments(post.id);
            setComments(data);
        } catch (e) {
            addToast(t('post_fail'), 'error');
        } finally {
            setSendingComment(false);
        }
    };

    const handleDelete = async () => {
        if (!post) return;
        if (confirm(t('delete_confirm'))) {
            await deletePost(post.id);
            addToast(t('post_deleted'), 'success');
            navigate('/feed');
        }
    };

    if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;
    if (!post || !currentUser) return <div className="text-center pt-20 text-zinc-500">{t('fetch_fail')}</div>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-3xl mx-auto px-4 py-8"
        >
            <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors group">
                <Icons.ChevronDown className="w-4 h-4 rotate-90 group-hover:-translate-x-1 transition-transform" /> {t('return_home')}
            </button>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-6 shadow-lg"
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                            {post.user?.avatarUrl ? (
                                <img src={post.user.avatarUrl} className="w-full h-full object-cover" />
                            ) : (
                                <span className="flex items-center justify-center h-full font-bold">{post.user?.nickname?.charAt(0)}</span>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="font-bold text-lg">{post.user?.nickname}</div>
                                {post.user?.jobTags?.map(t => <span key={t} className="text-[10px] text-zinc-500 border border-zinc-200 dark:border-zinc-700 px-1.5 rounded-sm">{t}</span>)}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-zinc-500 font-mono">{formatLocalTime(post.createdAt)}</span>
                                {post.location && (
                                    <span className="text-[10px] text-blue-600 dark:text-blue-500 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/10 px-1.5 rounded-sm">
                                        <Icons.MapPin className="w-3 h-3" /> {post.location}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {(currentUser.id === post.userId || currentUser.role === 'ADMIN') && (
                        <Button variant="ghost" size="sm" onClick={handleDelete} className="text-zinc-400 hover:text-red-500"><Icons.Trash className="w-4 h-4" /></Button>
                    )}
                </div>

                {/* Content */}
                <div className="text-lg leading-relaxed mb-6 whitespace-pre-wrap text-black dark:text-zinc-200 pl-16">
                    {post.content}
                </div>

                {/* Images */}
                {post.imageUrls && post.imageUrls.length > 0 && (
                    <div className="pl-16 mb-6">
                        <div className={`grid gap-2 ${post.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {post.imageUrls.map((url, i) => (
                                <ImagePreview key={i} src={url} alt="Attachment" className="w-full h-auto rounded-sm overflow-hidden bg-zinc-100 dark:bg-zinc-800" thumbnailClassName="w-full h-full object-cover aspect-square hover:scale-105 transition-transform duration-500" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 pl-16">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleLike}
                        className={`flex items-center gap-2 text-sm font-bold transition-colors ${isLiked ? 'text-red-500' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
                    >
                        <Icons.Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-current scale-110' : ''}`} /> {likes}
                    </motion.button>
                    <div className="flex items-center gap-2 text-sm font-bold text-zinc-500">
                        <Icons.MessageSquare className="w-5 h-5" /> {comments.length}
                    </div>
                </div>
            </motion.div>

            {/* Comments Section */}
            <div className="mt-8 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 ml-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6 pl-4">{t('comments_label')}</h3>

                {/* Input */}
                <form onSubmit={handleSendComment} className="mb-8 flex gap-2 pl-4">
                    <div className="flex-1 relative">
                        <input
                            value={commentInput}
                            onChange={e => setCommentInput(e.target.value)}
                            className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-700 py-2 pr-10 outline-none focus:border-black dark:focus:border-white transition-colors placeholder-zinc-400"
                            placeholder={t('write_comment')}
                        />
                        <button
                            type="submit"
                            disabled={!commentInput.trim() || sendingComment}
                            className="absolute right-0 top-2 text-zinc-400 hover:text-black dark:hover:text-white disabled:opacity-30"
                        >
                            {sendingComment ? <Spinner size="sm" /> : <Icons.ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>
                </form>

                {/* List */}
                <div className="space-y-6 pl-4">
                    <AnimatePresence>
                        {comments.map(c => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                id={`comment-${c.id}`}
                                key={c.id}
                                className="group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 mt-1">
                                        {c.user?.avatarUrl ? <img src={c.user.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold">{c.user?.nickname?.charAt(0)}</div>}
                                    </div>
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-bold text-sm text-black dark:text-white">{c.user?.nickname}</span>
                                            <span className="text-xs text-zinc-400 font-mono">{formatLocalTime(c.createdAt)}</span>
                                        </div>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">{c.content}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default PostDetailPage;
