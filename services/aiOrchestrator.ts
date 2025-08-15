import * as gemini from './geminiService';
import { processPlaysLocally } from './aiUtils';
import type { Play, Analysis, Bankroll, Signal, Rect, GrandePaguePeriod, GrandePagueStrategy, Strategy, LiveAISignal, LearnedPatterns, ApiInfo, ChartData, User, HunterMode, Color } from '../types';

type SummaryAnalysisReturn = Omit<Analysis, 'strategyRecommendations' | 'chartsData' | 'prediction' | 'restOfDayPrediction' | 'prediction50x' | 'predictionGrandePague' | 'grandePagueStrategy' | 'learnedPatterns'>;

const isQuotaError = (error: any): boolean => {
    return error instanceof Error && (error.message.toLowerCase().includes('quota') || error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('resource_exhausted'));
};

export const getSummaryAnalysis = async (...args: Parameters<typeof gemini.getSummaryAnalysis>): Promise<SummaryAnalysisReturn & { apiInfo: ApiInfo }> => {
    try {
        const result = await gemini.getSummaryAnalysis(...args);
        return { ...result.data, apiInfo: result.apiInfo };
    } catch (error: any) {
        if (isQuotaError(error)) {
            console.warn("Gemini quota exceeded for getSummaryAnalysis. Falling back to local analysis.");
            const [plays] = args;
            const { summary, hotSpots, grandePague } = processPlaysLocally(plays);
            return {
                summary: {
                    ...summary,
                    dailyTrend: 'Normal',
                    trendReasoning: 'IA indisponível (limite de uso). Análise local.',
                    recentPinksAnalysis: 'IA indisponível. Verifique os dados locais.',
                    nextSignalPrediction: 'IA indisponível.',
                    pinksTo50xAnalysis: { ...summary.pinksTo50xAnalysis!, analysisText: 'IA indisponível.' },
                    pinksTo100xAnalysis: { ...summary.pinksTo100xAnalysis!, analysisText: 'IA indisponível.' },
                    pinksTo1000xAnalysis: { ...summary.pinksTo1000xAnalysis!, analysisText: 'IA indisponível.' }
                },
                hotSpots,
                alerts: ["A IA atingiu o limite de uso. Os dados exibidos são da análise local, sem a camada de inteligência artificial. Funcionalidades como previsões e estratégias podem estar indisponíveis."],
                grandePagueAnalysis: { ...grandePague, iaAnalysis: 'IA indisponível.' },
                apiInfo: { provider: 'Local', keyIndex: 0 }
            };
        }
        throw error;
    }
};

type PredictionAnalysisReturn = Pick<Analysis, 'prediction' | 'restOfDayPrediction' | 'prediction50x' | 'predictionGrandePague' | 'predictionVerticalRepeat'>;

export const getPredictionAnalysis = async (plays: Play[], summary: Analysis['summary'], hotSpots: Analysis['hotSpots'], grandePagueAnalysis: Analysis['grandePagueAnalysis'], signalHistory: Signal[], learnedPatterns?: LearnedPatterns, risk_profile?: User['risk_profile']): Promise<PredictionAnalysisReturn & { apiInfo: ApiInfo }> => {
    try {
        const result = await gemini.getPredictionAnalysis(plays, summary, hotSpots, grandePagueAnalysis, signalHistory, learnedPatterns, risk_profile);
        return { ...result.data, apiInfo: result.apiInfo };
    } catch (error: any) {
        if (isQuotaError(error)) {
            console.warn("Gemini quota exceeded for getPredictionAnalysis. Returning empty predictions.");
            return {
                prediction: [],
                restOfDayPrediction: [],
                prediction50x: [],
                predictionGrandePague: [],
                predictionVerticalRepeat: [],
                apiInfo: { provider: 'Local', keyIndex: 0 }
            };
        }
        throw error;
    }
};

