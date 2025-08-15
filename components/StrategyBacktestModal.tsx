import React, { useMemo } from 'react';
import { type Strategy, type Play, Color } from '../types';
import type { BacktestResult } from '../types';

interface StrategyBacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulationTarget: Strategy | Color[] | null;
  historicalData: Play[];
}

const runPatternBacktest = (pattern: Color[], historicalData: Play[]): BacktestResult => {
    const lastPlays = historicalData.slice(-200);
    const colorHistory: Color[] = lastPlays.map(p => p.multiplier >= 10 ? Color.Pink : p.multiplier >= 2 ? Color.Purple : Color.Blue);
    const patternLen = pattern.length;
    let netProfit = 0;
    let wins = 0;
    let losses = 0;
    let totalEntries = 0;
    
    // Fixed bet strategy for pattern simulation
    const bet = 1.00;
    const target = 2.00;

    for (let i = 0; i <= colorHistory.length - patternLen - 1; i++) {
        const slice = colorHistory.slice(i, i + patternLen);
        if (slice.every((color, index) => color === pattern[index])) {
            totalEntries++;
            const outcomePlay = lastPlays[i + patternLen];
            if (outcomePlay.multiplier >= target) {
                netProfit += (bet * target) - bet;
                wins++;
            } else {
                netProfit -= bet;
                losses++;
            }
        }
    }
    const winRate = totalEntries > 0 ? (wins / totalEntries) * 100 : 0;
    return { netProfit, winRate, wins, losses, totalEntries, strategyName: `Padrão [${pattern.join(', ')}]` };
};

const runStrategyBacktest = (strategy: Strategy, historicalData: Play[]): BacktestResult => {
    const lastPlays = historicalData.slice(-200);
    let netProfit = 0;
    let wins = 0;
    const totalEntries = lastPlays.length;

    lastPlays.forEach(play => {
      const { mainBet, secondaryBet } = strategy.betValues;
      const { mainTarget, secondaryTarget } = strategy.targetMultipliers;
      let entryProfit = 0;
      
      if (play.multiplier >= mainTarget) {
        entryProfit += (mainBet * mainTarget) - mainBet;
      } else {
        entryProfit -= mainBet;
      }
      
      if (secondaryBet && secondaryTarget) {
        if (play.multiplier >= secondaryTarget) {
          entryProfit += (secondaryBet * secondaryTarget) - secondaryBet;
        } else {
          entryProfit -= secondaryBet;
        }
      }

      netProfit += entryProfit;
      if (entryProfit > 0) {
          wins++;
      }
    });

    const winRate = totalEntries > 0 ? (wins / totalEntries) * 100 : 0;
    return { netProfit, winRate, wins, losses: totalEntries - wins, totalEntries, strategyName: strategy.name };
};

const StrategyBacktestModal: React.FC<StrategyBacktestModalProps> = ({ isOpen, onClose, simulationTarget, historicalData }) => {
  const simulationResult = useMemo(() => {
    if (!isOpen || !simulationTarget) return null;
    
    if (Array.isArray(simulationTarget)) { // It's a pattern (Color[])
        return runPatternBacktest(simulationTarget, historicalData);
    }
    
    if (typeof simulationTarget === 'object' && 'name' in simulationTarget) { // It's a strategy
        return runStrategyBacktest(simulationTarget, historicalData);
    }
    
    return null;
  }, [simulationTarget, historicalData, isOpen]);

  if (!isOpen || !simulationResult) return null;

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
          <div>
            <h2 className="text-2xl font-bold">Simulador de Estratégia</h2>
            <p className="text-amber-300">{simulationResult.strategyName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
            <div className="bg-gray-900/50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                 <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Resultado Final</p>
                    <p className={`font-bold text-3xl ${simulationResult.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {simulationResult.netProfit >= 0 ? `+ R$${simulationResult.netProfit.toFixed(2)}` : `- R$${Math.abs(simulationResult.netProfit).toFixed(2)}`}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Taxa de Acerto</p>
                    <p className="font-bold text-3xl text-cyan-400">{simulationResult.winRate.toFixed(1)}%</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Total de Entradas</p>
                    <p className="font-bold text-3xl text-white">{simulationResult.totalEntries}</p>
                </div>
            </div>
             <p className="text-xs text-gray-500 mt-1 text-center">
               {Array.isArray(simulationTarget)
                 ? `Simulação baseada na aplicação de uma aposta de R$1,00 com saída em 2.00x em todas as ${simulationResult.totalEntries} ocorrências do padrão nas últimas ${historicalData.slice(-200).length} rodadas.`
                 : `Simulação baseada na aplicação da estratégia nas últimas ${simulationResult.totalEntries} rodadas. Valores de aposta definidos na estratégia.`
               }
            </p>

            <div className="text-sm text-yellow-300 bg-yellow-900/40 border border-yellow-700 rounded-lg p-3">
              <strong>Aviso:</strong> Este é um teste de estresse e não uma garantia de resultados futuros. O desempenho passado não é indicativo de desempenho futuro. Aposte com responsabilidade.
            </div>
        </div>

        <div className="p-4 border-t border-gray-700 text-right flex-shrink-0">
            <button
                onClick={onClose}
                className="bg-amber-600 hover:bg-amber-700 text-black font-bold py-2 px-5 rounded-lg transition-colors"
            >
                Fechar
            </button>
        </div>
      </div>
    </div>
  );
};

export default StrategyBacktestModal;