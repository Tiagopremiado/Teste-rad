import React, { useState, useEffect, useMemo } from 'react';
import type { User, SocialPost, SocialComment, WeeklyChallenge, ExclusiveContent, Suggestion } from '../types';
import PostCard from './PostCard';
import UserProfile from './UserProfile';
import CreatePost from './CreatePost';
import HighlightsPanel from './HighlightsPanel';
import ChallengesAndContent from './ChallengesAndContent';
import SuggestionBox from './SuggestionBox';
import SocialProofFeed from './SocialProofFeed';

const mockChallenge: WeeklyChallenge = {
    title: "Poste sua maior vitória da semana!",
    description: "O post de vitória com mais curtidas até domingo será o vencedor.",
    lastWinnerId: 'user1' // ReiDoPink won last week
};

const mockExclusiveContent: ExclusiveContent[] = [
    { title: "Vídeo: Dominando a Estratégia de 3 Roxos", type: 'video', url: '#' },
    { title: "PDF: Análise de Padrões para Velas 100x+", type: 'pdf', url: '#' },
    { title: "Vídeo: Gestão de Banca para Iniciantes", type: 'video', url: '#' }
];

const SHARED_ANALYSIS_IMAGE_KEY = 'shared_analysis_image';
const SHARED_POST_DATA_KEY = 'SHARED_POST_DATA_KEY';

const RulesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 border-2 border-lime-500/50 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="text-3xl">📜</span>
                        Regras da Comunidade
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6 text-gray-300">
                    <p>Para manter a Resenha um ambiente seguro, respeitoso e valioso para todos, siga estas diretrizes:</p>

                    <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-lime-300">✅ O Que Incentivamos</h3>
                        <ul className="list-disc list-inside space-y-2 pl-2">
                            <li><strong>Respeito Mútuo:</strong> Trate todos os membros com cordialidade. Críticas construtivas são bem-vindas, ataques pessoais não.</li>
                            <li><strong>Compartilhamento de Estratégias:</strong> Discuta táticas, padrões que você observou e ideias para melhorar o jogo de todos.</li>
                            <li><strong>Prints de Vitórias:</strong> Comemore seus ganhos! Compartilhe seus prints e explique o que te levou àquela vitória.</li>
                            <li><strong>Dúvidas e Sugestões:</strong> Tem alguma dúvida sobre o sistema ou uma ideia para melhorá-lo? Este é o lugar!</li>
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-red-400">❌ O Que Não Toleramos</h3>
                        <ul className="list-disc list-inside space-y-2 pl-2">
                            <li><strong>Spam e Publicidade:</strong> É proibido divulgar outros serviços, grupos de sinais, links de afiliados ou qualquer tipo de propaganda.</li>
                            <li><strong>Garantia de Ganhos:</strong> Não prometa ou garanta lucros. Cada um é responsável por sua própria banca.</li>
                            <li><strong>Discurso de Ódio e Assédio:</strong> Comentários ofensivos, discriminatórios, ameaças ou qualquer forma de assédio resultarão em banimento imediato.</li>
                            <li><strong>Conteúdo Ilegal ou NSFW:</strong> Qualquer postagem com conteúdo ilegal, pornográfico ou inadequado será removida e o usuário banido.</li>
                            <li><strong>Informações Pessoais:</strong> Não compartilhe informações de contato pessoais (telefone, redes sociais) publicamente.</li>
                        </ul>
                    </div>
                    <div className="bg-yellow-900/40 border border-yellow-700 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-yellow-300 flex items-center gap-2">🛡️ Jogo Responsável</h3>
                        <p className="text-sm mt-2">Lembre-se: o Radar Aviator é uma ferramenta de ANÁLISE e não oferece conselhos financeiros. Os resultados passados não garantem lucros futuros. Aposte com responsabilidade e gerencie sua banca com sabedoria.</p>
                    </div>
                     <p className="text-xs text-gray-500 text-center">O descumprimento das regras pode levar à remoção do post, suspensão temporária ou banimento permanente da plataforma.</p>
                </div>
                <div className="p-4 border-t border-gray-700 text-right flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="bg-lime-500 hover:bg-lime-600 text-black font-bold py-2 px-5 rounded-lg transition-colors"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

