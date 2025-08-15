import React, { useState, useMemo } from 'react';
import type { Analysis, PlayWithId, SelectedHouseDetails, HouseOccurrence, HouseRanking, HighlightedStat, GrandePagueAnalysis, GrandePaguePeriod, PinkPressureAnalysis, PinkPauseRiskAnalysis, PinkPause, PurplePressureAnalysis } from '../types';
import HouseDetailModal from './HouseDetailModal';

type StatsSummaryProps = {
  summary: Required<Analysis>['summary'];
  hotSpots: Required<Analysis>['hotSpots'];
  grandePagueAnalysis?: GrandePagueAnalysis;
  playsWithIds: PlayWithId[];
  highlightedStat: HighlightedStat;
  onStatHighlight: (stat: HighlightedStat) => void;
  onShowPinkHistory: () => void;
  onAnalyzeGrandePagueStrategy: (period: GrandePaguePeriod) => void;
  isPremium: boolean;
  showPremiumModal: () => void;
  onHighlightBlock: (plays: PlayWithId[]) => void;
  pinkPressureAnalysis: PinkPressureAnalysis | null;
  purplePressureAnalysis: PurplePressureAnalysis | null;
  pinkPauseRisk: PinkPauseRiskAnalysis | null;
  pinkPauseHistory?: PinkPause[] | null;
};

const specialHouses = new Set([2, 4, 5, 8, 9, 11, 13, 15, 17, 20, 23, 25]);

const StatCard: React.FC<{ title: React.ReactNode; value: React.ReactNode; colorClass?: string; borderColorClass?: string; tooltip?: string; className?: string; isHighlighted?: boolean; onClick?: () => void; }> = ({ title, value, colorClass = 'text-white', borderColorClass = 'border-transparent', tooltip, className = '', isHighlighted = false, onClick }) => {
    const baseClasses = "bg-gray-900/50 p-4 rounded-xl shadow-lg flex flex-col justify-start text-left h-full transition-all duration-200 border-2";
    const highlightClasses = isHighlighted ? 'ring-2 ring-amber-400' : '';
    const clickableClasses = onClick ? 'cursor-pointer hover:bg-gray-800/50' : '';

    const content = (
        <div className={`${baseClasses} ${highlightClasses} ${clickableClasses} ${borderColorClass} ${className}`}>
            <h3 className="text-sm font-medium text-gray-400">{title}</h3>
            <div className={`text-3xl font-bold mt-2 ${colorClass}`}>{value}</div>
        </div>
    );

    return onClick ? <button onClick={onClick} className="w-full h-full text-left" title={tooltip}>{content}</button> : <div title={tooltip}>{content}</div>;
};
  
const getBarColor = (count: number): string => {
  if (count >= 5) return 'bg-amber-400';
  if (count === 4) return 'bg-yellow-500';
  if (count === 3) return 'bg-yellow-600';
  if (count === 2) return 'bg-amber-700';
  if (count === 1) return 'bg-yellow-800';
  return 'bg-gray-700';
};

const RankingItem: React.FC<{ item: HouseRanking; maxCount: number; onClick: (house: number) => void; }> = ({ item, maxCount, onClick }) => {
    const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
    const barColor = getBarColor(item.count);
    const isSpecial = specialHouses.has(item.house);

    return (
        <button onClick={() => onClick(item.house)} className={`p-3 rounded-lg flex flex-col justify-between text-left w-full transition-colors hover:bg-gray-700/50 ${isSpecial ? 'bg-yellow-900/40 border border-yellow-700/60' : 'bg-gray-900'}`} title={`Casa ${item.house}: ${item.count} repetições${isSpecial ? ' (Casa Especial)' : ''}`}>
            <div className="flex justify-between items-baseline mb-1">
                <span className={`font-bold text-sm ${isSpecial ? 'text-yellow-400' : 'text-white'}`}>Casa {item.house}</span>
                <span className="font-semibold text-base text-gray-300">{`${item.count}x`}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                    className={`${barColor} h-1.5 rounded-full transition-all duration-500 ease-out`} 
                    style={{ width: `${barWidth}%` }}
                />
            </div>
        </button>
    );
};

