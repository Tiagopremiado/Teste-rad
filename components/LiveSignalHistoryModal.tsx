


import React, { useMemo } from 'react';
import type { LiveSignalHistoryItem, Play } from '../types';

interface LiveSignalHistoryModalProps {
  isOpen: boolean;
  history: LiveSignalHistoryItem[];
  onClose: () => void;
}

const getPlayStyle = (multiplier: number): string => {
  if (multiplier >= 10) return 'bg-pink-500 text-white';
  if (multiplier >= 2) return 'bg-purple-500 text-white';
  return 'bg-cyan-500 text-white';
};

const StatCard: React.FC<{ title: string; value: React.ReactNode; colorClass?: string; }> = ({ title, value, colorClass = 'text-white' }) => (
    <div className="bg-gray-900/50 p-4 rounded-xl shadow-lg text-center h-full">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <div className={`text-3xl font-bold mt-2 ${colorClass}`}>{value}</div>
    </div>
);

const MiniPlay: React.FC<{ play: Play, isTrigger?: boolean, isResult?: boolean }> = ({ play, isTrigger, isResult }) => {
    let classes = `w-12 h-10 flex-shrink-0 rounded-md text-xs font-bold flex flex-col items-center justify-center transition-all duration-200 ${getPlayStyle(play.multiplier)}`;
    if (isTrigger) {
        classes += ' ring-2 ring-yellow-400 scale-105';
    }
    if (isResult) {
        classes += ' ring-2 ring-white scale-105';
    }
    return (
        <div className={classes} title={`${play.multiplier.toFixed(2)}x às ${play.time}`}>
            <span>{play.multiplier.toFixed(2)}x</span>
        </div>
    );
};

const SignalHistoryCard: React.FC<{ item: LiveSignalHistoryItem }> = ({ item }) => {
    const outcomeConfig = {
        'Win': { color: 'border-green-500', text: 'text-green-400', bg: 'bg-green-900/50' },
        'Loss': { color: 'border-red-500', text: 'text-red-400', bg: 'bg-red-900/50' },
        'Pending': { color: 'border-gray-600', text: 'text-gray-400', bg: 'bg-gray-700/50' },
    };

    const { color, text, bg } = outcomeConfig[item.outcome];

    const signalConfig = {
        'Gold': { icon: '🥇', style: 'text-yellow-400' },
        'FollowUp': { icon: '🚀', style: 'text-purple-400' },
        'Opportunity': { icon: '💡', style: 'text-cyan-400' },
    };
    const config = signalConfig[item.signal.level] || { icon: '⚪', style: 'text-gray-400' };

    return (
        <div className={`bg-gray-800/50 rounded-lg p-4 border-l-4 ${color}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-2 flex-grow">
                    <div>
                        <p className="text-xs text-gray-400">Horário</p>
                        <p className="font-semibold">{new Date(item.timestamp).toLocaleTimeString('pt-BR')}</p>
                    </div>
                     <div>
                        <p className="text-xs text-gray-400">Alvo</p>
                        <p className="font-semibold text-indigo-300">{item.signal.target}</p>
                    </div>
                     <div>
                        <p className="text-xs text-gray-400">Confiança</p>
                        <p className="font-semibold">{item.signal.confidence}</p>
                    </div>
                     <div className="col-span-2 sm:col-span-1">
                        <p className="text-xs text-gray-400">Tipo</p>
                        <p className={`font-semibold ${config.style}`}>{config.icon} {item.signal.level}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-2 md:col-span-1">
                        <p className="text-xs text-gray-400">Gatilho</p>
                        <p className="font-semibold truncate" title={item.signal.trigger}>{item.signal.trigger}</p>
                    </div>
                </div>
                <div className={`text-lg font-bold px-4 py-2 rounded-md ${bg} ${text} flex-shrink-0`}>
                    {item.outcome}
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-700/50">
                <p className="text-xs text-center text-gray-500 uppercase tracking-wider mb-2">Espelho da Rodada</p>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {item.contextPlays.map((play, index) => <MiniPlay key={index} play={play} />)}
                    <span className="text-2xl text-yellow-400 mx-1" title="Gatilho">→</span>
                    <MiniPlay play={item.triggerPlay} isTrigger />
                     <span className="text-2xl text-gray-400 mx-1" title="Sinal Enviado">🔔</span>
                     {item.resultPlay ? (
                        <MiniPlay play={item.resultPlay} isResult />
                     ) : (
                         <div className="w-12 h-10 flex items-center justify-center text-gray-500 bg-gray-900 rounded-md">?</div>
                     )}
                </div>
            </div>
        </div>
    );
}

const LiveSignalHistoryModal: React.FC<LiveSignalHistoryModalProps> = ({ isOpen, history, onClose }) => {
  const stats = useMemo(() => {
    const processed = history.filter(s => s.outcome !== 'Pending');
    const wins = processed.filter(s => s.outcome === 'Win').length;
    const losses = processed.length - wins;
    const winRate = processed.length > 0 ? (wins / processed.length) * 100 : 0;
    return { wins, losses, total: processed.length, winRate };
  }, [history]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold">Histórico de Sinais do Robô</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Assertividade" value={`${stats.winRate.toFixed(1)}%`} colorClass={stats.winRate > 50 ? 'text-green-400' : 'text-red-400'}/>
                <StatCard title="Sinais Totais" value={stats.total} />
                <StatCard title="Acertos (Win)" value={stats.wins} colorClass="text-green-400" />
                <StatCard title="Erros (Loss)" value={stats.losses} colorClass="text-red-400" />
            </div>

            <div className="space-y-4">
                {history.length > 0 ? (
                    history.map(item => <SignalHistoryCard key={item.id} item={item} />)
                ) : (
                    <p className="text-center text-gray-500 italic py-8">Nenhum sinal foi gerado pelo robô ainda.</p>
                )}
            </div>
        </div>
        
        <div className="p-4 border-t border-gray-700 text-right flex-shrink-0">
            <button
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-colors"
            >
                Fechar
            </button>
        </div>
      </div>
    </div>
  );
};

export default LiveSignalHistoryModal;