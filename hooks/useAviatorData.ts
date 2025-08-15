import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';

import type { Play, Analysis, Bankroll, Signal, SignalOutcome, SignalPrediction, GrandePaguePeriod, TrainingStatus, AILearningProgress, Rect, AutoCollectionStatus, User, Strategy, LiveAISignal, LearnedPatterns, LiveSignalHistoryItem, MarketState, ApiInfo, BankrollManagement, BankrollTransaction, HunterMode, AIBotLifetimeStats, AIBotHistoryItem, WinningPatternResult, LosingPatternResult, TriggerHighlight, PinkChaseConfig, Notification, AnalysisCountdowns, Color, PinkPressureAnalysis, PinkPauseRiskAnalysis, PurplePressureAnalysis, ImportFeedback, TechnicalIndicators, IATacticWeights, PinkPatternAnalysis, DailyRankedPattern, PlayWithId, GenericPatternOccurrence, AdminSignal, LuxSignalsBotState, LuxSignalsBotHistoryItem } from '../types';
import { Color as ColorEnum } from '../types';
import { getSummaryAnalysis, getPredictionAnalysis, getChartsData, extractPlaysFromImage, getGrandePagueStrategy, getHolisticTrainingFeedback, getStrategyRecommendations } from '../services/aiOrchestrator';
import { processPlaysLocally } from '../services/aiUtils';
import { supabase } from '../services/supabase';

const ALARM_MUTE_KEY = 'aviatorAlarmMuted'; // Can remain local, it's a device preference
const COLLECTION_INTERVAL = 3 * 1000; // 3 segundos para coleta automática
const CHUNK_SIZE = 200; // Reduzido para 200 para aumentar a robustez do treinamento com planilhas muito grandes e evitar erros de MAX_TOKENS.
const AUTO_TRAIN_TRIGGER_COUNT = 50;
const AUTO_TRAIN_CHUNK_SIZE = 200;
const MIN_BET = 1.00;
const MAX_BET = 700.00;

const initialBankrollManagement: BankrollManagement = {
    isActive: false,
    initialBankroll: 100,
    currentBankroll: 100,
    stopWinPercentage: 20,
    stopLossPercentage: 15,
    baseBet: 1.00,
    onWinIncrease: 0,
    onLossIncrease: 100,
    maxBlueStreakStop: 3,
    minPurpleStreakGo: 2,
    history: [],
    managementType: 'manual',
    iaProfile: 'Moderado',
    iaTacticWeights: {
        patternHunter: 70,
        hotMarket: 80,
        houseHunter: 50,
        hotSignalHunter: 75,
        technicalAnalysis: 40,
        automaticTriggers: 65,
        extremeMultiplierProximity: 85,
        shortTermVolatility: 55,
        pinkPatternProximity: 95,
        ipvHunter: 90,
    },
    autoActivateOnPressure: false,
    activateDefensiveModeOnPauseRisk: true,
    isDualStrategyActive: false,
    consecutiveLosses: 0,
    pinkHuntConsecutiveLosses: 0,
    pinkHuntMaxLosses: 3,
};

const initialLuxSignalsBotState: LuxSignalsBotState = {
    isActive: false, initialBankroll: 1000, currentBankroll: 1000,
    sessionStartBankroll: 1000, status: 'idle',
    history: [], wins: 0, losses: 0,
    profitTargetPercentage: 5,
    stopLossPercentage: 10,
    baseBetAmount: 5.00,
    strategyMode: 'normal',
    lastLossAmount: 0,
    currentCompoundBetAmount: 5.00,
    currentCycleProfit: 0,
    currentBet: { bet1: { amount: 0, target: 0 }, bet2: { amount: 0, target: 0 } },
    apostaFuturaWin: { bet1: { amount: 0, target: 0 }, bet2: { amount: 0, target: 0 } },
    apostaFuturaLoss: { bet1: { amount: 0, target: 0 }, bet2: { amount: 0, target: 0 } },
};

const findAndAnalyzePatternOccurrences = (
    patternWithOutcome: Color[], 
    plays: PlayWithId[]
): { occurrences: number, hits: number, avgMultiplier: number, history: GenericPatternOccurrence[] } => {
    const pattern = patternWithOutcome.slice(0, -1);
    const outcome = patternWithOutcome[patternWithOutcome.length - 1];
    if (pattern.length === 0) return { occurrences: 0, hits: 0, avgMultiplier: 0, history: [] };

    const colorHistory = plays.map(play => play.multiplier >= 10 ? ColorEnum.Pink : play.multiplier >= 2 ? ColorEnum.Purple : ColorEnum.Blue);
    let occurrences = 0;
    let hits = 0;
    let totalMultiplier = 0;
    const history: GenericPatternOccurrence[] = [];

    for (let i = 0; i <= colorHistory.length - pattern.length - 1; i++) {
        const slice = colorHistory.slice(i, i + pattern.length);
        if (slice.every((color, index) => color === pattern[index])) {
            occurrences++;
            const outcomePlay = plays[i + pattern.length];
            const nextColor = colorHistory[i + pattern.length];
            
            history.push({
                triggerPlays: plays.slice(i, i + pattern.length),
                outcomePlays: plays.slice(i + pattern.length, i + pattern.length + 11) // Next 10 plays after outcome play
            });
            
            if (nextColor === outcome && (outcome === ColorEnum.Purple || outcome === ColorEnum.Pink)) {
                hits++;
                totalMultiplier += outcomePlay.multiplier;
            }
        }
    }

    return {
        occurrences,
        hits,
        avgMultiplier: hits > 0 ? totalMultiplier / hits : 0,
        history,
    };
};

