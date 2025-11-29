import useSWR, { useSWRConfig } from 'swr';
import useSWRInfinite from 'swr/infinite';
import { getFeed, getUserPosts, getCurrentUser, getPostById } from '../services/mockBackend';
import { Post, User } from '../types';

// Keys
const KEYS = {
    FEED: 'feed',
    USER_POSTS: (userId: string) => `posts_${userId}`,
    USER_PROFILE: (userId: string) => `profile_${userId}`,
    CURRENT_USER: 'current_user'
};

// Fetcher wrapper
// SWR expects a fetcher that returns data or throws
// Our mockBackend returns { data, count } or arrays.
// We need to adapt it.

const feedFetcher = async ([key, page]: [string, number]) => {
    const res = await getFeed(page, 10);
    return res.data; // Just return the array of posts
};

const userPostsFetcher = async (userId: string) => {
    return await getUserPosts(userId);
};

const currentUserFetcher = async () => {
    return await getCurrentUser();
};

export const useFeed = () => {
    const { data, error, size, setSize, mutate, isLoading } = useSWRInfinite(
        (index) => [KEYS.FEED, index + 1], // SWR key: ['feed', page]
        feedFetcher,
        {
            revalidateFirstPage: false,
            persistSize: true,
            revalidateOnFocus: false // Don't revalidate aggressively for feed to avoid jumping
        }
    );

    const posts = data ? data.flat() : [];
    const isLoadingInitialData = !data && !error;
    const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === 'undefined');
    const isEmpty = data?.[0]?.length === 0;
    const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < 10);

    return {
        posts,
        error,
        isLoading: isLoadingInitialData,
        isLoadingMore,
        isReachingEnd,
        size,
        setSize,
        mutate
    };
};

export const useUserPosts = (userId: string) => {
    const { data, error, isLoading, mutate } = useSWR(
        userId ? KEYS.USER_POSTS(userId) : null,
        () => userPostsFetcher(userId)
    );

    return {
        posts: data || [],
        error,
        isLoading,
        mutate
    };
};

export const useCurrentUser = () => {
    const { data, error, isLoading, mutate } = useSWR(
        KEYS.CURRENT_USER,
        currentUserFetcher
    );

    return {
        user: data,
        error,
        isLoading,
        mutate
    };
};
