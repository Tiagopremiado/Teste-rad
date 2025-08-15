import React from 'react';
import type { IATacticWeights, TacticScore, ConfidenceReport } from '../types';

const TacticSlider: React.FC<{
    label: string;
    description: string;
    tacticScore?: TacticScore;
    onWeightChange: (value: number) => void;
}> = ({ label, description, tacticScore, onWeightChange }) => {
    const weight = tacticScore?.weight ?? 50;
    const score = tacticScore?.score ?? 0;
    
    return (
        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
            <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-white text-sm" title={description}>{label}</label>
                <span className="text-sm font-mono text-gray-300">
                    Score: <span className="font-bold text-white">{score.toFixed(0)}</span>
                </span>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={weight}
                    onChange={e => onWeightChange(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    title={`Peso: ${weight}%`}
                />
                <span className="font-bold text-amber-300 w-12 text-right">{weight}%</span>
            </div>
        </div>
    );
};


interface AITacticsPanelProps {
    iaTacticWeights: IATacticWeights;
    onWeightsChange: (newWeights: IATacticWeights) => void;
}

const AITacticsPanel: React.FC<AITacticsPanelProps> = ({ iaTacticWeights, onWeightsChange }) => {
    
    const tacticDetails: { key: keyof IATacticWeights; label: string; description: string }[] = [
        { key: 'pinkPatternProximity', label: 'Proximidade de Padrão Rosa', description: 'Reage a padrões de alta probabilidade de rosas próximas, como a "Rosa Dupla".' },
        { key: 'ipvHunter', label: 'Caçador de IPV', description: "Usa o Indicador Preditivo de Virada (baseado em sequências) para decidir a entrada e pausas." },
        { key: 'hotMarket', label: 'Mercado Quente', description: 'Reage à "temperatura" geral do mercado.' },
        { key: 'hotSignalHunter', label: 'Caçador de Sinais', description: 'Prioriza "Minutos Quentes" e dicas do Caçador de Padrões.' },
        { key: 'automaticTriggers', label: 'Pressão de Rosas', description: 'Usa a "Barra de Pressão" como gatilho principal.' },
        { key: 'patternHunter', label: 'Padrões de Cores', description: 'Busca sequências de cores vencedoras no histórico recente.' },
        { key: 'houseHunter', label: 'Caçador de Casas', description: 'Foca na repetição de casas (intervalos entre rosas).' },
        { key: 'technicalAnalysis', label: 'Análise Técnica', description: 'Usa indicadores como a "Pressão Roxa" para timing.' },
        { key: 'extremeMultiplierProximity', label: 'Proximidade de Vela Alta', description: 'Aumenta a agressividade quando uma vela de 100x+ está estatisticamente próxima.' },
        { key: 'shortTermVolatility', label: 'Volatilidade Recente', description: 'Reage a picos de volatilidade nas últimas 15 rodadas.' },
    ];
    
    const handleWeightChange = (key: keyof IATacticWeights, value: number) => {
        onWeightsChange({ ...iaTacticWeights, [key]: value });
    };

    return (
        <div className="space-y-3">
             <p className="text-center text-sm text-gray-400 -mt-1 mb-4">Ajuste a importância de cada tática para a decisão da IA.</p>
            <div className="grid grid-cols-1 gap-2">
                {tacticDetails.map(({ key, label, description }) => (
                    <TacticSlider
                        key={key}
                        label={label}
                        description={description}
                        tacticScore={{ weight: iaTacticWeights[key] } as TacticScore}
                        onWeightChange={(value) => handleWeightChange(key, value)}
                    />
                ))}
            </div>
        </div>
    );
};

export default AITacticsPanel;