import { useState, useCallback, useEffect, useMemo } from 'react';
import type { User, SocialPost, SocialComment, Suggestion, SuggestionStatus } from '../types';
import { supabase } from '../services/supabase';

const coPilotoIAUser: User = {
    id: 'co-piloto-ia',
    whatsapp: '+1 (555) 000-0000',
    display_name: 'Co-Piloto IA',
    role: 'admin',
    status: 'active',
    created_at: new Date().toISOString(),
    avatar_url: `https://i.pravatar.cc/150?u=CoPilotoIA`,
    cover_photo_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    bio: 'Sou a Inteligência Artificial do Radar Aviator. Estou aqui para analisar, prever e ajudar você a voar mais alto!',
    risk_profile: 'Moderado',
    registration_pending: false,
    followers_count: 999,
    following_count: 1,
    is_lifetime: true,
    premium_expiry: null,
    used_codes: ['SYSTEM'],
};

export const useSocialData = (currentUser: User | null, allUsers: User[]) => {
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [followingMap, setFollowingMap] = useState<Map<string, string[]>>(new Map());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [postsRes, suggestionsRes, followsRes] = await Promise.all([
                    supabase.from('social_posts').select('*').order('timestamp', { ascending: false }),
                    supabase.from('suggestions').select('*').order('timestamp', { ascending: false }),
                    supabase.from('user_follows').select('*')
                ]);

                if (postsRes.error) throw postsRes.error;
                setPosts(postsRes.data as SocialPost[]);

                if (suggestionsRes.error) throw suggestionsRes.error;
                setSuggestions(suggestionsRes.data as Suggestion[]);

                if (followsRes.error) throw followsRes.error;
                const newFollowingMap = new Map<string, string[]>();
                if (followsRes.data) {
                    for (const follow of followsRes.data) {
                        const list = newFollowingMap.get(follow.follower_id) || [];
                        list.push(follow.following_id);
                        newFollowingMap.set(follow.follower_id, list);
                    }
                }
                setFollowingMap(newFollowingMap);

            } catch (error) {
                console.error("Error fetching social data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);


    const addPost = useCallback(async (post: Omit<SocialPost, 'id' | 'timestamp' | 'author_id' | 'likedBy' | 'comments'>) => {
        if (!currentUser) return;
        const newPost: Omit<SocialPost, 'id'> = {
            ...post,
            timestamp: new Date().toISOString(),
            author_id: currentUser.id,
            likedBy: [],
            comments: [],
        };
        const { data, error } = await supabase.from('social_posts').insert([newPost]).select();
        if (error) {
            console.error("Error adding post:", error);
        } else if (data) {
            setPosts(prev => [data[0] as SocialPost, ...prev]);
        }
    }, [currentUser]);
    
    const deletePost = useCallback(async (postId: string) => {
        const { error } = await supabase.from('social_posts').delete().eq('id', postId);
        if (error) {
            console.error("Error deleting post:", error);
        } else {
            setPosts(prev => prev.filter(p => p.id !== postId));
        }
    }, []);

    const likePost = useCallback(async (postId: string) => {
        if (!currentUser) return;
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        const isLiked = post.likedBy.includes(currentUser.id);
        const newLikedBy = isLiked ? post.likedBy.filter(id => id !== currentUser.id) : [...post.likedBy, currentUser.id];

        const { error } = await supabase.from('social_posts').update({ likedBy: newLikedBy }).eq('id', postId);
        if (!error) {
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, likedBy: newLikedBy } : p));
        } else {
             console.error("Error liking post:", error);
        }
    }, [currentUser, posts]);

    const commentOnPost = useCallback(async (postId: string, text: string) => {
        if (!currentUser) return;
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        
        const newComment: SocialComment = {
            id: crypto.randomUUID(), author_id: currentUser.id, text, timestamp: new Date().toISOString()
        };
        const newComments = [...post.comments, newComment];

        const { error } = await supabase.from('social_posts').update({ comments: newComments }).eq('id', postId);
        if (!error) {
             setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: newComments } : p));
        } else {
            console.error("Error commenting on post:", error);
        }
    }, [currentUser, posts]);

    const addSuggestion = useCallback(async (text: string) => {
        if (!currentUser) return;
        const newSuggestion: Omit<Suggestion, 'id'> = {
            author_id: currentUser.id, text, timestamp: new Date().toISOString(), upvotes: [currentUser.id], status: 'Nova'
        };
        const { data, error } = await supabase.from('suggestions').insert([newSuggestion]).select();
        if (error) {
            console.error("Error adding suggestion:", error);
        } else if (data) {
            setSuggestions(prev => [data[0] as Suggestion, ...prev]);
        }
    }, [currentUser]);

    const upvoteSuggestion = useCallback(async (suggestionId: string) => {
        if (!currentUser) return;
        const suggestion = suggestions.find(s => s.id === suggestionId);
        if (!suggestion) return;

        const isUpvoted = suggestion.upvotes.includes(currentUser.id);
        const newUpvotes = isUpvoted ? suggestion.upvotes.filter(id => id !== currentUser.id) : [...suggestion.upvotes, currentUser.id];
        
        const { error } = await supabase.from('suggestions').update({ upvotes: newUpvotes }).eq('id', suggestionId);
        if (!error) {
            setSuggestions(prev => prev.map(s => s.id === suggestionId ? { ...s, upvotes: newUpvotes } : s));
        } else {
            console.error("Error upvoting suggestion:", error);
        }
    }, [currentUser, suggestions]);
    
    const updateSuggestion = useCallback(async (id: string, status: SuggestionStatus) => {
        const { error } = await supabase.from('suggestions').update({ status }).eq('id', id);
        if (!error) {
            setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
        } else {
            console.error("Error updating suggestion:", error);
        }
    }, []);
    
    const toggleFollow = useCallback(async (userIdToFollow: string) => {
        if (!currentUser || currentUser.id === userIdToFollow) return;
        
        const isFollowing = (followingMap.get(currentUser.id) || []).includes(userIdToFollow);
        
        if (isFollowing) {
            const { error } = await supabase.from('user_follows').delete().match({ follower_id: currentUser.id, following_id: userIdToFollow });
            if (!error) {
                setFollowingMap(prev => {
                    const newMap = new Map(prev);
                    const list = newMap.get(currentUser.id) || [];
                    newMap.set(currentUser.id, list.filter(id => id !== userIdToFollow));
                    return newMap;
                });
            } else {
                console.error("Error unfollowing user:", error);
            }
        } else {
            const { error } = await supabase.from('user_follows').insert({ follower_id: currentUser.id, following_id: userIdToFollow });
            if (!error) {
                setFollowingMap(prev => {
                    const newMap = new Map(prev);
                    const list = newMap.get(currentUser.id) || [];
                    newMap.set(currentUser.id, [...list, userIdToFollow]);
                    return newMap;
                });
            } else {
                console.error("Error following user:", error);
            }
        }
    }, [currentUser, followingMap]);

    const userMap = useMemo(() => {
        const map = new Map<string, User>();
        allUsers.forEach(u => map.set(u.id, u));
        map.set(coPilotoIAUser.id, coPilotoIAUser); // Ensure IA user is always present
        
        const followersMap = new Map<string, number>();
        for (const followingList of followingMap.values()) {
            for (const followedId of followingList) {
                followersMap.set(followedId, (followersMap.get(followedId) || 0) + 1);
            }
        }
        
        map.forEach((u, id) => {
            const updatedUser = { 
                ...u, 
                followers_count: followersMap.get(id) || 0,
                following_count: followingMap.get(id)?.length || 0,
            };
            map.set(id, updatedUser);
        });
        return map;
    }, [allUsers, posts, followingMap]);

    return {
        posts,
        suggestions,
        userMap,
        addPost,
        deletePost,
        likePost,
        commentOnPost,
        addSuggestion,
        upvoteSuggestion,
        updateSuggestion,
        followingMap,
        toggleFollow,
    };
};