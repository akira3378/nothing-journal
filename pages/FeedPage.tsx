import React, { useEffect, useRef, useState } from 'react';
import { User, Post } from '../types';
import { getFeed, createPost } from '../services/mockBackend';

interface FeedProps {
  user: User;
}

const FeedPage: React.FC<FeedProps> = ({ user }) => {
  const [posts, setPosts] = useState<(Post & { user?: User })[]>([]);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Attachments
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    const data = await getFeed();
    // Ensure data is an array before setting state
    setPosts(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    // Cleanup preview
    return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const f = e.target.files[0];
          setSelectedFile(f);
          setPreviewUrl(URL.createObjectURL(f));
      }
      // Reset input so selecting the same file triggers change again
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
              alert('Could not fetch location. Please check browser permissions.');
              setLocationLoading(false);
          }, { timeout: 5000 });
      } else {
          alert("Geolocation not supported by this browser.");
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
      await fetchPosts();
    } catch (error) {
      console.error(error);
      alert("Failed to post content. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Post Creator */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6 mb-8 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">What's on your mind?</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full bg-black border border-zinc-700 rounded-sm p-4 text-white focus:border-blue-500 focus:outline-none resize-none h-24"
            placeholder="Share something..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          
          {/* Previews */}
          {(previewUrl || location) && (
              <div className="mt-3 flex gap-4 items-center bg-black/50 p-2 rounded border border-zinc-800 animate-fadeIn">
                  {previewUrl && (
                      <div className="relative h-16 w-16 group shrink-0">
                          <img src={previewUrl} className="h-full w-full object-cover rounded-sm border border-zinc-700" alt="Preview" />
                          <button type="button" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600">×</button>
                      </div>
                  )}
                  {location && (
                      <div className="flex items-center gap-2 text-xs text-blue-400 border border-blue-900/30 bg-blue-900/10 px-2 py-1 rounded">
                          <span>📍 {location}</span>
                          <button type="button" onClick={() => setLocation(null)} className="text-zinc-500 hover:text-white font-bold">×</button>
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
                className="hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800"
              >
                  <span>📷</span> Image
              </button>
              
              <button 
                type="button" 
                onClick={handleGetLocation} 
                disabled={locationLoading}
                className="hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800 disabled:opacity-50"
              >
                  {locationLoading ? <span className="animate-spin">⏳</span> : <span>📍</span>}
                  Location
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting || (!newContent.trim() && !selectedFile)}
              className="bg-white text-black px-6 py-2 rounded-sm text-sm font-bold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {submitting ? 'POSTING...' : 'PUBLISH'}
            </button>
          </div>
        </form>
      </div>

      {/* Feed Stream */}
      <div className="space-y-6">
        {loading ? (
          // Loading Skeleton
          <div className="space-y-6">
             {[1, 2, 3].map(i => (
                <div key={i} className="bg-zinc-900/40 border border-zinc-800/50 rounded-sm p-6 animate-pulse">
                  <div className="flex items-center mb-4">
                     <div className="h-10 w-10 rounded-full bg-zinc-800"></div>
                     <div className="ml-4 space-y-2">
                        <div className="h-4 w-32 bg-zinc-800 rounded"></div>
                        <div className="h-3 w-24 bg-zinc-800 rounded"></div>
                     </div>
                  </div>
                  <div className="h-4 w-full bg-zinc-800 rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-zinc-800 rounded"></div>
                </div>
             ))}
          </div>
        ) : (!posts || posts.length === 0) ? (
           <div className="text-center text-zinc-600 py-16 border border-dashed border-zinc-800 rounded-sm flex flex-col items-center justify-center">
               <span className="text-4xl mb-4">🔇</span>
               <p>It's quiet here. Be the first to speak.</p>
           </div>
        ) : (
          // Safe mapping
          Array.isArray(posts) && posts.map((post) => (
            <div key={post.id} className="bg-zinc-900/40 border border-zinc-800/50 rounded-sm p-6 hover:border-zinc-700 transition-colors">
              <div className="flex items-start mb-4">
                <div className="h-10 w-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold mr-4 border border-zinc-600 shrink-0">
                  {post.user?.nickname?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
                     <span className="text-white font-bold hover:underline cursor-pointer">{post.user?.nickname || 'Unknown Member'}</span>
                     <div className="flex flex-wrap gap-1">
                        {post.user?.jobTags?.map(t => <span key={t} className="text-[10px] text-zinc-400 border border-zinc-800 px-1 rounded-[2px] bg-zinc-900">{t}</span>)}
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">{new Date(post.createdAt).toLocaleString()}</span>
                      {post.location && (
                          <span className="text-[10px] text-blue-500 flex items-center gap-0.5">📍 {post.location}</span>
                      )}
                  </div>
                </div>
              </div>
              
              <div className="text-zinc-300 mb-4 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </div>
              
              {post.imageUrl && (
                <div className="mb-4">
                   <img src={post.imageUrl} alt="Post attachment" className="max-h-96 rounded-sm object-cover border border-zinc-800" />
                </div>
              )}

              <div className="flex items-center pt-4 border-t border-zinc-800 text-xs text-zinc-500">
                <button className="hover:text-blue-400 mr-6 flex items-center gap-1">
                   <span>♡</span> Like ({post.likes})
                </button>
                <button className="hover:text-blue-400">Comment</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedPage;