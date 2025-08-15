import React from 'react';
import type { User, WeeklyChallenge, ExclusiveContent } from '../types';

interface ChallengesAndContentProps {
  challenge?: WeeklyChallenge;
  content: ExclusiveContent[];
  winner?: User | null;
  onViewProfile: (user: User) => void;
}

const ChallengesAndContent: React.FC<ChallengesAndContentProps> = ({ challenge, content, winner, onViewProfile }) => {
  return (
    <div className="space-y-6">
      {/* Weekly Challenge */}
      {challenge && (
          <div className="bg-slate-900 rounded-xl p-4 shadow-xl border border-lime-500/30">
            <h3 className="text-lg font-bold mb-3 text-center text-lime-300">Desafio da Semana</h3>
            <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                <p className="font-semibold text-white">{challenge.title}</p>
                <p className="text-sm text-gray-400 mt-1">{challenge.description}</p>
            </div>
            {winner && (
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Vencedor da Semana Passada</p>
                    <button onClick={() => onViewProfile(winner)} className="bg-lime-600/20 text-lime-300 font-bold px-4 py-2 rounded-full text-sm inline-flex items-center gap-2 transition-colors hover:bg-lime-600/40">
                       🏆 {winner.display_name}
                    </button>
                </div>
            )}
          </div>
      )}

      {/* Exclusive Content */}
      <div className="bg-slate-900 rounded-xl p-4 shadow-xl border border-lime-500/30">
        <h3 className="text-lg font-bold mb-3 text-center text-lime-300">Conteúdo Exclusivo</h3>
        <div className="space-y-2">
          {content.map((item, index) => (
            <a 
              key={index} 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full text-left p-2.5 rounded-lg hover:bg-gray-700/50 transition-colors flex items-center gap-3"
            >
                <span className="text-xl">{item.type === 'video' ? '🎬' : '📄'}</span>
                <p className="font-semibold text-white">{item.title}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChallengesAndContent;