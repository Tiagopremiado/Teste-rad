import React, { useMemo } from 'react';
import type { SocialPost, User } from '../types';

interface HighlightsPanelProps {
  posts: SocialPost[];
  userMap: Map<string, User>;
  onViewProfile: (user: User) => void;
}

const HighlightListItem: React.FC<{
  title: string;
  subtitle: string;
  value: React.ReactNode;
  onClick: () => void;
}> = ({ title, subtitle, value, onClick }) => (
  <button onClick={onClick} className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-between gap-3">
    <div className="flex-grow min-w-0">
      <p className="font-semibold text-white break-words">{title}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
    <div className="flex-shrink-0 font-bold text-lime-400 text-lg flex items-center gap-1.5">
       ❤️<span className="text-white">{value}</span>
    </div>
  </button>
);

const HighlightUserItem: React.FC<{
  user?: User;
  label: string;
  value: string;
  icon: string;
  onViewProfile: (user: User) => void;
}> = ({ user, label, value, icon, onViewProfile }) => {
    if (!user) return null;
    return (
        <div className="bg-gray-900/50 p-3 rounded-lg flex items-center gap-3">
            <div className="text-3xl">{icon}</div>
            <div>
                 <p className="text-xs text-gray-400">{label}</p>
                <button onClick={() => onViewProfile(user)} className="font-bold text-lg text-lime-300 hover:underline">{user.display_name}</button>
                <p className="text-sm text-gray-500">{value}</p>
            </div>
        </div>
    );
};

const HighlightsPanel: React.FC<HighlightsPanelProps> = ({ posts, userMap, onViewProfile }) => {
  const highlights = useMemo(() => {
    const topWins = [...posts]
      .filter(p => p.category === 'Vitória')
      .sort((a, b) => b.likedBy.length - a.likedBy.length)
      .slice(0, 5);

    const topPosts = [...posts]
      .sort((a, b) => b.likedBy.length - a.likedBy.length)
      .slice(0, 5);

    const postCounts = new Map<string, number>();
    posts.forEach(p => {
      postCounts.set(p.author_id, (postCounts.get(p.author_id) || 0) + 1);
    });

    const topPosterId = [...postCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const topPoster = topPosterId ? userMap.get(topPosterId) : undefined;
    const topPosterCount = topPosterId ? postCounts.get(topPosterId) : 0;

    const legendPost = topPosts[0];
    const legend = legendPost ? userMap.get(legendPost.author_id) : undefined;
    const legendLikes = legendPost ? legendPost.likedBy.length : 0;

    return { topWins, topPosts, topPoster, topPosterCount, legend, legendLikes };
  }, [posts, userMap]);

  return (
    <div className="space-y-6">
      {/* Community Highlights */}
      <div className="bg-slate-900 rounded-xl p-4 shadow-xl border border-lime-500/30">
        <h3 className="text-lg font-bold mb-4 text-center">Destaques da Comunidade</h3>
        <div className="space-y-3">
            <HighlightUserItem
                user={highlights.legend}
                label="Lenda da Semana"
                value={`${highlights.legendLikes} curtidas no post`}
                icon="👑"
                onViewProfile={onViewProfile}
            />
             <HighlightUserItem
                user={highlights.topPoster}
                label="Perfil em Alta"
                value={`${highlights.topPosterCount} publicações`}
                icon="🚀"
                onViewProfile={onViewProfile}
            />
        </div>
      </div>
      
      {/* Top Wins */}
      <div className="bg-slate-900 rounded-xl p-4 shadow-xl border border-lime-500/30">
        <h3 className="text-lg font-bold mb-3">Top 5 Vitórias</h3>
        <div className="space-y-1">
          {highlights.topWins.map(post => (
            <HighlightListItem
              key={`win-${post.id}`}
              title={post.text}
              subtitle={`por ${userMap.get(post.author_id)?.display_name || 'Usuário'}`}
              value={post.likedBy.length}
              onClick={() => { /* maybe scroll to post in future */ }}
            />
          ))}
          {highlights.topWins.length === 0 && <p className="text-sm text-center text-gray-500 py-2">Nenhuma vitória postada ainda.</p>}
        </div>
      </div>

      {/* Most Liked Posts */}
      <div className="bg-slate-900 rounded-xl p-4 shadow-xl border border-lime-500/30">
        <h3 className="text-lg font-bold mb-3">Posts Mais Curtidos</h3>
        <div className="space-y-1">
          {highlights.topPosts.map(post => (
             <HighlightListItem
                key={`post-${post.id}`}
                title={post.text}
                subtitle={`por ${userMap.get(post.author_id)?.display_name || 'Usuário'}`}
                value={post.likedBy.length}
                onClick={() => { /* maybe scroll to post in future */ }}
            />
          ))}
           {highlights.topPosts.length === 0 && <p className="text-sm text-center text-gray-500 py-2">Nenhuma publicação ainda.</p>}
        </div>
      </div>
    </div>
  );
};

export default HighlightsPanel;