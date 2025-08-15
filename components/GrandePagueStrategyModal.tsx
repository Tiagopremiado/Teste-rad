
import React from 'react';
import type { GrandePagueStrategy } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface GrandePagueStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: GrandePagueStrategy | null;
  isLoading: boolean;
}

const StrategyStat: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div className="bg-gray-900/50 p-3 rounded-lg text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className={`font-bold text-2xl ${color}`}>{value}</p>
    </div>
);

const GrandePagueStrategyModal: React.FC<GrandePagueStrategyModalProps> = ({ isOpen, onClose, strategy, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <span className="text-3xl">💲</span>
            Estratégia "Grande Pague"
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
            {isLoading && <LoadingSpinner text="IA analisando a melhor estratégia..." />}
            {!isLoading && strategy && (
                <div className="space-y-4">
                    <div className="bg-gradient-to-tr from-gray-900 to-gray-800 p-4 rounded-lg border border-gray-700">
                        <h4 className="font-semibold text-gray-300 mb-2">Raciocínio da IA</h4>
                        <p className="text-sm text-gray-400 italic">"{strategy.reasoning}"</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-indigo-300 mb-2">Aposta 1 (Segurança)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <StrategyStat label="Valor da Aposta" value={`$${strategy.bet1Amount.toFixed(2)}`} color="text-white" />
                            <StrategyStat label="Saída Automática" value={`${strategy.bet1Exit.toFixed(2)}x`} color="text-green-400" />
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold text-yellow-300 mb-2">Aposta 2 (Lucro)</h3>
                         <div className="grid grid-cols-2 gap-4">
                            <StrategyStat label="Valor da Aposta" value={`$${strategy.bet2Amount.toFixed(2)}`} color="text-white" />
                            <StrategyStat label="Saída Automática" value={`${strategy.bet2Exit.toFixed(2)}x`} color="text-pink-400" />
                        </div>
                    </div>
                </div>
            )}
             {!isLoading && !strategy && (
                <p className="text-center text-gray-500 italic py-8">Não foi possível gerar uma estratégia. Tente novamente.</p>
            )}
        </div>

        <div className="p-4 border-t border-gray-700 text-right flex-shrink-0">
            <button
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg transition-colors"
            >
                Fechar
            </button>
        </div>
      </div>
    </div>
  );
};

export default GrandePagueStrategyModal;
