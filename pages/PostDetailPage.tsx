
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getPostById, getComments, toggleLike, addComment, deletePost } from '../services/mockBackend';
import { Post, User, Comment } from '../types';
import { useApp } from '../utils/i18n';
import { ImagePreview } from '../components/ImagePreview';
import { formatLocalTime } from '../utils/formatters';
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
            addToast('Failed to comment', 'error');
        } finally {
            setSendingComment(false);
        }
    };
    
    const handleDelete = async () => {
        if(!post) return;
        if(confirm("Delete post?")) {
            await deletePost(post.id);
            navigate('/feed');
        }
    };

    if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;
    if (!post || !currentUser) return <div className="text-center pt-20 text-zinc-500">Post not found.</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                <Icons.ChevronDown className="w-4 h-4 rotate-90" /> Back
            </button>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-6 shadow-lg">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                         <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            {post.user?.avatarUrl ? (
                                <img src={post.user.avatarUrl} className="w-full h-full object-cover" />
                            ) : (
                                <span className="flex items-center justify-center h-full font-bold">{post.user?.nickname?.charAt(0)}</span>
                            )}
                         </div>
                         <div>
                             <div className="font-bold text-lg">{post.user?.nickname}</div>
                             <div className="text-xs text-zinc-500">{formatLocalTime(post.createdAt)}</div>
                         </div>
                    </div>
                    {(currentUser.id === post.userId || currentUser.role === 'ADMIN') && (
                        <Button variant="ghost" size="sm" onClick={handleDelete}><Icons.Trash className="w-4 h-4" /></Button>
                    )}
                </div>

                {/* Content */}
                <div className="text-lg leading-relaxed mb-6 whitespace-pre-wrap text-black dark:text-zinc-200">
                    {post.content}
                </div>

                {/* Images */}
                {post.imageUrls && post.imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-6">
                        {post.imageUrls.map((url, i) => (
                            <ImagePreview key={i} src={url} alt="Attachment" className="w-full h-auto rounded-sm" thumbnailClassName="w-full h-full object-cover aspect-square" />
                        ))}
                    </div>
                )}
                
                {/* Actions */}
                <div className="flex items-center gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                     <button 
                        onClick={handleLike} 
                        className={`flex items-center gap-2 text-sm font-bold ${isLiked ? 'text-red-500' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
                    >
                        <Icons.Heart className="w-5 h-5" fill={isLiked} /> {likes}
                    </button>
                    <div className="flex items-center gap-2 text-sm font-bold text-zinc-500">
                        <Icons.MessageSquare className="w-5 h-5" /> {comments.length}
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <div className="mt-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Comments</h3>
                
                {/* Input */}
                <form onSubmit={handleSendComment} className="mb-8 flex gap-2">
                    <input 
                        value={commentInput}
                        onChange={e => setCommentInput(e.target.value)}
                        className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-3 rounded-sm outline-none focus:border-black dark:focus:border-white transition-colors"
                        placeholder="Write a comment..."
                    />
                    <Button type="submit" isLoading={sendingComment} disabled={!commentInput.trim()}>Send</Button>
                </form>

                {/* List */}
                <div className="space-y-4">
                    {comments.map(c => (
                        <div 
                            id={`comment-${c.id}`} 
                            key={c.id} 
                            className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-sm transition-colors duration-1000"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                         {c.user?.avatarUrl && <img src={c.user.avatarUrl} className="w-full h-full object-cover" />}
                                    </div>
                                    <span className="font-bold text-sm">{c.user?.nickname}</span>
                                </div>
                                <span className="text-xs text-zinc-400">{formatLocalTime(c.createdAt)}</span>
                            </div>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 pl-8">{c.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PostDetailPage;