interface SocialClubProps {
  currentUser: User;
  updateUserProfile: (updates: Partial<User>) => void;
  canReturnFromShare: boolean;
  onReturnFromShare: () => void;
  clearSessionEndContext: () => void;
  posts: SocialPost[];
  suggestions: Suggestion[];
  userMap: Map<string, User>;
  addPost: (post: Omit<SocialPost, 'id' | 'timestamp' | 'author_id' | 'likedBy' | 'comments'>) => void;
  likePost: (postId: string) => void;
  commentOnPost: (postId: string, text: string) => void;
  addSuggestion: (text: string) => void;
  upvoteSuggestion: (suggestionId: string) => void;
  followingMap: Map<string, string[]>;
  toggleFollow: (userIdToFollow: string) => void;
}

const SocialClub: React.FC<SocialClubProps> = ({ 
    currentUser, updateUserProfile, canReturnFromShare, onReturnFromShare, clearSessionEndContext,
    posts, suggestions, userMap, addPost, likePost, commentOnPost, addSuggestion, upvoteSuggestion,
    followingMap, toggleFollow
}) => {
  const [page, setPage] = useState<'feed' | 'profile'>('feed');
  const [feedType, setFeedType] = useState<'global' | 'seguindo'>('global');
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [sharedImage, setSharedImage] = useState<string | null>(null);
  const [sharedPostData, setSharedPostData] = useState<{ text: string, category: 'Vitória' | 'Estratégia' | 'Dúvida' | 'Sugestão' } | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  useEffect(() => {
    const imageData = localStorage.getItem(SHARED_ANALYSIS_IMAGE_KEY);
    if (imageData) {
        setSharedImage(imageData);
        localStorage.removeItem(SHARED_ANALYSIS_IMAGE_KEY);
        const createPostElement = document.getElementById('create-post-section');
        if (createPostElement) {
            createPostElement.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    const postData = localStorage.getItem(SHARED_POST_DATA_KEY);
    if (postData) {
        try {
            setSharedPostData(JSON.parse(postData));
            localStorage.removeItem(SHARED_POST_DATA_KEY);
            const createPostElement = document.getElementById('create-post-section');
            if (createPostElement) {
                createPostElement.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (e) {
            console.error("Failed to parse shared post data", e);
            localStorage.removeItem(SHARED_POST_DATA_KEY);
        }
    }
  }, []);
  
  const filteredPosts = useMemo(() => {
    if (feedType === 'seguindo') {
        const followingList = followingMap.get(currentUser.id) || [];
        const feedUserIds = new Set([...followingList, currentUser.id]);
        return posts.filter(p => feedUserIds.has(p.author_id));
    }
    return posts;
  }, [feedType, posts, followingMap, currentUser.id]);

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

  const handleViewProfile = (userToView: User) => {
      setProfileUser(userToView);
      setPage('profile');
  };

  const handleAddPost = (post: Omit<SocialPost, 'id' | 'timestamp' | 'author_id' | 'likedBy' | 'comments'>) => {
    addPost(post);
    if (canReturnFromShare) {
        clearSessionEndContext();
    }
  };
  
  const currentUserEnriched = userMap.get(currentUser.id) || currentUser;

  if (page === 'profile' && profileUser) {
      return (
          <UserProfile 
              user={userMap.get(profileUser.id) || profileUser} 
              isOwnProfile={profileUser.id === currentUser.id}
              onBack={() => setPage('feed')} 
              currentUser={currentUserEnriched}
              onAddPost={handleAddPost}
              updateUserProfile={updateUserProfile}
              posts={posts}
              userMap={userMap}
              onLike={likePost}
              onComment={commentOnPost}
              onViewProfile={handleViewProfile}
              followingMap={followingMap}
              toggleFollow={toggleFollow}
          />
      );
  }

  const lastWeekWinner = userMap.get(mockChallenge.lastWinnerId || '');

  return (
    <>
      <RulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
      <div className="bg-slate-950 bg-grid-green-pattern py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
              {/* Main Feed Column */}
              <div className="lg:col-span-8 space-y-6">
                  <div className="bg-slate-900/70 backdrop-blur-sm rounded-xl p-4 shadow-xl flex items-center justify-between gap-4 sticky top-[70px] z-20 border border-lime-500/30">
                      <div className="flex items-center gap-4">
                          <img
                              src={currentUserEnriched.avatar_url}
                              alt={currentUserEnriched.display_name}
                              className="w-16 h-16 rounded-full object-cover ring-4 ring-lime-500 cursor-pointer transition-transform hover:scale-105"
                              onClick={() => handleViewProfile(currentUserEnriched)}
                              title="Ver meu perfil"
                          />
                          <div>
                              <h2 className="text-2xl font-bold text-white mb-1">Bem-vindo à Resenha, {currentUserEnriched.display_name}!</h2>
                              <p className="text-gray-400 text-sm">Compartilhe vitórias, estratégias e aprenda com a comunidade.</p>
                          </div>
                      </div>
                      <button 
                        onClick={() => setIsRulesModalOpen(true)}
                        className="flex-shrink-0 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2"
                        title="Ver as regras da comunidade"
                      >
                         📜 Regras
                      </button>
                  </div>

                  <div id="create-post-section">
                    <CreatePost 
                        currentUser={currentUserEnriched} 
                        onAddPost={handleAddPost} 
                        sharedImage={sharedImage}
                        clearSharedImage={() => setSharedImage(null)}
                        sharedPostData={sharedPostData}
                        canReturnFromShare={canReturnFromShare}
                        onReturnFromShare={onReturnFromShare}
                    />
                  </div>
                  
                  <SocialProofFeed posts={posts} userMap={userMap} />

                   <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                      <button 
                          onClick={() => setFeedType('global')}
                          className={`w-full py-2 font-bold rounded-md transition-colors ${feedType === 'global' ? 'bg-lime-500 text-black shadow-md' : 'text-gray-300'}`}
                      >
                          Feed Global
                      </button>
                      <button 
                          onClick={() => setFeedType('seguindo')}
                          className={`w-full py-2 font-bold rounded-md transition-colors ${feedType === 'seguindo' ? 'bg-lime-500 text-black shadow-md' : 'text-gray-300'}`}
                      >
                          Seguindo
                      </button>
                  </div>

                  <div className="space-y-6">
                      {filteredPosts.map(post => {
                          const author = userMap.get(post.author_id);
                          if (!author) return null;
                          return (
                              <PostCard 
                                  key={post.id} 
                                  post={post} 
                                  currentUser={currentUserEnriched}
                                  author={author}
                                  userMap={userMap}
                                  onViewProfile={handleViewProfile}
                                  onLike={likePost}
                                  onComment={commentOnPost}
                                  onShare={handleShare}
                              />
                          );
                      })}
                       {filteredPosts.length === 0 && (
                          <div className="text-center py-16 bg-slate-900 rounded-xl border border-gray-700/50">
                              <p className="text-lg text-gray-500">
                                  {feedType === 'seguindo' ? "Você ainda não segue ninguém ou eles não postaram nada." : "Nenhuma publicação para mostrar."}
                              </p>
                          </div>
                      )}
                  </div>
              </div>

              {/* Highlights Column */}
              <div className="lg:col-span-4 lg:sticky top-[70px] h-max space-y-6">
                  <HighlightsPanel posts={posts} userMap={userMap} onViewProfile={handleViewProfile} />
                  <SuggestionBox
                      suggestions={suggestions}
                      currentUser={currentUserEnriched}
                      userMap={userMap}
                      onAddSuggestion={addSuggestion}
                      onUpvote={upvoteSuggestion}
                  />
                  <ChallengesAndContent
                      challenge={mockChallenge}
                      content={mockExclusiveContent}
                      winner={lastWeekWinner}
                      onViewProfile={handleViewProfile}
                  />
              </div>
          </div>
      </div>
    </>
  );
};

export default SocialClub;