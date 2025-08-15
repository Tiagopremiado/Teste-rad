import React, { useState, useMemo, ReactNode, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Analysis, Play, PlayWithId, HighlightedStat, Signal, SignalOutcome, GrandePaguePeriod, AutoCollectionStatus, User, AILearningProgress, LiveSignalHistoryItem, ApiInfo, MarketState, BankrollManagement, AIBotHistoryItem, AIBotLifetimeStats, WinningPatternResult, LosingPatternResult, PinkChaseConfig, AnalysisCountdowns, HunterMode, TrainingStatus, LearnedPatterns, PinkPressureAnalysis, Notification, PinkPauseRiskAnalysis, PurplePressureAnalysis, ImportFeedback, Strategy, Color as ColorType, PinkPatternAnalysis, DailyRankedPattern, ConfidenceReport, LuxSignalsBotState, LuxSignalsBotHistoryItem } from '../types';
import { Color as ColorEnum } from '../types';
import StatsSummary from './StatsSummary';
import RecentPlays from './RecentPlays';
import StrategyRecommendations from './StrategyRecommendations';
import AlertDisplay from './Alerts';
import AnalysisCharts from './AnalysisCharts';
import AnalysisSection from './AnalysisSection';
import PinkHistoryModal from './PinkHistoryModal';
import SignalPredictor from './SignalPredictor';
import SignalHistory from './SignalHistory';
import SignalAssertivenessReport from './SignalAssertivenessReport';
import GrandePagueStrategyModal from './GrandePagueStrategyModal';
import LiveAISignalStream from './LiveAISignalStream';
import PatternCataloger from './FileUpload';
import AIBotPlayer from './AIBotPlayer';
import ManagementModal from './ManagementModal';
import KnowledgeImportReportModal from './KnowledgeImportReportModal';
import MarketChart from './MarketChart';
import StrategyBacktestModal from './StrategyBacktestModal';
import MinuteHeatmap from './MinuteHeatmap';
import AdditionalAnalysisReport from './AdditionalAnalysisReport';
import PinkPatternAnalyzer from './PinkPatternAnalyzer';
import LiveSignalHistoryModal from './LiveSignalHistoryModal';
import PinkPatternHistoryModal from './PinkPatternHistoryModal';
import DailyPatternRanking from './DailyPatternRanking';
import SessionEndModal from './SessionEndModal';
import AIBotHistoryModal from './AIBotHistoryModal';
import { useAIBotLogic } from '../hooks/useAIBotLogic';

