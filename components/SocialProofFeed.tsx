import React from 'react';
import type { SocialPost, User } from '../types';

interface SocialProofFeedProps {
  posts: SocialPost[];
  userMap: Map<string, User>;
}

const ProofCard: React.FC<{ post: SocialPost, author?: User }> = ({ post, author }) => (
    <div className="flex-shrink-0 w-64 bg-slate-900 rounded-lg p-3 snap-center border border-lime-500/20">
        <div className="flex items-center gap-2 mb-2">
            <img src={author?.avatar_url} alt={author?.display_name} className="w-8 h-8 rounded-full object-cover" />
            <div>
                <p className="text-sm font-semibold text-white">{author?.display_name}</p>
                <p className="text-xs text-gray-500">pegou uma rosa!</p>
            </div>
        </div>
        <img src={post.imageUrl} alt="Print da vitória" className="w-full h-32 object-cover rounded-md mb-2" />
        <div className="flex justify-end items-center gap-3 text-sm text-gray-400">
            <span>❤️ {post.likedBy.length}</span>
            <span>💬 {post.comments.length}</span>
        </div>
    </div>
);

const SocialProofFeed: React.FC<SocialProofFeedProps> = ({ posts, userMap }) => {
    const victoryPosts = posts.filter(p => p.category === 'Vitória' && p.imageUrl);

    if (victoryPosts.length === 0) {
        return null;
    }

    return (
        <div className="bg-slate-900 rounded-xl p-4 shadow-xl border border-lime-500/30">
            <h3 className="text-lg font-bold text-white mb-3">🏆 Vitrine de Vitórias</h3>
            <div className="flex overflow-x-auto space-x-4 pb-3 snap-x snap-mandatory">
                {victoryPosts.map(post => (
                    <ProofCard key={post.id} post={post} author={userMap.get(post.author_id)} />
                ))}
            </div>
        </div>
    );
};

export default SocialProofFeed;