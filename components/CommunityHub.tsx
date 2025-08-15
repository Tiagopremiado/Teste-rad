import React from 'react';
import type { User, Suggestion, SuggestionStatus } from '../types';

interface CommunityHubProps {
  suggestions: Suggestion[];
  updateSuggestion: (id: string, status: SuggestionStatus) => void;
  userMap: Map<string, User>;
  allUsers: User[]; // for other potential features
}

const SuggestionCard: React.FC<{
    suggestion: Suggestion;
    author?: User;
    onStatusChange: (id: string, status: SuggestionStatus) => void;
}> = ({ suggestion, author, onStatusChange }) => {
    const statusClasses: Record<SuggestionStatus, string> = {
        'Nova': 'bg-blue-500/20 text-blue-300',
        'Em Análise': 'bg-yellow-500/20 text-yellow-300',
        'Implementada': 'bg-green-500/20 text-green-300',
        'Rejeitada': 'bg-red-500/20 text-red-300',
    };

    return (
        <div className="bg-gray-800/50 p-4 rounded-lg flex gap-4">
            <div className="flex-grow">
                <p className="text-gray-300">{suggestion.text}</p>
                <p className="text-xs text-gray-500 mt-2">
                    Sugerido por <strong className="text-white">{author?.display_name || 'Desconhecido'}</strong> em {new Date(suggestion.timestamp).toLocaleDateString()}
                </p>
            </div>
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
                 <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusClasses[suggestion.status]}`}>{suggestion.status}</span>
                 <select
                    value={suggestion.status}
                    onChange={(e) => onStatusChange(suggestion.id, e.target.value as SuggestionStatus)}
                    className="bg-gray-700 text-white p-1 rounded-md border border-gray-600 text-xs"
                 >
                    <option value="Nova">Nova</option>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Implementada">Implementada</option>
                    <option value="Rejeitada">Rejeitada</option>
                 </select>
                <span className="text-xs text-gray-400">👍 {suggestion.upvotes.length}</span>
            </div>
        </div>
    );
};


const CommunityHub: React.FC<CommunityHubProps> = ({ suggestions, updateSuggestion, userMap }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Gerenciamento da Comunidade</h2>
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Sugestões dos Usuários</h3>
        <div className="space-y-3">
            {suggestions.map(suggestion => (
                <SuggestionCard 
                    key={suggestion.id}
                    suggestion={suggestion}
                    author={userMap.get(suggestion.author_id)}
                    onStatusChange={updateSuggestion}
                />
            ))}
            {suggestions.length === 0 && <p className="text-center text-gray-500 py-4">Nenhuma sugestão enviada ainda.</p>}
        </div>
      </div>
    </div>
  );
};

export default CommunityHub;