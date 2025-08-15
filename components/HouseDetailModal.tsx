

import React from 'react';
import type { SelectedHouseDetails, PlayWithId } from '../types';

interface HouseDetailModalProps {
  details: SelectedHouseDetails | null;
  onClose: () => void;
}

const getPlayStyle = (multiplier: number): string => {
  if (multiplier >= 100) return 'bg-gradient-to-b from-red-500 via-pink-500 to-pink-600';
  if (multiplier >= 10) return 'bg-gradient-to-b from-pink-500 to-pink-700';
  if (multiplier >= 2) return 'bg-gradient-to-b from-purple-500 to-purple-700';
  return 'bg-gradient-to-b from-cyan-500 to-cyan-700';
};

const MiniPlay: React.FC<{ play: PlayWithId, isTrigger?: boolean }> = ({ play, isTrigger = false }) => {
    const style = getPlayStyle(play.multiplier);
    const triggerClasses = isTrigger ? 'ring-2 ring-yellow-400 scale-110' : '';
    return (
        <div 
            className={`w-4 h-4 rounded-sm ${style} ${triggerClasses} transition-transform duration-200 hover:scale-125`}
            title={`${play.multiplier.toFixed(2)}x at ${play.time}`}
        />
    );
};

const HouseDetailModal: React.FC<HouseDetailModalProps> = ({ details, onClose }) => {
  if (!details) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold">
            Análise da Casa <span className="text-amber-400">{details.houseNumber}</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
            <div className="bg-gray-900/50 p-4 rounded-lg">
                <p className="text-gray-300">
                    A casa <span className="font-bold text-amber-400">{details.houseNumber}</span> resultou em uma rosa <span className="font-bold text-pink-400">{details.occurrences.length}</span> vez(es). Abaixo está o detalhe de cada ocorrência, com as jogadas anteriores e posteriores para análise de contexto.
                </p>
            </div>

            {details.occurrences.map((occurrence, index) => (
                <div key={occurrence.triggerPlay.id} className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
                        <h4 className="font-semibold text-lg">Ocorrência #{index + 1}</h4>
                        <div className="text-right">
                           <p className="font-bold text-xl text-pink-400">{occurrence.triggerPlay.multiplier.toFixed(2)}x</p>
                           <p className="text-xs text-gray-400">{occurrence.triggerPlay.date} às {occurrence.triggerPlay.time}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Espelho do Histórico (25 Anteriores e Posteriores)</p>
                        <div className="w-full overflow-x-auto p-2 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center justify-start gap-1 w-max">
                                {/* Anteriores */}
                                {occurrence.precursorPlays.map(p => <MiniPlay key={`pre-${p.id}`} play={p} />)}
                                
                                {/* Gatilho */}
                                <div className="mx-2 flex items-center gap-1">
                                    <div className="w-px h-6 bg-gray-600"></div>
                                    <MiniPlay play={occurrence.triggerPlay} isTrigger={true} />
                                    <div className="w-px h-6 bg-gray-600"></div>
                                </div>
                                
                                {/* Posteriores */}
                                {occurrence.postcursorPlays.map(p => <MiniPlay key={`post-${p.id}`} play={p} />)}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {details.occurrences.length === 0 && (
                <p className="text-center text-gray-500 italic py-8">Nenhuma ocorrência encontrada para esta casa.</p>
            )}

        </div>
        <div className="p-4 border-t border-gray-700 text-right flex-shrink-0">
            <button
                onClick={onClose}
                className="bg-amber-600 hover:bg-amber-700 text-black font-bold py-2 px-5 rounded-lg transition-colors"
            >
                Fechar
            </button>
        </div>
      </div>
    </div>
  );
};

export default HouseDetailModal;