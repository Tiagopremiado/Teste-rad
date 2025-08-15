import React, { useMemo } from 'react';
import type { LiveSignalHistoryItem, HunterMode, AIBotHistoryItem, ConfidenceReport, LiveAISignal } from '../types';

interface LiveAISignalStreamProps {
  liveAiSignal: LiveAISignal | null;
  isLiveSignalActive: boolean;
  toggleLiveSignal: () => void;
  onOpenHistory: () => void;
  signalHistory: LiveSignalHistoryItem[];
  isPremium: boolean;
  hunterMode: HunterMode;
  updateHunterMode: (mode: HunterMode) => void;
}

const LiveAISignalStream: React.FC<LiveAISignalStreamProps> = ({ liveAiSignal, isLiveSignalActive, toggleLiveSignal, onOpenHistory, signalHistory, isPremium, hunterMode, updateHunterMode }) => {

    const signalConfig = {
      'Gold': { icon: '🥇', color: 'text-yellow-400', glowColor: '#facc15', glowFaded: 'rgba(250, 204, 21, 0.3)'},
      'FollowUp': { icon: '🚀', color: 'text-purple-400', glowColor: '#a855f7', glowFaded: 'rgba(168, 85, 247, 0.3)'},
      'Opportunity': { icon: '💡', color: 'text-gray-300', glowColor: '#d1d5db', glowFaded: 'rgba(209, 213, 219, 0.3)'}
    };

    const getGlowColor = () => {
        if (!isLiveSignalActive || !liveAiSignal?.level) return { '--glow-color': '#0000', '--glow-color-faded': '#0000' };
        const config = signalConfig[liveAiSignal.level];
        return { '--glow-color': config.glowColor, '--glow-color-faded': config.glowFaded };
    }

    const currentSignalConfig = liveAiSignal ? signalConfig[liveAiSignal.level] : null;
    const isDisabled = !isPremium;
    
    const hunterModeDescriptions: Record<HunterMode, string> = {
        'Conservador': 'Espera por padrões de altíssima probabilidade. Sinais raros, mas precisos.',
        'Moderado': 'Aguarda o mercado aquecer antes de buscar sinais. Equilíbrio entre segurança e oportunidade.',
        'Elite': 'Busca antecipar sequências. Sinais mais frequentes e arriscados.'
    };

    return (
      <div className="bg-gray-900/50 rounded-xl p-6 shadow-2xl border border-amber-800/20 flex flex-col items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 w-full">
              {/* Robot Head */}
              <div className="flex-shrink-0 w-40 h-40 relative flex items-center justify-center">
                  {/* Head Outline */}
                  <div className={`absolute inset-0 border-4 rounded-full transition-all duration-500 ${(isLiveSignalActive && isPremium) ? 'border-amber-400' : 'border-gray-700'}`}></div>
                  <div className={`absolute inset-2 border-2 rounded-full transition-all duration-500 ${(isLiveSignalActive && isPremium) ? 'border-amber-400/30' : 'border-gray-800'}`}></div>
                  
                  {/* Inner details */}
                  <div className="w-2/3 h-2/3 bg-gray-900 rounded-full relative overflow-hidden">
                     {/* Radar sweep animation */}
                     {(isLiveSignalActive && isPremium) && !liveAiSignal && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent animate-radar-sweep origin-center"></div>
                        </div>
                     )}
                     {/* Central eye/core */}
                     <div
                        style={getGlowColor() as React.CSSProperties}
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full transition-all duration-300 ${liveAiSignal && isPremium ? 'animate-pulse-glow bg-white' : 'bg-gray-700'}`}
                     ></div>
                  </div>
                  
                  {/* Lock Icon */}
                   {isDisabled && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                               <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}


                  {/* Power Button */}
                  <button 
                    onClick={toggleLiveSignal}
                    disabled={isDisabled}
                    className={`absolute bottom-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${isLiveSignalActive && isPremium ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'} disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed`}
                    title={isDisabled ? 'Funcionalidade Premium' : (isLiveSignalActive ? 'Desativar Sinais ao Vivo' : 'Ativar Sinais ao Vivo')}
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
                      </svg>
                  </button>
              </div>

              {/* Info Panel */}
              <div className="flex-grow w-full border-t-2 md:border-t-0 md:border-l-2 border-gray-700/50 pt-4 md:pt-0 md:pl-6 text-center md:text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">Robô de Sinais ao Vivo</h3>
                       <p className={`text-lg font-medium transition-colors ${(liveAiSignal && isPremium) ? currentSignalConfig?.color : 'text-amber-400'}`}>
                        { (isLiveSignalActive && isPremium) ? (liveAiSignal ? 'Sinal Encontrado!' : 'Aguardando Padrão...') : 'Inativo'}
                      </p>
                    </div>
                    <button 
                      onClick={onOpenHistory}
                      disabled={signalHistory.length === 0}
                      className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                      Histórico
                    </button>
                  </div>
                  
                  <div className="mt-4 min-h-[7rem] flex items-center justify-center md:justify-start animate-fade-in">
                      {(isLiveSignalActive && isPremium) ? (
                          liveAiSignal && currentSignalConfig ? (
                               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center w-full">
                                   <div className="bg-gray-900/50 p-3 rounded-lg">
                                       <p className="text-xs text-gray-400 uppercase">Sinal {currentSignalConfig.icon}</p>
                                       <p className={`text-2xl font-bold ${currentSignalConfig.color} truncate`} title={liveAiSignal.target}>{liveAiSignal.target}</p>
                                   </div>
                                   <div className="bg-gray-900/50 p-3 rounded-lg">
                                       <p className="text-xs text-gray-400 uppercase">Confiança</p>
                                       <p className="text-2xl font-bold text-amber-300">{liveAiSignal.confidence}</p>
                                   </div>
                                   <div className="bg-gray-900/50 p-3 rounded-lg">
                                       <p className="text-xs text-gray-400 uppercase">Gatilho</p>
                                       <p className="text-2xl font-bold text-gray-300 truncate" title={liveAiSignal.trigger}>{liveAiSignal.trigger}</p>
                                   </div>
                               </div>
                          ) : (
                              <p className="text-gray-500 italic">Aguardando padrão correspondente ao conhecimento da IA...</p>
                          )
                      ) : !isPremium ? (
                          <p className="text-gray-500 italic">Ative sua conta Premium para usar o Robô de Sinais ao Vivo.</p>
                      ) : !isLiveSignalActive ? (
                           <p className="text-gray-500 italic">Ative o robô para iniciar a análise em tempo real.</p>
                      ) : null}
                  </div>
              </div>
          </div>
          
           {isPremium && (
            <div className="mt-4 pt-4 border-t border-gray-700/50 w-full animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-300">Modo de Caça</h4>
                     <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-md">
                        {(['Conservador', 'Moderado', 'Elite'] as HunterMode[]).map(m => (
                            <button
                                key={m}
                                onClick={() => updateHunterMode(m)}
                                disabled={!isLiveSignalActive}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${hunterMode === m ? 'bg-amber-600 text-black shadow' : 'text-gray-400 hover:bg-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
                 <p className="text-xs text-gray-500 text-center bg-black/20 p-2 rounded-md">
                    {hunterModeDescriptions[hunterMode]}
                </p>
            </div>
          )}

      </div>
    );
};

export default LiveAISignalStream;