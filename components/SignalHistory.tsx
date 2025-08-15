

import React, { useState } from 'react';
import type { Signal } from '../types';

const SignalItem: React.FC<{ signal: Signal }> = ({ signal }) => {
    const isHit = signal.outcome === 'Win';
    const outcomeColor = isHit ? 'text-green-400' : 'text-red-400';
    const borderColor = isHit ? 'border-green-800' : 'border-red-800';

    const tempConfig = {
        'Quente': { style: 'text-pink-400', icon: '🔥' },
        'Morno': { style: 'text-purple-400', icon: '💧' },
        'Grande Pague': { style: 'text-yellow-400', icon: '💲' },
    };
    const config = tempConfig[signal.prediction.temperature] || { style: 'text-gray-400', icon: '⚪' };

    return (
        <div className={`bg-gray-800 p-3 rounded-lg border-l-4 ${borderColor} grid grid-cols-2 md:grid-cols-4 gap-2 text-sm`}>
            <div className="text-center md:text-left">
                <p className="text-xs text-gray-400">Horário</p>
                <p className="font-semibold">{new Date(signal.timestamp).toLocaleTimeString('pt-BR')}</p>
            </div>
            <div className="text-center md:text-left">
                <p className="text-xs text-gray-400">Sinal</p>
                <p className="font-semibold">{signal.prediction.predictedMinute} / {signal.prediction.predictedHouse}</p>
            </div>
            <div className="text-center md:text-left">
                 <p className="text-xs text-gray-400">Tipo</p>
                <p className={`font-semibold ${config.style}`}>
                    {config.icon} {signal.prediction.temperature}
                </p>
            </div>
            <div className="text-center md:text-left">
                <p className="text-xs text-gray-400">Resultado</p>
                <p className={`font-bold ${outcomeColor}`}>{signal.outcome}</p>
            </div>
        </div>
    )
};


const SignalHistory: React.FC<{ signals: Signal[] }> = ({ signals }) => {
    const [showAll, setShowAll] = useState(false);

    if (signals.length === 0) {
        return null;
    }

    const displayedSignals = showAll ? signals : signals.slice(0, 5);
    
    return (
        <div className="mt-6">
            <h4 className="text-lg font-bold text-gray-300 mb-3">Histórico de Sinais</h4>
            <div className="space-y-2">
                {displayedSignals.map(signal => <SignalItem key={signal.prediction.id} signal={signal} />)}
            </div>

            {signals.length > 5 && (
                <div className="text-center mt-4">
                    <button onClick={() => setShowAll(prev => !prev)} className="text-indigo-400 text-sm hover:underline">
                        {showAll ? 'Mostrar menos' : `Mostrar todos (${signals.length})`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SignalHistory;