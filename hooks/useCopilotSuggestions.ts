import { useMemo } from 'react';
import type { Analysis, BankrollManagement, HunterMode, PinkPauseRiskAnalysis, PinkPressureAnalysis, CopilotSuggestion, IATacticWeights, PinkPatternAnalysis } from '../types';

interface UseCopilotSuggestionsProps {
    analysis: Partial<Analysis>;
    localAnalysis: Partial<Analysis> | null;
    bankrollState: BankrollManagement;
    updateBankroll: (updates: Partial<Omit<BankrollManagement, 'history' | 'currentBankroll'>>) => void;
    pinkPauseRisk: PinkPauseRiskAnalysis | null;
    pinkPressureAnalysis: PinkPressureAnalysis | null;
    pinkPatternAnalysis: PinkPatternAnalysis | null | undefined;
}

export const useCopilotSuggestions = ({
    analysis,
    localAnalysis,
    bankrollState,
    updateBankroll,
    pinkPauseRisk,
    pinkPressureAnalysis,
    pinkPatternAnalysis,
}: UseCopilotSuggestionsProps): { suggestions: CopilotSuggestion[], handleSuggestionAction: (suggestion: CopilotSuggestion) => void } => {

    const suggestions = useMemo<CopilotSuggestion[]>(() => {
        if (bankrollState.isSmartPresetActive) {
            // AI is in control, no need for manual profile suggestions.
            return [];
        }

        const activeSuggestions: CopilotSuggestion[] = [];
        const { summary } = localAnalysis ?? {};
        const { iaProfile, iaTacticWeights } = bankrollState;

        if (!summary) return [];

        // Preset Suggestions
        if (summary.marketState === 'MUITO_QUENTE' && iaProfile !== 'Elite') {
            activeSuggestions.push({
                id: 'preset-elite',
                type: 'preset',
                title: 'Oportunidade de Elite!',
                message: 'O mercado está Super Quente. Mudar para o perfil "Elite" pode maximizar os lucros.',
                action: { label: 'Mudar para Elite', targetPreset: 'Elite' }
            });
        }

        if ((summary.marketState === 'FRIO' || pinkPauseRisk?.level === 'CRÍTICO') && iaProfile !== 'Conservador') {
             activeSuggestions.push({
                id: 'preset-conservative',
                type: 'preset',
                title: 'Mercado em Baixa!',
                message: 'O mercado está frio ou com risco de pausa. Mudar para "Conservador" protege sua banca.',
                action: { label: 'Mudar para Conservador', targetPreset: 'Conservador' }
            });
        }
        
        if (summary.marketState === 'MORNO' && iaProfile !== 'Moderado') {
             activeSuggestions.push({
                id: 'preset-moderate',
                type: 'preset',
                title: 'Mercado Normalizando',
                message: 'O mercado voltou a um estado morno. O perfil "Moderado" é o mais equilibrado agora.',
                action: { label: 'Mudar para Moderado', targetPreset: 'Moderado' }
            });
        }

        // Tactic Suggestions
        if (pinkPatternAnalysis?.doublePink.isAlerting || pinkPatternAnalysis?.closeRepetition.isAlerting) {
            if (iaTacticWeights.pinkPatternProximity < 80) {
                 activeSuggestions.push({
                    id: 'tactic-pink-pattern',
                    type: 'tactic',
                    title: 'Ajuste de Tática: Padrão Rosa',
                    message: 'Um padrão de rosa de alta probabilidade está ativo. Aumente o peso da tática para a IA capitalizar.',
                    action: { label: 'Aumentar para 95%', targetTactic: { key: 'pinkPatternProximity', recommendedWeight: 95 } }
                });
            }
        }
        
        if (pinkPressureAnalysis?.level === 'CRÍTICA' && iaTacticWeights.hotSignalHunter < 85) {
             activeSuggestions.push({
                id: 'tactic-pressure',
                type: 'tactic',
                title: 'Ajuste de Tática: Pressão Crítica',
                message: 'A pressão de rosas está CRÍTICA. Aumente o peso dos Sinais Quentes para a IA agir com mais agressividade.',
                action: { label: 'Aumentar para 90%', targetTactic: { key: 'hotSignalHunter', recommendedWeight: 90 } }
            });
        }

        return activeSuggestions.slice(0, 2); // Show max 2 suggestions
    }, [localAnalysis, bankrollState, pinkPauseRisk, pinkPressureAnalysis, pinkPatternAnalysis]);
    
    const handleSuggestionAction = (suggestion: CopilotSuggestion) => {
        if (suggestion.action.targetPreset) {
            updateBankroll({ iaProfile: suggestion.action.targetPreset });
        }
        if (suggestion.action.targetTactic) {
            const { key, recommendedWeight } = suggestion.action.targetTactic;
            updateBankroll({
                iaTacticWeights: {
                    ...bankrollState.iaTacticWeights,
                    [key]: recommendedWeight,
                }
            });
        }
    };

    return { suggestions, handleSuggestionAction };
};