const PinkPressureAnalyzer: React.FC<{ analysis: PinkPressureAnalysis | null }> = ({ analysis }) => {
    if (!analysis) {
        return (
            <div className="bg-black/30 backdrop-blur-sm p-4 rounded-lg text-center">
                <p className="text-sm text-gray-500">Análise de Pressão indisponível. Aguardando dados...</p>
            </div>
        );
    }

    const { level, percentage, factors } = analysis;
    const levelConfig = {
        'Baixa': { color: 'bg-cyan-500', text: 'Pressão Baixa', textColor: 'text-cyan-300' },
        'Construindo': { color: 'bg-yellow-500', text: 'Construindo Pressão', textColor: 'text-yellow-300' },
        'Eminente': { color: 'bg-orange-500', text: 'Pressão Eminente', textColor: 'text-orange-300' },
        'CRÍTICA': { color: 'bg-red-600', text: 'PRESSÃO CRÍTICA!', textColor: 'text-red-300' },
    };
    const config = levelConfig[level];

    return (
        <div className={`bg-gray-900/50 p-4 rounded-lg border-2 ${level === 'CRÍTICA' ? 'border-red-500/80 animate-pulse-critical' : 'border-gray-700/50'}`}>
            <h4 className="font-semibold text-gray-300 mb-3 text-center">Analisador de Pressão de Rosas</h4>
            <div className="w-full bg-gray-700/50 rounded-full h-6 border border-gray-600 relative overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${config.color} flex items-center justify-center`}
                    style={{ width: `${percentage}%` }}
                >
                </div>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">{config.text} ({percentage.toFixed(0)}%)</span>
            </div>
            {factors.length > 0 && (
                <div className="mt-3 text-center">
                    <p className="text-xs text-gray-400">Fatores: {factors.join(' / ')}</p>
                </div>
            )}
        </div>
    );
};

const PurplePressureAnalyzer: React.FC<{ analysis: PurplePressureAnalysis | null }> = ({ analysis }) => {
    if (!analysis) {
        return <div className="bg-black/30 p-4 rounded-lg text-center"><p className="text-sm text-gray-500">Análise de Pressão Roxa indisponível.</p></div>;
    }
    const { level, percentage, factors } = analysis;
    const levelConfig = {
        'Baixa': { color: 'bg-cyan-500', text: 'Pressão Baixa', textColor: 'text-cyan-300' },
        'Construindo': { color: 'bg-yellow-500', text: 'Construindo Pressão', textColor: 'text-yellow-300' },
        'ALTA': { color: 'bg-orange-500', text: 'Pressão ALTA', textColor: 'text-orange-300' },
        'CRÍTICA': { color: 'bg-purple-600', text: 'PRESSÃO CRÍTICA!', textColor: 'text-purple-300' },
    };
    const config = levelConfig[level];
    return (
        <div className={`bg-gray-900/50 p-4 rounded-lg border-2 ${level === 'CRÍTICA' ? 'border-purple-500/80 animate-pulse-critical-purple' : 'border-gray-700/50'}`}>
            <h4 className="font-semibold text-gray-300 mb-3 text-center">Analisador de Pressão Roxa</h4>
            <div className="w-full bg-gray-700/50 rounded-full h-6 border border-gray-600 relative overflow-hidden">
                 <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${config.color}`}
                    style={{ width: `${percentage}%` }}
                >
                </div>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">{config.text} ({percentage.toFixed(0)}%)</span>
            </div>
             {factors.length > 0 && (
                <div className="mt-3 text-center">
                    <p className="text-xs text-gray-400">Fatores: {factors.join(' / ')}</p>
                </div>
            )}
        </div>
    );
};

const PinkPauseRiskAnalyzer: React.FC<{ analysis: PinkPauseRiskAnalysis | null }> = ({ analysis }) => {
    if (!analysis) {
        return <div className="bg-black/30 p-4 rounded-lg text-center"><p className="text-sm text-gray-500">Análise de Risco de Pausa indisponível.</p></div>;
    }
    const { level, percentage, factors } = analysis;
    const levelConfig = {
        'Baixo': { color: 'bg-green-500', text: 'Risco Baixo', textColor: 'text-green-300' },
        'Médio': { color: 'bg-yellow-500', text: 'Risco Médio', textColor: 'text-yellow-300' },
        'Alto': { color: 'bg-orange-500', text: 'Risco Alto', textColor: 'text-orange-300' },
        'CRÍTICO': { color: 'bg-red-600', text: 'RISCO CRÍTICO!', textColor: 'text-red-300' },
    };
    const config = levelConfig[level];
    return (
        <div className={`bg-gray-900/50 p-4 rounded-lg border-2 ${level === 'CRÍTICO' ? 'border-red-500/80 animate-pulse-critical' : 'border-gray-700/50'}`}>
            <h4 className="font-semibold text-gray-300 mb-3 text-center">Analisador de Risco de Pausa</h4>
            <div className="w-full bg-gray-700/50 rounded-full h-6 border border-gray-600 relative overflow-hidden">
                 <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${config.color}`}
                    style={{ width: `${percentage}%` }}
                >
                </div>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">{config.text} ({percentage.toFixed(0)}%)</span>
            </div>
             {factors.length > 0 && (
                <div className="mt-3 text-center">
                    <p className="text-xs text-gray-400">Fatores: {factors.join(' / ')}</p>
                </div>
            )}
        </div>
    );
};


