import { useState, useEffect, useRef } from 'react';
import type { Analysis, Play, AIBotHistoryItem, BankrollManagement, WinningPatternResult, LosingPatternResult, Color, PinkChaseConfig, HunterMode, PinkPauseRiskAnalysis, Notification, PurplePressureAnalysis, IATacticWeights, PinkPressureAnalysis, ConfidenceReport, TacticScore, PinkPatternAnalysis, RoundResult } from '../types';
import { Color as ColorEnum } from '../types';


type BetResult = { didWin: boolean; withdrawnAt: number };

interface Bet {
    amount: number;
    target: number;
}

export interface BotState {
  status: string;
  reason: string;
  plan: {
    bet1: Bet;
    bet2: Bet;
  };
  apostaFuturaWin: { a1: Bet; a2: Bet };
  apostaFuturaLoss: { a1: Bet; a2: Bet };
  lastRoundResult: RoundResult | null;
  animationKey: number;
}

interface UseAIBotLogicProps {
    analysis: Partial<Analysis>;
    localAnalysis: Partial<Analysis> | null;
    historicalData: Play[];
    isPremium: boolean;
    updateAIBotLifetimeStats: (result: { profit: number }) => void;
    bankrollManagement: BankrollManagement;
    updateBankroll: (updates: Partial<Omit<BankrollManagement, 'history' | 'currentBankroll'>>) => void;
    addBankrollTransaction: (type: 'Win' | 'Loss', amount: number) => void;
    addAIBotHistoryItem: (item: Omit<AIBotHistoryItem, 'id' | 'timestamp'>) => void;
    isPatternHunterModeActive: boolean;
    winningPatterns: WinningPatternResult[];
    losingPatterns: LosingPatternResult[];
    isHouseHunterModeActive: boolean;
    currentTargetHouse: number | null;
    pinkChaseConfig: PinkChaseConfig;
    hunterMode: HunterMode;
    pinkPauseRisk: PinkPauseRiskAnalysis | null;
    pinkPressureAnalysis: PinkPressureAnalysis | null;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    purplePressureAnalysis: PurplePressureAnalysis | null;
    pinkPatternAnalysis?: PinkPatternAnalysis | null;
    onSessionEnd: (reason: { type: 'win' | 'loss'; profitOrLoss: number; nextBestTimeSuggestion?: string }) => void;
}

const MIN_BET = 1.00;
const MAX_BET = 700.00;
const APOSTA_THRESHOLD = 65; // Limiar de confiança para apostar

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

// Dados da análise preditiva baseados no princípio de que sequências longas de azul são mais raras.
const PROB_AZUL_CONTINUA: { [streak: number]: number } = {
  1: 0.52, 2: 0.51, 3: 0.50, 4: 0.48, 5: 0.45, 6: 0.42, 7: 0.40, 8: 0.35, 9: 0.30, 10: 0.25,
  11: 0.20, 12: 0.15, 13: 0.12, 14: 0.10, 15: 0.08, 16: 0.05, 17: 0.05, 18: 0.05, 19: 0.05,
  20: 0.05, 21: 0.05, 22: 0.05, 23: 0.05, 24: 0.05, 25: 0.05,
};


