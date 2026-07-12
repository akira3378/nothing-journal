




import { createClient, SupabaseClient, Session, EmailOtpType, RealtimeChannel } from '@supabase/supabase-js';
import { User, UserRole, Post, ApiResponse, Comment, SiteConfig, Notification, NotificationType } from '../types';
import imageCompression from 'browser-image-compression';

/*
  --- SUPABASE DATABASE SCHEMA (RUN THIS IN SQL EDITOR) ---

  -- 1. Profiles
  create table profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique,
    nickname text,
    job_tags text[],
    role text default 'USER', -- 'USER', 'ADMIN'
    avatar_url text,
    country text, -- New
    city text, -- New
    created_at timestamptz default now()
  );

  -- 2. Posts
  create table posts (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references profiles(id) on delete cascade,
    title text,
    content text,
    image_urls text[],
    location text,
    entry_date timestamptz default now(),
    is_published boolean default true,
    created_at timestamptz default now()
  );

  -- 3. Comments
  create table comments (
    id uuid default gen_random_uuid() primary key,
    post_id uuid references posts(id) on delete cascade,
    user_id uuid references profiles(id) on delete cascade,
    content text,
    parent_id uuid references comments(id) on delete cascade,
    created_at timestamptz default now()
  );

  -- 4. Likes
  create table likes (
    id uuid default gen_random_uuid() primary key,
    post_id uuid references posts(id) on delete cascade,
    user_id uuid references profiles(id) on delete cascade,
    created_at timestamptz default now(),
    unique(post_id, user_id)
  );

  -- 5. Notifications (NEW)
  create table notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references profiles(id) not null, -- Receiver
    trigger_user_id uuid references profiles(id), -- Sender
    type text not null, -- 'COMMENT', 'SYSTEM'
    content text,
    related_post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    related_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
    is_read boolean default false,
    created_at timestamptz default now()
  );

  -- 6. Site Config
  create table site_config (
    id bigint primary key,
    logo_url text -- New
  );
  
  -- Insert default config row if not exists
  insert into site_config (id) values (1) on conflict do nothing;
*/

// --- Configuration Management ---
const CONFIG_KEYS = {
    URL: 'nothing_sb_url',
    KEY: 'nothing_sb_key'
};

const DEFAULT_URL = 'https://dyspuewvcrgzlvoebson.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5c3B1ZXd2Y3Jnemx2b2Vic29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTI1NDUsImV4cCI6MjA3OTM4ODU0NX0.mB5CppY2w8eGV1CtkcKtVi8tlIDIOoFaXbRRsxXZ4lA';

let supabase: SupabaseClient | null = null;

// --- Global Error Dispatcher ---
export const SYSTEM_ERROR_EVENT = 'NOTHING_SYSTEM_ERROR';

interface SystemErrorDetail {
    title: string;
    message: string;
    code?: string;
    hint?: string;
}

const dispatchFatalError = (error: any, context: string) => {
    console.error(`[Fatal Error in ${context}]`, error);

    let detail: SystemErrorDetail = {
        title: 'System Malfunction',
        message: error.message || 'An unexpected error occurred.',
        code: error.code
    };

    // Handle specific Postgres errors
    if (error.code === '42703') {
        detail.title = 'Database Schema Mismatch';
        detail.message = `Column not found: ${error.message}`;
        detail.hint = 'Please run the latest SQL script in Supabase SQL Editor to update your table structure.';
    } else if (error.code === '42P01') {
        detail.title = 'Missing Table Structure';
        detail.message = `Table not found: ${error.message}`;
        detail.hint = 'A required database table is missing. Please run the setup SQL script in Supabase.';
    } else if (error.code === 'PGRST301') {
        detail.title = 'Authentication Error';
        detail.message = 'Your session token may be invalid or expired.';
    } else if (error.code === '23505') {
        // Unique violation is usually handled locally, but if fatal:
        detail.title = 'Data Conflict';
        detail.message = 'Duplicate data entry detected.';
    }

    window.dispatchEvent(new CustomEvent(SYSTEM_ERROR_EVENT, { detail }));
};