const StatsSummary: React.FC<StatsSummaryProps> = ({
  summary,
  hotSpots,
  grandePagueAnalysis,
  playsWithIds,
  highlightedStat,
  onStatHighlight,
  onShowPinkHistory,
  onAnalyzeGrandePagueStrategy,
  isPremium,
  showPremiumModal,
  onHighlightBlock,
  pinkPressureAnalysis,
  purplePressureAnalysis,
  pinkPauseRisk,
  pinkPauseHistory,
}) => {
    const [houseDetails, setHouseDetails] = useState<SelectedHouseDetails | null>(null);

    const handleHouseClick = (houseNumber: number) => {
        const pinkIndices: number[] = [];
        playsWithIds.forEach((play, index) => {
            if (play.multiplier >= 10) {
                pinkIndices.push(index);
            }
        });

        const occurrences: HouseOccurrence[] = [];
        for (let i = 1; i < pinkIndices.length; i++) {
            const interval = pinkIndices[i] - pinkIndices[i - 1];
            if (interval === houseNumber) {
                const triggerPlay = playsWithIds[pinkIndices[i]];
                const precursorPlays = playsWithIds.slice(Math.max(0, pinkIndices[i] - 25), pinkIndices[i]);
                const postcursorPlays = playsWithIds.slice(pinkIndices[i] + 1, pinkIndices[i] + 26);
                occurrences.push({ triggerPlay, precursorPlays, postcursorPlays });
            }
        }
        setHouseDetails({ houseNumber, occurrences });
    };
    
    const handleGrandePagueClick = () => {
        if (!isPremium) {
            showPremiumModal();
            return;
        }
        if (grandePagueAnalysis && grandePagueAnalysis.periods.length > 0) {
            // Analyze the most recent period
            onAnalyzeGrandePagueStrategy(grandePagueAnalysis.periods[grandePagueAnalysis.periods.length - 1]);
        }
    };

    return (
        <div className="space-y-6">
            <HouseDetailModal details={houseDetails} onClose={() => setHouseDetails(null)} />
            
            {/* General Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                <StatCard title="Jogadas desde Rosa" value={summary.playsSinceLastPink} colorClass="text-pink-400" isHighlighted={highlightedStat === 'playsSinceLastPink'} onClick={() => onStatHighlight('playsSinceLastPink')} tooltip="Clique para destacar as jogadas desde a última rosa" />
                <StatCard title="Total de Rosas" value={summary.pinkCount} colorClass="text-pink-400" isHighlighted={highlightedStat === 'allPinks'} onClick={onShowPinkHistory} tooltip="Clique para ver o histórico de todas as rosas" />
                <StatCard title="Média Intervalo Rosa" value={`${summary.averagePinkInterval.toFixed(1)}`} colorClass="text-gray-300" />
                <StatCard title="Média Multiplicador Roxo" value={`${summary.averagePurpleMultiplier.toFixed(2)}x`} colorClass="text-purple-400" />
            </div>

            {/* High Multiplier & Special Events Stats */}
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                <StatCard title="Rosas desde 50x" value={summary.pinksSinceLast50x} colorClass="text-yellow-400" isHighlighted={highlightedStat === 'pinksSince50x'} onClick={() => onStatHighlight('pinksSince50x')} tooltip="Rosas desde a última vela de 50x+" />
                <StatCard title="Rosas desde 100x" value={summary.pinksSinceLast100x} colorClass="text-red-400" isHighlighted={highlightedStat === 'pinksSince100x'} onClick={() => onStatHighlight('pinksSince100x')} tooltip="Rosas desde a última vela de 100x+" />
                <StatCard title="Última Rosa" value={summary.lastPinkMultiplier ? `${summary.lastPinkMultiplier.toFixed(2)}x` : '-'} colorClass="text-pink-300" />
                <StatCard 
                    title={<span className="flex items-center gap-1">"Grande Pague" {!isPremium && <span className="text-amber-400 -mt-1" title="Premium">👑</span>}</span>} 
                    value={grandePagueAnalysis?.occurrencesToday ?? 0} 
                    colorClass="text-yellow-300"
                    onClick={handleGrandePagueClick}
                    tooltip="Clique para analisar a estratégia para o último período"
                />
            </div>
            
            {/* Analyzers */}
             <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <PinkPressureAnalyzer analysis={pinkPressureAnalysis} />
                <PurplePressureAnalyzer analysis={purplePressureAnalysis} />
                <PinkPauseRiskAnalyzer analysis={pinkPauseRisk} />
            </div>

            {/* House Ranking */}
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                <h4 className="font-semibold text-gray-300 mb-2 text-center">Ranking de Casas</h4>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {hotSpots.houseRanking.map((item) => (
                      <RankingItem 
                        key={item.house} 
                        item={item} 
                        maxCount={hotSpots.houseRanking[0]?.count || 1} 
                        onClick={() => handleHouseClick(item.house)} 
                      />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StatsSummary;