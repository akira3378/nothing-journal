import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { User, UserRole, UserStatus, Announcement, Post, ApiResponse } from '../types';

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
    // 1. If registration, check if email already exists in PROFILES
    // We allow the Auth User to exist (maybe they didn't finish onboarding), but not a Profile.
    if (isRegistration) {
        const { data: existing } = await supabase!.from('profiles').select('id').eq('email', cleanEmail).single();
        if (existing) {
            return { success: false, error: 'Email already registered.' };
        }
    } else {
        // Login: Check if user exists/status
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
        shouldCreateUser: isRegistration, // Only create auth user if registering
        emailRedirectTo: window.location.origin // Redirects to base URL
      },
    });

    if (error) throw error;
    return { success: true, data: 'Magic Link sent to email.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send Link' };
  }
};

// Upload helper
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

// Step 2 of Registration: Called AFTER clicking the link
export const createProfile = async (data: { nickname: string; jobTags: string[]; credentialFile: File }): Promise<ApiResponse<null>> => {
  const check = ensureClient();
  if (!check.success) return check;

  try {
    const { data: { user: authUser } } = await supabase!.auth.getUser();
    
    if (!authUser || !authUser.email) {
        return { success: false, error: 'Session expired. Please click the link again.' };
    }

    // Upload Credential
    const publicUrl = await uploadImage(data.credentialFile, 'avatars');
    
    if (!publicUrl) {
        return { success: false, error: 'Failed to upload credential image. Please try again.' };
    }

    // Create Profile
    const { error: dbError } = await supabase!.from('profiles').insert({
      id: authUser.id,
      email: authUser.email,
      nickname: data.nickname,
      job_tags: data.jobTags,
      credential_url: publicUrl,
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

export const getFeed = async (): Promise<(Post & { user: User | undefined })[]> => {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
        .from('posts')
        .select(`
        *,
        user:profiles(id, nickname, job_tags)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn("Feed error:", error);
        return [];
    }

    return (data || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        content: p.content,
        imageUrl: p.image_url,
        location: p.location,
        createdAt: new Date(p.created_at).getTime(),
        likes: p.likes || 0,
        user: p.user ? {
            ...p.user,
            jobTags: p.user.job_tags
        } : undefined
    }));
  } catch (e) {
      console.error("Exception fetching feed:", e);
      return [];
  }
};

export const createPost = async (content: string, file?: File, location?: string) => {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  let imageUrl = null;

  if (file) {
      // Use 'posts' bucket
      imageUrl = await uploadImage(file, 'posts');
  }

  const { error } = await supabase.from('posts').insert({
    user_id: user.id,
    content,
    image_url: imageUrl, // Ensure this column exists in DB
    location: location   // Ensure this column exists in DB
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
    createdAt: new Date(profile.created_at).getTime()
  }));
};

export const updateUserStatus = async (userId: string, status: UserStatus) => {
  if (!supabase) return;
  await supabase.from('profiles').update({ status }).eq('id', userId);
};