// --- Sub-componente para Lux Sinais ---
const LuxSignalsBot: React.FC<{
    botState: LuxSignalsBotState;
    updateSettings: (updates: Partial<LuxSignalsBotState>) => void;
    startBot: () => void;
    stopBot: () => void;
    isPremium: boolean;
    showPremiumModal: () => void;
}> = ({ botState, updateSettings, startBot, stopBot, isPremium, showPremiumModal }) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { isActive, status, initialBankroll, currentBankroll, profitTargetPercentage, stopLossPercentage, history, wins, losses, sessionStartBankroll, baseBetAmount, strategyMode, currentCycleProfit, apostaFuturaWin, apostaFuturaLoss, currentBet } = botState;

    const profit = currentBankroll - sessionStartBankroll;
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
    const profitTargetValue = sessionStartBankroll * (1 + profitTargetPercentage / 100);
    const stopLossValue = sessionStartBankroll * (1 - stopLossPercentage / 100);

    const modeText = {
        normal: 'Normal',
        compounding: `Compondo Lucro (Meta: R$ ${baseBetAmount.toFixed(2)})`,
        recovery: 'Recuperando Perda'
    };

    const statusConfig = {
        idle: { text: "INATIVO", color: "text-gray-400" },
        running: { text: "ANALISANDO...", color: "text-cyan-400 animate-pulse" },
        stopped_win: { text: "META ATINGIDA!", color: "text-green-400" },
        stopped_loss: { text: "STOP LOSS ATINGIDO", color: "text-red-400" },
        paused: { text: `PAUSADO`, color: "text-yellow-400" },
    };
    const currentStatus = statusConfig[status] || statusConfig.idle;

    const lastOperation = history.length > 0 ? history[0] : null;
    
    const handleDownloadPdf = () => {
        if (history.length === 0) return;
        const doc = new jsPDF();
        const date = new Date().toISOString().split('T')[0];
        doc.setFontSize(18);
        doc.text("Relatório de Sessão - Lux Sinais", 14, 22);
        autoTable(doc, {
            startY: 30,
            head: [['Rodada', 'Aposta 1', 'Alvo 1', 'Aposta 2', 'Alvo 2', 'Resultado', 'Lucro']],
            body: history.map(item => [
                item.round,
                `R$ ${item.bet1Amount.toFixed(2)}`,
                `${item.target1Multiplier.toFixed(2)}x`,
                item.bet2Amount ? `R$ ${item.bet2Amount.toFixed(2)}` : '-',
                item.target2Multiplier ? `${item.target2Multiplier.toFixed(2)}x` : '-',
                `${item.actualMultiplier.toFixed(2)}x`,
                `R$ ${item.profit.toFixed(2)}`
            ]),
            theme: 'grid',
            headStyles: { fillColor: [34, 34, 34] },
            didDrawCell: (data) => {
                const rowData = history[data.row.index];
                if (rowData && data.column.index === 6) {
                    doc.setTextColor(rowData.outcome === 'Win' ? '#22c55e' : '#ef4444');
                }
             },
             willDrawCell: () => {
                doc.setTextColor(40, 40, 40);
            }
        });
        doc.save(`relatorio-lux-sinais-${date}.pdf`);
    };

    const FutureBetDisplay: React.FC<{ title: string; plan: LuxSignalsBotState['apostaFuturaWin']; outcome: 'win' | 'loss' }> = ({ title, plan, outcome }) => (
        <div className={`p-3 rounded-lg border ${outcome === 'win' ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
            <p className={`text-sm font-bold ${outcome === 'win' ? 'text-green-300' : 'text-red-300'}`}>{title}</p>
            {plan.bet1.amount > 0 ? (
                <>
                    <p className="text-white">Aposta 1: <span className="font-mono">R$ {plan.bet1.amount.toFixed(2)} @ {plan.bet1.target.toFixed(2)}x</span></p>
                    {plan.bet2.amount > 0 && <p className="text-white">Aposta 2: <span className="font-mono">R$ {plan.bet2.amount.toFixed(2)} @ {plan.bet2.target.toFixed(2)}x</span></p>}
                </>
            ) : (
                <p className="text-gray-500">Nenhuma aposta</p>
            )}
        </div>
    );

    return (
        <div className="bg-gray-950/50 p-6 rounded-2xl border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/10 space-y-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-2xl font-bold text-white">Lux Sinais</h3>
                    <p className="text-sm text-gray-400">Estratégia de composição e recuperação.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleDownloadPdf} disabled={history.length === 0} className="p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-400 disabled:opacity-50">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>
                    </button>
                    <button onClick={isPremium ? (isActive ? stopBot : startBot) : showPremiumModal} className={`font-bold py-2 px-4 rounded-lg text-sm ${isActive ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                        {isActive ? 'Parar Robô' : 'Iniciar Robô'} {!isPremium && '👑'}
                    </button>
                </div>
            </div>

            {isSettingsOpen && (
                <div className="bg-black/30 p-4 rounded-lg space-y-3 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Banca Inicial (R$)</label>
                            <input type="number" disabled={isActive} value={initialBankroll} onChange={e => updateSettings({ initialBankroll: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 disabled:opacity-50" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Meta de Lucro (%)</label>
                            <input type="number" disabled={isActive} value={profitTargetPercentage} onChange={e => updateSettings({ profitTargetPercentage: parseInt(e.target.value, 10) || 0 })} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 disabled:opacity-50" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Limite de Perda (%)</label>
                            <input type="number" disabled={isActive} value={stopLossPercentage} onChange={e => updateSettings({ stopLossPercentage: parseInt(e.target.value, 10) || 0 })} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 disabled:opacity-50" />
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Aposta Base (R$)</label>
                            <input type="number" disabled={isActive} value={baseBetAmount} onChange={e => updateSettings({ baseBetAmount: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 disabled:opacity-50" />
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 space-y-3">
                    <div className="text-center">
                        <p className="text-sm text-gray-400">Modo de Estratégia</p>
                        <p className={`text-xl font-bold text-amber-300`}>{modeText[strategyMode]}</p>
                    </div>
                    <div className="text-center bg-black/30 p-2 rounded-lg border border-gray-600">
                        <p className="text-xs text-gray-400 uppercase">Aposta Atual</p>
                        {currentBet && currentBet.bet1.amount > 0 && isActive ? (
                            <p className="text-lg font-bold text-white font-mono">
                                R$ {currentBet.bet1.amount.toFixed(2)} @ {currentBet.bet1.target.toFixed(2)}x
                                {currentBet.bet2.amount > 0 && ` | R$ ${currentBet.bet2.amount.toFixed(2)} @ ${currentBet.bet2.target.toFixed(2)}x`}
                            </p>
                        ) : (
                            <p className="text-lg font-bold text-gray-600">--</p>
                        )}
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
                        <div className="absolute h-full bg-gray-900" style={{ left: 0, width: `${(currentBankroll - stopLossValue) / (profitTargetValue - stopLossValue) * 100}%`, transition: 'width 0.5s' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>R$ {stopLossValue.toFixed(2)}</span>
                        <span className="font-bold text-white">R$ {currentBankroll.toFixed(2)}</span>
                        <span>R$ {profitTargetValue.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                        <div><p className="text-xs text-gray-400">Lucro</p><p className={`font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {profit.toFixed(2)}</p></div>
                        <div><p className="text-xs text-gray-400">Vitórias</p><p className="font-bold text-white">{wins}</p></div>
                        <div><p className="text-xs text-gray-400">Derrotas</p><p className="font-bold text-white">{losses}</p></div>
                        <div><p className="text-xs text-gray-400">Acerto</p><p className="font-bold text-white">{winRate.toFixed(1)}%</p></div>
                    </div>
                </div>
                 <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 space-y-2">
                     <p className="text-sm text-center text-gray-400">Próxima Aposta</p>
                     <FutureBetDisplay title="Se GANHAR" plan={apostaFuturaWin} outcome="win" />
                     <FutureBetDisplay title="Se PERDER" plan={apostaFuturaLoss} outcome="loss" />
                </div>
            </div>
            
            <div>
                 <h4 className="text-lg font-semibold text-white mb-2">Histórico de Operações</h4>
                 <div className="bg-black/30 rounded-lg max-h-48 overflow-y-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="sticky top-0 bg-gray-900">
                            <tr>
                                <th className="p-2">Rodada</th>
                                <th className="p-2">Aposta 1</th>
                                <th className="p-2">Alvo 1</th>
                                <th className="p-2">Aposta 2</th>
                                <th className="p-2">Alvo 2</th>
                                <th className="p-2">Resultado</th>
                                <th className="p-2">Lucro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {history.map(item => (
                                <tr key={item.id} className={`${item.outcome === 'Win' ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                                    <td className="p-2 text-gray-400">{item.round}</td>
                                    <td className="p-2">R$ {item.bet1Amount.toFixed(2)}</td>
                                    <td className="p-2 text-cyan-300">{item.target1Multiplier.toFixed(2)}x</td>
                                    <td className="p-2">{item.bet2Amount ? `R$ ${item.bet2Amount.toFixed(2)}` : '-'}</td>
                                    <td className="p-2 text-cyan-300">{item.target2Multiplier ? `${item.target2Multiplier.toFixed(2)}x` : '-'}</td>
                                    <td className="p-2">{item.actualMultiplier.toFixed(2)}x</td>
                                    <td className={`p-2 font-bold ${item.outcome === 'Win' ? 'text-green-400' : 'text-red-400'}`}>R$ {item.profit.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

interface DashboardProps {
  analysis: Partial<Analysis>;
  localAnalysis: Partial<Analysis> | null;
  historicalData: Play[];
  user: User;
  isProcessing: boolean;
  loadingStates: {
    summary: boolean;
    strategy: boolean;
    chart: boolean;
    prediction: boolean;
  };
  analysisHandlers: {
    summary: () => void;
    prediction: () => void;
    strategy: () => void;
    chart: () => void;
    analyzeGrandePagueStrategy: (period: GrandePaguePeriod) => void;
    toggleAutoCollection: () => void;
    clearCache: () => void;
  };
  predictionHandlers: {
      feedback: (predictionId: string, outcome: SignalOutcome) => void;
  };
  alarmHandlers: {
    isMuted: boolean;
    toggleMute: () => void;
  };
  signalHistory: Signal[];
  liveSignalHistory: LiveSignalHistoryItem[];
  highlightedGrandePaguePeriod: GrandePaguePeriod | null;
  lastAnalysisHash: string | null;
  aiLearningProgress: AILearningProgress;
  aiBotLifetimeStats: AIBotLifetimeStats;
  updateAIBotLifetimeStats: (result: { profit: number }) => void;
  aiBotHistory: AIBotHistoryItem[];
  addAIBotHistoryItem: (item: Omit<AIBotHistoryItem, 'id' | 'timestamp'>) => void;
  handleRefineKnowledge: () => void;
  lastApiCallInfo: ApiInfo | null;
  latestLearnings: string | null;
  autoCollection: {
    status: AutoCollectionStatus;
    countdown: number;
    error: string | null;
    isCollecting: boolean;
    stats: {
        total: number;
        latest: Play | null;
        oldest: Play | null;
    };
  };
  isLiveSignalActive: boolean;
  toggleLiveSignal: () => void;
  hunterMode: HunterMode;
  updateHunterMode: (mode: HunterMode) => void;
  bankrollManagement: {
    state: BankrollManagement;
    update: (updates: Partial<BankrollManagement>) => void;
    reset: () => void;
    addTransaction: (type: 'Win' | 'Loss', amount: number) => void;
    addFunds: (amount: number) => void;
  };
  isPremium: boolean;
  showPremiumModal: () => void;
  isTraining: boolean;
  trainingStatus: TrainingStatus | null;
  handleHolisticTraining: (file: File) => void;
  learnedPatterns?: LearnedPatterns;
  handleLearnedPatternsUpload: (file: File) => void;
  isAutoTraining: boolean;
  autoTrainingProgress: number;
  autoTrainingTriggerCount: number;
  isPatternHunterModeActive: boolean;
  togglePatternHunterMode: () => void;
  winningPatterns: WinningPatternResult[];
  losingPatterns: LosingPatternResult[];
  setFoundPatterns: (patterns: { winning: WinningPatternResult[]; losing: LosingPatternResult[] }) => void;
  isHouseHunterModeActive: boolean;
  toggleHouseHunterMode: () => void;
  currentTargetHouse: number | null;
  pinkChaseConfig: PinkChaseConfig;
  updatePinkChaseConfig: (updates: Partial<PinkChaseConfig>) => void;
  analysisCountdowns: AnalysisCountdowns;
  pinkPressureAnalysis: PinkPressureAnalysis | null;
  pinkPauseRisk: PinkPauseRiskAnalysis | null;
  purplePressureAnalysis: PurplePressureAnalysis | null;
  pinkPatternAnalysis: PinkPatternAnalysis | null | undefined;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  importFeedback: ImportFeedback | null;
  dismissImportFeedback: () => void;
  onShareWin: (sessionData: any) => void;
  sessionEndContext: any | null;
  clearSessionEndContext: () => void;
  alertingPanels: { dailyPatternRanking: boolean; patternChaser: boolean };
  luxSignalsBot: LuxSignalsBotState;
  updateLuxSignalsBot: (updates: Partial<LuxSignalsBotState>) => void;
  startLuxSignalsBot: () => void;
  stopLuxSignalsBot: () => void;
}
  
const AiAnalysisDisplay: React.FC<{
  summary: Analysis['summary'];
  grandePagueAnalysis?: Analysis['grandePagueAnalysis'];
}> = ({ summary, grandePagueAnalysis }) => {
  const insights = [
    { label: 'Tendência do Dia', value: `${summary.dailyTrend} - ${summary.trendReasoning}`, show: summary.dailyTrend },
    { label: 'Padrão Recente de Rosas', value: summary.recentPinksAnalysis, show: summary.recentPinksAnalysis },
    { label: 'Tendência Próximo Sinal', value: summary.nextSignalPrediction, show: summary.nextSignalPrediction },
    { label: 'Análise "Grande Pague"', value: grandePagueAnalysis?.iaAnalysis, show: grandePagueAnalysis?.iaAnalysis },
    { label: 'Análise para 50x+', value: summary.pinksTo50xAnalysis?.analysisText, show: summary.pinksTo50xAnalysis?.analysisText },
  ].filter(insight => insight.show && insight.value.trim() !== '');

  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      {insights.map(insight => (
         <div key={insight.label} className="bg-black/40 p-3 rounded-lg">
            <p className="font-semibold text-lime-200/80 text-sm">{insight.label}</p>
            <p className="text-lime-300 italic">"{insight.value}"</p>
        </div>
      ))}
    </div>
  );
};


const CollapseIcon = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-lime-200/70 transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
    </svg>
);

const Dashboard: React.FC<DashboardProps> = ({ 
  analysis, 
  localAnalysis,
  historicalData,
  user,
  isProcessing,
  loadingStates,
  analysisHandlers,
  predictionHandlers,
  alarmHandlers,
  signalHistory,
  liveSignalHistory,
  highlightedGrandePaguePeriod,
  lastAnalysisHash,
  aiLearningProgress,
  aiBotLifetimeStats,
  updateAIBotLifetimeStats,
  aiBotHistory,
  addAIBotHistoryItem,
  handleRefineKnowledge,
  lastApiCallInfo,
  latestLearnings,
  autoCollection,
  isLiveSignalActive,
  toggleLiveSignal,
  hunterMode,
  updateHunterMode,
  bankrollManagement,
  isPremium,
  showPremiumModal,
  isTraining,
  trainingStatus,
  handleHolisticTraining,
  learnedPatterns,
  handleLearnedPatternsUpload,
  isAutoTraining,
  autoTrainingProgress,
  autoTrainingTriggerCount,
  isPatternHunterModeActive,
  togglePatternHunterMode,
  winningPatterns,
  losingPatterns,
  setFoundPatterns,
  isHouseHunterModeActive,
  toggleHouseHunterMode,
  currentTargetHouse,
  pinkChaseConfig,
  updatePinkChaseConfig,
  analysisCountdowns,
  pinkPressureAnalysis,
  pinkPauseRisk,
  purplePressureAnalysis,
  pinkPatternAnalysis,
  addNotification,
  importFeedback,
  dismissImportFeedback,
  onShareWin,
  sessionEndContext,
  clearSessionEndContext,
  alertingPanels,
  luxSignalsBot,
  updateLuxSignalsBot,
  startLuxSignalsBot,
  stopLuxSignalsBot,
}) => {
  const [highlightedStat, setHighlightedStat] = useState<HighlightedStat>(null);
  const [highlightedPattern, setHighlightedPattern] = useState<PlayWithId[] | null>(null);
  const [highlightedBlockPlays, setHighlightedBlockPlays] = useState<PlayWithId[] | null>(null);
  const [pinkHistoryModalOpen, setPinkHistoryModalOpen] = useState(false);
  const [isGrandePagueModalOpen, setIsGrandePagueModalOpen] = useState(false);
  const [isLiveSignalHistoryModalOpen, setIsLiveSignalHistoryModalOpen] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
  const [isBacktestModalOpen, setIsBacktestModalOpen] = useState(false);
  const [simulationTarget, setSimulationTarget] = useState<Strategy | ColorType[] | null>(null);
  const [patternHistoryInfo, setPatternHistoryInfo] = useState<{ name: string; pattern?: ColorType[] } | null>(null);
  const [sessionEndData, setSessionEndData] = useState<{ type: 'win' | 'loss'; profitOrLoss: number; nextBestTimeSuggestion?: string } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [collapsedSections, setCollapsedSections] = useState({
      summary: true,
      marketChart: true,
      strategies: true,
      predictions: true,
      charts: true,
      aiBotPlayer: true,
      liveSignals: true,
      luxSignals: true,
      patternCataloger: true,
      pinkPatterns: true,
      recentPlays: false, // Start open as it's the main view
      minuteHeatmap: true,
      additionalReport: true,
      dailyRanking: true,
  });

  const [scrollTarget, setScrollTarget] = useState<{ sectionId: string; playId?: string } | null>(null);
  
  const handleSessionEnd = React.useCallback((data: { type: 'win' | 'loss'; profitOrLoss: number; nextBestTimeSuggestion?: string }) => {
    setSessionEndData(data);
  }, []);

  const { state: coPilotState, confidenceReport } = useAIBotLogic({
    analysis,
    localAnalysis,
    historicalData,
    isPremium,
    updateAIBotLifetimeStats,
    bankrollManagement: bankrollManagement.state,
    updateBankroll: bankrollManagement.update,
    addBankrollTransaction: bankrollManagement.addTransaction,
    addAIBotHistoryItem,
    isPatternHunterModeActive,
    winningPatterns,
    losingPatterns,
    isHouseHunterModeActive,
    currentTargetHouse,
    pinkChaseConfig,
    hunterMode,
    pinkPauseRisk,
    pinkPressureAnalysis,
    addNotification,
    purplePressureAnalysis,
    pinkPatternAnalysis,
    onSessionEnd: handleSessionEnd,
  });

  useEffect(() => {
    if (sessionEndContext) {
      setSessionEndData(sessionEndContext);
      clearSessionEndContext();
    }
  }, [sessionEndContext, clearSessionEndContext]);


  const handleScrollComplete = () => {
      setScrollTarget(null);
  };

  const toggleCollapse = (section: keyof typeof collapsedSections) => {
      setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSimulate = (target: Strategy | ColorType[]) => {
    if (!isPremium) {
        showPremiumModal();
        return;
    }
    setSimulationTarget(target);
    setIsBacktestModalOpen(true);
  };
  
  const handleViewPatternHistory = (info: { name: string; pattern?: ColorType[] }) => {
    setPatternHistoryInfo(info);
  };


  useEffect(() => {
    if (highlightedGrandePaguePeriod) {
        setIsGrandePagueModalOpen(true);
    }
  }, [highlightedGrandePaguePeriod]);

  useEffect(() => {
    if (
        pinkPressureAnalysis?.level === 'CRÍTICA' &&
        bankrollManagement.state.autoActivateOnPressure &&
        !bankrollManagement.state.isActive
    ) {
        bankrollManagement.update({ isActive: true, managementType: 'ia', iaProfile: 'Elite' });
        addNotification({
            type: 'info',
            title: 'Co-Piloto Ativado Automaticamente!',
            message: 'Pressão CRÍTICA detectada. O Co-Piloto foi iniciado no modo Elite.'
        });
    }
  }, [pinkPressureAnalysis, bankrollManagement.state, bankrollManagement.update, addNotification]);

  const playsWithIds = useMemo(() =>
    historicalData.map((play, index) => ({
        ...play,
        id: `${play.date}-${play.time}-${play.multiplier.toFixed(2)}-${index}`
    })),
    [historicalData]
  );
  
  const handleHighlightBlock = (plays: PlayWithId[]) => {
    setHighlightedStat(null);
    setHighlightedPattern(null);
    setHighlightedBlockPlays(plays);
    setCollapsedSections(prev => ({...prev, recentPlays: false}));
    setScrollTarget({ sectionId: 'recent-plays-section', playId: plays[0]?.id });
  };

  const handleStatHighlight = (stat: HighlightedStat) => {
    setHighlightedBlockPlays(null);
    setHighlightedPattern(null);
    setHighlightedStat(prev => prev === stat ? null : stat);
    if(stat === 'hottestMinutes' || stat === 'allPinks') {
        setPinkHistoryModalOpen(true);
    }
  };

  const handleHighlightPatternRequest = (patternToFind: ColorEnum[]) => {
    if (patternToFind.length === 0) {
      setHighlightedPattern(null);
      return;
    }

    const colorHistory: ColorEnum[] = playsWithIds.map(play => {
      if (play.multiplier >= 10) return ColorEnum.Pink;
      if (play.multiplier >= 2) return ColorEnum.Purple;
      return ColorEnum.Blue;
    });

    let lastFoundIndex = -1;
    for (let i = colorHistory.length - patternToFind.length; i >= 0; i--) {
      const slice = colorHistory.slice(i, i + patternToFind.length);
      if (slice.every((color, index) => color === patternToFind[index])) {
        lastFoundIndex = i;
        break;
      }
    }

    if (lastFoundIndex !== -1) {
      const foundPlays = playsWithIds.slice(lastFoundIndex, lastFoundIndex + patternToFind.length);
      setHighlightedStat(null);
      setHighlightedBlockPlays(null);
      setHighlightedPattern(foundPlays);
      setCollapsedSections(prev => ({ ...prev, recentPlays: false }));
      setScrollTarget({ sectionId: 'recent-plays-section', playId: foundPlays[foundPlays.length - 1].id });
    } else {
      setHighlightedPattern(null);
    }
  };

  const isDataLoaded = historicalData.length > 0;
  const hasCoreAnalysis = !!analysis.summary;
  const hasLocalAnalysis = !!localAnalysis;
  const isUpToDate = lastAnalysisHash === JSON.stringify(historicalData);
  const combinedAnalysis = useMemo(() => ({...localAnalysis, ...analysis}), [localAnalysis, analysis]);

  const createPremiumHandler = (handler: () => void) => {
    return () => {
        if (isPremium) {
            handler();
        } else {
            showPremiumModal();
        }
    };
  };
  
  const handleCloseSessionEndModal = () => {
    // This is the primary action: formally end the session.
    bankrollManagement.update({ isActive: false });
    setSessionEndData(null);
  };

  const handleOverrideSession = () => {
    // This is the secondary action for stop loss: start a new session with remaining funds.
    const remainingBankroll = bankrollManagement.state.currentBankroll;
    bankrollManagement.reset(); // This sets isActive to false.
    
    // Use a timeout to ensure the reset state has propagated before starting a new session.
    setTimeout(() => {
        bankrollManagement.update({
            initialBankroll: remainingBankroll,
            isActive: true,
        });
    }, 50); 
    setSessionEndData(null);
  };
  
  const handleContinueWinSession = () => {
    const currentWinningBankroll = bankrollManagement.state.currentBankroll;
    bankrollManagement.reset();
    
    setTimeout(() => {
        bankrollManagement.update({
            initialBankroll: currentWinningBankroll,
            currentBankroll: currentWinningBankroll,
            isActive: true,
        });
    }, 50); 
    setSessionEndData(null);
  };

  const handleViewHistory = () => {
    setSessionEndData(null); // Close session end modal
    setIsHistoryModalOpen(true); // Open history modal
  };

  const handleDownloadReport = () => {
    if (aiBotHistory.length === 0) {
        alert("Nenhuma operação foi registrada nesta sessão para gerar um relatório.");
        return;
    }
    const { currentBankroll, initialBankroll } = bankrollManagement.state;
    const totalProfit = currentBankroll - initialBankroll;
    const wins = aiBotHistory.filter(item => item.profit > 0).length;
    const losses = aiBotHistory.filter(item => item.profit < 0).length;
    const winRate = aiBotHistory.length > 0 ? (wins / aiBotHistory.length) * 100 : 0;

    const doc = new jsPDF();
    const date = new Date();
    const fileName = `relatorio-copiloto-${date.toISOString().split('T')[0]}.pdf`;

    // Header
    doc.setFontSize(20);
    doc.text("Relatório de Sessão do Co-Piloto IA", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Perfil: ${user.display_name}`, 14, 30);
    doc.text(`Data: ${date.toLocaleString('pt-BR')}`, 14, 36);

    // Summary Table
    autoTable(doc, {
        startY: 45,
        head: [['Métrica', 'Valor']],
        body: [
            ['Banca Inicial', `R$ ${initialBankroll.toFixed(2)}`],
            ['Banca Final', `R$ ${currentBankroll.toFixed(2)}`],
            ['Lucro/Prejuízo Total', `R$ ${totalProfit.toFixed(2)}`],
            ['Taxa de Acerto', `${winRate.toFixed(1)}%`],
            ['Operações', `${aiBotHistory.length} (Vitórias: ${wins}, Derrotas: ${losses})`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [34, 34, 34] } // Dark gray
    });

    // Operations Table
    const body = aiBotHistory.slice().reverse().map(item => [
        new Date(item.timestamp).toLocaleTimeString('pt-BR'),
        `${item.plan.bet1.amount.toFixed(2)} @ ${item.plan.bet1.target.toFixed(2)}x`,
        item.resultPlay.multiplier.toFixed(2) + 'x',
        `R$ ${item.profit.toFixed(2)}`,
        item.reason,
    ]);

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Horário', 'Plano', 'Resultado', 'Lucro', 'Tática da IA']],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [34, 34, 34] },
        didDrawCell: (data) => {
            const rowData = aiBotHistory.slice().reverse()[data.row.index];
            if (rowData && data.column.index === 3) { // Profit column
                if (rowData.profit >= 0) {
                    doc.setTextColor(34, 197, 94); // Green
                } else {
                    doc.setTextColor(239, 68, 68); // Red
                }
            }
        },
        willDrawCell: () => {
             doc.setTextColor(40, 40, 40); // Reset to default text color
        }
    });

    doc.save(fileName);
  };

  const handlePublishWin = () => {
    onShareWin(sessionEndData);
    handleCloseSessionEndModal(); // Close the modal locally
  };


  return (
    <div className="space-y-6">
       <PinkHistoryModal isOpen={pinkHistoryModalOpen} plays={playsWithIds} onClose={() => setPinkHistoryModalOpen(false)} />
       <GrandePagueStrategyModal 
            isOpen={isGrandePagueModalOpen} 
            onClose={() => setIsGrandePagueModalOpen(false)} 
            strategy={analysis.grandePagueStrategy || null} 
            isLoading={loadingStates.summary}
        />
       <LiveSignalHistoryModal isOpen={isLiveSignalHistoryModalOpen} history={liveSignalHistory} onClose={() => setIsLiveSignalHistoryModalOpen(false)} />
       
       <ManagementModal
            isOpen={isManagementModalOpen}
            onClose={() => setIsManagementModalOpen(false)}
            bankrollState={bankrollManagement.state}
            updateBankroll={bankrollManagement.update}
            resetBankroll={bankrollManagement.reset}
            updateHunterMode={updateHunterMode}
            aiBotHistory={aiBotHistory}
            onDownloadReport={handleDownloadReport}
       />
        <KnowledgeImportReportModal
            isOpen={!!importFeedback}
            onClose={dismissImportFeedback}
            feedback={importFeedback}
        />
       <StrategyBacktestModal
            isOpen={isBacktestModalOpen}
            onClose={() => setIsBacktestModalOpen(false)}
            simulationTarget={simulationTarget}
            historicalData={historicalData}
        />
        {pinkPatternAnalysis && (
            <PinkPatternHistoryModal
                isOpen={!!patternHistoryInfo}
                onClose={() => setPatternHistoryInfo(null)}
                patternInfo={patternHistoryInfo}
                analysis={pinkPatternAnalysis}
                dailyRanking={localAnalysis?.dailyPatternRanking ?? []}
            />
        )}
        <SessionEndModal
            isOpen={!!sessionEndData}
            onClose={handleCloseSessionEndModal}
            onOverride={sessionEndData?.type === 'loss' ? handleOverrideSession : undefined}
            onContinueWin={sessionEndData?.type === 'win' ? handleContinueWinSession : undefined}
            type={sessionEndData?.type ?? 'win'}
            profitOrLoss={sessionEndData?.profitOrLoss ?? 0}
            nextBestTimeSuggestion={sessionEndData?.nextBestTimeSuggestion}
            user={user}
            onViewHistory={handleViewHistory}
            onDownloadReport={handleDownloadReport}
            onPublishWin={handlePublishWin}
        />
        <AIBotHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            history={aiBotHistory}
            bankrollState={bankrollManagement.state}
        />


      <div className="bg-gray-900 backdrop-blur-md rounded-xl shadow-xl border border-lime-500/30">
        <button onClick={() => toggleCollapse('aiBotPlayer')} className="w-full flex justify-between items-center p-6 text-left">
            <h3 className="text-xl font-bold text-lime-300 flex items-center gap-3"><span className="text-2xl">🤖</span> Co-Piloto IA & Banca</h3>
            <CollapseIcon isCollapsed={collapsedSections.aiBotPlayer} />
        </button>
        {!collapsedSections.aiBotPlayer && (
            <div className="px-6 pb-6 animate-fade-in">
                 <AIBotPlayer
                    analysis={analysis}
                    localAnalysis={localAnalysis}
                    historicalData={historicalData}
                    isPremium={isPremium}
                    showPremiumModal={showPremiumModal}
                    aiBotHistory={aiBotHistory}
                    bankrollManagement={bankrollManagement}
                    isTraining={isTraining}
                    trainingStatus={trainingStatus}
                    handleHolisticTraining={handleHolisticTraining}
                    learnedPatterns={learnedPatterns}
                    handleLearnedPatternsUpload={handleLearnedPatternsUpload}
                    pinkPatternAnalysis={pinkPatternAnalysis}
                    onOpenManagementModal={() => setIsManagementModalOpen(true)}
                    pinkPressureAnalysis={pinkPressureAnalysis}
                    purplePressureAnalysis={purplePressureAnalysis}
                    pinkPauseRisk={pinkPauseRisk}
                    addAIBotHistoryItem={addAIBotHistoryItem}
                    updateAIBotLifetimeStats={updateAIBotLifetimeStats}
                    isPatternHunterModeActive={isPatternHunterModeActive}
                    winningPatterns={winningPatterns}
                    losingPatterns={losingPatterns}
                    isHouseHunterModeActive={isHouseHunterModeActive}
                    currentTargetHouse={currentTargetHouse}
                    pinkChaseConfig={pinkChaseConfig}
                    hunterMode={hunterMode}
                    addNotification={addNotification}
                    onSessionEnd={handleSessionEnd}
                    coPilotState={coPilotState}
                    confidenceReport={confidenceReport}
                  />
            </div>
        )}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="bg-gray-900 backdrop-blur-md rounded-xl shadow-xl border border-lime-500/30">
            <button onClick={() => toggleCollapse('liveSignals')} className="w-full flex justify-between items-center p-6 text-left">
                <h3 className="text-xl font-bold text-lime-300 flex items-center gap-3"><span className="text-2xl">📡</span> Robô de Sinais ao Vivo</h3>
                <CollapseIcon isCollapsed={collapsedSections.liveSignals} />
            </button>
            {!collapsedSections.liveSignals && (
                <div className="px-6 pb-6 animate-fade-in">
                    <LiveAISignalStream 
                        liveAiSignal={null}
                        isLiveSignalActive={isLiveSignalActive}
                        toggleLiveSignal={createPremiumHandler(toggleLiveSignal)} 
                        onOpenHistory={() => setIsLiveSignalHistoryModalOpen(true)} 
                        signalHistory={liveSignalHistory}
                        isPremium={isPremium}
                        hunterMode={hunterMode}
                        updateHunterMode={updateHunterMode}
                    />
                </div>
            )}
        </div>
      </div>

       <div className="bg-gray-900 backdrop-blur-md rounded-xl shadow-xl border border-lime-500/30">
            <button onClick={() => toggleCollapse('luxSignals')} className="w-full flex justify-between items-center p-6 text-left">
                <h3 className="text-xl font-bold text-lime-300 flex items-center gap-3"><span className="text-2xl">💎</span> Lux Sinais</h3>
                <CollapseIcon isCollapsed={collapsedSections.luxSignals} />
            </button>
            {!collapsedSections.luxSignals && (
                <div className="px-6 pb-6 animate-fade-in">
                    <LuxSignalsBot
                        botState={luxSignalsBot}
                        updateSettings={updateLuxSignalsBot}
                        startBot={startLuxSignalsBot}
                        stopBot={stopLuxSignalsBot}
                        isPremium={isPremium}
                        showPremiumModal={showPremiumModal}
                    />
                </div>
            )}
        </div>

      {isDataLoaded ? (
        <div className="space-y-6">
          <AnalysisSection
            title="Resumo da Análise"
            isAnalyzed={hasCoreAnalysis}
            isLoading={loadingStates.summary}
            onAnalyze={createPremiumHandler(analysisHandlers.summary)}
            isCollapsed={collapsedSections.summary}
            onToggleCollapse={() => toggleCollapse('summary')}
            isUpToDate={isUpToDate}
            isPremium={isPremium}
            ctaText={hasCoreAnalysis ? 'Atualizar IA' : 'Analisar com IA'}
            countdown={analysisCountdowns.summary}
          >
             {hasLocalAnalysis && combinedAnalysis.summary && combinedAnalysis.hotSpots && (
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div className="xl:col-span-2">
                          <StatsSummary
                              summary={combinedAnalysis.summary}
                              hotSpots={combinedAnalysis.hotSpots}
                              grandePagueAnalysis={combinedAnalysis.grandePagueAnalysis}
                              playsWithIds={playsWithIds}
                              highlightedStat={highlightedStat}
                              onStatHighlight={handleStatHighlight}
                              onShowPinkHistory={() => setPinkHistoryModalOpen(true)}
                              onAnalyzeGrandePagueStrategy={analysisHandlers.analyzeGrandePagueStrategy}
                              isPremium={isPremium}
                              showPremiumModal={showPremiumModal}
                              onHighlightBlock={handleHighlightBlock}
                              pinkPressureAnalysis={pinkPressureAnalysis}
                              purplePressureAnalysis={purplePressureAnalysis}
                              pinkPauseRisk={pinkPauseRisk}
                              pinkPauseHistory={analysis.pinkPauseHistory}
                          />
                      </div>
                      {hasCoreAnalysis && isUpToDate && analysis.summary && (
                          <div className="xl:col-span-2">
                             <AiAnalysisDisplay summary={analysis.summary} grandePagueAnalysis={analysis.grandePagueAnalysis} />
                          </div>
                      )}
                 </div>
             )}
          </AnalysisSection>

           <div id="recent-plays-section">
                <AnalysisSection
                    title="Histórico Recente & Termômetro"
                    isAnalyzed={true}
                    isLoading={false}
                    onAnalyze={() => {}}
                    isCollapsed={collapsedSections.recentPlays}
                    onToggleCollapse={() => toggleCollapse('recentPlays')}
                    isPremium={true}
                >
                    <RecentPlays 
                        historicalData={playsWithIds} 
                        hotSpots={combinedAnalysis.hotSpots}
                        highlightedStat={highlightedStat}
                        onStatHighlight={handleStatHighlight}
                        highlightedGrandePaguePeriod={highlightedGrandePaguePeriod}
                        highlightedPatternPlays={highlightedPattern}
                        highlightedBlockPlays={highlightedBlockPlays}
                        marketState={combinedAnalysis.summary?.marketState || 'FRIO'}
                        marketStatePercentage={combinedAnalysis.summary?.marketStatePercentage || 0}
                        scrollTarget={scrollTarget}
                        onScrollComplete={handleScrollComplete}
                        onHighlightBlock={handleHighlightBlock}
                        isPremium={isPremium}
                        showPremiumModal={showPremiumModal}
                    />
                </AnalysisSection>
            </div>
          
            <AnalysisSection
                title="Ranking Diário de Padrões"
                isAnalyzed={!!localAnalysis?.dailyPatternRanking}
                isLoading={false}
                onAnalyze={() => {}} // No specific analysis, it's auto-calculated
                isCollapsed={collapsedSections.dailyRanking}
                onToggleCollapse={() => toggleCollapse('dailyRanking')}
                isPremium={true}
                isAlerting={alertingPanels.dailyPatternRanking}
            >
                {localAnalysis?.dailyPatternRanking && (
                    <DailyPatternRanking 
                        ranking={localAnalysis.dailyPatternRanking}
                        onPatternClick={(info) => handleViewPatternHistory(info)}
                    />
                )}
                 {!localAnalysis?.dailyPatternRanking && (
                    <p className="text-center text-gray-400 py-4">Ranking é calculado automaticamente para o dia atual quando há dados suficientes.</p>
                )}
            </AnalysisSection>


            <AnalysisSection
                title="Padrões de Rosa (Dupla e Repetição)"
                isAnalyzed={!!pinkPatternAnalysis}
                isLoading={false}
                onAnalyze={() => {}}
                isCollapsed={collapsedSections.pinkPatterns}
                onToggleCollapse={() => toggleCollapse('pinkPatterns')}
                isPremium={true}
            >
                {pinkPatternAnalysis && (
                    <PinkPatternAnalyzer 
                        analysis={pinkPatternAnalysis} 
                        onViewHistory={(type) => {
                            if (type === 'doublePink') handleViewPatternHistory({ name: 'Rosa Dupla' });
                            if (type === 'closeRepetition') handleViewPatternHistory({ name: 'Repetição Próxima' });
                        }}
                    />
                )}
            </AnalysisSection>

            <AnalysisSection
                title="Relatórios de Multiplicadores Altos"
                isAnalyzed={!!analysis.summary?.pinksTo50xAnalysis}
                isLoading={loadingStates.summary}
                onAnalyze={createPremiumHandler(analysisHandlers.summary)}
                isCollapsed={collapsedSections.additionalReport}
                onToggleCollapse={() => toggleCollapse('additionalReport')}
                isPremium={isPremium}
                isPremiumFeature
            >
                <AdditionalAnalysisReport analysis={analysis} historicalData={historicalData} />
            </AnalysisSection>

            <AnalysisSection
                title="Mapa de Calor & Tendências de Minutos"
                isAnalyzed={true}
                isLoading={false}
                onAnalyze={() => {}}
                isCollapsed={collapsedSections.minuteHeatmap}
                onToggleCollapse={() => toggleCollapse('minuteHeatmap')}
                isPremium={true}
            >
                 <MinuteHeatmap historicalData={historicalData} />
            </AnalysisSection>

            <AnalysisSection
                title="Gráfico de Mercado Avançado"
                isAnalyzed={!!analysis.technicalIndicators}
                isLoading={loadingStates.summary}
                onAnalyze={createPremiumHandler(analysisHandlers.summary)}
                isCollapsed={collapsedSections.marketChart}
                onToggleCollapse={() => toggleCollapse('marketChart')}
                isPremium={isPremium}
                isPremiumFeature
            >
                <MarketChart 
                    data={historicalData} 
                    technicalIndicators={localAnalysis?.technicalIndicators}
                    isPremium={isPremium}
                    showPremiumModal={showPremiumModal}
                />
            </AnalysisSection>

           <AnalysisSection
            title="Estratégias Recomendadas"
            isAnalyzed={!!analysis.strategyRecommendations}
            isLoading={loadingStates.strategy}
            onAnalyze={createPremiumHandler(analysisHandlers.strategy)}
            isCollapsed={collapsedSections.strategies}
            onToggleCollapse={() => toggleCollapse('strategies')}
            isPremium={isPremium}
            countdown={analysisCountdowns.strategy}
            isPremiumFeature
          >
            {analysis.strategyRecommendations && (
                <>
                    <StrategyRecommendations 
                        strategies={analysis.strategyRecommendations} 
                        onSimulate={handleSimulate}
                        isPremium={isPremium}
                    />
                    <AlertDisplay alerts={analysis.alerts || []} />
                </>
            )}
          </AnalysisSection>

          <AnalysisSection
            title="Previsão de Sinais com IA"
            isAnalyzed={!!analysis.prediction}
            isLoading={loadingStates.prediction}
            onAnalyze={createPremiumHandler(analysisHandlers.prediction)}
            isCollapsed={collapsedSections.predictions}
            onToggleCollapse={() => toggleCollapse('predictions')}
            isPremium={isPremium}
            countdown={analysisCountdowns.prediction}
            isPremiumFeature
          >
            <SignalPredictor 
              predictions={analysis.prediction || null} 
              restOfDayPredictions={analysis.restOfDayPrediction || null}
              predictions50x={analysis.prediction50x || null}
              predictionGrandePague={analysis.predictionGrandePague || null}
              predictionVerticalRepeat={analysis.predictionVerticalRepeat || null}
              onFeedback={predictionHandlers.feedback}
              isLoadingAll={loadingStates.prediction}
              isEnabled={hasCoreAnalysis}
              signalHistory={signalHistory}
              alarmHandlers={alarmHandlers}
            />
             <SignalHistory signals={signalHistory} />
             <SignalAssertivenessReport signals={signalHistory} />
          </AnalysisSection>

          <AnalysisSection
            title="Catalogador de Padrões Vencedores 2.0"
            isAnalyzed={true}
            isLoading={false}
            onAnalyze={() => {}}
            isCollapsed={collapsedSections.patternCataloger}
            onToggleCollapse={() => toggleCollapse('patternCataloger')}
            isPremium={true}
          >
            <PatternCataloger 
                historicalData={historicalData}
                onHighlightRequest={handleHighlightPatternRequest}
                onPatternsCalculated={setFoundPatterns}
                onSimulate={handleSimulate}
                isPremium={isPremium}
                showPremiumModal={showPremiumModal}
            />
          </AnalysisSection>

          <AnalysisSection
            title="Análise Visual"
            isAnalyzed={!!analysis.chartsData}
            isLoading={loadingStates.chart}
            onAnalyze={createPremiumHandler(analysisHandlers.chart)}
            isCollapsed={collapsedSections.charts}
            onToggleCollapse={() => toggleCollapse('charts')}
            isPremium={isPremium}
            isPremiumFeature
          >
            {analysis.chartsData && <AnalysisCharts chartsData={analysis.chartsData} />}
          </AnalysisSection>
        </div>
      ) : null}
    </div>
  );
};

export default Dashboard;