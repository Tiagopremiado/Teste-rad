import React from 'react';
import type { PinkPatternAnalysis, PlayWithId } from '../types';

const getPlayStyle = (multiplier: number): string => {
  if (multiplier >= 10) return 'bg-pink-500 text-white';
  if (multiplier >= 2) return 'bg-purple-500 text-white';
  return 'bg-cyan-500 text-white';
};

const MiniPlay: React.FC<{ play: PlayWithId }> = ({ play }) => (
    <div 
        className={`w-12 h-8 flex-shrink-0 rounded-md text-xs font-bold flex items-center justify-center ${getPlayStyle(play.multiplier)}`}
        title={`${play.multiplier.toFixed(2)}x às ${play.time}`}
    >
        {play.multiplier.toFixed(2)}x
    </div>
);

const CountdownCircle: React.FC<{ countdown: number, total: number, label: string }> = ({ countdown, total, label }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * (radius - 5);
    const progress = total > 0 ? (countdown / total) * 100 : 0;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="absolute w-full h-full" viewBox="0 0 120 120">
                <circle className="text-gray-700" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
                <circle
                    className="text-amber-400"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                />
            </svg>
            <div className="text-center">
                <span className="text-4xl font-bold text-white">{countdown}</span>
                <p className="text-xs text-gray-400">{label}</p>
            </div>
        </div>
    );
};


const PatternCard: React.FC<{
    title: string;
    description: string;
    stats: { label: string; value: string }[];
    patternState: PinkPatternAnalysis['doublePink'] | PinkPatternAnalysis['closeRepetition'];
    onViewHistory: () => void;
}> = ({ title, description, stats, patternState, onViewHistory }) => {
    const { isActive, isAlerting, triggerPlays, countdown, alertWindow, lastDistance, history } = patternState;

    let status = { text: "Aguardando Padrão", color: "bg-gray-600" };
    if (isAlerting) {
        status = { text: "ALERTA ATIVO", color: "bg-red-600 animate-pulse" };
    } else if (isActive) {
        status = { text: "Padrão Detectado", color: "bg-yellow-600" };
    }

    return (
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-grow w-full">
                <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-bold text-pink-300">{title}</h4>
                    <span className={`px-3 py-1 text-xs font-bold text-white rounded-full ${status.color}`}>{status.text}</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">{description}</p>
                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                    {stats.map(stat => (
                        <div key={stat.label} className="bg-gray-800 p-2 rounded-md">
                            <p className="text-xs text-gray-500">{stat.label}</p>
                            <p className="font-semibold text-white">{stat.value}</p>
                        </div>
                    ))}
                </div>
                 <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Gatilho do Padrão (últimas 2 rosas):</p>
                        <div className="flex items-center gap-2">
                            {isActive && triggerPlays.length >= 2 ? (
                                <>
                                    <MiniPlay play={triggerPlays[0]} />
                                    <div className="text-center text-gray-400 px-2">
                                        <span className="text-lg font-bold">{lastDistance}</span>
                                        <p className="text-xs -mt-1">rodadas</p>
                                    </div>
                                    <MiniPlay play={triggerPlays[1]} />
                                </>
                            ) : (
                                <p className="text-sm text-gray-600 italic">Nenhum gatilho detectado.</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onViewHistory}
                        disabled={!history || history.length === 0}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors disabled:bg-gray-700 disabled:opacity-50"
                    >
                        Ver Histórico ({history?.length ?? 0})
                    </button>
                 </div>
            </div>
            {isAlerting && (
                <div className="flex-shrink-0">
                    <CountdownCircle countdown={countdown} total={alertWindow.end - alertWindow.start + 1} label="Rodadas Restantes" />
                </div>
            )}
        </div>
    );
};


const PinkPatternAnalyzer: React.FC<{ 
    analysis: PinkPatternAnalysis,
    onViewHistory: (patternType: 'doublePink' | 'closeRepetition') => void
}> = ({ analysis, onViewHistory }) => {
    return (
        <div className="space-y-6">
            <PatternCard
                title="Padrão de Rosa Dupla"
                description="Quando duas rosas ocorrem consecutivamente (uma seguida da outra), uma terceira é esperada em breve."
                stats={[
                    { label: 'Janela do Alerta', value: '2-8 Rodadas' },
                    { label: 'Pico Provável', value: '~4ª Rodada' },
                    { label: 'Fonte', value: 'Análise de 150k+' },
                ]}
                patternState={analysis.doublePink}
                onViewHistory={() => onViewHistory('doublePink')}
            />
             <PatternCard
                title="Padrão de Repetição Próxima"
                description="Quando duas rosas ocorrem em até 7 rodadas de distância, o padrão de proximidade tende a se repetir."
                stats={[
                    { label: 'Janela do Alerta', value: '1-7 Rodadas' },
                    { label: 'Pico Provável', value: '~3ª-4ª Rodada' },
                    { label: 'Fonte', value: 'Análise de 150k+' },
                ]}
                patternState={analysis.closeRepetition}
                onViewHistory={() => onViewHistory('closeRepetition')}
            />
        </div>
    );
};

export default PinkPatternAnalyzer;