import React, { useEffect, useRef, useState } from 'react';
import { User, Post, Comment } from '../types';
import { getFeed, createPost, deletePost, toggleLike, getComments, addComment } from '../services/mockBackend';
import { useApp } from '../utils/i18n';
import { ImagePreview } from '../components/ImagePreview';
import { formatLocalTime } from '../utils/formatters';

interface FeedProps {
  user: User;
}

const FeedItem: React.FC<{ post: Post; currentUser: User; onDelete: (id: string) => void }> = ({ post, currentUser, onDelete }) => {
    const { t } = useApp();
    const [likes, setLikes] = useState(post.likes);
    const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsLoaded, setCommentsLoaded] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const [error, setError] = useState('');

    const handleLike = async () => {
        // Optimistic update
        const newVal = !isLiked;
        setIsLiked(newVal);
        setLikes(prev => newVal ? prev + 1 : prev - 1);
        
        try {
            await toggleLike(post.id);
        } catch (e) {
            // Revert
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
                setError("Failed to load comments.");
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
            // Refresh comments
            const data = await getComments(post.id);
            setComments(data);
        } catch (e) {
            alert('Failed to comment.');
        } finally {
            setSendingComment(false);
        }
    };

    const handleDelete = async () => {
        if (confirm(t('delete_confirm'))) {
            try {
                await deletePost(post.id);
                onDelete(post.id);
            } catch (e) {
                alert('Delete failed');
            }
        }
    };

    const canDelete = currentUser.role === 'ADMIN' || currentUser.id === post.userId;

    return (
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-sm p-6 transition-all shadow-sm dark:shadow-none mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start">
                    {/* Avatar with Preview */}
                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-black dark:text-white font-bold mr-4 border border-zinc-200 dark:border-zinc-700 shrink-0 overflow-hidden">
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
                        <span className="text-black dark:text-white font-bold hover:underline cursor-pointer">{post.user?.nickname || t('unknown_member')}</span>
                        <div className="flex flex-wrap gap-1">
                            {post.user?.jobTags?.map(t => <span key={t} className="text-[10px] text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-800 px-1 rounded-[2px] bg-gray-100 dark:bg-zinc-900">{t}</span>)}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Formatted Local Time */}
                        <span className="text-xs text-zinc-500">{formatLocalTime(post.createdAt)}</span>
                        {post.location && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-500 flex items-center gap-0.5">📍 {post.location}</span>
                        )}
                    </div>
                    </div>
                </div>
                
                {canDelete && (
                    <button onClick={handleDelete} className="text-xs text-zinc-400 hover:text-red-500 transition-colors" title={t('delete')}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                )}
              </div>
              
              <div className="text-zinc-800 dark:text-zinc-300 mb-4 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </div>
              
              {post.imageUrl && (
                <div className="mb-4">
                   <ImagePreview 
                        src={post.imageUrl}
                        alt="Post attachment"
                        className="rounded-sm w-full max-h-96"
                        thumbnailClassName="w-full max-h-96 object-cover border border-zinc-200 dark:border-zinc-800"
                   />
                </div>
              )}

              <div className="flex items-center pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 font-bold select-none">
                <button 
                    onClick={handleLike} 
                    className={`mr-6 flex items-center gap-2 px-2 py-1 rounded transition-all active:scale-95 ${isLiked ? 'text-red-500 bg-red-50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                >
                   <svg className={`w-5 h-5 transition-transform ${isLiked ? 'scale-110 fill-current' : 'scale-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                   </svg>
                   <span>{likes > 0 ? likes : ''}</span>
                </button>
                
                <button 
                    onClick={toggleComments} 
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    <span>{post.commentsCount ? post.commentsCount : ''}</span>
                </button>
              </div>

              {/* Comments Section */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showComments ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 bg-gray-50 dark:bg-zinc-900/30 -mx-6 -mb-6 px-6 pb-6 rounded-b-sm">
                      {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
                      
                      {commentsLoading ? (
                          <div className="flex items-center justify-center py-4 space-x-2">
                             <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                             <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-75"></div>
                             <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-150"></div>
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
                                               <span className="text-[10px] text-zinc-400">{formatLocalTime(c.createdAt)}</span>
                                          </div>
                                          <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-0.5">{c.content}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                      
                      <form onSubmit={handleSendComment} className="flex gap-2 relative">
                          <input 
                            value={commentInput}
                            onChange={e => setCommentInput(e.target.value)}
                            placeholder={t('write_comment')}
                            className="flex-1 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-sm px-4 py-2 text-sm outline-none focus:border-zinc-400 pr-10 transition-colors"
                          />
                          <button type="submit" disabled={sendingComment} className="absolute right-1 top-1 bottom-1 px-3 bg-black dark:bg-white text-white dark:text-black rounded-sm text-xs font-bold hover:opacity-80 disabled:opacity-50 transition-opacity">
                              {sendingComment ? '...' : '→'}
                          </button>
                      </form>
                  </div>
              </div>
            </div>
    );
};

const FeedPage: React.FC<FeedProps> = ({ user }) => {
  const { t } = useApp();
  const [posts, setPosts] = useState<(Post & { user?: User })[]>([]);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 10;
  
  // Attachments
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async (currentPage: number) => {
    setLoading(true);
    const { data, count } = await getFeed(currentPage, ITEMS_PER_PAGE);
    setPosts(Array.isArray(data) ? data : []);
    setTotalCount(count);
    setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [page]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const f = e.target.files[0];
          setSelectedFile(f);
          setPreviewUrl(URL.createObjectURL(f));
      }
      e.target.value = '';
  };

  const handleGetLocation = () => {
      setLocationLoading(true);
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
              setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
              setLocationLoading(false);
          }, (err) => {
              console.error("Location error", err);
              alert('Could not fetch location.');
              setLocationLoading(false);
          }, { timeout: 5000 });
      } else {
          alert("Geolocation not supported.");
          setLocationLoading(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() && !selectedFile) return;
    
    setSubmitting(true);
    try {
      await createPost(newContent, selectedFile || undefined, location || undefined);
      setNewContent('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setLocation(null);
      
      // Reset to page 1 to see new post
      if (page === 1) {
          await fetchPosts(1);
      } else {
          setPage(1);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to post content.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrevPage = () => {
      if (page > 1) setPage(p => p - 1);
  };

  const handleNextPage = () => {
      if (page < totalPages) setPage(p => p + 1);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Post Creator */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-6 mb-8 shadow-sm dark:shadow-lg transition-colors">
        <h3 className="text-lg font-bold text-black dark:text-white mb-4">{t('whats_on_mind')}</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full bg-gray-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 rounded-sm p-4 text-black dark:text-white focus:border-blue-500 focus:outline-none resize-none h-24 placeholder-zinc-400"
            placeholder={t('share_placeholder')}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          
          {/* Previews */}
          {(previewUrl || location) && (
              <div className="mt-3 flex gap-4 items-center bg-gray-50 dark:bg-black/50 p-2 rounded border border-zinc-200 dark:border-zinc-800 animate-fadeIn">
                  {previewUrl && (
                      <div className="relative h-16 w-16 group shrink-0">
                          <img src={previewUrl} className="h-full w-full object-cover rounded-sm border border-zinc-300 dark:border-zinc-700" alt="Preview" />
                          <button type="button" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600">×</button>
                      </div>
                  )}
                  {location && (
                      <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 px-2 py-1 rounded">
                          <span>📍 {location}</span>
                          <button type="button" onClick={() => setLocation(null)} className="text-zinc-500 hover:text-black dark:hover:text-white font-bold">×</button>
                      </div>
                  )}
              </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <div className="text-xs text-zinc-500 flex gap-4">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
              
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                  <span>📷</span> {t('image')}
              </button>
              
              <button 
                type="button" 
                onClick={handleGetLocation} 
                disabled={locationLoading}
                className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                  {locationLoading ? <span className="animate-spin">⏳</span> : <span>📍</span>}
                  {t('location')}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting || (!newContent.trim() && !selectedFile)}
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-sm text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4 text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {submitting ? t('posting') : t('publish')}
            </button>
          </div>
        </form>
      </div>

      {/* Feed Stream */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-6">
             {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-sm p-6 animate-pulse shadow-sm">
                  <div className="flex items-center mb-4">
                     <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-zinc-800"></div>
                     <div className="ml-4 space-y-2">
                        <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                        <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                     </div>
                  </div>
                  <div className="h-4 w-full bg-gray-200 dark:bg-zinc-800 rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                </div>
             ))}
          </div>
        ) : (!posts || posts.length === 0) ? (
           <div className="text-center text-zinc-500 dark:text-zinc-600 py-16 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-sm flex flex-col items-center justify-center">
               <span className="text-4xl mb-4">🔇</span>
               <p>{t('quiet_here')}</p>
           </div>
        ) : (
          <>
            {posts.map((post) => (
                <FeedItem 
                    key={post.id} 
                    post={post} 
                    currentUser={user} 
                    onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))} 
                />
            ))}
            
            {/* Pagination Controls */}
            {totalCount > ITEMS_PER_PAGE && (
                <div className="flex justify-between items-center pt-8 border-t border-zinc-200 dark:border-zinc-800">
                    <button 
                        onClick={handlePrevPage} 
                        disabled={page === 1}
                        className="px-4 py-2 text-sm font-bold border border-zinc-300 dark:border-zinc-700 rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        ← Prev
                    </button>
                    <span className="text-xs font-mono text-zinc-500">
                        PAGE {page} / {totalPages}
                    </span>
                    <button 
                        onClick={handleNextPage} 
                        disabled={page === totalPages}
                        className="px-4 py-2 text-sm font-bold border border-zinc-300 dark:border-zinc-700 rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        Next →
                    </button>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FeedPage;