const calculateDailyPatternRanking = (
    historicalData: PlayWithId[],
    winningPatterns: WinningPatternResult[],
    pinkPatternAnalysis: PinkPatternAnalysis | null | undefined
): DailyRankedPattern[] | null => {
    if (!pinkPatternAnalysis || historicalData.length === 0) {
        return null;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayPlays = historicalData.filter(p => p.date === todayStr);

    if (todayPlays.length < 20) {
        return null;
    }

    const patternsToRank: Omit<DailyRankedPattern, 'rank'>[] = [];

    // 1. Double Pink
    const doublePinkToday = pinkPatternAnalysis.doublePink.history?.filter(occ => occ.triggerPlays[1].date === todayStr) ?? [];
    if (doublePinkToday.length > 0) {
        const alertWindow = pinkPatternAnalysis.doublePink.alertWindow;
        const hitOccurrences = doublePinkToday.filter(occ => 
            occ.outcomePlays.slice(alertWindow.start - 1, alertWindow.end).some(p => p.multiplier >= 10)
        );
        const hits = hitOccurrences.length;
        const hitPinks = hitOccurrences.flatMap(occ => 
            occ.outcomePlays.slice(alertWindow.start - 1, alertWindow.end).filter(p => p.multiplier >= 10)
        );
        const avgMultiplier = hitPinks.length > 0 ? hitPinks.reduce((sum, p) => sum + p.multiplier, 0) / hitPinks.length : 0;
        
        patternsToRank.push({
            name: 'Rosa Dupla',
            occurrences: doublePinkToday.length,
            hits,
            hitRate: (hits / doublePinkToday.length) * 100,
            avgMultiplier,
        });
    }

    // 2. Close Repetition
    const closeRepToday = pinkPatternAnalysis.closeRepetition.history?.filter(occ => occ.triggerPlays[1].date === todayStr) ?? [];
    if (closeRepToday.length > 0) {
        const alertWindow = pinkPatternAnalysis.closeRepetition.alertWindow;
        const hitOccurrences = closeRepToday.filter(occ => 
            occ.outcomePlays.slice(alertWindow.start - 1, alertWindow.end).some(p => p.multiplier >= 10)
        );
        const hits = hitOccurrences.length;
        const hitPinks = hitOccurrences.flatMap(occ => 
            occ.outcomePlays.slice(alertWindow.start - 1, alertWindow.end).filter(p => p.multiplier >= 10)
        );
        const avgMultiplier = hitPinks.length > 0 ? hitPinks.reduce((sum, p) => sum + p.multiplier, 0) / hitPinks.length : 0;
        
        patternsToRank.push({
            name: 'Repetição Próxima',
            occurrences: closeRepToday.length,
            hits,
            hitRate: (hits / closeRepToday.length) * 100,
            avgMultiplier,
        });
    }

    // 3. Cataloged Winning Patterns
    if (winningPatterns.length > 0) {
        winningPatterns.slice(0, 5).forEach(wp => { // Check top 5 cataloged
            const analysisResult = findAndAnalyzePatternOccurrences(wp.pattern, todayPlays);
            if (analysisResult.occurrences > 0) {
                patternsToRank.push({
                    name: `Padrão Catalogado`,
                    pattern: wp.pattern,
                    occurrences: analysisResult.occurrences,
                    hits: analysisResult.hits,
                    hitRate: (analysisResult.hits / analysisResult.occurrences) * 100,
                    avgMultiplier: analysisResult.avgMultiplier,
                    history: analysisResult.history,
                });
            }
        });
    }

    const ranked = patternsToRank
        .filter(p => p.occurrences > 0) // Only rank patterns that appeared today
        .sort((a, b) => {
            if (b.hitRate !== a.hitRate) {
                return b.hitRate - a.hitRate;
            }
            return b.hits - a.hits;
        })
        .slice(0, 5)
        .map((p, index) => ({ ...p, rank: index + 1 }));

    return ranked.length > 0 ? ranked : null;
};


export const useAviatorData = (user: User | null, isPremium: boolean) => {
  const [error, setError] = useState<string | null>(null);
  
  const [historicalData, setHistoricalData] = useState<Play[]>([]);
  const [bankroll, setBankroll] = useState<Bankroll>({ initialAmount: 1000, stopWin: 1200, stopLoss: 800 });
  const [analysis, setAnalysis] = useState<Partial<Analysis>>({});
  const [localAnalysis, setLocalAnalysis] = useState<Partial<Analysis> | null>(null);
  const [lastAnalysisHash, setLastAnalysisHash] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isStrategyLoading, setIsStrategyLoading] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [isGrandePagueStrategyLoading, setIsGrandePagueStrategyLoading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [isAutoTraining, setIsAutoTraining] = useState(false);
  const [autoTrainingProgress, setAutoTrainingProgress] = useState(0);
  const lastTrainCountRef = useRef(0);


  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);
  
  const [aiLearningProgress, setAiLearningProgress] = useState<AILearningProgress>({ totalPlaysAnalyzed: 0, wins: 0, losses: 0 });
  const [aiBotLifetimeStats, setAiBotLifetimeStats] = useState<AIBotLifetimeStats>({ wins: 0, losses: 0, totalProfit: 0 });
  const [aiBotHistory, setAiBotHistory] = useState<AIBotHistoryItem[]>([]);
  const [latestLearnings, setLatestLearnings] = useState<string | null>(null);
  
  const [lastBackupExists, setLastBackupExists] = useState(false);
  
  const [isAlarmMuted, setIsAlarmMuted] = useState(() => localStorage.getItem(ALARM_MUTE_KEY) === 'true');

  const [highlightedGrandePaguePeriod, setHighlightedGrandePaguePeriod] = useState<GrandePaguePeriod | null>(null);

  // Auto-collection state
  const [autoCollectionStatus, setAutoCollectionStatus] = useState<AutoCollectionStatus>('running');
  const [collectionCountdown, setCollectionCountdown] = useState(0);
  const [autoCollectionError, setAutoCollectionError] = useState<string | null>(null);
  const collectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionStats, setCollectionStats] = useState<{ total: number; latest: Play | null; oldest: Play | null; }>({ total: 0, latest: null, oldest: null });
  const [autoCollectionPausedUntil, setAutoCollectionPausedUntil] = useState<number | null>(null);

  const [initialPatterns, setInitialPatterns] = useState<LearnedPatterns | null>(null);
  
  const [lastApiCallInfo, setLastApiCallInfo] = useState<ApiInfo | null>(null);

  // Pillar 2: Bankroll Co-Pilot
  const [bankrollManagement, setBankrollManagement] = useState<BankrollManagement>(initialBankrollManagement);
  const [pinkChaseConfig, setPinkChaseConfig] = useState<PinkChaseConfig>({ duration: 8 });

  const [signalHistory, setSignalHistory] = useState<Signal[]>([]);
  
  const [liveSignalHistory, setLiveSignalHistory] = useState<LiveSignalHistoryItem[]>([]);

  // Pillar 3: AI Co-Pilot Pattern Hunter Mode
  const [isPatternHunterModeActive, setIsPatternHunterModeActive] = useState(false);
  const [winningPatterns, setWinningPatterns] = useState<WinningPatternResult[]>([]);
  const [losingPatterns, setLosingPatterns] = useState<LosingPatternResult[]>([]);
  
  // Pillar 4: AI Co-Pilot House Hunter Mode
  const [isHouseHunterModeActive, setIsHouseHunterModeActive] = useState(false);
  const toggleHouseHunterMode = useCallback(() => setIsHouseHunterModeActive(prev => !prev), []);

  // Pillar 5: Pink Pressure Analysis
  const [pinkPressureAnalysis, setPinkPressureAnalysis] = useState<PinkPressureAnalysis | null>(null);
  const [purplePressureAnalysis, setPurplePressureAnalysis] = useState<PurplePressureAnalysis | null>(null);
  const [pinkPauseRisk, setPinkPauseRisk] = useState<PinkPauseRiskAnalysis | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(null);
  const dismissImportFeedback = useCallback(() => setImportFeedback(null), []);

  const [adminSignal, setAdminSignal] = useState<AdminSignal | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const lastSignalIdRef = useRef<string | null>(null);

  // Lux Sinais Bot State
    const [luxSignalsBot, setLuxSignalsBot] = useState<LuxSignalsBotState>(initialLuxSignalsBotState);
    const lastProcessedPlayTimestamp = useRef<string | null>(null);

  const togglePatternHunterMode = useCallback(() => {
    setIsPatternHunterModeActive(prev => !prev);
  }, []);

  const setFoundPatterns = useCallback(({ winning, losing }: { winning: WinningPatternResult[], losing: LosingPatternResult[] }) => {
    setWinningPatterns(winning);
    setLosingPatterns(losing);
  }, []);

    const currentTargetHouse = useMemo(() => {
        const { isMarketPaused = false, playsSinceLastPink = 0 } = localAnalysis?.summary ?? {};
        const { repeatingHousesSequence: sequence = [] } = localAnalysis?.hotSpots ?? {};

        if (isMarketPaused) return null;
        if (!sequence || sequence.length === 0) return null;

        const nextBestTarget = sequence[0];
        
        if (nextBestTarget > playsSinceLastPink) {
            return nextBestTarget;
        }

        return null;
    }, [localAnalysis?.summary?.isMarketPaused, localAnalysis?.hotSpots?.repeatingHousesSequence, localAnalysis?.summary?.playsSinceLastPink]);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [alertingPanels, setAlertingPanels] = useState({
    dailyPatternRanking: false,
    patternChaser: false,
  });

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    setNotifications(prev => {
        const newNotification: Notification = {
            ...notification,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            read: false,
        };
        
        if (user) {
            supabase.from('notifications').insert([{ ...newNotification, user_id: user.id }]).then();
        }

        try {
            const soundId = notification.type === 'pattern' ? 'pink-pattern-alert-sound' : 'notification-sound';
            const audio = document.getElementById(soundId) as HTMLAudioElement;
            if (audio) { audio.play().catch(e => console.error("Audio play failed:", e)); }
        } catch (e) { console.error("Could not play sound alert:", e); }
        
        return [newNotification, ...prev].slice(0, 50);
    });
  }, [user]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    if (!user) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).match({ id, user_id: user.id });
  }, [user]);

  const clearAllNotifications = useCallback(async () => {
    if (!user) return;
    setNotifications([]);
    await supabase.from('notifications').delete().eq('user_id', user.id);
  }, [user]);

  // Cooldowns
  const SUMMARY_COOLDOWN = 10 * 60; // 10 minutes
  const PREDICTION_COOLDOWN = 15 * 60; // 15 minutes
  const STRATEGY_COOLDOWN = 20 * 60; // 20 minutes
  
  const [isAutoAnalysisPaused, setIsAutoAnalysisPaused] = useState(false);
  const toggleAutoAnalysis = useCallback(() => {
    setIsAutoAnalysisPaused(prev => !prev);
  }, []);

  const [analysisCountdowns, setAnalysisCountdowns] = useState<AnalysisCountdowns>({
    summary: 0,
    prediction: 0,
    strategy: 0,
  });
  const analysisQueueRef = useRef<Array<'summary' | 'prediction' | 'strategy'>>([]);
  const isAnalysisRunningRef = useRef(false);
  const initialAnalysisDoneRef = useRef(false);

  useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 15 * 1000); // Check time every 15s
    return () => clearInterval(timerId);
  }, []);
  
  useEffect(() => {
      const interval = setInterval(async () => {
          try {
              const { data } = await supabase.from('admin_signals').select('*').limit(1);
              if (data && data.length > 0) {
                  const signal = data[0] as AdminSignal;
                  setAdminSignal(signal);
                   if (lastSignalIdRef.current !== signal.id) {
                      setIsDismissed(false);
                      lastSignalIdRef.current = signal.id;
                  }
              } else {
                  setAdminSignal(null);
                  lastSignalIdRef.current = null;
              }
          } catch (e) {
              console.error("Failed to check for admin signal", e);
              setAdminSignal(null);
          }
      }, 3000); // Check every 3 seconds

      return () => clearInterval(interval);
  }, []);

  const dismissAdminSignal = useCallback(() => {
      setIsDismissed(true);
  }, []);

  // This is a simplified version of what would be needed for saveData, addPlays, etc.
  const saveData = useCallback(async (plays: Play[]) => {
      if (!user) return;
      const sortedPlays = plays.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
      await supabase.from('plays_history').delete().eq('user_id', user.id);
      const { error } = await supabase.from('plays_history').insert(sortedPlays.map(p => ({ user_id: user.id, multiplier: p.multiplier, play_date: p.date, play_time: p.time })));
      if (error) { setError("Falha ao salvar o histórico no banco de dados."); } 
      else { setHistoricalData(sortedPlays); }
  }, [user]);

  const addPlays = useCallback(async (newPlays: Play[]) => {
      if (!user) return;
      const existingPlaysIds = new Set(historicalData.map(p => `${p.date}_${p.time}_${p.multiplier.toFixed(2)}`));
      const uniqueNewPlays = newPlays.filter(p => !existingPlaysIds.has(`${p.date}_${p.time}_${p.multiplier.toFixed(2)}`));
      if (uniqueNewPlays.length === 0) return;
      const { error } = await supabase.from('plays_history').insert(uniqueNewPlays.map(p => ({ user_id: user.id, multiplier: p.multiplier, play_date: p.date, play_time: p.time })));
      if (error) { setError("Falha ao adicionar novas jogadas."); } 
      else { setHistoricalData(prev => [...prev, ...uniqueNewPlays].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())); }
  }, [user, historicalData]);

  useEffect(() => {
    if (!user) {
        setHistoricalData([]); setAnalysis({}); setLocalAnalysis(null);
        setSignalHistory([]); setLiveSignalHistory([]);
        setAiLearningProgress({ totalPlaysAnalyzed: 0, wins: 0, losses: 0 });
        setAiBotLifetimeStats({ wins: 0, losses: 0, totalProfit: 0 });
        setAiBotHistory([]); setBankrollManagement(initialBankrollManagement);
        setLuxSignalsBot(initialLuxSignalsBotState);
        setNotifications([]);
        return;
    }
    
    const fetchUserData = async () => {
        setIsProcessing(true);
        try {
            const [
                historyRes, signalsRes, liveSignalsRes, learningRes, lifetimeStatsRes,
                botHistoryRes, bankrollRes, luxBotRes, learnedPatternsRes, notificationsRes, backupRes
            ] = await Promise.all([
                supabase.from('plays_history').select('multiplier, play_date, play_time').eq('user_id', user.id).order('play_date').order('play_time'),
                supabase.from('signal_history').select('data').eq('user_id', user.id),
                supabase.from('live_signal_history').select('data').eq('user_id', user.id),
                supabase.from('ai_learning_progress').select('data').eq('user_id', user.id),
                supabase.from('ai_bot_lifetime_stats').select('data').eq('user_id', user.id),
                supabase.from('ai_bot_history').select('data').eq('user_id', user.id),
                supabase.from('bankroll_management').select('data').eq('user_id', user.id),
                supabase.from('lux_signals_bot').select('data').eq('user_id', user.id),
                supabase.from('learned_patterns').select('data').eq('user_id', user.id),
                supabase.from('notifications').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }).limit(50),
                supabase.from('backups').select('data').eq('user_id', user.id).limit(1)
            ]);
            
            if (historyRes.data) setHistoricalData(historyRes.data.map((p: any) => ({ multiplier: p.multiplier, date: p.play_date, time: p.play_time })));
            if (signalsRes.data?.[0]) setSignalHistory(signalsRes.data[0].data);
            if (liveSignalsRes.data?.[0]) setLiveSignalHistory(liveSignalsRes.data[0].data);
            if (learningRes.data?.[0]) setAiLearningProgress(learningRes.data[0].data);
            if (lifetimeStatsRes.data?.[0]) setAiBotLifetimeStats(lifetimeStatsRes.data[0].data);
            if (botHistoryRes.data?.[0]) setAiBotHistory(botHistoryRes.data[0].data);
            if (bankrollRes.data?.[0]) setBankrollManagement(bankrollRes.data[0].data);
            if (luxBotRes.data?.[0]) setLuxSignalsBot(prev => ({ ...prev, ...luxBotRes.data![0].data, status: 'idle', isActive: false }));
            if (learnedPatternsRes.data?.[0]) {
                setInitialPatterns(learnedPatternsRes.data[0].data);
                setAnalysis(prev => ({ ...prev, learnedPatterns: learnedPatternsRes.data![0].data }));
            }
            if (notificationsRes.data) setNotifications(notificationsRes.data as Notification[]);
            setLastBackupExists(!!backupRes.data?.[0]);

        } catch (error) {
            console.error("Error fetching user data from Supabase:", error);
            setError("Falha ao carregar seus dados. Tente recarregar a página.");
        } finally {
            setIsProcessing(false);
        }
    };
    fetchUserData();
  }, [user]);

    const createSupabaseUpdater = <T,>(tableName: string, state: T) => {
        useEffect(() => {
            if (user && !isProcessing) { // Avoid writing back stale data during initial load
                supabase.from(tableName).upsert({ user_id: user.id, data: state }).then(({ error }) => {
                    if (error) console.error(`Error saving to ${tableName}:`, error);
                });
            }
        }, [state, user, isProcessing, tableName]);
    };

    createSupabaseUpdater('signal_history', signalHistory);
    createSupabaseUpdater('live_signal_history', liveSignalHistory);
    createSupabaseUpdater('ai_learning_progress', aiLearningProgress);
    createSupabaseUpdater('ai_bot_lifetime_stats', aiBotLifetimeStats);
    createSupabaseUpdater('ai_bot_history', aiBotHistory);
    createSupabaseUpdater('bankroll_management', bankrollManagement);
    createSupabaseUpdater('lux_signals_bot', luxSignalsBot);
    createSupabaseUpdater('learned_patterns', analysis.learnedPatterns);


  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    cooldownIntervalRef.current = setInterval(() => {
      setAnalysisCountdowns(prev => {
        const newSummary = Math.max(0, prev.summary - 1);
        const newPrediction = Math.max(0, prev.prediction - 1);
        const newStrategy = Math.max(0, prev.strategy - 1);
        
        if (isPremium && user && historicalData.length > 0 && !isAutoAnalysisPaused && initialAnalysisDoneRef.current) {
            if (newSummary === 0 && !analysisQueueRef.current.includes('summary')) analysisQueueRef.current.push('summary');
            if (newPrediction === 0 && !analysisQueueRef.current.includes('prediction')) analysisQueueRef.current.push('prediction');
            if (newStrategy === 0 && !analysisQueueRef.current.includes('strategy')) analysisQueueRef.current.push('strategy');
        }
        
        return { summary: newSummary, prediction: newPrediction, strategy: newStrategy };
      });
    }, 1000);

    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, [isPremium, user, historicalData.length, isAutoAnalysisPaused]);

  const addAIBotHistoryItem = useCallback((item: Omit<AIBotHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: AIBotHistoryItem = {
        ...item,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
    };
    setAiBotHistory(prev => [newItem, ...prev].slice(0, 500)); // Keep last 500 records
  }, []);

  const handleRefineKnowledge = useCallback(() => {
    if (aiBotHistory.length < 10) {
        alert("É necessário um histórico de pelo menos 10 operações do robô para refinar o conhecimento.");
        return;
    }

    const winReasons = new Map<string, number>();
    const lossReasons = new Map<string, number>();

    aiBotHistory.forEach(item => {
        if (item.reason && !item.reason.toLowerCase().includes('pausando') && !item.reason.toLowerCase().includes('aguardando')) {
            if (item.profit > 0) {
                winReasons.set(item.reason, (winReasons.get(item.reason) || 0) + 1);
            } else {
                lossReasons.set(item.reason, (lossReasons.get(item.reason) || 0) + 1);
            }
        }
    });

    const newObservations: string[] = [];
    const existingObservations = analysis.learnedPatterns?.generalObservations || [];
    const existingReasons = new Set(existingObservations.map(obs => { const match = obs.match(/A estratégia "([^"]+)"/); return match ? match[1] : null; }).filter(Boolean));

    winReasons.forEach((wins, reason) => {
        if (existingReasons.has(reason)) return;
        const losses = lossReasons.get(reason) || 0;
        const total = wins + losses;
        const winRate = (wins / total) * 100;
        if (total >= 5 && winRate > 70) { 
            newObservations.push(`A estratégia "${reason}" demonstrou alta assertividade (${winRate.toFixed(0)}% de acerto em ${total} amostras). Priorizar.`);
        }
    });

    lossReasons.forEach((losses, reason) => {
        if (existingReasons.has(reason)) return;
        const wins = winReasons.get(reason) || 0;
        const total = wins + losses;
        const winRate = (wins / total) * 100;
        if (total >= 5 && winRate < 35) {
            newObservations.push(`A estratégia "${reason}" demonstrou baixa assertividade (${winRate.toFixed(0)}% de acerto em ${total} amostras). Usar com cautela.`);
        }
    });
    
    if (newObservations.length > 0) {
        setAnalysis(prev => {
            const updatedPatterns = {
                ...(prev.learnedPatterns || { highValueTriggers: [], streakPatterns: [], timeBasedPatterns: [], generalObservations: [] }),
                generalObservations: [...(prev.learnedPatterns?.generalObservations || []), ...newObservations]
            };
            return { ...prev, learnedPatterns: updatedPatterns as LearnedPatterns };
        });
        alert(`${newObservations.length} novo(s) padrão(ões) de decisão foi(ram) adicionado(s) ao conhecimento da IA!`);
    } else {
        alert("Análise concluída. Nenhum padrão novo e conclusivo foi encontrado para refinar a IA no momento.");
    }
  }, [aiBotHistory, analysis.learnedPatterns]);

  const updateBankrollManagement = useCallback((updates: Partial<Omit<BankrollManagement, 'history' | 'currentBankroll'>>) => {
      setBankrollManagement(prev => {
          const newState = { ...prev, ...updates };
          
          if (updates.isActive === true && prev.isActive === false) {
              const startTransaction: BankrollTransaction = {
                  id: crypto.randomUUID(), type: 'Start', amount: newState.initialBankroll,
                  newBankroll: newState.initialBankroll, timestamp: new Date().toISOString(), notes: 'Sessão iniciada',
              };
              newState.history = [startTransaction];
              newState.currentBankroll = newState.initialBankroll;
          }
           if (newState.managementType === 'ia') {
                let percentage = 0.02; // Moderado
                if (newState.iaProfile === 'Conservador') percentage = 0.01;
                if (newState.iaProfile === 'Elite') percentage = 0.03;
                
                const newBaseBet = Math.max(MIN_BET, Math.min(MAX_BET, parseFloat((newState.currentBankroll * percentage).toFixed(2))));
                newState.baseBet = newBaseBet;
          }
           if (updates.baseBet !== undefined) {
             newState.baseBet = Math.max(MIN_BET, Math.min(MAX_BET, updates.baseBet));
           }

          return newState;
      });
  }, []);
  
  const updatePinkChaseConfig = useCallback((updates: Partial<PinkChaseConfig>) => {
      setPinkChaseConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const addBankrollTransaction = useCallback((type: 'Win' | 'Loss', amount: number) => {
      if (!bankrollManagement.isActive || amount === 0) return;

      setBankrollManagement(prev => {
          const change = type === 'Win' ? amount : -amount;
          const newBankroll = prev.currentBankroll + change;

          const newTransaction: BankrollTransaction = {
              id: crypto.randomUUID(), type: type, amount: Math.abs(amount), newBankroll: newBankroll, timestamp: new Date().toISOString(),
          };

          let newConsecutiveLosses = prev.consecutiveLosses;
          if (type === 'Loss') newConsecutiveLosses++;
          else if (type === 'Win') newConsecutiveLosses = 0;

          return { ...prev, currentBankroll: newBankroll, history: [...prev.history, newTransaction], consecutiveLosses: newConsecutiveLosses };
      });
  }, [bankrollManagement.isActive]);
  
  const addBankrollFunds = useCallback((amount: number) => {
    if (!bankrollManagement.isActive || amount <= 0) return;

    setBankrollManagement(prev => {
        const newBankroll = prev.currentBankroll + amount;
        const correctionTransaction: BankrollTransaction = {
            id: crypto.randomUUID(), type: 'Correction', amount: amount, newBankroll: newBankroll,
            timestamp: new Date().toISOString(), notes: 'Fundos adicionados à sessão.',
        };
        return { ...prev, currentBankroll: newBankroll, history: [...prev.history, correctionTransaction] };
    });
  }, [bankrollManagement.isActive]);

  const resetBankrollSession = useCallback(() => {
      setBankrollManagement(prev => ({
          ...initialBankrollManagement, initialBankroll: prev.initialBankroll, baseBet: prev.baseBet,
          onWinIncrease: prev.onWinIncrease, onLossIncrease: prev.onLossIncrease,
          maxBlueStreakStop: prev.maxBlueStreakStop, minPurpleStreakGo: prev.minPurpleStreakGo,
          stopWinPercentage: prev.stopWinPercentage, stopLossPercentage: prev.stopLossPercentage,
          isActive: false, currentBankroll: prev.initialBankroll, history: [], pinkHuntConsecutiveLosses: 0,
      }));
  }, []);


  // Live AI Signal Stream state
  const [isLiveSignalActive, setIsLiveSignalActive] = useState(false);
  const toggleLiveSignal = useCallback(() => {
      setIsLiveSignalActive(prev => !prev);
  }, []);
  
  const [hunterMode, setHunterMode] = useState<HunterMode>('Moderado');

  const updateHunterMode = useCallback((mode: HunterMode) => {
    setHunterMode(mode);
  }, []);

   useEffect(() => {
    if (user && initialPatterns === null) {
        // Attempt to load from Supabase first (handled in main useEffect)
        // If still null after fetch, load from local JSON
        if (!analysis.learnedPatterns) {
             fetch('/data/learned-patterns.json')
                .then(res => res.json())
                .then(data => {
                    setInitialPatterns(data);
                    setAnalysis(prev => ({ ...prev, learnedPatterns: data }));
                })
                .catch(e => console.error("Could not load default learned patterns", e));
        }
    }
  }, [user, initialPatterns, analysis.learnedPatterns]);

  useEffect(() => {
    if (user) {
        if (historicalData.length > 0) {
            const playsWithIds = historicalData.map((p, i) => ({...p, id: `${p.date}-${p.time}-${p.multiplier}-${i}`}));
            const processed = processPlaysLocally(historicalData);
            const ranking = calculateDailyPatternRanking(playsWithIds, winningPatterns, processed.pinkPatternAnalysis);

            setLocalAnalysis({ ...processed, dailyPatternRanking: ranking || undefined });
            setLastApiCallInfo({ provider: 'Local', keyIndex: 0 });
        } else {
            setLocalAnalysis(null);
        }
    }
  }, [historicalData, user, winningPatterns]);

    useEffect(() => {
    if (!localAnalysis || !localAnalysis.summary || !localAnalysis.hotSpots) {
      setPinkPressureAnalysis(null);
      return;
    }

    const { summary, hotSpots } = localAnalysis;
    const { playsSinceLastPink = 0, averagePinkInterval = 25, marketState, isMarketPaused } = summary;
    const { hottestPinkMinutes = [] } = hotSpots;
    
    let percentage = 0;
    const factors: string[] = [];

    if (averagePinkInterval > 0 && !isMarketPaused) {
        const basePressure = Math.min((playsSinceLastPink / averagePinkInterval) * 50, 60);
        percentage += basePressure;
        if (basePressure > 20) factors.push(`Distância da última rosa (${playsSinceLastPink} jogadas)`);
    }

    if (marketState === 'QUENTE') { percentage += 15; factors.push("Mercado em estado QUENTE"); } 
    else if (marketState === 'MUITO_QUENTE') { percentage += 30; factors.push("Mercado em estado MUITO QUENTE"); }
    
    const currentMinute = currentTime.getMinutes();
    const isHotMinute = hottestPinkMinutes.some(m => parseInt(m.minute.replace(':', '')) === currentMinute);
    const isNextMinuteHot = hottestPinkMinutes.some(m => parseInt(m.minute.replace(':', '')) === (currentMinute + 1) % 60);

    if (isHotMinute) { percentage += 30; factors.push(`Minuto :${String(currentMinute).padStart(2, '0')} é um MINUTO QUENTE`); }
    else if (isNextMinuteHot) { percentage += 15; factors.push(`Próximo minuto é quente`); }

    const last10Plays = historicalData.slice(-10).map(p => p.multiplier >= 10 ? ColorEnum.Pink : p.multiplier >= 2 ? ColorEnum.Purple : ColorEnum.Blue);

    for (const p of winningPatterns) {
        const pattern = p.pattern.slice(0, -1);
        if (pattern.length > 0 && last10Plays.length >= pattern.length) {
            const recentSlice = last10Plays.slice(-pattern.length);
            if (recentSlice.every((color, index) => color === pattern[index])) {
                percentage += 25;
                factors.push(`Padrão vencedor [${pattern.join('-')}] ativo`);
                break;
            }
        }
    }

     for (const p of losingPatterns) {
        const pattern = p.pattern;
        if (pattern.length > 0 && last10Plays.length >= pattern.length) {
            const recentSlice = last10Plays.slice(-pattern.length);
            if (recentSlice.every((color, index) => color === pattern[index])) {
                percentage = Math.max(0, percentage - 50); // Drastic reduction
                factors.push(`Gatilho de fuga [${pattern.join('-')}] detectado!`);
                break;
            }
        }
    }
    
    if(isMarketPaused){
        percentage = 5;
        factors.splice(0, factors.length, `PAUSA DE ROSAS ATIVA!`);
    }

    percentage = Math.max(0, Math.min(100, percentage));

    let level: PinkPressureAnalysis['level'] = 'Baixa';
    if (percentage >= 95) level = 'CRÍTICA';
    else if (percentage >= 75) level = 'Eminente';
    else if (percentage >= 40) level = 'Construindo';

    setPinkPressureAnalysis({ level, percentage, factors });
  }, [localAnalysis, winningPatterns, losingPatterns, historicalData, currentTime]);

  useEffect(() => {
    if (!localAnalysis?.summary || !historicalData.length) {
      setPinkPauseRisk(null);
      return;
    }
    
    const { playsSinceLastPink = 0 } = localAnalysis.summary;
    const historicalPauses = localAnalysis.pinkPauseHistory ?? [];
    const factors: string[] = [];
    let percentage = 0;

    const last5Plays = historicalData.slice(-5);
    const giantMultiplier = last5Plays.find(p => p.multiplier > 100);
    if (giantMultiplier) {
        percentage = 95; // Critical
        factors.push(`Efeito Pós-Gigante (${giantMultiplier.multiplier.toFixed(0)}x)`);
    } else {
        if (historicalPauses.length > 0) {
            const avgPauseDuration = historicalPauses.reduce((sum, p) => sum + p.duration, 0) / historicalPauses.length;
            if (playsSinceLastPink > avgPauseDuration * 0.75) {
                const proximityFactor = Math.min(((playsSinceLastPink / avgPauseDuration) - 0.75) * 100, 50);
                percentage += proximityFactor;
                factors.push(`Proximidade do Limite (média: ${avgPauseDuration.toFixed(0)})`);
            }
        }
    }

    percentage = Math.max(0, Math.min(100, percentage));
    
    let level: PinkPauseRiskAnalysis['level'] = 'Baixo';
    if (percentage >= 90) level = 'CRÍTICO';
    else if (percentage >= 70) level = 'Alto';
    else if (percentage >= 40) level = 'Médio';

    setPinkPauseRisk({ level, percentage, factors });
}, [localAnalysis, historicalData]);

  const prevAlertStateRef = useRef({ doublePink: false, closeRepetition: false });

  useEffect(() => {
    const doublePinkAlerting = localAnalysis?.pinkPatternAnalysis?.doublePink.isAlerting ?? false;
    const closeRepetitionAlerting = localAnalysis?.pinkPatternAnalysis?.closeRepetition.isAlerting ?? false;
    
    if (doublePinkAlerting && !prevAlertStateRef.current.doublePink) {
        addNotification({
            type: 'pattern', title: 'Padrão de Rosa Dupla Detectado!',
            message: 'Próxima rosa esperada entre a 2ª e 11ª rodada (maior probabilidade ~5ª).',
        });
    }

    if (closeRepetitionAlerting && !prevAlertStateRef.current.closeRepetition) {
         addNotification({
            type: 'pattern', title: 'Repetição Próxima de Rosa Detectado!',
            message: 'Próxima rosa esperada em até 7 rodadas (maior probabilidade ~3ª-4ª).',
        });
    }

    prevAlertStateRef.current = { doublePink: doublePinkAlerting, closeRepetition: closeRepetitionAlerting };
  }, [localAnalysis?.pinkPatternAnalysis, addNotification]);

    useEffect(() => {
        if (!user || !isPremium) return;
        const currentLength = historicalData.length;
        if (lastTrainCountRef.current === 0 && currentLength > 0) {
            lastTrainCountRef.current = currentLength;
        }
        const newPlaysSinceLastTrain = currentLength - lastTrainCountRef.current;
        setAutoTrainingProgress(newPlaysSinceLastTrain % AUTO_TRAIN_TRIGGER_COUNT);
        if (newPlaysSinceLastTrain >= AUTO_TRAIN_TRIGGER_COUNT && !isAutoTraining) {
            const handleAutoTraining = async () => {
                setIsAutoTraining(true);
                try {
                    const chunk = historicalData.slice(-AUTO_TRAIN_CHUNK_SIZE);
                    const currentLearnedPatterns = analysis.learnedPatterns || initialPatterns || { highValueTriggers: [], streakPatterns: [], timeBasedPatterns: [], generalObservations: [] };
                    const { patterns: newLearnedPatterns, apiInfo } = await getHolisticTrainingFeedback(chunk, currentLearnedPatterns);
                    setLastApiCallInfo(apiInfo);
                    const mergedPatterns = {
                        highValueTriggers: [...new Set([...(currentLearnedPatterns.highValueTriggers || []), ...(newLearnedPatterns.highValueTriggers || [])])],
                        streakPatterns: [...new Set([...(currentLearnedPatterns.streakPatterns || []), ...(newLearnedPatterns.streakPatterns || [])])],
                        timeBasedPatterns: [...new Set([...(currentLearnedPatterns.timeBasedPatterns || []), ...(newLearnedPatterns.timeBasedPatterns || [])])],
                        generalObservations: [...new Set([...(currentLearnedPatterns.generalObservations || []), ...(newLearnedPatterns.generalObservations || [])])],
                    };
                    setAnalysis(prev => ({ ...prev, learnedPatterns: mergedPatterns }));
                    setAiLearningProgress(prev => ({ ...prev, totalPlaysAnalyzed: prev.totalPlaysAnalyzed + Math.min(chunk.length, AUTO_TRAIN_TRIGGER_COUNT) }));
                } catch (error) { console.error("Falha no ciclo de auto-aprendizado:", error); } 
                finally { lastTrainCountRef.current = currentLength; setIsAutoTraining(false); }
            };
            handleAutoTraining();
        }
    }, [historicalData.length, user, isPremium, isAutoTraining, analysis.learnedPatterns, initialPatterns]);

  useEffect(() => {
    if (user && isPremium && historicalData.length > 50 && !initialAnalysisDoneRef.current) {
        // initialAnalysisDoneRef.current = true;
        // analysisQueueRef.current.push('summary');
    }
  }, [user, isPremium, historicalData.length]);

  useEffect(() => {
    if (winningPatterns.length === 0 || historicalData.length < 10) return;
    const lastPlays = historicalData.slice(-10).map(p => p.multiplier >= 10 ? ColorEnum.Pink : p.multiplier >= 2 ? ColorEnum.Purple : ColorEnum.Blue);
    for (const p of winningPatterns) {
        const pattern = p.pattern.slice(0, -1);
        if (pattern.length > 0 && lastPlays.length >= pattern.length) {
            const recentSlice = lastPlays.slice(-pattern.length);
            if (recentSlice.every((color, index) => color === pattern[index])) {
                const nextColor = p.pattern[p.pattern.length - 1];
                addNotification({
                    type: 'pattern', title: 'Padrão Ativo!',
                    message: `Padrão "${pattern.join(', ')}" está se formando. Próxima cor provável: ${nextColor}.`,
                });
                break; 
            }
        }
    }
  }, [historicalData, winningPatterns, addNotification]);

  useEffect(() => {
    const checkHotMinutes = () => {
        if (!localAnalysis?.hotSpots?.hottestPinkMinutes) return;
        const now = new Date();
        const currentMinute = now.getMinutes();
        const nextMinute = (currentMinute + 1) % 60;
        const hotMinutes = localAnalysis.hotSpots.hottestPinkMinutes.map(m => parseInt(m.minute.replace(':', '')));
        if (hotMinutes.includes(currentMinute)) {
            addNotification({
                type: 'hot_minute', title: 'Minuto Quente ATIVO!',
                message: `O minuto :${String(currentMinute).padStart(2, '0')} é um minuto quente para rosas. Fique atento!`,
            });
        } else if (hotMinutes.includes(nextMinute)) {
            addNotification({
                type: 'hot_minute', title: 'Alerta de Minuto Quente',
                message: `O próximo minuto (:${String(nextMinute).padStart(2, '0')}) é um minuto quente para rosas. Prepare-se!`,
            });
        }
    };
    const interval = setInterval(checkHotMinutes, 30 * 1000);
    return () => clearInterval(interval);
  }, [localAnalysis, addNotification]);

  const prevTargetHouseRef = useRef<number | null>(null);
  useEffect(() => {
      if (currentTargetHouse !== null && currentTargetHouse !== prevTargetHouseRef.current) {
          setAlertingPanels(prev => ({ ...prev, patternChaser: true }));
          const timer = setTimeout(() => { setAlertingPanels(prev => ({ ...prev, patternChaser: false })); }, 6000);
          return () => clearTimeout(timer);
      }
      prevTargetHouseRef.current = currentTargetHouse;
  }, [currentTargetHouse]);
  
  useEffect(() => {
      if (!localAnalysis?.dailyPatternRanking || historicalData.length < 5) return;
      const recentColors = historicalData.slice(-5).map(p => p.multiplier >= 10 ? ColorEnum.Pink : p.multiplier >= 2 ? ColorEnum.Purple : ColorEnum.Blue);
      let patternMatched = false;
      for (const rankedPattern of localAnalysis.dailyPatternRanking) {
          if (!rankedPattern.pattern) continue; 
          const patternToMatch = rankedPattern.pattern;
          if (recentColors.length >= patternToMatch.length) {
              const slice = recentColors.slice(-patternToMatch.length);
              if (slice.every((color, index) => color === patternToMatch[index])) {
                  patternMatched = true;
                  break;
              }
          }
      }
      if (patternMatched) {
          setAlertingPanels(prev => ({ ...prev, dailyPatternRanking: true }));
          const timer = setTimeout(() => { setAlertingPanels(prev => ({ ...prev, dailyPatternRanking: false })); }, 6000);
          return () => clearTimeout(timer);
      }
  }, [historicalData, localAnalysis?.dailyPatternRanking]);
    
  
  const clearData = useCallback(async () => {
      if(!user) return;
      setHistoricalData([]); setAnalysis({ learnedPatterns: initialPatterns || undefined });
      setLocalAnalysis(null); setLastAnalysisHash(null); setError(null);
      setSignalHistory([]); setLiveSignalHistory([]); setAiBotHistory([]);
      setHighlightedGrandePaguePeriod(null);
      await Promise.all([
          supabase.from('plays_history').delete().eq('user_id', user.id),
          supabase.from('signal_history').delete().eq('user_id', user.id),
          // ... and so on for all other tables
      ]);
  }, [user, initialPatterns]);
  
    // --- START: Implemented Handlers ---
    const handleAnalyzeSummary = useCallback(async () => {
      if (!isPremium || !user || historicalData.length === 0) return;
      setIsSummaryLoading(true);
      try {
          const result = await getSummaryAnalysis(historicalData.slice(-500), bankroll, signalHistory, analysis.learnedPatterns);
          const { apiInfo, ...analysisData } = result;
          setAnalysis(prev => ({ ...prev, ...analysisData }));
          setLastApiCallInfo(apiInfo);
          setLastAnalysisHash(JSON.stringify(historicalData));
          setAnalysisCountdowns(prev => ({ ...prev, summary: SUMMARY_COOLDOWN }));
          if (!initialAnalysisDoneRef.current) {
              initialAnalysisDoneRef.current = true;
          }
      } catch (err: any) {
          setError(err.message);
      } finally {
          setIsSummaryLoading(false);
      }
    }, [user, isPremium, historicalData, signalHistory, analysis.learnedPatterns, bankroll]);

    const handleAnalyzePredictions = useCallback(async () => {
        if (!isPremium || !user || !analysis.summary || !analysis.hotSpots || !analysis.grandePagueAnalysis) return;
        setIsPredictionLoading(true);
        try {
            const result = await getPredictionAnalysis(historicalData.slice(-500), analysis.summary, analysis.hotSpots, analysis.grandePagueAnalysis, signalHistory, analysis.learnedPatterns, user.risk_profile);
            const { apiInfo, ...predictionData } = result;
            setAnalysis(prev => ({ ...prev, ...predictionData }));
            setLastApiCallInfo(apiInfo);
            setAnalysisCountdowns(prev => ({ ...prev, prediction: PREDICTION_COOLDOWN }));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsPredictionLoading(false);
        }
    }, [user, isPremium, historicalData, analysis, signalHistory]);

    const handleAnalyzeStrategies = useCallback(async () => {
        if (!isPremium || !user || !analysis.summary || !analysis.hotSpots) return;
        setIsStrategyLoading(true);
        try {
            const { strategies, apiInfo } = await getStrategyRecommendations(historicalData.slice(-500), bankroll, analysis.summary, analysis.hotSpots, analysis.learnedPatterns, user.risk_profile);
            setAnalysis(prev => ({ ...prev, strategyRecommendations: strategies }));
            setLastApiCallInfo(apiInfo);
            setAnalysisCountdowns(prev => ({ ...prev, strategy: STRATEGY_COOLDOWN }));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsStrategyLoading(false);
        }
    }, [user, isPremium, historicalData, analysis, bankroll]);

    const handleAnalyzeCharts = useCallback(async () => {
        if (!isPremium || !user) return;
        setIsChartLoading(true);
        try {
            const { chartsData, apiInfo } = await getChartsData(historicalData);
            setAnalysis(prev => ({ ...prev, chartsData }));
            setLastApiCallInfo(apiInfo);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsChartLoading(false);
        }
    }, [user, isPremium, historicalData]);

    const handleAnalyzeGrandePagueStrategy = useCallback(async (period: GrandePaguePeriod) => {
        if (!isPremium || !user) return;
        setIsGrandePagueStrategyLoading(true);
        try {
            const { strategy, apiInfo } = await getGrandePagueStrategy(period.plays);
            setAnalysis(prev => ({ ...prev, grandePagueStrategy: strategy }));
            setLastApiCallInfo(apiInfo);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsGrandePagueStrategyLoading(false);
        }
    }, [user, isPremium]);

    const handleHolisticTraining = useCallback(async (file: File) => {
        if (!isPremium || !user) return;
        setIsTraining(true);
        setTrainingStatus({ message: 'Lendo arquivo...', fileName: file.name, processedCount: 0, totalCount: 0, isComplete: false, error: null });
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: ["multiplier", "date", "time"] });

            const plays: Play[] = jsonData.slice(1).map(row => ({
                multiplier: parseFloat(String(row.multiplier).replace('x', '').replace(',', '.')),
                date: typeof row.date === 'number' ? new Date(1900, 0, row.date - 1).toISOString().split('T')[0] : new Date(row.date).toISOString().split('T')[0],
                time: typeof row.time === 'number' ? new Date(1900, 0, 1, 0, 0, Math.round(row.time * 86400)).toISOString().substr(11, 8) : new Date(row.time).toISOString().substr(11, 8),
            })).filter(p => !isNaN(p.multiplier) && p.date && p.time);

            const totalCount = plays.length;
            setTrainingStatus(prev => ({ ...prev!, totalCount }));
            let currentLearnedPatterns = analysis.learnedPatterns || initialPatterns || { highValueTriggers: [], streakPatterns: [], timeBasedPatterns: [], generalObservations: [] };

            for (let i = 0; i < totalCount; i += CHUNK_SIZE) {
                const chunk = plays.slice(i, i + CHUNK_SIZE);
                setTrainingStatus(prev => ({ ...prev!, message: `Analisando lote ${i / CHUNK_SIZE + 1}...`, processedCount: i }));
                const { patterns: newLearnedPatterns, summary, apiInfo } = await getHolisticTrainingFeedback(chunk, currentLearnedPatterns);
                setLastApiCallInfo(apiInfo);
                currentLearnedPatterns = {
                    highValueTriggers: [...new Set([...(currentLearnedPatterns.highValueTriggers || []), ...(newLearnedPatterns.highValueTriggers || [])])],
                    streakPatterns: [...new Set([...(currentLearnedPatterns.streakPatterns || []), ...(newLearnedPatterns.streakPatterns || [])])],
                    timeBasedPatterns: [...new Set([...(currentLearnedPatterns.timeBasedPatterns || []), ...(newLearnedPatterns.timeBasedPatterns || [])])],
                    generalObservations: [...new Set([...(currentLearnedPatterns.generalObservations || []), ...(newLearnedPatterns.generalObservations || [])])],
                };
                if (summary) setLatestLearnings(summary);
            }
            setAnalysis(prev => ({ ...prev, learnedPatterns: currentLearnedPatterns }));
            setTrainingStatus(prev => ({ ...prev!, message: 'Treinamento concluído!', processedCount: totalCount, isComplete: true }));
        } catch (err: any) {
            setTrainingStatus(prev => ({ ...prev!, error: err.message, isComplete: true }));
        } finally {
            setIsTraining(false);
        }
    }, [user, isPremium, analysis.learnedPatterns, initialPatterns]);

    const handlePredictionFeedback = useCallback((predictionId: string, outcome: SignalOutcome) => {
        const prediction = [
          ...(analysis.prediction || []),
          ...(analysis.restOfDayPrediction || []),
          ...(analysis.prediction50x || []),
          ...(analysis.predictionGrandePague || []),
          ...(analysis.predictionVerticalRepeat || [])
        ].find(p => p.id === predictionId);
    
        if (prediction) {
          const newSignal: Signal = {
            prediction,
            outcome,
            timestamp: new Date().toISOString(),
          };
          setSignalHistory(prev => [newSignal, ...prev].slice(0, 100)); // Keep last 100 signals
        }
    }, [analysis]);

    const parsePlaysFromText = (text: string): Play[] => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const plays: Play[] = [];
        const today = new Date().toISOString().split('T')[0];
    
        lines.forEach(line => {
          const parts = line.split(/\s+/);
          const multiplierMatch = parts.find(p => p.includes('x'));
          const timeMatch = parts.find(p => /\d{2}:\d{2}:\d{2}/.test(p));
          if (multiplierMatch && timeMatch) {
            const multiplier = parseFloat(multiplierMatch.replace('x', '').replace(',', '.'));
            if (!isNaN(multiplier)) {
              plays.push({ multiplier, time: timeMatch, date: today });
            }
          }
        });
        return plays.reverse(); // Assuming newest is first
    };

    const handleFileUpload = useCallback(async (file: File) => {
        setIsProcessing(true);
        setError(null);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: ["multiplier", "date", "time"] });
            
            const plays = jsonData.slice(1).map(row => ({
                multiplier: parseFloat(String(row.multiplier).replace('x', '').replace(',', '.')),
                date: typeof row.date === 'number' ? new Date(1900, 0, row.date - 1).toISOString().split('T')[0] : new Date(row.date).toISOString().split('T')[0],
                time: typeof row.time === 'number' ? new Date(1900, 0, 1, 0, 0, Math.round(row.time * 86400)).toISOString().substr(11, 8) : new Date(row.time).toISOString().substr(11, 8),
            })).filter(p => !isNaN(p.multiplier) && p.date && p.time);
    
            await saveData(plays);
        } catch (err: any) {
            setError("Erro ao processar o arquivo. Verifique o formato.");
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    }, [saveData]);

    const handlePastedText = useCallback(async (text: string) => {
        setIsProcessing(true);
        setError(null);
        try {
            const plays = parsePlaysFromText(text);
            if (plays.length === 0) throw new Error("Nenhuma jogada válida encontrada no texto.");
            await saveData(plays);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    }, [saveData]);

    const handleImageUpload = useCallback(async (file: File, selections?: Rect[]) => {
        setIsProcessing(true);
        setError(null);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = (reader.result as string).split(',')[1];
                try {
                    const { plays, apiInfo } = await extractPlaysFromImage(base64String, selections);
                    setLastApiCallInfo(apiInfo);
                    if (plays.length === 0) throw new Error("A IA não conseguiu extrair jogadas da imagem.");
                    await saveData(plays);
                } catch (e: any) {
                    setError(e.message);
                } finally {
                    setIsProcessing(false);
                }
            };
            reader.readAsDataURL(file);
        } catch (err: any) {
            setError("Erro ao processar a imagem.");
            setIsProcessing(false);
        }
    }, [saveData]);

    const handleBackup = useCallback(async () => {
        if (!user) return;
        const backupData = {
            version: 1,
            timestamp: new Date().toISOString(),
            profile: { id: user.id, displayName: user.display_name },
            data: {
                historicalData, signalHistory, liveSignalHistory, aiLearningProgress,
                aiBotLifetimeStats, aiBotHistory, bankrollManagement,
                learnedPatterns: analysis.learnedPatterns,
            }
        };
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `radar_aviator_backup_${user.display_name}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        await supabase.from('backups').upsert({ user_id: user.id, data: backupData });
        setLastBackupExists(true);
    }, [user, historicalData, signalHistory, liveSignalHistory, aiLearningProgress, aiBotLifetimeStats, aiBotHistory, bankrollManagement, analysis.learnedPatterns]);

    const handleRestore = useCallback(async (file: File) => {
        setIsProcessing(true);
        try {
            const text = await file.text();
            const backupData = JSON.parse(text);
            if (backupData.version !== 1 || !backupData.data) {
                throw new Error("Arquivo de backup inválido ou incompatível.");
            }
            const data = backupData.data;
            if (data.historicalData) setHistoricalData(data.historicalData);
            if (data.signalHistory) setSignalHistory(data.signalHistory);
            if (data.liveSignalHistory) setLiveSignalHistory(data.liveSignalHistory);
            if (data.aiLearningProgress) setAiLearningProgress(data.aiLearningProgress);
            if (data.aiBotLifetimeStats) setAiBotLifetimeStats(data.aiBotLifetimeStats);
            if (data.aiBotHistory) setAiBotHistory(data.aiBotHistory);
            if (data.bankrollManagement) setBankrollManagement(data.bankrollManagement);
            if (data.learnedPatterns) setAnalysis(prev => ({ ...prev, learnedPatterns: data.learnedPatterns }));
            await saveData(data.historicalData || []);
        } catch (e: any) {
            setError(`Falha ao restaurar backup: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    }, [user, saveData]);
    
    const handleRestoreLastBackup = useCallback(async () => {
        if (!user) return;
        setIsProcessing(true);
        try {
            const { data: backupRes, error } = await supabase.from('backups').select('data').eq('user_id', user.id).limit(1);
            if (error || !backupRes || backupRes.length === 0) {
                throw new Error("Nenhum backup encontrado no servidor.");
            }
            const backupData = backupRes[0].data as any;
    
            if (backupData.version !== 1 || !backupData.data) {
                throw new Error("Backup do servidor inválido ou incompatível.");
            }
            
            const data = backupData.data;
            if (data.historicalData) setHistoricalData(data.historicalData);
            if (data.signalHistory) setSignalHistory(data.signalHistory);
            if (data.liveSignalHistory) setLiveSignalHistory(data.liveSignalHistory);
            if (data.aiLearningProgress) setAiLearningProgress(data.aiLearningProgress);
            if (data.aiBotLifetimeStats) setAiBotLifetimeStats(data.aiBotLifetimeStats);
            if (data.aiBotHistory) setAiBotHistory(data.aiBotHistory);
            if (data.bankrollManagement) setBankrollManagement(data.bankrollManagement);
            if (data.learnedPatterns) setAnalysis(prev => ({ ...prev, learnedPatterns: data.learnedPatterns }));
    
            await saveData(data.historicalData || []);
        } catch (e: any) {
            setError(`Falha ao restaurar último backup: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    }, [user, saveData]);

    const handleLearnedPatternsUpload = useCallback(async (file: File) => {
        setIsProcessing(true);
        try {
            const text = await file.text();
            const newPatterns = JSON.parse(text);
  
            const currentPatterns = analysis.learnedPatterns || { highValueTriggers: [], streakPatterns: [], timeBasedPatterns: [], generalObservations: [] };
            
            const delta: ImportFeedback['delta'] = {
                highValueTriggers: 0, streakPatterns: 0, timeBasedPatterns: 0, generalObservations: 0
            };
  
            const merge = (key: keyof LearnedPatterns) => {
                const currentSet = new Set(currentPatterns[key] || []);
                const newItems = newPatterns[key] || [];
                const originalSize = currentSet.size;
                newItems.forEach((item: string) => currentSet.add(item));
                delta[key] = currentSet.size - originalSize;
                return Array.from(currentSet);
            };
  
            const merged: LearnedPatterns = {
                highValueTriggers: merge('highValueTriggers'),
                streakPatterns: merge('streakPatterns'),
                timeBasedPatterns: merge('timeBasedPatterns'),
                generalObservations: merge('generalObservations'),
            };
            
            const totalNew = Object.values(delta).reduce((sum, val) => sum + val, 0);
            const totalPatterns = Object.values(merged).reduce((sum, arr) => sum + arr.length, 0);
  
            setAnalysis(prev => ({ ...prev, learnedPatterns: merged }));
            setImportFeedback({ newPatternsCount: totalNew, totalPatternsCount: totalPatterns, delta });
  
        } catch (e: any) {
            setError(`Falha ao importar padrões: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    }, [analysis.learnedPatterns]);
    // --- END: Implemented Handlers ---

    return {
        error, analysis, localAnalysis, historicalData, bankroll, isProcessing,
        isSummaryLoading, isStrategyLoading, isChartLoading, isPredictionLoading,
        isGrandePagueStrategyLoading, isTraining, trainingStatus, aiLearningProgress,
        aiBotLifetimeStats, lastApiCallInfo, aiBotHistory, latestLearnings,
        signalHistory, lastBackupExists, isAlarmMuted, highlightedGrandePaguePeriod,
        lastAnalysisHash, autoCollectionStatus, collectionCountdown, autoCollectionError,
        isCollecting, collectionStats, isLiveSignalActive, liveSignalHistory,
        bankrollManagement, hunterMode, isAutoTraining, autoTrainingProgress,
        isPatternHunterModeActive, winningPatterns, losingPatterns, isHouseHunterModeActive,
        currentTargetHouse, pinkChaseConfig, notifications, analysisCountdowns,
        pinkPressureAnalysis, pinkPauseRisk, purplePressureAnalysis, 
        pinkPatternAnalysis: localAnalysis?.pinkPatternAnalysis,
        importFeedback, alertingPanels, adminSignal: isDismissed ? null : adminSignal,
        luxSignalsBot, autoTrainingTriggerCount: AUTO_TRAIN_TRIGGER_COUNT,
        isAutoAnalysisPaused,

        // Handlers
        clearData, 
        handleFileUpload, 
        handlePastedText, 
        handleImageUpload, 
        dismissError: useCallback(() => setError(null), []),
        handleAnalyzeSummary, 
        handleAnalyzePredictions, 
        handleAnalyzeStrategies,
        handleAnalyzeCharts, 
        handleAnalyzeGrandePagueStrategy, 
        handleHolisticTraining,
        handlePredictionFeedback, 
        handleBackup, handleRestore, handleRestoreLastBackup,
        toggleAlarmMute: useCallback(() => {
            setIsAlarmMuted(prev => {
                const newState = !prev;
                localStorage.setItem(ALARM_MUTE_KEY, String(newState));
                return newState;
            });
        }, []), 
        setError, 
        toggleAutoCollection: useCallback(() => {
            setAutoCollectionStatus(prev => prev === 'running' ? 'idle' : 'running');
        }, []),
        toggleLiveSignal, updateHunterMode,
        updateBankrollManagement, resetBankrollSession, addBankrollTransaction, addBankrollFunds,
        handleLearnedPatternsUpload, 
        togglePatternHunterMode, setFoundPatterns,
        toggleHouseHunterMode, updatePinkChaseConfig, markNotificationAsRead,
        clearAllNotifications, addNotification, toggleAutoAnalysis, dismissImportFeedback,
        updateAIBotLifetimeStats: useCallback((result: { profit: number }) => {
            setAiBotLifetimeStats(prev => ({
                wins: result.profit > 0 ? prev.wins + 1 : prev.wins,
                losses: result.profit < 0 ? prev.losses + 1 : prev.losses,
                totalProfit: prev.totalProfit + result.profit,
            }));
        }, []), 
        addAIBotHistoryItem, handleRefineKnowledge,
        dismissAdminSignal, 
        updateLuxSignalsBot: useCallback((updates: Partial<LuxSignalsBotState>) => {
            setLuxSignalsBot(prev => ({...prev, ...updates}));
        }, []), 
        startLuxSignalsBot: useCallback(() => {
            setLuxSignalsBot(prev => ({
                ...prev,
                isActive: true,
                status: 'running',
                sessionStartBankroll: prev.currentBankroll,
                history: [],
                wins: 0,
                losses: 0,
            }));
            lastProcessedPlayTimestamp.current = null;
        }, []), 
        stopLuxSignalsBot: useCallback(() => {
            setLuxSignalsBot(prev => ({...prev, isActive: false, status: 'idle' }));
        }, []),
    };
};