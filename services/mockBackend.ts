import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { User, UserRole, UserStatus, Announcement, Post, ApiResponse, Comment } from '../types';

// --- Configuration Management ---
const CONFIG_KEYS = {
  URL: 'nothing_sb_url',
  KEY: 'nothing_sb_key'
};

const DEFAULT_URL = 'https://dyspuewvcrgzlvoebson.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5c3B1ZXd2Y3Jnemx2b2Vic29uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTI1NDUsImV4cCI6MjA3OTM4ODU0NX0.mB5CppY2w8eGV1CtkcKtVi8tlIDIOoFaXbRRsxXZ4lA';

let supabase: SupabaseClient | null = null;

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

// --- Auth Service ---

export const getSession = async (): Promise<Session | null> => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

export const sendOtp = async (email: string, isRegistration: boolean = false): Promise<ApiResponse<string>> => {
  const check = ensureClient();
  if (!check.success) return check;

  const cleanEmail = email.trim().toLowerCase();

  try {
    if (isRegistration) {
        const { data: existing } = await supabase!.from('profiles').select('id').eq('email', cleanEmail).single();
        if (existing) {
            return { success: false, error: 'Email already registered.' };
        }
    } else {
        const { data: existing } = await supabase!.from('profiles').select('status').eq('email', cleanEmail).single();
        if (!existing) {
            return { success: false, error: 'Member not found. Please register first.' };
        }
        if (existing.status === 'DELETED') {
             return { success: false, error: 'Account has been deleted.' };
        }
        if (existing.status === 'REJECTED') {
             return { success: false, error: 'Membership application was rejected.' };
        }
    }

    const { error } = await supabase!.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: isRegistration,
        emailRedirectTo: window.location.origin
      },
    });

    if (error) throw error;
    return { success: true, data: 'Magic Link sent to email.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send Link' };
  }
};

export const uploadImage = async (file: File, bucket: 'avatars' | 'posts'): Promise<string | null> => {
    if (!supabase) return null;
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);

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

export const createProfile = async (data: { nickname: string; jobTags: string[]; credentialFile: File, avatarFile?: File }): Promise<ApiResponse<null>> => {
  const check = ensureClient();
  if (!check.success) return check;

  try {
    const { data: { user: authUser } } = await supabase!.auth.getUser();
    
    if (!authUser || !authUser.email) {
        return { success: false, error: 'Session expired. Please click the link again.' };
    }

    const credentialUrl = await uploadImage(data.credentialFile, 'avatars');
    if (!credentialUrl) {
        return { success: false, error: 'Failed to upload credential image.' };
    }

    let avatarUrl = null;
    if (data.avatarFile) {
        avatarUrl = await uploadImage(data.avatarFile, 'avatars');
    }

    const { error: dbError } = await supabase!.from('profiles').insert({
      id: authUser.id,
      email: authUser.email,
      nickname: data.nickname,
      job_tags: data.jobTags,
      credential_url: credentialUrl,
      avatar_url: avatarUrl,
      role: 'USER',
      status: 'PENDING'
    });

    if (dbError) {
        if (dbError.code === '23505') return { success: false, error: 'Profile already exists.' };
        throw dbError;
    }

    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { success: false, error: err.message || 'Registration failed' };
  }
};

export const updateUserProfile = async (userId: string, updates: { nickname?: string; jobTags?: string[] }) => {
    if (!supabase) return;
    
    const payload: any = {};
    if (updates.nickname) payload.nickname = updates.nickname;
    if (updates.jobTags) payload.job_tags = updates.jobTags;

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

  if (error || !profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    nickname: profile.nickname,
    role: profile.role as UserRole,
    status: profile.status as UserStatus,
    jobTags: profile.job_tags || [],
    credentialUrl: profile.credential_url,
    avatarUrl: profile.avatar_url,
    createdAt: new Date(profile.created_at).getTime()
  };
};

// --- Content Service ---

export const getAnnouncements = async (): Promise<Announcement[]> => {
  if (!supabase) return [];
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (data || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    type: a.type,
    createdAt: new Date(a.created_at).getTime(),
    isActive: a.is_active
  }));
};

export const getAllAnnouncements = async (): Promise<Announcement[]> => {
  if (!supabase) return [];
  const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
  return (data || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    type: a.type,
    createdAt: new Date(a.created_at).getTime(),
    isActive: a.is_active
  }));
};

