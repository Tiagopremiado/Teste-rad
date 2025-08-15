import React, { useState, useMemo, useCallback } from 'react';
import type { Play, WinningPatternResult, LosingPatternResult, HotTriggerResult, Strategy } from '../types';
import { Color } from '../types';

interface PatternCatalogerProps {
  historicalData: Play[];
  onHighlightRequest: (pattern: Color[]) => void;
  onPatternsCalculated: (patterns: { winning: WinningPatternResult[]; losing: LosingPatternResult[] }) => void;
  onSimulate: (target: Strategy | Color[]) => void;
  isPremium: boolean;
  showPremiumModal: () => void;
}

// Analysis result for manual pattern search
interface ManualAnalysisResult {
  pattern: Color[];
  outcomes: {
    [Color.Blue]: number;
    [Color.Purple]: number;
    [Color.Pink]: number;
  };
}

const colorMap = {
    [Color.Blue]: { name: "Azul", style: 'bg-cyan-500 hover:bg-cyan-600' },
    [Color.Purple]: { name: "Roxo", style: 'bg-purple-500 hover:bg-purple-600' },
    [Color.Pink]: { name: "Rosa", style: 'bg-pink-500 hover:bg-pink-600' },
};

const ColorButton: React.FC<{ color: Color; onClick: () => void; }> = ({ color, onClick }) => {
  const { name, style } = colorMap[color];
  return (
    <button onClick={onClick} className={`text-white font-bold py-2 px-4 rounded-lg transition-colors ${style}`}>
      {name}
    </button>
  );
};

const PatternDisplay: React.FC<{ pattern: Color[]; onClick?: () => void }> = ({ pattern, onClick }) => {
  const Wrapper = onClick ? 'button' : 'div';
  return (
     <Wrapper
        onClick={onClick}
        disabled={!onClick}
        className={`flex items-center gap-1.5 flex-wrap p-1 rounded-lg ${onClick ? 'cursor-pointer hover:bg-gray-700/50 transition-colors' : ''}`}
        title={onClick ? 'Clique para encontrar este padrão no histórico' : ''}
    >
      {pattern.map((color, index) => (
        <div key={index} className={`w-6 h-6 rounded-md ${colorMap[color].style.split(' ')[0]}`} />
      ))}
    </Wrapper>
  );
};

