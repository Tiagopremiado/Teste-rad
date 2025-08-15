import React, { useState } from 'react';
import type { SocialPost, User, SocialComment } from '../types';

interface PostCardProps {
    post: SocialPost;
    currentUser: User;
    author: User;
    userMap: Map<string, User>;
    onViewProfile: (user: User) => void;
    onLike: (postId: string) => void;
    onComment: (postId: string, text: string) => void;
    onShare: (post: SocialPost) => void;
}

const timeAgo = (date: string): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " anos";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
};

const Comment: React.FC<{ comment: SocialComment, author?: User }> = ({ comment, author }) => (
    <div className="flex items-start gap-2.5">
        <img
            className="w-8 h-8 rounded-full object-cover"
            src={author?.avatar_url}
            alt={author?.display_name}
        />
        <div className="flex-grow bg-gray-700/60 rounded-lg px-3 py-2">
            <div className="flex items-baseline gap-2">
                 <span className="font-semibold text-sm text-white">{author?.display_name || 'Usuário'}</span>
                 <span className="text-xs text-gray-500">{timeAgo(comment.timestamp)}</span>
            </div>
            <p className="text-sm text-gray-300">{comment.text}</p>
        </div>
    </div>
);

const PostCard: React.FC<PostCardProps> = ({ post, currentUser, author, userMap, onViewProfile, onLike, onComment, onShare }) => {
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [commentText, setCommentText] = useState('');

    const isLikedByCurrentUser = post.likedBy.includes(currentUser.id);

    const categoryColors = {
        'Vitória': 'bg-green-500/20 text-green-300 border-green-500/30',
        'Estratégia': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        'Dúvida': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        'Sugestão': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    };
    
    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentText.trim()) {
            onComment(post.id, commentText);
            setCommentText('');
        }
    };

    return (
        <div className="bg-slate-900 rounded-xl shadow-xl border border-lime-500/30">
            {/* Post Header */}
            <div className="p-4 flex items-center gap-3 border-b border-gray-700/50">
                <img 
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-700 cursor-pointer transition-transform hover:scale-105" 
                    src={author.avatar_url || `https://i.pravatar.cc/150?u=${author.display_name}`} 
                    alt={author.display_name}
                    onClick={() => onViewProfile(author)}
                    title={`Ver perfil de ${author.display_name}`}
                />
                <div className="flex-grow">
                    <div className="flex items-baseline gap-2">
                        <button onClick={() => onViewProfile(author)} className="font-bold text-white hover:underline">{author.display_name}</button>
                        {author.role === 'admin' && (
                             <span className="text-xs font-bold bg-lime-500 text-gray-900 px-2 py-0.5 rounded-full">Admin</span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400">{timeAgo(post.timestamp)} atrás</p>
                </div>
                <div className={`text-xs font-semibold px-3 py-1 rounded-full border ${categoryColors[post.category]}`}>
                    {post.category}
                </div>
            </div>

            {/* Post Body */}
            <div className="p-4">
                <p className="text-gray-200 whitespace-pre-wrap break-words">{post.text}</p>
                {post.imageUrl && (
                    <img src={post.imageUrl} alt="Post image" className="mt-4 rounded-lg w-full h-auto object-cover border border-gray-700" />
                )}
            </div>

            {/* Post Footer (Actions) */}
            <div className="p-2 border-t border-gray-700/50">
                <div className="flex justify-around items-center">
                    <button 
                        onClick={() => onLike(post.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg w-full justify-center transition-colors ${isLikedByCurrentUser ? 'text-lime-400' : 'text-gray-400 hover:bg-gray-700/50'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-sm">{post.likedBy.length > 0 ? post.likedBy.length : ''} Curtir</span>
                    </button>
                    <button 
                        onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                        className="flex items-center gap-2 p-2 rounded-lg w-full justify-center text-gray-400 hover:bg-gray-700/50 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-sm">{post.comments.length > 0 ? post.comments.length : ''} Comentar</span>
                    </button>
                    <button 
                        onClick={() => onShare(post)}
                        className="flex items-center gap-2 p-2 rounded-lg w-full justify-center text-gray-400 hover:bg-gray-700/50 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                        </svg>
                        <span className="font-semibold text-sm">Compartilhar</span>
                    </button>
                </div>
            </div>

            {/* Comments Section */}
            {isCommentsOpen && (
                <div className="p-4 border-t border-gray-700/50 space-y-4">
                    <form onSubmit={handleCommentSubmit} className="flex items-center gap-2.5">
                        <img className="w-8 h-8 rounded-full object-cover" src={currentUser.avatar_url} alt={currentUser.display_name} />
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Adicione um comentário..."
                            className="w-full bg-gray-700/60 text-white placeholder-gray-400 px-3 py-2 rounded-full border border-gray-600 focus:ring-1 focus:ring-lime-500"
                        />
                        <button type="submit" className="bg-lime-500 text-black rounded-full p-2">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                        </button>
                    </form>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {post.comments.map(comment => <Comment key={comment.id} comment={comment} author={userMap.get(comment.author_id)} />)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostCard;