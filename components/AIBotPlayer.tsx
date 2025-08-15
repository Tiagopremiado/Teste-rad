import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Analysis, Play, AIBotHistoryItem, BankrollManagement, TrainingStatus, LearnedPatterns, WinningPatternResult, LosingPatternResult, PinkChaseConfig, HunterMode, PinkPauseRiskAnalysis, Notification, PurplePressureAnalysis, PinkPressureAnalysis, PinkPatternAnalysis, IATacticWeights, ConfidenceReport, RoundResult, AILearningProgress } from '../types';
import AIBotHistoryModal from './AIBotHistoryModal';
import AITacticsPanel from './AITacticsPanel';
import { useCopilotSuggestions } from '../hooks/useCopilotSuggestions';
import { useAIBotLogic, BotState } from '../hooks/useAIBotLogic';

interface AIBotPlayerProps {
    analysis: Partial<Analysis>;
    localAnalysis: Partial<Analysis> | null;
    historicalData: Play[];
    isPremium: boolean;
    showPremiumModal: () => void;
    aiBotHistory: AIBotHistoryItem[];
    bankrollManagement: {
        state: BankrollManagement;
        update: (updates: Partial<Omit<BankrollManagement, 'history' | 'currentBankroll'>>) => void;
        reset: () => void;
        addTransaction: (type: 'Win' | 'Loss', amount: number) => void;
        addFunds: (amount: number) => void;
    };
    isTraining: boolean;
    trainingStatus: TrainingStatus | null;
    handleHolisticTraining: (file: File) => void;
    learnedPatterns?: LearnedPatterns;
    handleLearnedPatternsUpload: (file: File) => void;
    pinkPatternAnalysis: PinkPatternAnalysis | null | undefined;
    onOpenManagementModal: () => void;
    pinkPressureAnalysis: PinkPressureAnalysis | null;
    purplePressureAnalysis: PurplePressureAnalysis | null;
    pinkPauseRisk: PinkPauseRiskAnalysis | null;
    addAIBotHistoryItem: (item: Omit<AIBotHistoryItem, 'id' | 'timestamp'>) => void;
    updateAIBotLifetimeStats: (result: { profit: number; }) => void;
    isPatternHunterModeActive: boolean;
    winningPatterns: WinningPatternResult[];
    losingPatterns: LosingPatternResult[];
    isHouseHunterModeActive: boolean;
    currentTargetHouse: number | null;
    pinkChaseConfig: PinkChaseConfig;
    hunterMode: HunterMode;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    onSessionEnd: (reason: { type: 'win' | 'loss'; profitOrLoss: number; nextBestTimeSuggestion?: string | undefined; }) => void;
    confidenceReport: ConfidenceReport | null;
    coPilotState: BotState;
}

const SMART_PRESET_WEIGHTS: IATacticWeights = {
    hotMarket: 85,
    hotSignalHunter: 80,
    technicalAnalysis: 75,
    ipvHunter: 90,
    pinkPatternProximity: 95,
    patternHunter: 60,
    houseHunter: 50,
    extremeMultiplierProximity: 70,
    shortTermVolatility: 40,
    automaticTriggers: 65,
};

const MIN_BET = 1.00;
const MAX_BET = 700.00;


const getPlayStyle = (multiplier: number): string => {
  if (multiplier >= 10) return 'bg-pink-500';
  if (multiplier >= 2) return 'bg-purple-500';
  return 'bg-cyan-500';
};

const FastMultiplierDisplay: React.FC<{ play: Play | null; result?: RoundResult | null }> = ({ play, result }) => {
    if (!play) return <div className="z-10 text-4xl md:text-5xl font-bold text-gray-600">- . -- x</div>;
    const colorClass = play.multiplier >= 10 ? 'text-pink-400' : play.multiplier >= 2 ? 'text-purple-400' : 'text-cyan-400';

    let resultText = null;
    if (result) {
        if (result.profit >= 0) {
            resultText = <p key={result.play.time} className="text-xs font-bold text-green-400 animate-fade-in">🤑 GREEN! +R$ {result.profit.toFixed(2)}</p>;
        } else {
            resultText = <p key={result.play.time} className="text-xs font-bold text-red-400 animate-fade-in">🔥 RED! Foco pra recuperar!</p>;
        }
    }

    return (
        <div className="z-10 flex flex-col items-center justify-center">
            <div className={`text-4xl md:text-5xl font-bold transition-colors duration-300 ${colorClass}`} style={{ textShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}>
                {play.multiplier.toFixed(2)}x
            </div>
            {resultText}
        </div>
    );
};


const BankrollGauge: React.FC<{ current: number; initial: number; stopLoss: number; stopWin: number; }> = ({ current, initial, stopLoss, stopWin }) => {
    const totalRange = stopWin - stopLoss;
    const progress = current - stopLoss;
    const progressPercent = totalRange > 0 ? Math.max(0, Math.min(100, (progress / totalRange) * 100)) : 50;
    
    const initialMarkerPercent = totalRange > 0 ? ((initial - stopLoss) / totalRange) * 100 : 50;

    const profit = current - initial;
    const profitPercent = initial > 0 ? (profit / initial) * 100 : 0;
    const profitColor = profit >= 0 ? 'text-green-400' : 'text-red-400';

    return (
        <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700/50">
            <div className="flex justify-between items-baseline mb-1">
                 <h4 className="text-xs font-semibold text-gray-300">Banca</h4>
                 <div className="text-right">
                    <p className="font-bold text-base text-white">R$ {current.toFixed(2)}</p>
                    <p className={`text-[11px] font-semibold ${profitColor}`}>{profit >= 0 ? '+' : ''}{profit.toFixed(2)} ({profitPercent.toFixed(1)}%)</p>
                 </div>
            </div>
            <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden border border-black/20">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 via-yellow-500 to-green-500" style={{ width: '100%' }}></div>
                <div className="absolute top-0 left-0 h-full bg-gray-900 rounded-r-lg" style={{ width: `${progressPercent}%`, transition: 'width 0.5s ease-out' }}></div>
                <div className="absolute top-0 h-full w-0.5 bg-white/50" style={{ left: `${initialMarkerPercent}%` }} title={`Banca Inicial: R$ ${initial.toFixed(2)}`}></div>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5 px-1">
                <span>{stopLoss.toFixed(0)}</span>
                <span>{stopWin.toFixed(0)}</span>
            </div>
        </div>
    );
};

const ConfidenceGauge: React.FC<{ score: number }> = ({ score }) => {
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    let colorClass = 'stroke-cyan-400';
    if (score > 80) colorClass = 'stroke-green-400';
    else if (score > 65) colorClass = 'stroke-amber-400';
    else if (score < 40) colorClass = 'stroke-red-400';

    return (
        <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center h-full">
             <h4 className="text-[11px] font-semibold text-gray-300 mb-0.5">Confiança</h4>
            <div className="relative w-12 h-12">
                <svg className="w-full h-full" viewBox="0 0 60 60">
                    <circle className="text-gray-700" strokeWidth="6" stroke="currentColor" fill="transparent" r={radius} cx="30" cy="30" />
                    <circle
                        className={`transition-all duration-500 ease-out ${colorClass}`}
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="30"
                        cy="30"
                        transform="rotate(-90 30 30)"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{score.toFixed(0)}</span>
                </div>
            </div>
        </div>
    );
};

const PressureGauge: React.FC<{ analysis: PinkPressureAnalysis | PurplePressureAnalysis | null; title: string; color: 'pink' | 'purple' }> = ({ analysis, title, color }) => {
    const { level, percentage } = analysis || { level: 'Baixa', percentage: 0 };
    const colorConfig = {
        pink: { CRÍTICA: 'bg-red-600', Eminente: 'bg-orange-500', Construindo: 'bg-yellow-500', Baixa: 'bg-cyan-500' },
        purple: { CRÍTICA: 'bg-purple-600', ALTA: 'bg-orange-500', Construindo: 'bg-yellow-500', Baixa: 'bg-cyan-500' },
    };
    const barColor = colorConfig[color][level as keyof typeof colorConfig.pink] || 'bg-gray-500';
    return (
        <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700/50 w-full h-full flex flex-col justify-center">
            <h4 className="text-[11px] font-semibold text-gray-300 mb-1">{title}</h4>
            <div className="w-full bg-gray-700 rounded-full h-3.5 relative overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`} style={{ width: `${percentage}%` }}></div>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow-md">{level} ({percentage.toFixed(0)}%)</span>
            </div>
        </div>
    );
};

const AnnunciatorPanel: React.FC<{
    isSmartPresetActive: boolean;
    isPinkPatternAlerting: boolean;
}> = ({ isSmartPresetActive, isPinkPatternAlerting }) => {
    return (
         <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700/50 h-full flex flex-col justify-center">
            <h4 className="text-[11px] font-semibold text-gray-300 mb-1 text-center">Anunciadores</h4>
            <div className="grid grid-cols-2 gap-1">
                <div className={`p-1 rounded text-center transition-all ${isSmartPresetActive ? 'bg-cyan-900/80 animate-pulse-cyan' : 'bg-gray-900/50'}`}>
                    <p className={`font-bold text-[9px] leading-tight ${isSmartPresetActive ? 'text-cyan-300' : 'text-gray-500'}`}>ESTRATÉGIA OTIMIZADA</p>
                </div>
                 <div className={`p-1 rounded text-center transition-all ${isPinkPatternAlerting ? 'bg-red-900/80 animate-pulse-critical' : 'bg-gray-900/50'}`}>
                    <p className={`font-bold text-[9px] leading-tight ${isPinkPatternAlerting ? 'text-red-300' : 'text-gray-500'}`}>ALERTA PADRÃO ROSA</p>
                </div>
            </div>
         </div>
    );
};

const BetCard: React.FC<{
    title: string;
    bet: { amount: number; target: number };
    isBetting: boolean;
}> = ({ title, bet, isBetting }) => {
    // As per user request, solid green/orange background with white text, similar to the game.
    const colorClasses = isBetting
        ? 'bg-orange-500' // Solid orange
        : 'bg-green-500';  // Solid green

    const statusText = isBetting ? 'APOSTA ATIVA' : 'AGUARDANDO SINAL';
    
    return (
        <div className={`p-3 rounded-lg ${colorClasses} text-white transition-colors duration-500 flex flex-col justify-center text-center h-24 ${isBetting ? 'animate-pulse' : ''}`}>
            <p className="text-xs font-bold uppercase">{statusText}</p>
            <p className="text-sm text-white/80">{title}</p>
            {bet.amount > 0 ? (
                <p className="text-xl font-bold text-white mt-1">R$ {bet.amount.toFixed(2)} @ {bet.target.toFixed(2)}x</p>
            ) : (
                <p className="text-xl font-bold text-white/50 mt-1">---</p>
            )}
        </div>
    );
};


const AIBotPlayer: React.FC<AIBotPlayerProps> = (props) => {
  const { 
    analysis, localAnalysis, historicalData, isPremium, showPremiumModal, aiBotHistory, 
    bankrollManagement, learnedPatterns, 
    pinkPatternAnalysis, onOpenManagementModal, pinkPressureAnalysis, purplePressureAnalysis, pinkPauseRisk,
    coPilotState, confidenceReport
  } = props;

  const { state: bankrollState } = bankrollManagement;
  const { 
    isActive, initialBankroll, currentBankroll, stopWinPercentage, stopLossPercentage,
    iaTacticWeights, isSmartPresetActive
  } = bankrollState;
  
  const [isPaused, setIsPaused] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTacticsCollapsed, setIsTacticsCollapsed] = useState(true);

  
  const { status, reason, plan, lastRoundResult, animationKey, apostaFuturaWin, apostaFuturaLoss } = coPilotState;
  
  const { suggestions, handleSuggestionAction } = useCopilotSuggestions({
    analysis, localAnalysis, bankrollState,
    updateBankroll: bankrollManagement.update,
    pinkPauseRisk,
    pinkPressureAnalysis,
    pinkPatternAnalysis,
  });

  const latestPlay = useMemo(() => historicalData.length > 0 ? historicalData[historicalData.length - 1] : null, [historicalData]);
  const isLastPlayFromBot = useMemo(() => {
      if (!latestPlay || !lastRoundResult?.play) return false;
      return latestPlay.time === lastRoundResult.play.time && latestPlay.multiplier === lastRoundResult.play.multiplier;
  }, [latestPlay, lastRoundResult]);

  const recentHistory = useMemo(() => historicalData.slice(-12).reverse(), [historicalData]);
  const isBetting = (status.startsWith('APOSTANDO') || status.startsWith('CAÇANDO') || status.startsWith('RECUPERANDO BANCA') || status.startsWith('RECUPERANDO (CAÇA)')) && !isPaused;
  const isPinkPatternAlerting = pinkPatternAnalysis?.doublePink.isAlerting || pinkPatternAnalysis?.closeRepetition.isAlerting;
  
  const handleSmartPresetClick = () => {
    if (isSmartPresetActive) {
        bankrollManagement.update({ isSmartPresetActive: false });
    } else {
        bankrollManagement.update({
            isSmartPresetActive: true, managementType: 'ia', isDualStrategyActive: true,
            maxBlueStreakStop: 3, pinkHuntMaxLosses: 3, iaProfile: 'Moderado',
            iaTacticWeights: SMART_PRESET_WEIGHTS,
        });
    }
  };

  const opportunityStatus = useMemo(() => {
    const { summary } = localAnalysis ?? {};
    if (!summary) return null;

    const isFavorable = summary.marketState === 'MUITO_QUENTE' || pinkPressureAnalysis?.level === 'CRÍTICA' || pinkPatternAnalysis?.doublePink.isAlerting || pinkPatternAnalysis?.closeRepetition.isAlerting;
    if (isFavorable) {
        return {
            type: 'favorable',
            icon: '⚡️',
            message: 'Janela de Oportunidade! Seja rápido para bater a meta.',
            className: 'mb-4 p-3 rounded-lg flex items-center justify-center gap-3 bg-cyan-900/80 border border-cyan-500 text-cyan-200 animate-pulse-cyan',
        };
    }

    const isUnfavorable = summary.marketState === 'FRIO' || pinkPauseRisk?.level === 'Alto' || pinkPauseRisk?.level === 'CRÍTICO';
    if (isUnfavorable) {
        return {
            type: 'unfavorable',
            icon: '🛡️',
            message: 'Mercado instável. A IA não recomenda iniciar a sessão agora.',
            className: 'mb-4 p-3 rounded-lg flex items-center justify-center gap-3 bg-yellow-900/80 border border-yellow-600 text-yellow-200',
        };
    }

    return null; // Neutral state, show nothing.
  }, [localAnalysis, pinkPressureAnalysis, pinkPauseRisk, pinkPatternAnalysis]);


  if (!isActive) {
     return (
        <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-700/50 animate-fade-in text-center">
            <h3 className="text-xl font-bold text-white mb-1 flex items-center justify-center gap-3"><span className="text-2xl">🤖</span> Co-Piloto IA & Banca</h3>
            <p className="text-sm text-gray-400 mb-4">A IA gerenciará suas apostas com base em sua estratégia.</p>
             {opportunityStatus && (
                <div className={opportunityStatus.className}>
                    <span className="text-xl">{opportunityStatus.icon}</span>
                    <p className="font-semibold text-sm">{opportunityStatus.message}</p>
                </div>
            )}
            <button onClick={isPremium ? onOpenManagementModal : showPremiumModal} className="bg-amber-600 hover:bg-amber-700 text-black font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2">
                Configurar e Iniciar Sessão {!isPremium && '👑'}
            </button>
      </div>
    );
  }

  const optimizeButtonClass = isSmartPresetActive 
    ? "bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-2 rounded-lg transition-colors h-full flex items-center justify-center animate-pulse-cyan ring-2 ring-cyan-400"
    : "bg-gray-700 hover:bg-gray-600 text-gray-400 font-bold py-2 rounded-lg transition-colors h-full flex items-center justify-center";

  const displayPlan = isBetting 
    ? { bet1: plan.bet1, bet2: plan.bet2 } 
    : { bet1: apostaFuturaLoss.a1, bet2: apostaFuturaLoss.a2 };
    
  const statusText = isBetting ? 'ENTRADA CONFIRMADA!' : 'ANALISANDO MERCADO';
  const statusTextColor = isBetting ? 'text-orange-300' : 'text-green-300';


  return (
    <>
        <AIBotHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} history={aiBotHistory} bankrollState={bankrollManagement.state} />
        <div className="bg-gray-900 rounded-xl p-2 md:p-3 shadow-2xl border border-gray-800/50 space-y-3 font-mono">
            
             {isPaused ? (
                <div className="bg-yellow-900/50 border-2 border-yellow-500 rounded-lg p-4 text-center">
                    <h4 className="text-sm font-bold text-yellow-200 uppercase tracking-wider">ORDEM DO CO-PILOTO</h4>
                    <div className="flex items-center justify-center gap-4 my-3">
                        <span className="text-5xl">⏸️</span>
                        <p className="text-2xl font-bold text-white">EM ESPERA</p>
                    </div>
                    <p className="text-gray-300">Aperte "Continuar" para que a IA volte a operar.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="text-center">
                        <h4 className={`text-sm font-bold uppercase tracking-wider ${statusTextColor}`}>{statusText}</h4>
                        <p className="text-gray-300 text-xs truncate" title={reason}>{reason}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <BetCard title="Aposta 1 (Segurança)" bet={displayPlan.bet1} isBetting={isBetting} />
                        <BetCard title="Aposta 2 (Lucro)" bet={displayPlan.bet2} isBetting={isBetting} />
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Coluna 1: Zona de Voo (HUD & Histórico) */}
                 <div className="space-y-2">
                    <div className="bg-gray-900/50 p-2 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center">
                        <h4 className="text-[11px] font-semibold text-gray-400">ÚLTIMA RODADA</h4>
                        <div className="relative h-20 bg-black rounded-lg overflow-hidden flex items-center justify-center border border-gray-700 w-full bg-radial-rays">
                           <div key={animationKey} className="absolute inset-0 pointer-events-none">
                               <div className="absolute top-1/2 left-0 -translate-y-1/2 animate-fly-up-and-across">
                                   <span className="text-4xl" style={{ textShadow: '0 0 10px rgba(239, 68, 68, 0.7)'}}>✈️</span>
                               </div>
                           </div>
                          <FastMultiplierDisplay play={latestPlay} result={isLastPlayFromBot ? lastRoundResult : null} />
                        </div>
                        {isLastPlayFromBot && lastRoundResult && (
                             <div className="grid grid-cols-2 gap-2 mt-1 text-center w-full animate-fade-in">
                                <div><p className="text-[10px] text-gray-400">APOSTA 1</p><p className={`text-xs font-bold ${lastRoundResult.result.bet1?.didWin ? 'text-green-400' : 'text-red-400'}`}>{lastRoundResult.result.bet1 ? (lastRoundResult.result.bet1.didWin ? 'WIN' : 'LOSS') : 'N/A'}</p></div>
                                <div><p className="text-[10px] text-gray-400">APOSTA 2</p><p className={`text-xs font-bold ${lastRoundResult.result.bet2?.didWin ? 'text-green-400' : 'text-red-400'}`}>{lastRoundResult.result.bet2 ? (lastRoundResult.result.bet2.didWin ? 'WIN' : 'LOSS') : 'N/A'}</p></div>
                            </div>
                        )}
                    </div>
                    <div className="bg-black/30 p-1 rounded-lg overflow-hidden">
                        <div className="flex space-x-1 overflow-x-auto pb-1 -mb-1">
                            {recentHistory.map((play, index) => (
                                <div key={`${play.time}-${index}`} className={`flex-shrink-0 w-10 text-center px-1 py-0.5 text-[10px] font-bold rounded ${getPlayStyle(play.multiplier)}`}>
                                    {play.multiplier.toFixed(2)}x
                                </div>
                            ))}
                        </div>
                    </div>
                </div>


                {/* Coluna 2: Instrumentos */}
                <div className="space-y-2">
                    <BankrollGauge current={currentBankroll} initial={initialBankroll} stopLoss={initialBankroll * (1 - stopLossPercentage / 100)} stopWin={initialBankroll * (1 + stopWinPercentage / 100)} />
                    <div className="grid grid-cols-2 gap-2">
                        <PressureGauge analysis={pinkPressureAnalysis} title="Pressão Rosas" color="pink" />
                        <ConfidenceGauge score={confidenceReport?.finalScore ?? 0} />
                        <PressureGauge analysis={purplePressureAnalysis} title="Pressão Roxos" color="purple" />
                        <AnnunciatorPanel isSmartPresetActive={!!isSmartPresetActive} isPinkPatternAlerting={isPinkPatternAlerting ?? false} />
                    </div>
                </div>
            </div>

            {/* Console de Controle */}
            <div className="grid grid-cols-2 items-center gap-2 pt-2 border-t border-gray-700/50">
                <button onClick={() => setIsPaused(p => !p)} className={`text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${isPaused ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-black'}`}>
                    {isPaused ? '▶️ CONTINUAR' : '⏸️ PAUSAR'}
                </button>
                <button onClick={onOpenManagementModal} className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg transition-colors">
                    GERENCIAR SESSÃO
                </button>
                <button onClick={handleSmartPresetClick} className={optimizeButtonClass} title="Ativar/Desativar Estratégia Otimizada (IA)">
                   <span className="text-sm">
                        <span className={!isSmartPresetActive ? 'grayscale' : ''}>💡</span> OTIMIZAR IA
                   </span>
                </button>
                 <button onClick={() => setIsHistoryModalOpen(true)} className="text-sm bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded-lg transition-colors h-full flex items-center justify-center gap-2" title="Ver Histórico do Co-Piloto">
                    🕒 HISTÓRICO
                </button>
            </div>
            
             {/* Painel de Ajuste Fino */}
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700/50">
                <button onClick={() => setIsTacticsCollapsed(!isTacticsCollapsed)} className="w-full flex justify-between items-center p-2 text-left">
                    <h3 className="text-sm font-bold text-white">Ajuste Fino & Base de Conhecimento</h3>
                     <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${isTacticsCollapsed ? 'rotate-0' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {!isTacticsCollapsed && (
                     <div className="p-2 pt-0 animate-fade-in">
                        <div className="border-t border-gray-700/50 pt-2">
                             <AITacticsPanel
                                iaTacticWeights={iaTacticWeights}
                                onWeightsChange={(newWeights) => bankrollManagement.update({ iaTacticWeights: newWeights })}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    </>
  );
};

export default AIBotPlayer;