export const getStrategyRecommendations = async (plays: Play[], bankroll: Bankroll, summary: Analysis['summary'], hotSpots: Analysis['hotSpots'], learnedPatterns?: LearnedPatterns, risk_profile?: User['risk_profile']): Promise<{ strategies: Strategy[], apiInfo: ApiInfo }> => {
    try {
        return await gemini.getStrategyRecommendations(plays, bankroll, summary, hotSpots, learnedPatterns, risk_profile);
    } catch (error: any) {
        if (isQuotaError(error)) {
            console.warn("Gemini quota exceeded for getStrategyRecommendations. Returning empty strategies.");
            return {
                strategies: [],
                apiInfo: { provider: 'Local', keyIndex: 0 }
            };
        }
        throw error;
    }
};

export const getGrandePagueStrategy = async (...args: Parameters<typeof gemini.getGrandePagueStrategy>): Promise<{ strategy: GrandePagueStrategy, apiInfo: ApiInfo }> => {
    try {
        return await gemini.getGrandePagueStrategy(...args);
    } catch (error: any) {
        if (isQuotaError(error)) {
            console.warn("Gemini quota exceeded for getGrandePagueStrategy. Returning default strategy.");
            return {
                strategy: {
                    bet1Amount: 0,
                    bet1Exit: 0,
                    bet2Amount: 0,
                    bet2Exit: 0,
                    reasoning: "IA indisponível (limite de uso). Não foi possível gerar uma estratégia."
                },
                apiInfo: { provider: 'Local', keyIndex: 0 }
            };
        }
        throw error;
    }
};

export const getHolisticTrainingFeedback = async (...args: Parameters<typeof gemini.getHolisticTrainingFeedback>): Promise<{ patterns: LearnedPatterns, summary: string | null, apiInfo: ApiInfo }> => {
    try {
        return await gemini.getHolisticTrainingFeedback(...args);
    } catch (error: any) {
        if (isQuotaError(error)) {
            console.warn("Gemini quota exceeded for getHolisticTrainingFeedback. Training will be paused.");
            throw new Error("O treinamento foi pausado porque o limite de uso da IA foi atingido. Tente novamente mais tarde.");
        }
        throw error;
    }
};

export const getPatternDeepAnalysis = async (pattern: Color[], occurrences: { context: Play[], outcome: Play }[]): Promise<{ analysis: string, apiInfo: ApiInfo }> => {
    try {
        return await gemini.getPatternDeepAnalysis(pattern, occurrences);
    } catch (error: any) {
        if (isQuotaError(error)) {
            console.warn("Gemini quota exceeded for getPatternDeepAnalysis.");
            throw new Error("A análise profunda foi pausada porque o limite de uso da IA foi atingido. Tente novamente mais tarde.");
        }
        throw error;
    }
};

export const extractPlaysFromImage = async (...args: Parameters<typeof gemini.extractPlaysFromImage>): Promise<{ plays: Play[], apiInfo: ApiInfo }> => {
    try {
        return await gemini.extractPlaysFromImage(...args);
    } catch (error: any) {
        if (isQuotaError(error)) {
            console.warn("Gemini quota exceeded for extractPlaysFromImage.");
            throw new Error("Não foi possível analisar a imagem porque o limite de uso da IA foi atingido. Tente novamente mais tarde ou insira os dados manualmente.");
        }
        throw error;
    }
};

export const getChartsData = async (plays: Play[]): Promise<{ chartsData: ChartData, apiInfo: ApiInfo }> => {
    return gemini.getChartsData(plays);
};

export const getModerationFlags = async (posts: { id: string, text: string, authorId: string }[]): Promise<{ flaggedPosts: { postId: string, reason: string }[], apiInfo: ApiInfo }> => {
    try {
        const result = await gemini.getModerationFlags(posts);
        return { flaggedPosts: result.data.flaggedPosts || [], apiInfo: result.apiInfo };
    } catch (error) {
        console.error("AI Orchestrator failed during moderation:", error);
        // In case of error, return an empty array so the UI doesn't break
        return {
            flaggedPosts: [],
            apiInfo: { provider: 'Local', keyIndex: 0 } // Indicate a local/fallback response
        };
    }
};