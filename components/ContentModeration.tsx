import React, { useState, useMemo } from 'react';
import type { SocialPost, User } from '../types';

interface ContentModerationProps {
  posts: SocialPost[];
  userMap: Map<string, User>;
  deletePost: (postId: string) => void;
  flaggedPosts: { postId: string; reason: string }[];
  onAnalyzePosts: () => Promise<void>;
  isAnalyzing: boolean;
}

const ContentModeration: React.FC<ContentModerationProps> = ({ posts, userMap, deletePost, flaggedPosts, onAnalyzePosts, isAnalyzing }) => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const flaggedPostObjects = useMemo(() => {
    return flaggedPosts.map(flag => {
        const post = posts.find(p => p.id === flag.postId);
        return post ? { ...post, reason: flag.reason } : null;
    }).filter((p): p is SocialPost & { reason: string } => p !== null);
  }, [flaggedPosts, posts]);

  const filteredPosts = posts.filter(post => {
    const author = userMap.get(post.author_id);
    const categoryMatch = filter === 'all' || post.category === filter;
    const searchMatch = !searchTerm ||
      post.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (author && author.display_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return categoryMatch && searchMatch;
  });

  const handleDelete = (postId: string, authorName: string) => {
    if (window.confirm(`Tem certeza que deseja deletar o post de ${authorName}? Esta ação não pode ser desfeita.`)) {
      deletePost(postId);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">Moderação de Conteúdo</h2>
        <div className="flex items-center gap-4">
            <input
                type="text"
                placeholder="Buscar por autor ou conteúdo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-gray-800 text-white placeholder-gray-400 p-2 rounded-lg border-2 border-gray-700 focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
            />
            <button
                onClick={onAnalyzePosts}
                disabled={isAnalyzing}
                className="bg-lime-600 hover:bg-lime-500 text-black font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:bg-lime-900/50 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-black"></div>
                    Analisando...
                  </>
                ) : 'Analisar com IA'}
              </button>
        </div>
      </div>
      
      {flaggedPostObjects.length > 0 && (
        <div className="mb-6 bg-red-900/20 border border-red-500/30 p-4 rounded-lg animate-fade-in">
          <h3 className="text-lg font-bold text-red-300 mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.026 2.251-1.026 2.887 0l7.265 11.72c.636 1.026-.183 2.331-1.443 2.331H2.435c-1.26 0-2.079-1.305-1.443-2.331L8.257 3.099zM10 12a1 1 0 110-2 1 1 0 010 2zm0-4a1 1 0 01-1-1V5a1 1 0 112 0v2a1 1 0 01-1 1z" clipRule="evenodd" /></svg>
            Fila de Revisão da IA
          </h3>
          <div className="bg-gray-800/50 rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-black/20">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Autor</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Conteúdo</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Motivo da Sinalização</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {flaggedPostObjects.map(post => {
                        const author = userMap.get(post.author_id);
                        return (
                             <tr key={post.id} className="hover:bg-red-800/20">
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{author?.display_name || 'Desconhecido'}</td>
                                <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate" title={post.text}>{post.text}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-yellow-400">{post.reason}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => handleDelete(post.id, author?.display_name || 'usuário')} className="text-red-400 hover:text-red-300">Deletar</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
        </div>
      )}


      <div className="bg-gray-800/50 rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-black/20">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">Autor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">Conteúdo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">Mídia</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">Interações</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredPosts.map(post => {
              const author = userMap.get(post.author_id);
              return (
                <tr key={post.id} className="hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img className="h-10 w-10 rounded-full" src={author?.avatar_url} alt={author?.display_name} />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{author?.display_name || 'Desconhecido'}</div>
                        <div className="text-xs text-gray-400">{new Date(post.timestamp).toLocaleString('pt-BR')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-300 max-w-sm truncate" title={post.text}>{post.text}</p>
                  </td>
                  <td className="px-6 py-4">
                    {post.imageUrl && (
                      <a href={post.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">Ver Imagem</a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div className="flex items-center gap-3">
                        <span>❤️ {post.likedBy.length}</span>
                        <span>💬 {post.comments.length}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleDelete(post.id, author?.display_name || 'usuário')} className="text-red-400 hover:text-red-300">Deletar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredPosts.length === 0 && <p className="text-center text-gray-500 py-8">Nenhuma postagem encontrada.</p>}
      </div>
    </div>
  );
};

export default ContentModeration;