import { createClient, SupabaseClient, Session, EmailOtpType } from '@supabase/supabase-js';
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

// --- Helper: Image Compression ---
const compressImage = async (file: File): Promise<File> => {
    // Only compress images
    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                resolve(file); // Fallback
                return;
            }

            // Target dimensions: Max 1280px width/height (approx 720p)
            const MAX_SIZE = 1280;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with 0.7 quality
            canvas.toBlob((blob) => {
                if (blob) {
                    // If compressed blob is actually larger (rare but possible with low res PNGs), return original
                    if (blob.size > file.size) {
                         resolve(file);
                    } else {
                         const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    }
                } else {
                    resolve(file);
                }
            }, 'image/jpeg', 0.7);
        };

        img.onerror = (error) => reject(error);
        img.src = url;
    });
};

// --- Auth Service ---

export const getSession = async (): Promise<Session | null> => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

// Step 1: Send OTP (Code)
export const sendOtp = async (email: string, isRegistration: boolean = false): Promise<ApiResponse<string>> => {
  const check = ensureClient();
  if (!check.success) return check;

  const cleanEmail = email.trim().toLowerCase();

  try {
    // Business Logic Checks
    if (isRegistration) {
        const { data: existing } = await supabase!.from('profiles').select('status').eq('email', cleanEmail).single();
        if (existing) {
            // Logic Requirement: If user exists and is EXPIRED, tell them to Renew (via Login)
            if (existing.status === 'EXPIRED') {
                return { success: false, error: 'Account expired. Please Log In to renew membership.' };
            }
            // If DELETED, we might allow re-registration, but for now block to be safe or ask support
            if (existing.status === 'DELETED') {
                return { success: false, error: 'Account previously deleted. Contact admin.' };
            }
            return { success: false, error: 'Email already registered. Please Log In.' };
        }
    } else {
        const { data: existing } = await supabase!.from('profiles').select('status').eq('email', cleanEmail).single();
        if (!existing) {
            return { success: false, error: 'Member not found. Please register first.' };
        }
        // Strict Login Check
        if (existing.status === 'DELETED') {
             return { success: false, error: 'Account has been deactivated.' };
        }
    }

    // Send OTP
    const { error } = await supabase!.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: isRegistration,
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

export const uploadImage = async (file: File, bucket: 'avatars' | 'posts'): Promise<string | null> => {
    if (!supabase) return null;
    try {
        // COMPRESS BEFORE UPLOAD
        const compressedFile = await compressImage(file);

        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, compressedFile);

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
        return { success: false, error: 'Session expired. Please verify again.' };
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
      status: 'PENDING',
      is_renewal: false
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

export const renewMembership = async (credentialFile: File): Promise<ApiResponse<null>> => {
    const check = ensureClient();
    if (!check.success) return check;

    try {
        const { data: { user } } = await supabase!.auth.getUser();
        if (!user) return { success: false, error: 'Not logged in' };

        const credentialUrl = await uploadImage(credentialFile, 'avatars');
        if (!credentialUrl) return { success: false, error: 'Image upload failed' };

        const { error } = await supabase!.from('profiles').update({
            credential_url: credentialUrl,
            status: 'PENDING',
            is_renewal: true
        }).eq('id', user.id);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || 'Renew failed' };
    }
}

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

  // STRICT SECURITY CHECK
  if (profile.status === 'DELETED') {
      await logout();
      return null;
  }

  // Check Expiration
  let status = profile.status as UserStatus;
  const now = Date.now();
  const expirationDate = profile.expiration_date ? new Date(profile.expiration_date).getTime() : null;

  if (status === UserStatus.ACTIVE && expirationDate && now > expirationDate) {
      status = UserStatus.EXPIRED;
  }

  return {
    id: profile.id,
    email: profile.email,
    nickname: profile.nickname,
    role: profile.role as UserRole,
    status: status,
    jobTags: profile.job_tags || [],
    credentialUrl: profile.credential_url,
    avatarUrl: profile.avatar_url,
    createdAt: new Date(profile.created_at).getTime(),
    expirationDate: expirationDate || undefined,
    isRenewal: profile.is_renewal
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
    
    const { data: profile } = await supabase.from('profiles').select('status, expiration_date').eq('id', currentUser?.id).single();
    
    if (!profile || profile.status === 'DELETED') return { data: [], count: 0 };
    
    if (profile.expiration_date && new Date().getTime() > new Date(profile.expiration_date).getTime()) {
        return { data: [], count: 0 };
    }

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

        let imageUrls: string[] = [];
        if (p.image_urls && Array.isArray(p.image_urls)) {
            imageUrls = p.image_urls;
        } else if (p.image_url) {
            imageUrls = [p.image_url];
        }

        return {
            id: p.id,
            userId: p.user_id,
            content: p.content,
            imageUrls: imageUrls, 
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

export const createPost = async (content: string, files: File[] = [], location?: string) => {
  if (!supabase) return;
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

  const { error } = await supabase.from('posts').insert({
    user_id: user.id,
    content,
    image_urls: imageUrls,
    image_url: imageUrls.length > 0 ? imageUrls[0] : null,
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

    const { data: existing } = await supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', user.id).single();
    
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
    const { data, error } = await supabase
        .from('comments')
        .select('*, user:profiles(id, nickname, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
    
    if (error) throw error;

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
    createdAt: new Date(profile.created_at).getTime(),
    expirationDate: profile.expiration_date ? new Date(profile.expiration_date).getTime() : undefined,
    isRenewal: profile.is_renewal
  }));
};

// New function for polling badge
export const getPendingUserCount = async (): Promise<number> => {
    if (!supabase) return 0;
    const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');
    return count || 0;
};

export const updateUser = async (userId: string, updates: { status?: UserStatus; role?: UserRole; expirationDate?: string | null }) => {
    if (!supabase) return;
    
    const payload: any = {};
    if (updates.status) payload.status = updates.status;
    if (updates.role) payload.role = updates.role;
    if (updates.expirationDate !== undefined) {
         payload.expiration_date = updates.expirationDate;
    }
    
    if (updates.status === UserStatus.ACTIVE) {
        payload.is_renewal = false;
    }

    const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
    if (error) throw error;
};

export const updateUserStatus = async (userId: string, status: UserStatus, expirationDate?: Date) => {
  const payload: any = { status };
  if (status === UserStatus.ACTIVE && expirationDate) {
      payload.expirationDate = expirationDate.toISOString();
  }
  await updateUser(userId, payload);
};

export const updateUserRole = async (userId: string, role: UserRole) => {
  await updateUser(userId, { role });
};