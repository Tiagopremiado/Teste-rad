import React from 'react';
import type { BankrollManagement, HunterMode, IATacticWeights, AIBotHistoryItem } from '../types';

interface ManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankrollState: BankrollManagement;
  updateBankroll: (updates: Partial<Omit<BankrollManagement, 'history' | 'currentBankroll'>>) => void;
  resetBankroll: () => void;
  updateHunterMode: (mode: HunterMode) => void;
  aiBotHistory: AIBotHistoryItem[];
  onDownloadReport: () => void;
}

const TacticSlider: React.FC<{
    label: string;
    description: string;
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
}> = ({ label, description, value, onChange, disabled = false }) => (
    <div className={`bg-gray-800 p-3 rounded-lg ${disabled ? 'opacity-50' : ''}`}>
        <div className="flex justify-between items-center mb-1">
            <label className="font-semibold text-white text-sm">{label}</label>
            <span className="font-bold text-amber-300">{value}%</span>
        </div>
        <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={value}
            onChange={e => onChange(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            disabled={disabled}
        />
        <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
);

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


const ManagementModal: React.FC<ManagementModalProps> = ({ isOpen, onClose, bankrollState, updateBankroll, resetBankroll, updateHunterMode, aiBotHistory, onDownloadReport }) => {
    
    if (!isOpen) return null;

    const { 
        isActive, initialBankroll, stopWinPercentage, stopLossPercentage, baseBet,
        onWinIncrease, onLossIncrease, maxBlueStreakStop, minPurpleStreakGo, managementType, iaProfile,
        autoActivateOnPressure, iaTacticWeights, isDualStrategyActive, currentBankroll, history, isSmartPresetActive,
        pinkHuntMaxLosses
    } = bankrollState;

    const handleIaProfileSelect = (profile: HunterMode) => {
        updateHunterMode(profile);
        updateBankroll({ iaProfile: profile });
    };

    const handleSmartPreset = () => {
        updateBankroll({
            isSmartPresetActive: true,
            managementType: 'ia',
            isDualStrategyActive: true,
            maxBlueStreakStop: 5,
            iaProfile: 'Moderado',
            iaTacticWeights: SMART_PRESET_WEIGHTS,
        });
    };

    const handleStartSession = () => {
        updateBankroll({ isActive: true });
        onClose();
    };
    
    const handleEndSession = () => {
        resetBankroll();
        onClose();
    };

    const tacticDetails: { key: keyof IATacticWeights; label: string; description: string }[] = [
        { key: 'pinkPatternProximity', label: 'Proximidade de Padrão Rosa', description: 'Reage a padrões de alta probabilidade de rosas próximas, como a "Rosa Dupla".' },
        { key: 'hotMarket', label: 'Mercado Quente', description: 'Reage à "temperatura" geral do mercado.' },
        { key: 'hotSignalHunter', label: 'Caçador de Sinais', description: 'Prioriza "Minutos Quentes" e dicas do Caçador de Padrões.' },
        { key: 'automaticTriggers', label: 'Pressão de Rosas', description: 'Usa a "Barra de Pressão" como gatilho principal.' },
        { key: 'patternHunter', label: 'Padrões de Cores', description: 'Busca sequências de cores vencedoras no histórico recente.' },
        { key: 'ipvHunter', label: 'Caçador de IPV', description: "Usa o Indicador Preditivo de Virada (baseado em sequências) para decidir a entrada e pausas." },
        { key: 'houseHunter', label: 'Caçador de Casas', description: 'Foca na repetição de casas (intervalos entre rosas).' },
        { key: 'technicalAnalysis', label: 'Análise Técnica', description: 'Usa indicadores como a "Pressão Roxa" para timing.' },
        { key: 'extremeMultiplierProximity', label: 'Proximidade de Vela Alta', description: 'Aumenta a agressividade quando uma vela de 100x+ está estatisticamente próxima.' },
        { key: 'shortTermVolatility', label: 'Volatilidade Recente', description: 'Reage a picos de volatilidade nas últimas 15 rodadas.' },
    ];


    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" 
            onClick={onClose}
        >
            <div 
                className="bg-gray-950 border-2 border-amber-500/50 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-fade-in-up" 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-700/50">
                    <h2 className="text-2xl font-bold text-white">Painel de Gerenciamento</h2>
                    <p className="text-sm text-gray-400">Configure sua estratégia de apostas e limites de sessão.</p>
                </div>

                <div className="p-6 flex-grow overflow-y-auto space-y-6">
                    {/* Switcher */}
                    <div className="bg-gray-800 p-1.5 rounded-xl flex items-center">
                        <button onClick={() => updateBankroll({ managementType: 'ia', isSmartPresetActive: false })} className={`w-1/2 py-2.5 text-sm font-bold rounded-lg transition-colors ${managementType === 'ia' ? 'bg-amber-600 text-black shadow-md' : 'text-gray-300'}`}>
                            Gerenciamento da IA
                        </button>
                        <button onClick={() => updateBankroll({ managementType: 'manual', isSmartPresetActive: false })} className={`w-1/2 py-2.5 text-sm font-bold rounded-lg transition-colors ${managementType === 'manual' ? 'bg-amber-600 text-black shadow-md' : 'text-gray-300'}`}>
                            Gerenciamento do Apostador
                        </button>
                    </div>

                    {/* IA Management */}
                    {managementType === 'ia' && (
                        <div className="space-y-4 animate-fade-in">
                            <button
                                onClick={handleSmartPreset}
                                disabled={isSmartPresetActive}
                                className={`w-full font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg
                                    ${isSmartPresetActive
                                        ? 'bg-cyan-500 text-white animate-pulse-cyan ring-2 ring-cyan-400 cursor-not-allowed'
                                        : 'bg-transparent border-2 border-cyan-500 text-cyan-300 hover:bg-cyan-500 hover:text-white'
                                    }
                                `}
                                title={isSmartPresetActive ? "Estratégia Otimizada já está ativa." : "Ativa a configuração otimizada pela IA, que se adapta ao mercado. Recomendado para a maioria dos usuários."}
                            >
                                💡 {isSmartPresetActive ? 'Estratégia Otimizada Ativa' : 'Ativar Estratégia Otimizada (IA)'}
                            </button>

                            {isSmartPresetActive && (
                                <div className="bg-cyan-900/50 border border-cyan-700/50 p-3 rounded-lg text-center animate-fade-in">
                                    <p className="font-semibold text-cyan-300">💡 Modo Estratégia Otimizada Ativo</p>
                                    <p className="text-xs text-gray-400">A IA está se adaptando automaticamente. Para controle manual, inicie uma nova sessão no modo "Gerenciamento do Apostador".</p>
                                </div>
                            )}
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Banca Inicial (R$)</label>
                                <input type="number" step="0.01" value={initialBankroll} onChange={e => updateBankroll({ initialBankroll: parseFloat(e.target.value) || 100 })} className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Meta de Lucro (%)</label>
                                    <input type="number" value={stopWinPercentage} onChange={e => updateBankroll({ stopWinPercentage: parseInt(e.target.value, 10) || 0 })} className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Limite de Perda (%)</label>
                                    <input type="number" value={stopLossPercentage} onChange={e => updateBankroll({ stopLossPercentage: parseInt(e.target.value, 10) || 0 })} className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600" />
                                </div>
                            </div>
                            <div className="pt-4 mt-4 border-t border-gray-700/50">
                                <h4 className="text-lg font-semibold text-center text-white">Controles de Risco da IA</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Pausar após X Azuis</label>
                                        <input type="number" value={maxBlueStreakStop} onChange={e => updateBankroll({ maxBlueStreakStop: parseInt(e.target.value, 10) || 0 })} className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Parar Caça à Rosa após X Perdas</label>
                                        <input 
                                            type="number" 
                                            value={pinkHuntMaxLosses} 
                                            onChange={e => updateBankroll({ pinkHuntMaxLosses: parseInt(e.target.value, 10) || 0 })} 
                                            className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600"
                                        />
                                    </div>
                                </div>
                            </div>
                             <div className="bg-gray-800/50 p-4 rounded-xl border border-teal-500/30">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Estratégia de Aposta Dupla</h3>
                                        <p className="text-sm text-gray-400">Ativa a estratégia de Aposta de Segurança e Lucro Dinâmico.</p>
                                    </div>
                                    <label htmlFor="dual-strategy-toggle" className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input type="checkbox" id="dual-strategy-toggle" className="sr-only" checked={isDualStrategyActive} onChange={() => updateBankroll({ isDualStrategyActive: !isDualStrategyActive })} />
                                            <div className={`block ${isDualStrategyActive ? 'bg-teal-500' : 'bg-gray-600'} w-14 h-8 rounded-full transition`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${isDualStrategyActive ? 'translate-x-6' : ''}`}></div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                             <div className="pt-4 mt-4 border-t border-gray-700/50">
                                <h4 className="text-lg font-semibold text-center text-white">Painel de Táticas da IA (Pesos)</h4>
                                <p className="text-center text-sm text-gray-400 -mt-1 mb-4">Ajuste a importância de cada tática para a decisão da IA.</p>
                                <div className="space-y-3">
                                    {tacticDetails.map(({ key, label, description }) => (
                                        <TacticSlider
                                            key={key}
                                            label={label}
                                            description={description}
                                            value={iaTacticWeights[key]}
                                            onChange={(v) => updateBankroll({ iaTacticWeights: { ...iaTacticWeights, [key]: v } })}
                                            disabled={isSmartPresetActive}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-800/50 p-4 rounded-xl border border-teal-500/30">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Gatilho de Pressão</h3>
                                        <p className="text-sm text-gray-400">Iniciar o Co-Piloto quando a Barra de Pressão estiver CRÍTICA.</p>
                                    </div>
                                    <label htmlFor="auto-activate-toggle" className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input type="checkbox" id="auto-activate-toggle" className="sr-only" checked={autoActivateOnPressure} onChange={() => updateBankroll({ autoActivateOnPressure: !autoActivateOnPressure })} />
                                            <div className={`block ${autoActivateOnPressure ? 'bg-teal-500' : 'bg-gray-600'} w-14 h-8 rounded-full transition`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${autoActivateOnPressure ? 'translate-x-6' : ''}`}></div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-teal-500/30">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Modo Defensivo de Pausa</h3>
                                        <p className="text-sm text-gray-400">Pausar o Co-Piloto automaticamente quando o Risco de Pausa for CRÍTICO.</p>
                                    </div>
                                    <label htmlFor="defensive-mode-toggle" className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input type="checkbox" id="defensive-mode-toggle" className="sr-only" checked={bankrollState.activateDefensiveModeOnPauseRisk ?? true} onChange={() => updateBankroll({ activateDefensiveModeOnPauseRisk: !(bankrollState.activateDefensiveModeOnPauseRisk ?? true) })} />
                                            <div className={`block ${bankrollState.activateDefensiveModeOnPauseRisk ?? true ? 'bg-teal-500' : 'bg-gray-600'} w-14 h-8 rounded-full transition`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${bankrollState.activateDefensiveModeOnPauseRisk ?? true ? 'translate-x-6' : ''}`}></div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Manual Management */}
                    {managementType === 'manual' && (
                         <div className="space-y-4 animate-fade-in">
                            <p className="text-center text-gray-400">Você no controle total. Defina sua banca, metas e estratégia de apostas.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Banca Inicial (R$)</label>
                                    <input type="number" step="0.01" value={initialBankroll} onChange={e => updateBankroll({ initialBankroll: parseFloat(e.target.value) || 100 })} className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Aposta Base (R$)</label>
                                    <input type="number" step="0.01" min="1.00" max="700.00" value={baseBet} onChange={e => updateBankroll({ baseBet: parseFloat(e.target.value) || 1.00 })} className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Meta de Lucro (%)</label>
                                    <input type="number" value={stopWinPercentage} onChange={e => updateBankroll({ stopWinPercentage: parseInt(e.target.value, 10) || 0 })} className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Limite de Perda (%)</label>
                                    <input type="number" value={stopLossPercentage} onChange={e => updateBankroll({ stopLossPercentage: parseInt(e.target.value, 10) || 0 })} className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Aumento em Vitória (%)</label>
                                    <input type="number" value={onWinIncrease} onChange={e => updateBankroll({ onWinIncrease: parseInt(e.target.value, 10) || 0 })} className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600" />
                                </div>
                                 <div>
                                    <label htmlFor="onLossIncreaseInput" className="block text-sm font-medium text-gray-300 mb-1">Multiplicador de Recuperação (%)</label>
                                    <input id="onLossIncreaseInput" type="number" value={onLossIncrease} onChange={e => updateBankroll({ onLossIncrease: parseInt(e.target.value, 10) || 0 })} className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600" />
                                    <p className="text-xs text-gray-500 mt-1">Multiplica o valor perdido para a próxima aposta. Ex: 200% para dobrar a aposta (gale).</p>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Pausar após X Azuis</label>
                                    <input type="number" value={maxBlueStreakStop} onChange={e => updateBankroll({ maxBlueStreakStop: parseInt(e.target.value, 10) || 0 })} className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Continuar após X Roxos</label>
                                    <input type="number" value={minPurpleStreakGo} onChange={e => updateBankroll({ minPurpleStreakGo: parseInt(e.target.value, 10) || 0 })} className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600" />
                                </div>
                            </div>
                         </div>
                    )}
                </div>

                <div className="p-4 bg-gray-800/50 flex-shrink-0 flex items-center justify-between gap-4">
                    <button
                        onClick={isActive ? handleEndSession : handleStartSession}
                        className={`flex-grow font-bold py-3 rounded-lg transition-colors ${isActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                    >
                        {isActive ? 'Encerrar Sessão' : 'Iniciar Sessão'}
                    </button>
                    <button
                        onClick={onDownloadReport}
                        disabled={aiBotHistory.length === 0}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-700 disabled:opacity-50"
                        title="Baixar relatório da sessão"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManagementModal;