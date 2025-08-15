import React, { useState, useMemo } from 'react';
import type { User, SocialPost } from '../types';
import ProfileEditModal from './ProfileEditModal';
import CreatePost from './CreatePost';
import PostCard from './PostCard';

interface UserProfileProps {
  user: User;
  isOwnProfile: boolean;
  onBack: () => void;
  currentUser: User;
  onAddPost: (post: Omit<SocialPost, 'id' | 'timestamp' | 'author_id' | 'likedBy' | 'comments'>) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  posts: SocialPost[];
  userMap: Map<string, User>;
  onLike: (postId: string) => void;
  onComment: (postId: string, text: string) => void;
  onViewProfile: (user: User) => void;
  followingMap: Map<string, string[]>;
  toggleFollow: (userIdToFollow: string) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, isOwnProfile, onBack, currentUser, onAddPost, updateUserProfile, posts, userMap, onLike, onComment, onViewProfile, followingMap, toggleFollow }) => {
    const [isEditing, setIsEditing] = useState(false);
    
    const userPosts = useMemo(() => {
        return posts
            .filter(post => post.author_id === user.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [posts, user.id]);
    
    const isFollowing = useMemo(() => {
        return followingMap.get(currentUser.id)?.includes(user.id) || false;
    }, [followingMap, currentUser.id, user.id]);

    const handleSaveProfile = (updates: Pick<User, 'display_name' | 'avatar_url' | 'bio' | 'cover_photo_url'>) => {
        updateUserProfile(updates);
    };

    const handleShare = async (post: SocialPost) => {
        const author = userMap.get(post.author_id);
        const shareText = `Confira este post de ${author?.display_name} no Radar Aviator:\n\n"${post.text}"\n\n#RadarAviator #Aviator`;
        const shareData = {
            title: `Post de ${author?.display_name} no Radar Aviator`,
            text: shareText,
            url: window.location.href,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareText);
                alert('Post copiado para a área de transferência!');
            }
        } catch (err) {
            console.error('Erro ao compartilhar:', err);
        }
    };

    const { followers_count = 0, following_count = 0 } = user;

    return (
        <>
            <ProfileEditModal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                user={user}
                onSave={handleSaveProfile}
            />
            <div className="max-w-4xl mx-auto py-6">
                <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm text-lime-400 hover:text-lime-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Voltar para a Resenha
                </button>

                <div className="bg-slate-900 rounded-xl shadow-xl border border-lime-500/30 overflow-hidden">
                    <div className="relative">
                        <img
                            src={user.cover_photo_url}
                            alt="Foto de Capa"
                            className="w-full h-48 object-cover"
                        />
                         <div className="absolute -bottom-16 left-6">
                            <img
                                src={user.avatar_url}
                                alt={user.display_name}
                                className="w-32 h-32 rounded-full object-cover ring-4 ring-slate-900"
                            />
                        </div>
                    </div>
                    
                    <div className="pt-4 px-6 pb-6">
                        <div className="flex justify-end items-center mb-2">
                             {isOwnProfile ? (
                                <button onClick={() => setIsEditing(true)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg text-sm">
                                    Editar Perfil
                                </button>
                            ) : (
                                <button onClick={() => toggleFollow(user.id)} className={`font-bold py-2 px-6 rounded-lg text-sm transition-colors ${isFollowing ? 'bg-gray-700 hover:bg-red-600/80 text-white' : 'bg-lime-500 hover:bg-lime-600 text-black'}`}>
                                    {isFollowing ? 'Seguindo' : 'Seguir'}
                                </button>
                            )}
                        </div>

                        <div className="mt-4">
                            <h2 className="text-3xl font-bold text-white">{user.display_name}</h2>
                            <p className="text-sm text-gray-400">Membro desde {new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        
                        <div className="mt-4 flex items-center gap-6 text-sm">
                            <div><strong className="text-white">{userPosts.length}</strong> <span className="text-gray-400">publicações</span></div>
                            <div><strong className="text-white">{followers_count}</strong> <span className="text-gray-400">seguidores</span></div>
                            <div><strong className="text-white">{following_count}</strong> <span className="text-gray-400">seguindo</span></div>
                        </div>

                        <p className="mt-4 text-gray-300">{user.bio}</p>

                    </div>
                </div>

                {isOwnProfile && (
                    <div className="mt-6">
                        <CreatePost currentUser={currentUser} onAddPost={onAddPost} />
                    </div>
                )}
                
                <div className="mt-6">
                    <h3 className="text-xl font-bold text-white mb-4">Publicações de {user.display_name}</h3>
                    <div className="space-y-6">
                        {userPosts.length > 0 ? (
                            userPosts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    currentUser={currentUser}
                                    author={user}
                                    userMap={userMap}
                                    onViewProfile={onViewProfile}
                                    onLike={onLike}
                                    onComment={onComment}
                                    onShare={handleShare}
                                />
                            ))
                        ) : (
                            <div className="text-center py-12 bg-slate-900 rounded-xl border border-gray-700/50">
                                <p className="text-gray-500">{user.display_name} ainda não fez nenhuma publicação.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserProfile;