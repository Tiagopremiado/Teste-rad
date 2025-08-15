import React, { useState } from 'react';
import type { User, Suggestion } from '../types';

interface SuggestionBoxProps {
  suggestions: Suggestion[];
  currentUser: User;
  userMap: Map<string, User>;
  onAddSuggestion: (text: string) => void;
  onUpvote: (suggestionId: string) => void;
}

const SuggestionItem: React.FC<{
    suggestion: Suggestion;
    author?: User;
    onUpvote: () => void;
    isUpvoted: boolean;
}> = ({ suggestion, author, onUpvote, isUpvoted }) => {
    const upvoteClass = isUpvoted ? 'bg-lime-600 text-black' : 'bg-gray-700 hover:bg-gray-600';
    return (
        <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
            <button onClick={onUpvote} className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors ${upvoteClass}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
                <span className="text-sm font-bold">{suggestion.upvotes.length}</span>
            </button>
            <div className="flex-grow">
                <p className="text-sm text-gray-200">{suggestion.text}</p>
                <p className="text-xs text-gray-500 mt-1">Sugerido por <span className="font-medium text-gray-400">{author?.display_name || 'Usuário'}</span></p>
            </div>
        </div>
    );
};

const SuggestionBox: React.FC<SuggestionBoxProps> = ({ suggestions, currentUser, userMap, onAddSuggestion, onUpvote }) => {
  const [newSuggestionText, setNewSuggestionText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSuggestionText.trim()) {
      onAddSuggestion(newSuggestionText);
      setNewSuggestionText('');
    }
  };
  
  const sortedSuggestions = [...suggestions].sort((a,b) => b.upvotes.length - a.upvotes.length);

  return (
    <div className="bg-slate-900 rounded-xl p-4 shadow-xl border border-lime-500/30">
        <h3 className="text-lg font-bold mb-3 text-center text-lime-300">Caixa de Sugestões</h3>
        
        <form onSubmit={handleSubmit} className="mb-4 space-y-2">
            <textarea
                value={newSuggestionText}
                onChange={(e) => setNewSuggestionText(e.target.value)}
                placeholder="Tem uma ideia para melhorar o sistema?"
                rows={2}
                className="w-full bg-gray-700/50 text-white placeholder-gray-400 p-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-lime-500 resize-none"
            />
            <button
                type="submit"
                disabled={!newSuggestionText.trim()}
                className="w-full bg-lime-600 hover:bg-lime-700 text-black font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
                Enviar Sugestão
            </button>
        </form>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {sortedSuggestions.map(s => (
                <SuggestionItem
                    key={s.id}
                    suggestion={s}
                    author={userMap.get(s.author_id)}
                    onUpvote={() => onUpvote(s.id)}
                    isUpvoted={s.upvotes.includes(currentUser.id)}
                />
            ))}
            {sortedSuggestions.length === 0 && <p className="text-sm text-center text-gray-500 py-4">Nenhuma sugestão ainda. Seja o primeiro!</p>}
        </div>
    </div>
  );
};

export default SuggestionBox;