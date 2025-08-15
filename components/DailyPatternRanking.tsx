import React from 'react';
import type { DailyRankedPattern, Color } from '../types';
import { Color as ColorEnum } from '../types';

const colorMap = {
    [ColorEnum.Blue]: { name: "Azul", style: 'bg-cyan-500' },
    [ColorEnum.Purple]: { name: "Roxo", style: 'bg-purple-500' },
    [ColorEnum.Pink]: { name: "Rosa", style: 'bg-pink-500' },
};

const PatternDisplay: React.FC<{ pattern: Color[] }> = ({ pattern }) => {
  return (
     <div className="flex items-center gap-1.5 flex-wrap">
      {pattern.map((color, index) => (
        <div key={index} className={`w-5 h-5 rounded ${colorMap[color].style}`} />
      ))}
    </div>
  );
};

const RankItem: React.FC<{ item: DailyRankedPattern, onClick: () => void }> = ({ item, onClick }) => {
    const isWinner = item.rank === 1;
    const errors = item.occurrences - item.hits;

    return (
        <div onClick={onClick} className={`p-4 rounded-xl transition-all cursor-pointer ${isWinner ? 'bg-amber-900/50 border-2 border-amber-500 hover:bg-amber-900' : 'bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700'}`}>
            <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${isWinner ? 'text-amber-400' : 'text-gray-400'}`}>#{item.rank}</span>
                    <div>
                        <div className="font-bold text-white">{item.pattern ? <PatternDisplay pattern={item.pattern} /> : item.name}</div>
                        {item.pattern && <p className="text-xs text-gray-500">{item.name}</p>}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                 <div className="bg-gray-900/50 p-2 rounded-md">
                    <p className="text-xs text-gray-400">Taxa de Acerto</p>
                    <p className="font-bold text-lg text-green-400">{item.hitRate.toFixed(1)}%</p>
                </div>
                <div className="bg-gray-900/50 p-2 rounded-md">
                    <p className="text-xs text-gray-400">Acertos</p>
                    <p className="font-bold text-lg text-green-400">{item.hits}</p>
                </div>
                 <div className="bg-gray-900/50 p-2 rounded-md">
                    <p className="text-xs text-gray-400">Erros</p>
                    <p className="font-bold text-lg text-red-400">{errors}</p>
                </div>
                <div className="bg-gray-900/50 p-2 rounded-md">
                    <p className="text-xs text-gray-400">Média Acertos</p>
                    <p className="font-bold text-lg text-pink-400">{item.avgMultiplier > 0 ? `${item.avgMultiplier.toFixed(2)}x` : '-'}</p>
                </div>
            </div>
        </div>
    );
};

interface DailyPatternRankingProps {
  ranking: DailyRankedPattern[];
  onPatternClick: (info: { name: string, pattern?: Color[] }) => void;
}

const DailyPatternRanking: React.FC<DailyPatternRankingProps> = ({ ranking, onPatternClick }) => {
  return (
    <div className="space-y-3">
      {ranking.map(item => (
        <RankItem key={`${item.name}-${item.rank}`} item={item} onClick={() => onPatternClick({ name: item.name, pattern: item.pattern })} />
      ))}
    </div>
  );
};

export default DailyPatternRanking;