export const useAIBotLogic = ({
    analysis,
    localAnalysis,
    historicalData,
    isPremium,
    updateAIBotLifetimeStats,
    bankrollManagement,
    updateBankroll,
    addBankrollTransaction,
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
    onSessionEnd,
}: UseAIBotLogicProps) => {
    const { 
        isActive, initialBankroll, currentBankroll, 
        stopWinPercentage, stopLossPercentage, baseBet, onWinIncrease, onLossIncrease,
        iaTacticWeights, isDualStrategyActive, consecutiveLosses, maxBlueStreakStop, isSmartPresetActive,
        pinkHuntConsecutiveLosses, pinkHuntMaxLosses
    } = bankrollManagement;
    const lastPlayRef = useRef<Play | null>(null);
    const lastBetConfidence = useRef(0);
    const isSmartPauseActiveRef = useRef(false);
    const lastNotifiedProfile = useRef<HunterMode | null>(null);
    const sessionEndedRef = useRef(false);

    const [botState, setBotState] = useState<BotState>({
        status: 'INATIVO',
        reason: 'Aguardando início da sessão.',
        plan: { bet1: { amount: 0, target: 2.00 }, bet2: { amount: 0, target: 5.00 } },
        apostaFuturaWin: { a1: { amount: 0, target: 0 }, a2: { amount: 0, target: 0 } },
        apostaFuturaLoss: { a1: { amount: 0, target: 0 }, a2: { amount: 0, target: 0 } },
        lastRoundResult: null,
        animationKey: 0,
    });
    const [confidenceReport, setConfidenceReport] = useState<ConfidenceReport | null>(null);
    
    useEffect(() => {
        if (isActive) {
            sessionEndedRef.current = false;
        } else {
            lastNotifiedProfile.current = null;
        }
    }, [isActive]);

    useEffect(() => {
        if (!isPremium || !isActive || historicalData.length < 25) {
            setBotState(prev => ({ ...prev, status: 'AGUARDANDO', reason: 'Dados insuficientes ou sessão inativa.' }));
            return;
        }
        
        if (sessionEndedRef.current) return;

        const lastPlay = historicalData[historicalData.length - 1];
        if (lastPlayRef.current && lastPlay.time === lastPlayRef.current.time) return;

        // Process previous round result before making a new decision
        if (lastPlayRef.current && botState.plan.bet1.amount > 0) {
            const bets = botState.plan;
            let profit = 0;
            const bet1Result: BetResult | null = { didWin: lastPlay.multiplier >= bets.bet1.target, withdrawnAt: bets.bet1.target };
            const bet2Result: BetResult | null = bets.bet2.amount > 0 ? { didWin: lastPlay.multiplier >= bets.bet2.target, withdrawnAt: bets.bet2.target } : null;

            profit += bet1Result.didWin ? (bets.bet1.amount * bets.bet1.target) - bets.bet1.amount : -bets.bet1.amount;
            if (bet2Result) profit += bet2Result.didWin ? (bets.bet2.amount * bets.bet2.target) - bets.bet2.amount : -bets.bet2.amount;
            
            updateAIBotLifetimeStats({ profit });
            addBankrollTransaction(profit >= 0 ? 'Win' : 'Loss', Math.abs(profit));

            const wasPinkHunt = botState.plan.bet2.target >= 10 || (botState.plan.bet2.amount === 0 && botState.plan.bet1.target >= 10);
            const wasLoss = profit < 0;

            if (wasLoss && wasPinkHunt) {
                const newLossCount = (pinkHuntConsecutiveLosses || 0) + 1;
                updateBankroll({ pinkHuntConsecutiveLosses: newLossCount });
                if (newLossCount >= pinkHuntMaxLosses && pinkHuntMaxLosses > 0) {
                    addNotification({
                        type: 'info',
                        title: 'Co-Piloto: Modo de Recuperação Ativado',
                        message: `Após ${newLossCount} perdas na caça à rosa, o robô focará em recuperar o valor.`
                    });
                }
            } else if ((pinkHuntConsecutiveLosses || 0) > 0) {
                // Any win or a non-pink-hunt loss resets the counter.
                updateBankroll({ pinkHuntConsecutiveLosses: 0 });
            }
             
            let pinkPatternStatus = "Nenhum";
            if(pinkPatternAnalysis?.doublePink.isAlerting) pinkPatternStatus = "Rosa Dupla Ativa";
            else if(pinkPatternAnalysis?.closeRepetition.isAlerting) pinkPatternStatus = "Repetição Próxima Ativa";

            addAIBotHistoryItem({
                plan: bets, resultPlay: lastPlay, profit, reason: botState.reason, confidenceScore: lastBetConfidence.current,
                context: {
                    marketState: localAnalysis?.summary?.marketState ?? 'FRIO', isMarketPaused: localAnalysis?.summary?.isMarketPaused ?? false,
                    playsSinceLastPink: localAnalysis?.summary?.playsSinceLastPink ?? 0, last5Plays: historicalData.slice(-6, -1),
                    pinkPressure: pinkPressureAnalysis,
                    purplePressure: purplePressureAnalysis,
                    pinkPauseRisk: pinkPauseRisk,
                    pinkPatternStatus: pinkPatternStatus,
                },
            });
            setBotState(prev => ({ ...prev, lastRoundResult: { play: lastPlay, bets, result: { bet1: bet1Result, bet2: bet2Result }, profit }, animationKey: prev.animationKey + 1 }));
        }
        
        const previousPlay = lastPlayRef.current; // The play before the latest one
        lastPlayRef.current = lastPlay;

        const { summary, hotSpots } = localAnalysis ?? {};
        if (!summary || !hotSpots) return;

        // --- Dynamic Profile Selection for Smart Strategy ---
        if (isSmartPresetActive) {
            let dynamicProfile: HunterMode = 'Moderado'; // Default

            // Highest priority: Conservative conditions
            if (summary.marketState === 'FRIO' || (pinkPauseRisk && pinkPauseRisk.level === 'CRÍTICO') || (pinkPauseRisk?.level === 'Alto' && summary.marketState !== 'MUITO_QUENTE')) {
                dynamicProfile = 'Conservador';
            } 
            // Next priority: Elite conditions
            else if (
                (summary.marketState === 'MUITO_QUENTE' && (pinkPressureAnalysis?.level === 'CRÍTICA' || pinkPressureAnalysis?.level === 'Eminente')) ||
                (pinkPatternAnalysis?.doublePink.isAlerting || pinkPatternAnalysis?.closeRepetition.isAlerting)
            ) {
                if (pinkPauseRisk?.level === 'Baixo' || pinkPauseRisk?.level === 'Médio') {
                    dynamicProfile = 'Elite';
                }
            }
            
            if (dynamicProfile !== bankrollManagement.iaProfile && lastNotifiedProfile.current !== dynamicProfile) {
                updateBankroll({ iaProfile: dynamicProfile });
                addNotification({
                    type: 'info',
                    title: 'Co-Piloto IA: Perfil Ajustado',
                    message: `O mercado mudou. Perfil ajustado para "${dynamicProfile}".`
                });
                lastNotifiedProfile.current = dynamicProfile;
            }
        }

        const stopWinAmount = initialBankroll * (1 + (stopWinPercentage / 100));
        const stopLossAmount = initialBankroll * (1 - (stopLossPercentage / 100));

        if (currentBankroll >= stopWinAmount && !sessionEndedRef.current) {
            sessionEndedRef.current = true;
            setBotState(prev => ({ ...prev, 
                status: 'META ATINGIDA!', 
                reason: `Lucro de R$ ${(currentBankroll - initialBankroll).toFixed(2)} alcançado.`, 
                plan: { bet1: { amount: 0, target: 0 }, bet2: { amount: 0, target: 0 } },
            }));
            onSessionEnd({ type: 'win', profitOrLoss: currentBankroll - initialBankroll });
            return;
        }

        if (currentBankroll <= stopLossAmount && !sessionEndedRef.current) {
            sessionEndedRef.current = true;
            const hotMinutes = localAnalysis?.hotSpots?.hottestPinkMinutes ?? [];
            const nextBestTimeSuggestion = hotMinutes.length > 0 ? hotMinutes[0].minute : undefined;

            setBotState(prev => ({ ...prev, 
                status: 'LIMITE DE PERDA!', 
                reason: `Stop loss de R$ ${(initialBankroll - currentBankroll).toFixed(2)} atingido.`, 
                plan: { bet1: { amount: 0, target: 0 }, bet2: { amount: 0, target: 0 } },
            }));
            onSessionEnd({ 
                type: 'loss', 
                profitOrLoss: currentBankroll - initialBankroll,
                nextBestTimeSuggestion 
            });
            return;
        }
        
        // --- STRATEGIC PAUSES (NEW LOGIC) ---
        if (pinkPauseRisk && pinkPauseRisk.level === 'CRÍTICO') {
            setBotState(prev => ({ ...prev, status: 'PAUSA ESTRATÉGICA', reason: `Risco de pausa de mercado CRÍTICO detectado. Aguardando estabilização.`, plan: { bet1: { amount: 0, target: 0 }, bet2: { amount: 0, target: 0 } } }));
            return;
        }

        // --- Cautious Mode after Critical Pause Risk ---
        const isCautiousMode = bankrollManagement.activateDefensiveModeOnPauseRisk && pinkPauseRisk && pinkPauseRisk.level === 'CRÍTICO';

        // --- Smart Preset Pause Logic ---
        if (isSmartPresetActive) {
            // Se a pausa inteligente estiver ativa, verifica se pode desativar
            if (isSmartPauseActiveRef.current) {
                const lastPlay = historicalData[historicalData.length - 1];
                const lastPlayIsPurpleOrPink = lastPlay.multiplier >= 2;

                if (lastPlayIsPurpleOrPink) {
                    isSmartPauseActiveRef.current = false; // Desativa a pausa com 1 roxo ou 1 rosa
                }
            } 
            // Se não estiver em pausa, verifica se deve ativar
            else if (summary.currentBlueStreak >= maxBlueStreakStop) {
                isSmartPauseActiveRef.current = true;
            }
        } else {
             isSmartPauseActiveRef.current = false;
        }

        if (isSmartPauseActiveRef.current) {
            setBotState(prev => ({ ...prev, status: 'PAUSA INTELIGENTE', reason: `Aguardando o mercado pagar após ${summary.currentBlueStreak} azuis seguidos.`, plan: { bet1: { amount: 0, target: 0 }, bet2: { amount: 0, target: 0 } } }));
            return;
        }

        // --- Defensive Mode for Smart Preset ---
        let isDefensiveMode = false;
        if (isSmartPresetActive) {
            const last7Plays = historicalData.slice(-7);
            if (last7Plays.length === 7) {
                const blueCount = last7Plays.filter(p => p.multiplier < 2).length;
                const purpleCount = last7Plays.filter(p => p.multiplier >= 2 && p.multiplier < 10).length;
                if (blueCount > purpleCount) {
                    isDefensiveMode = true;
                }
            }
        }
        
        let finalStatus = 'AGUARDANDO';
        let finalReason = 'Aguardando oportunidade.';
        let finalPlan = { bet1: { amount: 0, target: 0 }, bet2: { amount: 0, target: 0 } };

        const calculateConfidence = (): ConfidenceReport => {
            const scores: Partial<Record<keyof IATacticWeights, TacticScore>> = {};
            const { iaTacticWeights: weights } = bankrollManagement;
            const { summary: sum, hotSpots: hs } = localAnalysis ?? {};
            if (!sum || !hs) return { finalScore: 0, scores: {} };
            
            const hotMarketScore = (): TacticScore => {
                let score = 0;
                let reason = "Mercado frio, sem entrada.";
                if (sum.marketState === 'MUITO_QUENTE') {
                    score = 100;
                    reason = "Mercado pegando fogo!";
                } else if (sum.marketState === 'QUENTE') {
                    score = 75;
                    reason = "Mercado esquentando.";
                }
                return { score, reason, target: 15.00, weight: weights.hotMarket, weightedScore: 0 };
            };
            scores.hotMarket = hotMarketScore();

            const ipvHunterScore = (): TacticScore => {
                const streak = sum.currentBlueStreak ?? 0;
                if (streak < 2) {
                    return { score: 50, reason: "Sinal neutro, aguardando.", target: 2.00, weight: weights.ipvHunter, weightedScore: 0 };
                }
                const cappedStreak = Math.min(streak, 25);
                const prob = PROB_AZUL_CONTINUA[cappedStreak] ?? 0.5;
                const ipv = (1 - prob) - prob;

                let score = (ipv + 0.5) * 100;
                let reason = `Sinal de virada (${ipv.toFixed(2)}) após ${streak} azuis.`;

                if (ipv < 0) {
                    reason = `Sinal de virada negativo! Risco de mais azul.`;
                    score = 0;
                } else if (ipv > 0.4) {
                    reason = `SINAL FORTE DE VIRADA! (${ipv.toFixed(2)})`;
                    score = 100;
                }

                return { score, reason, target: 2.00, weight: weights.ipvHunter, weightedScore: 0 };
            };
            scores.ipvHunter = ipvHunterScore();

            const hotSignalScore = (): TacticScore => {
                if (currentTargetHouse) {
                    return { score: 95, reason: `Alvo do Caçador na casa ${currentTargetHouse}!`, target: 20.00, weight: weights.hotSignalHunter, weightedScore: 0 };
                }
                const currentMinute = new Date().getMinutes();
                const hotMins = new Set(hs.hottestPinkMinutes?.map(m => parseInt(m.minute.replace(':', ''))));
                if (hotMins.has(currentMinute)) {
                    return { score: 85, reason: `Minuto quente :${currentMinute} agora!`, target: 18.00, weight: weights.hotSignalHunter, weightedScore: 0 };
                }
                return { score: 0, reason: "Sem sinal de minuto ou casa.", target: 0, weight: weights.hotSignalHunter, weightedScore: 0 };
            };
            scores.hotSignalHunter = hotSignalScore();

            const automaticTriggersScore = (): TacticScore => {
                if (pinkPressureAnalysis) {
                    const { level, percentage } = pinkPressureAnalysis;
                    if (level === 'CRÍTICA') return { score: 100, reason: `Pressão de Rosa no TALO! (${percentage.toFixed(0)}%)`, target: 25.00, weight: weights.automaticTriggers, weightedScore: 0 };
                    if (level === 'Eminente') return { score: 80, reason: `Pressão de Rosa SUBINDO! (${percentage.toFixed(0)}%)`, target: 20.00, weight: weights.automaticTriggers, weightedScore: 0 };
                }
                return { score: 0, reason: "Mercado sem pressão de rosas.", target: 0, weight: weights.automaticTriggers, weightedScore: 0 };
            };
            scores.automaticTriggers = automaticTriggersScore();

            const technicalAnalysisScore = (): TacticScore => {
                if (purplePressureAnalysis) {
                    const { level, percentage } = purplePressureAnalysis;
                    if (level === 'CRÍTICA') return { score: 100, reason: `Pressão roxa CRÍTICA! (${percentage.toFixed(0)}%)`, target: 2.00, weight: weights.technicalAnalysis, weightedScore: 0 };
                    if (level === 'ALTA') return { score: 80, reason: `Pressão roxa ALTA! (${percentage.toFixed(0)}%)`, target: 2.00, weight: weights.technicalAnalysis, weightedScore: 0 };
                }
                return { score: 0, reason: "Sem pressão roxa.", target: 0, weight: weights.technicalAnalysis, weightedScore: 0 };
            };
            scores.technicalAnalysis = technicalAnalysisScore();
            
            const pinkPatternProximityScore = (): TacticScore => {
                const isDoublePinkAlerting = pinkPatternAnalysis?.doublePink.isAlerting ?? false;
                const isCloseRepetitionAlerting = pinkPatternAnalysis?.closeRepetition.isAlerting ?? false;
                
                if (isDoublePinkAlerting) {
                    return { score: 100, reason: "Sinal de ROSA DUPLA!", target: 2.00, weight: weights.pinkPatternProximity, weightedScore: 0 };
                }
                if (isCloseRepetitionAlerting) {
                    return { score: 100, reason: "Sinal de REPETIÇÃO PRÓXIMA!", target: 2.00, weight: weights.pinkPatternProximity, weightedScore: 0 };
                }
                return { score: 0, reason: "Sem padrão de rosa ativo.", target: 2.00, weight: weights.pinkPatternProximity, weightedScore: 0 };
            };
            scores.pinkPatternProximity = pinkPatternProximityScore();

            let totalWeight = 0;
            let weightedSum = 0;
            Object.keys(scores).forEach(key => {
                const tacticKey = key as keyof IATacticWeights;
                const tactic = scores[tacticKey];
                if (tactic && tactic.score > 0) {
                    tactic.weightedScore = tactic.score * (tactic.weight / 100);
                    totalWeight += tactic.weight;
                    weightedSum += tactic.weightedScore;
                }
            });

            if (totalWeight === 0) return { finalScore: 0, scores };
            const finalScore = (weightedSum / totalWeight) * 100;
            return { finalScore, scores };
        };

        const confidence = calculateConfidence();
        setConfidenceReport(confidence);
        let { finalScore, scores } = confidence;
        
        // Apply defensive penalty
        if (isDefensiveMode) {
            finalScore *= 0.75; // Reduce confidence by 25%
        }
        lastBetConfidence.current = finalScore;
        const sortedTactics = Object.values(scores).filter(s => s.score > 0).sort((a, b) => b.weightedScore - a.weightedScore);
        const dominantTactic = sortedTactics[0];

        const isInRecoveryMode = currentBankroll < initialBankroll;

        if (finalScore >= APOSTA_THRESHOLD && dominantTactic) {
            if (isInRecoveryMode) {
                // --- SESSION RECOVERY MODE ---
                finalStatus = 'RECUPERANDO BANCA';
                finalReason = "Operação de recuperação para voltar ao green!";
                
                const amountToRecover = (initialBankroll - currentBankroll);
                const targetProfit = baseBet * 0.10;
                const totalAmountToWin = amountToRecover + targetProfit;

                const safeTarget = 1.80;

                let bet1Amount = totalAmountToWin / (safeTarget - 1);
                bet1Amount = Math.max(MIN_BET, Math.min(MAX_BET, parseFloat(bet1Amount.toFixed(2))));
                
                const bet2Amount = isDualStrategyActive ? baseBet : 0;
                const bet2Target = 2.50; 
                
                finalPlan = {
                    bet1: { amount: bet1Amount, target: safeTarget },
                    bet2: { amount: bet2Amount, target: bet2Target },
                };
            } else {
                // --- PROFIT HUNTING MODE ---
                if ((pinkHuntConsecutiveLosses || 0) >= pinkHuntMaxLosses && pinkHuntMaxLosses > 0) {
                    finalStatus = 'RECUPERANDO (CAÇA)';
                    finalReason = `Pausando a caça. Foco em recuperar o loss.`;
                    const safeBetAmount = Math.max(MIN_BET, parseFloat(baseBet.toFixed(2)));
                    finalPlan = {
                        bet1: { amount: safeBetAmount, target: 2.00 },
                        bet2: { amount: 0, target: 0 },
                    };
                } else {
                    // --- Main Profit/Pink Hunting Logic based on PDF analysis ---
                    let bet1Amount = baseBet;
                    let bet1Target = 2.00; // Default safety target
                    let bet2Amount = 0;
                    let bet2Target = 0;
                    let currentReason = dominantTactic.reason;
                    
                    if (consecutiveLosses > 0 && bankrollManagement.history.length > 0) {
                        const recentLosses = bankrollManagement.history.slice(-consecutiveLosses).filter(t => t.type === 'Loss');
                        const totalLossAmount = recentLosses.reduce((sum, t) => sum + t.amount, 0);
                        
                        if (totalLossAmount > 0) {
                            const profitUnit = baseBet * 0.1; // Target a small profit
                            bet1Target = 1.90; // Secure target for recovery
                            const amountToWin = totalLossAmount + profitUnit;
                            let recoveryBetAmount = amountToWin / (bet1Target - 1);
                            
                            // Safety cap: Never bet more than 25% of current bankroll on a single recovery.
                            const maxRecoveryBet = currentBankroll * 0.25;
                            bet1Amount = Math.max(MIN_BET, Math.min(MAX_BET, Math.min(maxRecoveryBet, parseFloat(recoveryBetAmount.toFixed(2)))));

                            bet2Amount = 0; // Recovery is always a single, safe bet.
                            currentReason = `Recuperação (${consecutiveLosses}ª perda) | Alvo ${bet1Target}x`;
                        }
                    } else if (isDualStrategyActive) {
                        // PDF Recommendation: Focus on 1.5x-3.0x, avoid high multipliers
                        bet1Amount = baseBet;
                        bet2Amount = Math.max(MIN_BET, Math.min(MAX_BET, parseFloat((baseBet * 0.5).toFixed(2))));
                        
                        // Bet 1 is always for safety
                        bet1Target = 1.80; // Secure point within the 1.5x-3.0x range
                        
                        // Bet 2 for profit, adjusted based on profile, but within reasonable limits
                        switch (bankrollManagement.iaProfile) {
                            case 'Conservador':
                                bet2Target = 2.50;
                                currentReason = `Busca conservadora (Alvo: ${bet2Target}x)`;
                                break;
                            case 'Moderado':
                                bet2Target = 3.00;
                                currentReason = `Busca moderada (Alvo: ${bet2Target}x)`;
                                break;
                            case 'Elite':
                                // Elite can go slightly higher, but not extreme
                                if (pinkPressureAnalysis && pinkPressureAnalysis.level === 'CRÍTICA') {
                                    bet2Target = 5.00;
                                    currentReason = `Caça Elite com Pressão CRÍTICA (Alvo: ${bet2Target}x)`;
                                } else {
                                    bet2Target = 4.00;
                                    currentReason = `Caça Elite (Alvo: ${bet2Target}x)`;
                                }
                                break;
                        }
                        // PDF Recommendation: Cautious high-value bets on very specific patterns
                        if (bankrollManagement.iaProfile === 'Elite' && pinkPatternAnalysis?.doublePink.isAlerting) {
                            bet2Amount = Math.max(MIN_BET, parseFloat((baseBet * 0.1).toFixed(2))); // Very small bet
                            bet2Target = 20.00; // Controlled high-value target
                            currentReason = `Caça de Padrão Rosa Dupla com aposta controlada! (Alvo: ${bet2Target}x)`;
                        }
                    } else { // Single bet strategy
                        bet1Amount = baseBet;
                        bet1Target = 2.50; // A balanced target within the PDF's 1.5x-3.0x range
                        currentReason = `Entrada única (Alvo: ${bet1Target}x)`;
                    }

                    if (isCautiousMode) {
                        bet1Amount = Math.max(MIN_BET, bet1Amount * 0.25);
                        bet2Amount = 0;
                        bet2Target = 0;
                        currentReason = `Entrada de segurança (pós-rosa alta): ${dominantTactic.reason}`;
                    }

                    if (isDefensiveMode) {
                        currentReason = `[DEFENSIVO] ${currentReason}`;
                    }
                    
                    finalStatus = isCautiousMode ? `APOSTA CAUTELOSA` : (bet2Target >= 10 ? `CAÇANDO ROSA...` : `APOSTANDO...`);
                    finalReason = currentReason;
                    finalPlan = {
                        bet1: { amount: bet1Amount, target: bet1Target },
                        bet2: { amount: bet2Amount, target: bet2Target },
                    };
                }
            }
             if (previousPlay) {
                finalReason = `Entrada após ${previousPlay.multiplier.toFixed(2)}x. ${finalReason}`;
            }
        } else {
            finalStatus = 'AGUARDANDO';
            finalReason = isDefensiveMode 
                ? '[DEFENSIVO] Segurando a entrada, mercado arriscado.' 
                : 'Aguardando sinal claro. Mercado perigoso.';
        }
        
       const calculateFuturePlan = (outcome: 'win' | 'loss'): { a1: Bet, a2: Bet } => {
            let profitOrLoss = 0;
            if (finalPlan.bet1.amount > 0) {
                if (outcome === 'win') {
                    profitOrLoss += (finalPlan.bet1.amount * finalPlan.bet1.target) - finalPlan.bet1.amount;
                    if (finalPlan.bet2.amount > 0) {
                        profitOrLoss += (finalPlan.bet2.amount * finalPlan.bet2.target) - finalPlan.bet2.amount;
                    }
                } else {
                    profitOrLoss = -(finalPlan.bet1.amount + finalPlan.bet2.amount);
                }
            }
        
            const nextBankroll = currentBankroll + profitOrLoss;
            const nextConsecutiveLosses = outcome === 'loss' ? (consecutiveLosses || 0) + 1 : 0;
        
            let nextBaseBet = baseBet;
            if (bankrollManagement.managementType === 'manual') {
                if (outcome === 'win') {
                    nextBaseBet = baseBet * (1 + onWinIncrease / 100);
                } else {
                    const lossMultiplier = 1 + (onLossIncrease / 100);
                    nextBaseBet = baseBet * Math.pow(lossMultiplier, nextConsecutiveLosses);
                }
            } else { // 'ia' mode
                let percentage = 0.02;
                if (bankrollManagement.iaProfile === 'Conservador') percentage = 0.01;
                if (bankrollManagement.iaProfile === 'Elite') percentage = 0.03;
                nextBaseBet = nextBankroll * percentage;
            }
        
            let bet1Amount = Math.max(MIN_BET, Math.min(MAX_BET, nextBaseBet));
            let bet1Target = 2.00;
            let bet2Amount = 0;
            let bet2Target = 0;
        
            if (isDualStrategyActive) {
                bet2Amount = Math.max(MIN_BET, Math.min(MAX_BET, nextBaseBet * 0.2));
                bet2Target = 15.00; // Simplified future target
            }
        
            // If we are in recovery mode, the plan changes
            if (nextBankroll < initialBankroll) {
                bet1Amount = baseBet;
                bet1Target = 1.80;
                bet2Amount = isDualStrategyActive ? baseBet : 0;
                bet2Target = 2.50;
            }
        
            return {
                a1: { amount: bet1Amount, target: bet1Target },
                a2: { amount: bet2Amount > 0 ? bet2Amount : 0, target: bet2Target },
            };
        };

        const apostaFuturaWin = calculateFuturePlan('win');
        const apostaFuturaLoss = calculateFuturePlan('loss');


        setBotState(prev => ({ 
            ...prev, 
            status: finalStatus, 
            reason: finalReason, 
            plan: finalPlan,
            apostaFuturaWin,
            apostaFuturaLoss,
        }));

    }, [
        historicalData, isPremium, isActive, localAnalysis, analysis, bankrollManagement,
        updateAIBotLifetimeStats, addAIBotHistoryItem, addBankrollTransaction,
        isPatternHunterModeActive, winningPatterns, losingPatterns, isHouseHunterModeActive, currentTargetHouse, pinkChaseConfig, hunterMode,
        pinkPauseRisk, pinkPressureAnalysis, addNotification, purplePressureAnalysis, pinkPatternAnalysis, onSessionEnd
    ]);

    return { state: botState, confidenceReport };
};