const PatternCataloger: React.FC<PatternCatalogerProps> = ({ historicalData, onHighlightRequest, onPatternsCalculated, onSimulate, isPremium, showPremiumModal }) => {
  const [currentPattern, setCurrentPattern] = useState<Color[]>([]);
  const [manualResult, setManualResult] = useState<ManualAnalysisResult | null>(null);
  
  const [topWinningPatterns, setTopWinningPatterns] = useState<WinningPatternResult[]>([]);
  const [topLosingPatterns, setTopLosingPatterns] = useState<LosingPatternResult[]>([]);
  const [hotPurpleTrigger, setHotPurpleTrigger] = useState<HotTriggerResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  
  const [analysisScope, setAnalysisScope] = useState<number>(Infinity); // Infinity for all
  const [patternLength, setPatternLength] = useState({ min: 3, max: 6 });

  const dataForAnalysis = useMemo(() => {
    if (analysisScope === Infinity) return historicalData;
    return historicalData.slice(-analysisScope);
  }, [historicalData, analysisScope]);

  const colorHistory: Color[] = useMemo(() => {
    return dataForAnalysis.map(play => {
      if (play.multiplier >= 10) return Color.Pink;
      if (play.multiplier >= 2) return Color.Purple;
      return Color.Blue;
    });
  }, [dataForAnalysis]);

  const addColorToPattern = (color: Color) => {
    if (currentPattern.length < 10) {
      setCurrentPattern(prev => [...prev, color]);
    }
  };

  const resetPattern = () => {
    setCurrentPattern([]);
    setManualResult(null);
  };

  const analyzeCurrentPattern = useCallback(() => {
    if (currentPattern.length === 0) return;
    setTopWinningPatterns([]);
    setTopLosingPatterns([]);
    setHotPurpleTrigger(null);

    const outcomes = { [Color.Blue]: 0, [Color.Purple]: 0, [Color.Pink]: 0 };
    const patternLen = currentPattern.length;

    for (let i = 0; i <= colorHistory.length - patternLen - 1; i++) {
      const slice = colorHistory.slice(i, i + patternLen);
      if (slice.every((color, index) => color === currentPattern[index])) {
        const nextColor = colorHistory[i + patternLen];
        outcomes[nextColor]++;
      }
    }
    setManualResult({ pattern: currentPattern, outcomes });
  }, [currentPattern, colorHistory]);

  const findWinningPatterns = useCallback(() => {
    setIsLoading(true);
    setManualResult(null);
    setCurrentPattern([]);

    setTimeout(() => {
      type PatternStats = { count: number; totalMultiplier: number; lastOccurrencePlays: Play[] };
      const winningPrecursors = new Map<string, PatternStats>();
      const losingPrecursors = new Map<string, number>();
      const allPrecursors = new Map<string, number>();
      const purpleTriggerCounts = new Map<string, number>();
      
      const { min: minLength, max: maxLength } = patternLength;

      for (let length = minLength; length <= maxLength; length++) {
        for (let i = 0; i <= dataForAnalysis.length - length - 1; i++) {
          const precursorColors = colorHistory.slice(i, i + length);
          const outcomePlay = dataForAnalysis[i + length];
          const key = precursorColors.join(',');

          allPrecursors.set(key, (allPrecursors.get(key) || 0) + 1);

          if (outcomePlay.multiplier >= 2) { // Purple or Pink win
              const current = winningPrecursors.get(key) || { count: 0, totalMultiplier: 0, lastOccurrencePlays: [] };
              winningPrecursors.set(key, {
                  count: current.count + 1,
                  totalMultiplier: current.totalMultiplier + outcomePlay.multiplier,
                  lastOccurrencePlays: dataForAnalysis.slice(i, i + length + 1),
              });
          } else { // Blue loss
              losingPrecursors.set(key, (losingPrecursors.get(key) || 0) + 1);
          }
        }
      }

      // Hot Purple Trigger Analysis
      for (let i = 0; i < dataForAnalysis.length - 1; i++) {
        const currentPlay = dataForAnalysis[i];
        const nextPlay = dataForAnalysis[i+1];
        if (currentPlay.multiplier >= 2 && currentPlay.multiplier < 10 && nextPlay.multiplier >= 10) {
            const range = `${Math.floor(currentPlay.multiplier)}.00x - ${Math.floor(currentPlay.multiplier)}.99x`;
            purpleTriggerCounts.set(range, (purpleTriggerCounts.get(range) || 0) + 1);
        }
      }
      const topTrigger = Array.from(purpleTriggerCounts.entries()).sort((a,b) => b[1] - a[1])[0];
      setHotPurpleTrigger(topTrigger ? { multiplierRange: topTrigger[0], count: topTrigger[1] } : null);

      const topWinning = Array.from(winningPrecursors.entries())
        .filter(([, stats]) => stats.count > 1)
        .map(([key, stats]) => {
            const winCount = stats.count;
            const totalCount = allPrecursors.get(key) || winCount;
            const pattern = key.split(',') as Color[];
            const outcomeColor = colorHistory[dataForAnalysis.findIndex((_, idx) => colorHistory.slice(idx, idx + pattern.length).join(',') === key) + pattern.length];
            return {
                pattern: [...pattern, outcomeColor],
                winCount,
                totalCount,
                avgMultiplier: stats.totalMultiplier / winCount,
                confidence: totalCount > 0 ? (winCount / totalCount) * 100 : 0,
                trend: 'stable' as 'up' | 'down' | 'stable',
                lastOccurrencePlays: stats.lastOccurrencePlays,
            };
        })
        .sort((a, b) => b.winCount - a.winCount)
        .slice(0, 5);

      const topLosing: LosingPatternResult[] = Array.from(losingPrecursors.entries())
        .filter(([, count]) => count > 1)
        .map(([key, count]) => ({
            pattern: key.split(',') as Color[],
            lossCount: count,
            totalCount: allPrecursors.get(key) || count,
        }))
        .sort((a, b) => b.lossCount - a.lossCount)
        .slice(0, 5);
      
      setTopWinningPatterns(topWinning);
      setTopLosingPatterns(topLosing);
      
      onPatternsCalculated({ winning: topWinning, losing: topLosing });
      setIsLoading(false);
    }, 50);
  }, [colorHistory, dataForAnalysis, patternLength, onPatternsCalculated]);
  
  const renderWinningPatterns = (title: string, patterns: WinningPatternResult[]) => {
      if (patterns.length === 0) return null;
      return (
          <div>
             <h4 className="font-semibold text-gray-300 mb-2">{title}:</h4>
             <div className="space-y-2">
               {patterns.map((result, index) => (
                  <div key={index} className="bg-gray-900/50 p-3 rounded-lg flex items-center justify-between gap-4 flex-wrap">
                      <PatternDisplay pattern={result.pattern} onClick={() => onHighlightRequest(result.pattern)}/>
                      <div className="flex items-center gap-4 text-sm">
                        <p>Vitórias: <span className="font-bold text-lg text-lime-400">{result.winCount}</span></p>
                        <p>Média: <span className="font-bold text-lg text-teal-400">{result.avgMultiplier.toFixed(2)}x</span></p>
                      </div>
                  </div>
               ))}
             </div>
          </div>
      );
  };

  const renderLosingPatterns = (title: string, patterns: LosingPatternResult[]) => {
    if (patterns.length === 0) return null;
    return (
        <div>
           <h4 className="font-semibold text-red-400 mb-2">{title}:</h4>
           <div className="space-y-2">
             {patterns.map((result, index) => (
                <div key={index} className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg flex items-center justify-between gap-4 flex-wrap">
                    <PatternDisplay pattern={result.pattern} onClick={() => onHighlightRequest(result.pattern)}/>
                    <div className="flex items-center gap-4 text-sm">
                      <p>Derrotas: <span className="font-bold text-lg text-red-400">{result.lossCount}</span></p>
                      <p>Total: <span className="font-bold text-lg text-gray-300">{result.totalCount}</span></p>
                    </div>
                </div>
             ))}
           </div>
        </div>
    );
  };
  
  return (
    <div className="bg-gray-900 backdrop-blur-md rounded-xl shadow-xl border border-lime-500/30 p-6 space-y-4">
      <h3 className="text-xl font-bold text-lime-300">Catalogador de Padrões Vencedores 2.0</h3>
      
      <div className="bg-gray-900/50 p-4 rounded-lg space-y-3">
          <p className="text-sm text-gray-400">Clique nas cores para montar uma sequência e analisar seus resultados:</p>
          <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                  <ColorButton color={Color.Blue} onClick={() => addColorToPattern(Color.Blue)} />
                  <ColorButton color={Color.Purple} onClick={() => addColorToPattern(Color.Purple)} />
                  <ColorButton color={Color.Pink} onClick={() => addColorToPattern(Color.Pink)} />
              </div>
              <div className="min-h-[24px]">
                <PatternDisplay pattern={currentPattern} />
              </div>
          </div>
      </div>
      
       <div className="bg-gray-900/50 p-4 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Escopo da Análise:</label>
            <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-md">
                {[1000, 5000, Infinity].map(scope => (
                     <button key={scope} onClick={() => setAnalysisScope(scope)} disabled={historicalData.length < scope} className={`w-full py-1 text-xs font-bold rounded-md transition-colors ${analysisScope === scope ? 'bg-lime-500 text-black shadow' : 'text-gray-300 hover:bg-gray-700'} disabled:opacity-50`}>
                        {scope === Infinity ? 'Tudo' : `Últimas ${scope}`}
                    </button>
                ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Profundidade do Padrão (min-max):</label>
            <div className="flex items-center gap-4">
                <input type="range" min="2" max="8" value={patternLength.min} onChange={e => setPatternLength(p => ({...p, min: Math.min(p.max, parseInt(e.target.value))}))} className="w-full" />
                <span className="font-mono text-lg">{patternLength.min}</span>
                <input type="range" min="2" max="8" value={patternLength.max} onChange={e => setPatternLength(p => ({...p, max: Math.max(p.min, parseInt(e.target.value))}))} className="w-full" />
                <span className="font-mono text-lg">{patternLength.max}</span>
            </div>
          </div>
      </div>


      <div className="flex items-center gap-3">
          <button onClick={analyzeCurrentPattern} disabled={currentPattern.length < 2} className="flex-1 bg-lime-500 hover:bg-lime-600 text-black font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">Analisar Sequência</button>
          <button onClick={isPremium ? findWinningPatterns : showPremiumModal} className="flex-1 bg-lime-500 hover:bg-lime-600 text-black font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
              Catalogar Padrões Quentes {!isPremium && <span className="text-black">👑</span>}
          </button>
          <button onClick={resetPattern} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Limpar</button>
      </div>
      
      {isLoading ? <div className="text-center p-4">Analisando histórico...</div> : (
        <div className="pt-4 mt-4 border-t border-lime-500/30 space-y-4">
            
            {hotPurpleTrigger && (
                 <div className="bg-purple-900/30 border border-purple-600/50 p-3 rounded-lg text-center">
                    <h4 className="text-sm font-semibold text-purple-200 mb-1">Gatilho de Roxo Quente</h4>
                    <p>A faixa de <span className="font-bold text-lg text-white">{hotPurpleTrigger.multiplierRange}</span> foi a que mais puxou <span className="text-pink-400">Rosas</span>.</p>
                    <p className="text-xs text-gray-400">(Ocorreu {hotPurpleTrigger.count} vezes)</p>
                </div>
            )}

            {manualResult && (
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">Resultado da Análise Manual:</h4>
                <div className="bg-gray-900/50 p-3 rounded-lg flex flex-col sm:flex-row items-center gap-4">
                    <PatternDisplay pattern={manualResult.pattern} onClick={() => onHighlightRequest(manualResult.pattern)} />
                    <div className="flex-grow flex justify-around w-full">
                       <p><span className="font-bold text-xl text-cyan-400">{manualResult.outcomes[Color.Blue]}</span> x Azul</p>
                       <p><span className="font-bold text-xl text-purple-400">{manualResult.outcomes[Color.Purple]}</span> x Roxo</p>
                       <p><span className="font-bold text-xl text-pink-400">{manualResult.outcomes[Color.Pink]}</span> x Rosa</p>
                    </div>
                    <button
                        onClick={() => isPremium ? onSimulate(manualResult.pattern) : showPremiumModal}
                        className="bg-lime-500 hover:bg-lime-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2"
                    >
                        Simular Padrão {!isPremium && <span className="text-black">👑</span>}
                    </button>
                </div>
              </div>
            )}
            
            {renderWinningPatterns("Top 5 Padrões Vencedores (≥ 2x)", topWinningPatterns)}
            {renderLosingPatterns("Top 5 Gatilhos de Fuga 🥶 (Resultaram em Azul)", topLosingPatterns)}
            
        </div>
      )}
    </div>
  );
};

export default PatternCataloger;