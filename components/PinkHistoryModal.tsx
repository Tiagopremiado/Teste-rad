

import React, { useState, useMemo } from 'react';
import type { PlayWithId } from '../types';

const getPlayStyle = (multiplier: number): string => {
  if (multiplier >= 100) return 'bg-gradient-to-b from-red-500 via-pink-500 to-pink-600 shadow-pink-500/50';
  if (multiplier >= 10) return 'bg-gradient-to-b from-pink-500 to-pink-700';
  if (multiplier >= 2) return 'bg-gradient-to-b from-purple-500 to-purple-700';
  return 'bg-gradient-to-b from-cyan-500 to-cyan-700';
};

interface PinkHistoryModalProps {
  isOpen: boolean;
  plays: PlayWithId[];
  onClose: () => void;
}

const SYMBOLS = ['⭐', '🔥', '💎', '🍀', '🚀', '🎯', '⚡', '👑', '💰', '💡', '💯', '🔔', '🎉', '🎁', '🔑'];


const PinkHistoryModal: React.FC<PinkHistoryModalProps> = ({ isOpen, plays, onClose }) => {
  const [columnCount, setColumnCount] = useState(7);
  const [filteredSymbol, setFilteredSymbol] = useState<string | null>(null);
  const columnOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  const minuteSymbols = useMemo(() => {
    if (!plays || plays.length === 0) {
      return new Map<string, string>();
    }
    const minuteCounts: Record<string, number> = {};
    plays.forEach(play => {
      const minute = play.time.split(':')[1];
      if (minute) {
        minuteCounts[minute] = (minuteCounts[minute] || 0) + 1;
      }
    });

    const repeatedMinutes = Object.keys(minuteCounts)
      .filter(minute => minuteCounts[minute] > 1)
      .sort(); // Sort to ensure consistent symbol assignment

    const symbolsMap = new Map<string, string>();
    repeatedMinutes.forEach((minute, index) => {
      symbolsMap.set(minute, SYMBOLS[index % SYMBOLS.length]);
    });
    
    return symbolsMap;
  }, [plays]);

  const handleSymbolClick = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation(); // Prevent modal from closing when clicking the symbol
    setFilteredSymbol(prev => (prev === symbol ? null : symbol));
  };

  const handleClose = () => {
    setFilteredSymbol(null); // Clear filter when closing
    onClose();
  };


  if (!isOpen) return null;

  const displayPlays = plays.slice().reverse(); // Show newest first

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold">Histórico de Rosas</h2>
            <p className="text-gray-400 text-sm">{plays.length} rosas encontradas.</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto">
            <div className="flex items-center justify-center space-x-2 flex-wrap gap-y-2 mb-6">
                <span className="text-sm text-gray-400">Colunas:</span>
                {columnOptions.map(count => (
                    <button key={count} onClick={() => setColumnCount(count)} className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-md transition-colors ${columnCount === count ? 'bg-amber-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>
                    {count}
                    </button>
                ))}
            </div>

            <div className="grid gap-x-2 gap-y-4" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
                {displayPlays.map((play) => {
                    const playMinute = play.time.split(':')[1];
                    const symbol = minuteSymbols.get(playMinute);
                    const isDimmed = filteredSymbol !== null && symbol !== filteredSymbol;

                    return (
                        <div key={play.id} className={`text-center transition-all duration-300 ${isDimmed ? 'opacity-30 saturate-50' : 'opacity-100'}`}>
                            <div className={`w-full rounded-lg py-3 h-14 flex items-center justify-center shadow-lg border border-black/20 relative transition-all duration-300 ${getPlayStyle(play.multiplier)}`}>
                                <span className="font-bold text-white text-base drop-shadow-sm">
                                {`${play.multiplier.toFixed(2).replace('.', ',')}x`}
                                </span>
                                {symbol && (
                                    <button 
                                      onClick={(e) => handleSymbolClick(e, symbol)}
                                      className="absolute top-1 right-1 text-lg p-1 rounded-full hover:bg-black/20 transition-colors cursor-pointer z-10"
                                      title={`Filtrar por ${symbol}`}
                                    >
                                        {symbol}
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-400 text-xs mt-1">{play.time}</p>
                        </div>
                    );
                })}
            </div>

             {plays.length === 0 && (
                <p className="text-center text-gray-500 italic py-8">Nenhuma rosa encontrada no histórico.</p>
            )}
        </div>

        <div className="p-4 border-t border-gray-700 text-right flex-shrink-0">
            <button
                onClick={handleClose}
                className="bg-amber-600 hover:bg-amber-700 text-black font-bold py-2 px-5 rounded-lg transition-colors"
            >
                Fechar
            </button>
        </div>
      </div>
    </div>
  );
};

export default PinkHistoryModal;