export const isBackendConfigured = () => {
    return (!!localStorage.getItem(CONFIG_KEYS.URL) && !!localStorage.getItem(CONFIG_KEYS.KEY)) || (!!DEFAULT_URL && !!DEFAULT_KEY);
};

export const configureBackend = (url: string, key: string) => {
    localStorage.setItem(CONFIG_KEYS.URL, url);
    localStorage.setItem(CONFIG_KEYS.KEY, key);
    initializeClient();
};

const initializeClient = () => {
    let url = localStorage.getItem(CONFIG_KEYS.URL);
    let key = localStorage.getItem(CONFIG_KEYS.KEY);

    if (!url || !key) {
        url = DEFAULT_URL;
        key = DEFAULT_KEY;
    }

    if (url && key) {
        try {
            supabase = createClient(url, key);
        } catch (e) {
            console.error("Failed to initialize Supabase client:", e);
        }
    }
};

initializeClient();

const ensureClient = (): ApiResponse<any> => {
    if (!supabase) return { success: false, error: 'Backend not configured' };
    return { success: true };
};

// --- Helper: Image Compression ---
const compressImage = async (file: File, bucket: 'avatars' | 'posts'): Promise<File> => {
    // Only compress images
    if (!file.type.startsWith('image/')) return file;

    try {
        // Different strategies for different use cases
        let options;

        if (bucket === 'avatars') {
            // Avatars: Aggressive compression (displayed small, ~50-200KB target)
            options = {
                maxSizeMB: 0.2,           // Target < 200KB
                maxWidthOrHeight: 512,    // Avatars don't need to be huge
                useWebWorker: true,
                fileType: 'image/webp',
                quality: 0.7,             // Lower quality = smaller file
                initialQuality: 0.7
            };
        } else {
            // Posts: Moderate compression (balance quality & size, ~500KB target)
            options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                fileType: 'image/webp',
                quality: 0.8,
                initialQuality: 0.8
            };
        }

        const compressedBlob = await imageCompression(file, options);

        // Rename to .webp
        const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
        return new File([compressedBlob], newName, { type: 'image/webp' });
    } catch (error) {
        console.error("Compression failed", error);
        return file;
    }
};

// --- Auth Service ---

export const getSession = async (): Promise<Session | null> => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

// Step 1: Send OTP (Code)
export const sendOtp = async (email: string, forRegistration = false): Promise<ApiResponse<string>> => {
    const check = ensureClient();
    if (!check.success) return check;

    const cleanEmail = email.trim().toLowerCase();

    try {
        const { data: existing } = await supabase!.from('profiles').select('id').eq('email', cleanEmail).maybeSingle();
        if (forRegistration && existing) {
            return { success: false, error: 'Account already exists.' };
        }
        if (!forRegistration && !existing) {
            return { success: false, error: 'Account not found.' };
        }

        // Send OTP
        const { error } = await supabase!.auth.signInWithOtp({
            email: cleanEmail,
            options: {
                shouldCreateUser: forRegistration,
            },
        });

        if (error) throw error;
        return { success: true, data: 'Verification code sent.' };
    } catch (err: any) {
        return { success: false, error: err.message || 'Failed to send Code' };
    }
};

// Step 2: Verify OTP
export const verifyOtp = async (email: string, token: string, type: EmailOtpType = 'email'): Promise<ApiResponse<Session>> => {
    const check = ensureClient();
    if (!check.success) return check;

    try {
        // Attempt 1: Try with the requested type (e.g., 'signup' or 'email')
        const { data, error } = await supabase!.auth.verifyOtp({
            email,
            token,
            type: type
        });

        if (!error && data.session) {
            return { success: true, data: data.session };
        }

        // Attempt 2: Fallback logic (Fixes 403 "Token expired" issues)
        if (error && (type === 'signup' || type === 'email' || type === 'magiclink')) {
            console.warn(`Initial verify (${type}) failed: ${error.message}. Attempting fallback...`);

            let fallbackType: EmailOtpType = 'email';
            if (type === 'email' || type === 'magiclink') {
                fallbackType = 'signup';
            }

            const { data: retryData, error: retryError } = await supabase!.auth.verifyOtp({
                email,
                token,
                type: fallbackType
            });

            if (!retryError && retryData.session) {
                return { success: true, data: retryData.session };
            }
        }

        if (error) throw error;
        return { success: false, error: 'Verification failed.' };
    } catch (err: any) {
        return { success: false, error: err.message || 'Invalid code' };
    }
};

export const createProfile = async (nickname: string): Promise<ApiResponse<User>> => {
    const check = ensureClient();
    if (!check.success) return check;

    const { data: { user }, error: userError } = await supabase!.auth.getUser();
    if (userError || !user) {
        return { success: false, error: 'Unable to retrieve the new account.' };
    }

    const cleanNickname = nickname.trim();
    if (!cleanNickname) {
        return { success: false, error: 'Nickname is required.' };
    }

    const { error } = await supabase!.from('profiles').insert({
        id: user.id,
        email: user.email,
        nickname: cleanNickname,
        job_tags: [],
        role: 'USER',
    });

    if (error) return { success: false, error: error.message };

    const profile = await getCurrentUser();
    return profile
        ? { success: true, data: profile }
        : { success: false, error: 'Profile creation failed.' };
};

export const uploadImage = async (file: File, bucket: 'avatars' | 'posts'): Promise<string | null> => {
    if (!supabase) return null;
    try {
        const fileToUpload = await compressImage(file, bucket);

        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, fileToUpload);

        if (uploadError) {
            console.warn(`Upload to ${bucket} failed:`, uploadError);
            return null;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return data.publicUrl;
    } catch (e) {
        console.error("Upload exception:", e);
        return null;
    }
};

export const updateUserProfile = async (userId: string, updates: {
    nickname?: string;
    jobTags?: string[];
    avatarFile?: File;
    country?: string;
    city?: string;
}) => {
    if (!supabase) return;

    const payload: any = {};
    if (updates.nickname) payload.nickname = updates.nickname;
    if (updates.jobTags) payload.job_tags = updates.jobTags;
    if (updates.country) payload.country = updates.country;
    if (updates.city) payload.city = updates.city;

    if (updates.avatarFile) {
        const url = await uploadImage(updates.avatarFile, 'avatars');
        if (url) payload.avatar_url = url;
    }

    const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
    if (error) throw error;
};

export const logout = async () => {
    if (supabase) await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
    if (!supabase) return null;

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

    if (error) {
        // Don't throw on not found; the account has no profile yet.
        return null;
    }

    if (!profile) return null;

    return {
        id: profile.id,
        email: profile.email,
        nickname: profile.nickname,
        role: profile.role as UserRole,
        jobTags: profile.job_tags || [],
        avatarUrl: profile.avatar_url,
        createdAt: new Date(profile.created_at).getTime(),
        country: profile.country,
        city: profile.city,
    };
};

// --- Site Config Service ---

export const getSiteConfig = async (): Promise<SiteConfig> => {
    if (!supabase) return { logoUrl: '' };

    try {
        const { data, error } = await supabase
            .from('site_config')
            .select('logo_url')
            .eq('id', 1)
            .maybeSingle();

        if (error) {
            // CRITICAL: If this schema error happens, app is broken. Dispatch it.
            if (error.code === '42703') { // Undefined column
                dispatchFatalError(error, 'getSiteConfig');
            }
            console.warn("Error fetching site config:", error.message);
            return { logoUrl: '' };
        }

        return {
            logoUrl: data?.logo_url || ''
        };
    } catch (e) {
        console.error("Site Config fetch exception:", e);
        return { logoUrl: '' };
    }
};

export const updateSiteConfig = async (config: Partial<SiteConfig>) => {
    if (!supabase) return;

    const payload: any = {};
    if (config.logoUrl !== undefined) payload.logo_url = config.logoUrl;

    const { error } = await supabase
        .from('site_config')
        .upsert({ id: 1, ...payload });

    if (error) throw error;
};

export interface FeedResponse {
    data: (Post & { user?: User })[];
    count: number;
}

// Helper to transform raw post from DB
const transformPost = (p: any, likes: number = 0, commentsCount: number = 0, isLikedByCurrentUser: boolean = false): Post & { user?: User } => {
    let imageUrls: string[] = [];
    if (p.image_urls && Array.isArray(p.image_urls)) {
        imageUrls = p.image_urls;
    }

    // Older posts used the first line of the body as an automatic title.
    // Do not render that title twice when it is already the opening line.
    const rawTitle = typeof p.title === 'string' ? p.title.trim() : '';
    const firstLine = typeof p.content === 'string' ? p.content.trim().split(/\r?\n/, 1)[0].trim() : '';
    const title = rawTitle && rawTitle !== firstLine ? rawTitle : undefined;

  return {
        id: p.id,
        userId: p.user_id,
        title,
        content: p.content,
        imageUrls: imageUrls,
        location: p.location,
        entryDate: p.entry_date ? new Date(p.entry_date).getTime() : new Date(p.created_at).getTime(),
        isPublished: p.is_published !== false,
        createdAt: new Date(p.created_at).getTime(),
        likes,
        commentsCount,
        isLikedByCurrentUser,
        user: p.user ? {
            ...p.user,
            avatarUrl: p.user.avatar_url,
            jobTags: p.user.job_tags
        } : undefined
    };
}

export const getPostById = async (postId: string): Promise<(Post & { user?: User }) | null> => {
    if (!supabase) return null;
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const { data: p, error } = await supabase
        .from('posts')
        .select(`*, user:profiles(id, nickname, job_tags, avatar_url)`)
        .eq('id', postId)
        .single();

    if (error || !p) return null;

    // Get interactions
    const [likesRes, commentsRes, myLikeRes] = await Promise.all([
        supabase!.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', p.id),
        supabase!.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', p.id),
        currentUser ? supabase!.from('likes').select('id').eq('post_id', p.id).eq('user_id', currentUser.id).maybeSingle() : Promise.resolve({ data: null })
    ]);

    return transformPost(p, likesRes.count || 0, commentsRes.count || 0, !!myLikeRes.data);
};

export const getFeed = async (page: number = 1, limit: number = 10): Promise<FeedResponse> => {
    if (!supabase) return { data: [], count: 0 };

    try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { count, error: countError } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true });

        if (countError) console.warn("Count error", countError);

        const { data, error } = await supabase
            .from('posts')
            .select(`
            *,
            user:profiles(id, nickname, job_tags, avatar_url)
        `)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            // If column missing or other critical DB error
            if (error.code === '42703') {
                dispatchFatalError(error, 'getFeed');
            }
            console.warn("Feed error:", error);
            return { data: [], count: 0 };
        }

        const postsWithInteractions = await Promise.all((data || []).map(async (p: any) => {
            const [likesRes, commentsRes, myLikeRes] = await Promise.all([
                supabase!.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', p.id),
                supabase!.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', p.id),
                currentUser ? supabase!.from('likes').select('id').eq('post_id', p.id).eq('user_id', currentUser.id).maybeSingle() : Promise.resolve({ data: null })
            ]);
            return transformPost(p, likesRes.count || 0, commentsRes.count || 0, !!myLikeRes.data);
        }));

        return {
            data: postsWithInteractions,
            count: count || 0
        };

    } catch (e: any) {
        // Dispatch if it's a Supabase error structure
        if (e?.code) dispatchFatalError(e, 'getFeedException');
        console.error("Exception fetching feed:", e);
        return { data: [], count: 0 };
    }
};

export const getUserPosts = async (userId: string): Promise<(Post & { user?: User })[]> => {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('posts')
        .select(`*, user:profiles(id, nickname, job_tags, avatar_url)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) return [];

    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const posts = await Promise.all((data || []).map(async (p: any) => {
        const [likesRes, commentsRes, myLikeRes] = await Promise.all([
            supabase!.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', p.id),
            supabase!.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', p.id),
            currentUser ? supabase!.from('likes').select('id').eq('post_id', p.id).eq('user_id', currentUser.id).maybeSingle() : Promise.resolve({ data: null })
        ]);
        return transformPost(p, likesRes.count || 0, commentsRes.count || 0, !!myLikeRes.data);
    }));

    return posts;
};


export const createPost = async (content: string, files: File[] = [], location?: string): Promise<string> => {
    if (!supabase) throw new Error("Not connected");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");

    const imageUrls: string[] = [];

    // Upload all files
    if (files.length > 0) {
        for (const file of files) {
            const url = await uploadImage(file, 'posts');
            if (url) imageUrls.push(url);
        }
    }

    const { data, error } = await supabase.from('posts').insert({
        user_id: user.id,
        title: content.trim().split(/\r?\n/)[0].slice(0, 80) || null,
        content,
        image_urls: imageUrls,
        location: location,
        entry_date: new Date().toISOString(),
        is_published: true
    }).select('id').single();

    if (error) throw error;
    return data.id;
};

export const deletePost = async (postId: string) => {
    if (!supabase) return;
    // Use select() to return the deleted record. If list is empty, nothing was deleted.
    const { data, error } = await supabase.from('posts').delete().eq('id', postId).select();

    if (error) throw error;
    if (!data || data.length === 0) {
        // Double check if it exists
        const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('id', postId);
        if (count && count > 0) {
            throw new Error("Permission denied: You cannot delete this post.");
        }
        // If count is 0, it's already deleted, which is fine, we don't throw.
    }
};

export const deleteComment = async (commentId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('comments').delete().eq('id', commentId).select();

    if (error) throw error;
    if (!data || data.length === 0) {
        const { count } = await supabase.from('comments').select('*', { count: 'exact', head: true }).eq('id', commentId);
        if (count && count > 0) {
            throw new Error("Permission denied: You cannot delete this comment.");
        }
    }
};

// --- Interactions ---

export const toggleLike = async (postId: string) => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Use maybeSingle to avoid error if no like exists
    const { data: existing } = await supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle();

    if (existing) {
        await supabase.from('likes').delete().eq('id', existing.id);
        return false;
    } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
        return true;
    }
};

export const getComments = async (postId: string): Promise<Comment[]> => {
    if (!supabase) return [];

    // Fetch all comments for the post
    const { data, error } = await supabase
        .from('comments')
        .select(`
            id, 
            post_id, 
            user_id, 
            content, 
            created_at,
            parent_id,
            profiles:user_id ( id, nickname, avatar_url, role )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true }); // Order by time to ensure parents come before children usually

    if (error) {
        console.error("Error fetching comments:", error);
        return [];
    }

    // Transform flat data to Comment objects
    const allComments: Comment[] = data.map((c: any) => ({
        id: c.id,
        postId: c.post_id,
        userId: c.user_id,
        user: c.profiles ? {
            id: c.profiles.id,
            nickname: c.profiles.nickname,
            avatarUrl: c.profiles.avatar_url,
            role: c.profiles.role,
            email: '',
            jobTags: [],
            createdAt: 0
        } : undefined,
        content: c.content,
        createdAt: new Date(c.created_at).getTime(),
        parentId: c.parent_id || undefined,
        replies: []
    }));

    // Build Tree Structure
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // 1. Map all comments
    allComments.forEach(c => commentMap.set(c.id, c));

    // 2. Link children to parents
    allComments.forEach(c => {
        if (c.parentId && commentMap.has(c.parentId)) {
            const parent = commentMap.get(c.parentId)!;
            if (!parent.replies) parent.replies = [];
            parent.replies.push(c);
        } else {
            rootComments.push(c);
        }
    });

    return rootComments;
};

export const addComment = async (postId: string, content: string, parentId?: string) => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: commentData, error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        content,
        parent_id: parentId || null
    }).select('id').single();

    if (error) throw error;

    // --- Trigger Notification Logic ---
    try {
        // 1. Get post owner
        const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single();

        // 2. Notify Post Owner (if not self)
        if (post && post.user_id !== user.id) {
            await supabase.from('notifications').insert({
                user_id: post.user_id,
                trigger_user_id: user.id,
                type: 'COMMENT',
                content: content,
                related_post_id: postId,
                related_comment_id: commentData.id,
                is_read: false
            });
        }

        // 3. Notify Parent Comment Author (if replying and not self, and not same as post owner to avoid double notif)
        if (parentId) {
            const { data: parentComment } = await supabase.from('comments').select('user_id').eq('id', parentId).single();

            if (parentComment && parentComment.user_id !== user.id && parentComment.user_id !== post?.user_id) {
                await supabase.from('notifications').insert({
                    user_id: parentComment.user_id,
                    trigger_user_id: user.id,
                    type: 'COMMENT', // Could distinguish 'REPLY' if needed, but 'COMMENT' is fine for now
                    content: content,
                    related_post_id: postId,
                    related_comment_id: commentData.id,
                    is_read: false
                });
            }
        }
    } catch (notifErr) {
        console.warn("Failed to create notification", notifErr);
    }
};



// --- Notifications ---

export const getNotifications = async (): Promise<Notification[]> => {
    if (!supabase) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select('*, triggerUser:profiles!trigger_user_id(nickname, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) // Newest first
        .limit(30);

    if (error) {
        // Only warn here, notifications aren't "fatal" usually, unless table is missing
        if (error.code === '42P01') { // Undefined table 'notifications'
            dispatchFatalError(error, 'getNotifications');
        }
        console.warn("Fetch notifications error", error);
        return [];
    }

    return (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        triggerUserId: n.trigger_user_id,
        triggerUser: n.triggerUser ? {
            nickname: n.triggerUser.nickname,
            avatarUrl: n.triggerUser.avatar_url
        } : undefined,
        type: n.type as NotificationType,
        content: n.content,
        relatedPostId: n.related_post_id,
        relatedCommentId: n.related_comment_id,
        isRead: n.is_read,
        createdAt: new Date(n.created_at).getTime()
    }));
};

export const markNotificationRead = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) console.error("Failed to mark notification as read:", error);
};

// --- Realtime Subscriptions ---

export const subscribeToNotifications = (userId: string, onData: (data: any) => void): RealtimeChannel | null => {
    if (!supabase) return null;
    return supabase
        .channel(`notif:${userId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
        }, async (payload) => {
            const raw = payload.new;

            // SAFETY CHECK: Ensure this notification is actually for the current user
            // This prevents receiving notifications meant for others if the RLS/Filter fails
            if (raw.user_id !== userId) return;

            // SAFETY CHECK: Ensure the trigger user is not the current user
            // This prevents self-notifications (e.g. if I comment on my own post and logic is buggy)
            if (raw.trigger_user_id === userId) return;

            // Fetch trigger user details
            let triggerUser = undefined;
            if (raw.trigger_user_id) {
                const { data } = await supabase.from('profiles').select('nickname, avatar_url').eq('id', raw.trigger_user_id).single();
                if (data) {
                    triggerUser = {
                        nickname: data.nickname,
                        avatarUrl: data.avatar_url
                    };
                }
            }

            // Format to match Notification interface (camelCase)
            const formattedNotification = {
                id: raw.id,
                userId: raw.user_id,
                triggerUserId: raw.trigger_user_id,
                triggerUser: triggerUser,
                type: raw.type,
                content: raw.content,
                relatedPostId: raw.related_post_id,
                relatedCommentId: raw.related_comment_id,
                isRead: raw.is_read,
                createdAt: new Date(raw.created_at).getTime()
            };

            onData(formattedNotification);
        })
        .subscribe();
};

export const subscribeToFeed = (onNewPost: () => void, currentUserId?: string): RealtimeChannel | null => {
    if (!supabase) return null;
    return supabase
        .channel('public:posts')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'posts'
        }, (payload) => {
            if (currentUserId && payload.new.user_id === currentUserId) {
                return; // Ignore own posts
            }
            onNewPost();
        })
        .subscribe();
};
