import React, { useMemo, useState } from 'react';
import type { Strategy, Play, Color } from '../types';
import StrategyBacktestModal from './StrategyBacktestModal';

const getRiskClasses = (risk: 'Baixo' | 'Médio' | 'Alto') => {
  switch (risk) {
    case 'Baixo': return 'text-green-300 border-green-500 bg-green-900/50';
    case 'Médio': return 'text-yellow-300 border-yellow-500 bg-yellow-900/50';
    case 'Alto': return 'text-red-300 border-red-500 bg-red-900/50';
    default: return 'text-gray-300 border-gray-500 bg-gray-900/50';
  }
};

const StrategyCard: React.FC<{ strategy: Strategy; onSimulate: (target: Strategy | Color[]) => void; isPremium: boolean; }> = ({ strategy, onSimulate, isPremium }) => {
    
  const potentialProfit = useMemo(() => {
    let profit = 0;
    const { mainBet, secondaryBet } = strategy.betValues;
    const { mainTarget, secondaryTarget } = strategy.targetMultipliers;

    if (mainBet != null && mainTarget != null) {
      profit += (mainBet * mainTarget) - mainBet;
    }
    if (secondaryBet && secondaryTarget) {
      profit += (secondaryBet * secondaryTarget) - secondaryBet;
    }
    return profit;
  }, [strategy.betValues, strategy.targetMultipliers]);

  return (
    <div className={`bg-gray-900 rounded-2xl p-5 shadow-lg border ${strategy.isBestFit ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-gray-700/80'} relative flex flex-col`}>
      
      <div className="flex justify-between items-start mb-3">
          <h4 className="text-xl font-bold text-white">{strategy.name}</h4>
          <div className="flex items-center gap-2">
              {strategy.isBestFit && (
                  <div className="bg-amber-600 text-black text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      Melhor Estratégia
                  </div>
              )}
              <div className={`text-xs font-semibold px-3 py-1 rounded-full border ${getRiskClasses(strategy.risk)}`}>
                  {strategy.risk} Risco
              </div>
          </div>
      </div>

      <p className="text-sm text-gray-300 mb-3 flex-grow">{strategy.description}</p>
      <p className="text-sm text-gray-200"><span className="font-semibold text-gray-400">Entrada:</span> {strategy.entrySuggestion}</p>
      
      <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-3 gap-4">
          <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Apostas</p>
              <p className="font-semibold text-lg text-white">
                  ${strategy.betValues.mainBet.toFixed(2)}
                  {strategy.betValues.secondaryBet != null && ` / $${strategy.betValues.secondaryBet.toFixed(2)}`}
              </p>
          </div>
          <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Alvos</p>
              <p className="font-semibold text-lg text-white">
                  {`${strategy.targetMultipliers.mainTarget.toFixed(2)}x${strategy.targetMultipliers.secondaryTarget != null ? ` / ${strategy.targetMultipliers.secondaryTarget.toFixed(2)}x` : ''}`}
              </p>
          </div>
          <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Lucro Potencial</p>
              <p className="font-semibold text-lg text-green-400">
                  +${potentialProfit.toFixed(2)}
              </p>
          </div>
      </div>

       <div className="mt-4 pt-4 border-t border-gray-700 text-center">
          <button
              onClick={() => onSimulate(strategy)}
              className="bg-amber-600 hover:bg-amber-700 text-black font-bold py-2 px-5 rounded-lg transition-colors shadow-md flex items-center gap-2 mx-auto"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
              Simular nas Últimas 200 Rodadas {!isPremium && <span className="text-black" title="Premium">👑</span>}
          </button>
      </div>
    </div>
  );
};

const StrategyRecommendations: React.FC<{ strategies: Strategy[]; onSimulate: (target: Strategy | Color[]) => void; isPremium: boolean; }> = ({ strategies, onSimulate, isPremium }) => {
  const sortedStrategies = [...strategies].sort((a, b) => (a.isBestFit === b.isBestFit) ? 0 : a.isBestFit ? -1 : 1);

  return (
    <>
      <div className="space-y-6">
        <h3 className="text-2xl font-bold mb-4">Recomendações de Estratégia da IA</h3>
        {sortedStrategies.length > 0 ? (
          <div className="space-y-4">
            {sortedStrategies.map((strategy, index) => <StrategyCard key={index} strategy={strategy} onSimulate={onSimulate} isPremium={isPremium} />)}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-900 rounded-lg">
            <p className="text-gray-400">A IA não encontrou nenhuma estratégia ideal para o cenário atual.</p>
            <p className="text-xs text-gray-500 mt-1">Isso pode acontecer se o histórico for muito curto ou os padrões não forem claros.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default StrategyRecommendations;