export const createAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
    if (!supabase) return;
    await supabase.from('announcements').insert({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        is_active: announcement.isActive
    });
};

export const deleteAnnouncement = async (id: string) => {
    if (!supabase) return;
    await supabase.from('announcements').delete().eq('id', id);
};

export const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    if (!supabase) return;
    const payload: any = {};
    if (updates.title) payload.title = updates.title;
    if (updates.content) payload.content = updates.content;
    
    await supabase.from('announcements').update(payload).eq('id', id);
};

export interface FeedResponse {
    data: (Post & { user: User | undefined })[];
    count: number;
}

export const getFeed = async (page: number = 1, limit: number = 10): Promise<FeedResponse> => {
  if (!supabase) return { data: [], count: 0 };
  
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    // Calculate range for pagination (0-indexed)
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Get count first
    const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

    if (countError) console.warn("Count error", countError);

    // Get Data
    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            user:profiles(id, nickname, job_tags, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.warn("Feed error:", error);
        return { data: [], count: 0 };
    }

    const postsWithInteractions = await Promise.all((data || []).map(async (p: any) => {
        let likes = 0;
        let commentsCount = 0;
        let isLikedByCurrentUser = false;

        try {
            const [likesRes, commentsRes, myLikeRes] = await Promise.all([
                supabase!.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', p.id),
                supabase!.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', p.id),
                currentUser ? supabase!.from('likes').select('id').eq('post_id', p.id).eq('user_id', currentUser.id).single() : Promise.resolve({ data: null })
            ]);

            likes = likesRes.count || 0;
            commentsCount = commentsRes.count || 0;
            isLikedByCurrentUser = !!myLikeRes.data;
        } catch (e) {
            // Ignore missing table errors
        }

        return {
            id: p.id,
            userId: p.user_id,
            content: p.content,
            imageUrl: p.image_url,
            location: p.location,
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
    }));

    return { 
        data: postsWithInteractions, 
        count: count || 0 
    };

  } catch (e) {
      console.error("Exception fetching feed:", e);
      return { data: [], count: 0 };
  }
};

export const createPost = async (content: string, file?: File, location?: string) => {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  let imageUrl = null;

  if (file) {
      imageUrl = await uploadImage(file, 'posts');
  }

  const { error } = await supabase.from('posts').insert({
    user_id: user.id,
    content,
    image_url: imageUrl,
    location: location
  });
  
  if (error) throw error;
};

export const deletePost = async (postId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
};

// --- Interactions ---

export const toggleLike = async (postId: string) => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if liked
    const { data: existing } = await supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', user.id).single();
    
    if (existing) {
        await supabase.from('likes').delete().eq('id', existing.id);
        return false; // unliked
    } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
        return true; // liked
    }
};

export const getComments = async (postId: string): Promise<Comment[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('comments')
        .select('*, user:profiles(id, nickname, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
    
    if (error) throw error; // Allow component to handle error

    return (data || []).map((c: any) => ({
        id: c.id,
        postId: c.post_id,
        userId: c.user_id,
        content: c.content,
        createdAt: new Date(c.created_at).getTime(),
        user: c.user ? {
            ...c.user,
            avatarUrl: c.user.avatar_url
        } : undefined
    }));
};

export const addComment = async (postId: string, content: string) => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        content
    });
    if (error) throw error;
};

// --- Admin Service ---

export const getAdminUsers = async (): Promise<User[]> => {
  if (!supabase) return [];
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  
  return (data || []).map((profile: any) => ({
    id: profile.id,
    email: profile.email,
    nickname: profile.nickname,
    role: profile.role,
    status: profile.status,
    jobTags: profile.job_tags || [],
    credentialUrl: profile.credential_url,
    avatarUrl: profile.avatar_url,
    createdAt: new Date(profile.created_at).getTime()
  }));
};

export const updateUserStatus = async (userId: string, status: UserStatus) => {
  if (!supabase) return;
  await supabase.from('profiles').update({ status }).eq('id', userId);
};

export const updateUserRole = async (userId: string, role: UserRole) => {
  if (!supabase) return;
  await supabase.from('profiles').update({ role }).eq('id', userId);
};