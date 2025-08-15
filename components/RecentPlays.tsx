import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Play, Analysis, PlayWithId, HighlightedStat, GrandePaguePeriod, MarketState } from '../types';

const RECENT_PLAYS_FOR_STATS_LIMIT = 500;

const getColumnHeatColor = (count: number, maxCount: number): string => {
    if (count <= 0) {
        return '#374151'; // gray-700 for cold/no data
    }
    if (maxCount <= 0) {
        return '#3b82f6'; // blue-500 for a single occurrence
    }
    // Normalize count to a 0-1 percentage
    const percentage = Math.min(count / maxCount, 1);
    // We want a gradient from blue (cold, hue 240) to red (hot, hue 0)
    const hue = 240 - (percentage * 240);
    // Keep saturation and lightness constant for vibrancy
    const saturation = 90;
    const lightness = 60;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};


interface StreakInfo {
  count: number;
  plays: PlayWithId[];
}
interface StreakStats {
  maxPurpleStreak: StreakInfo;
  lastPurpleStreak: StreakInfo;
  maxPinkStreak: StreakInfo;
  playsSinceLastPink: StreakInfo;
}

const getPlayStyle = (multiplier: number): string => {
  if (multiplier >= 100) return 'bg-gradient-to-b from-red-500 via-pink-500 to-pink-600 shadow-pink-500/50';
  if (multiplier >= 10) return 'bg-gradient-to-b from-pink-500 to-pink-700';
  if (multiplier >= 2) return 'bg-gradient-to-b from-purple-500 to-purple-700';
  return 'bg-gradient-to-b from-cyan-500 to-cyan-700';
};

const calculateStreakStats = (plays: PlayWithId[]): StreakStats => {
  let maxPurpleStreak: PlayWithId[] = [];
  let currentPurpleStreak: PlayWithId[] = [];
  let maxPinkStreak: PlayWithId[] = [];
  let currentPinkStreak: PlayWithId[] = [];

  for (const play of plays) {
    const isPurple = play.multiplier >= 2 && play.multiplier < 10;
    if (isPurple) {
      currentPurpleStreak.push(play);
    } else {
      if (currentPurpleStreak.length > maxPurpleStreak.length) {
        maxPurpleStreak = [...currentPurpleStreak];
      }
      currentPurpleStreak = [];
    }

    const isPink = play.multiplier >= 10;
    if (isPink) {
      currentPinkStreak.push(play);
    } else {
      if (currentPinkStreak.length > maxPinkStreak.length) {
        maxPinkStreak = [...currentPinkStreak];
      }
      currentPinkStreak = [];
    }
  }
  if (currentPurpleStreak.length > maxPurpleStreak.length) {
    maxPurpleStreak = [...currentPurpleStreak];
  }
  if (currentPinkStreak.length > maxPinkStreak.length) {
    maxPinkStreak = [...currentPinkStreak];
  }

  let lastPurpleStreak: PlayWithId[] = [];
  for (const play of [...plays].reverse()) {
    if (play.multiplier >= 2 && play.multiplier < 10) {
      lastPurpleStreak.unshift(play);
    } else if (lastPurpleStreak.length > 0) {
      break;
    }
  }

  const lastPinkIndex = plays.map(p => p.multiplier >= 10).lastIndexOf(true);
  const playsSinceLastPink = lastPinkIndex === -1 ? [...plays] : plays.slice(lastPinkIndex + 1);

  return {
    maxPurpleStreak: { count: maxPurpleStreak.length, plays: maxPurpleStreak },
    lastPurpleStreak: { count: lastPurpleStreak.length, plays: lastPurpleStreak },
    maxPinkStreak: { count: maxPinkStreak.length, plays: maxPinkStreak },
    playsSinceLastPink: { count: playsSinceLastPink.length, plays: playsSinceLastPink },
  };
};

const StatDisplay: React.FC<{ title: string; value: React.ReactNode; colorClass?: string; isHighlighted: boolean; onClick: () => void; }> = ({ title, value, colorClass = 'text-white', isHighlighted, onClick }) => (
  <button onClick={onClick} className={`text-center p-3 rounded-xl transition-all duration-200 h-full flex flex-col justify-center ${isHighlighted ? 'bg-amber-500/20 ring-2 ring-amber-400' : 'bg-gray-900/50 hover:bg-gray-700/50'}`}>
    <span className="text-gray-400 text-sm block whitespace-nowrap">{title}</span>
    <span className={`text-4xl font-bold ${colorClass}`}>{value}</span>
  </button>
);

const MarketThermometer: React.FC<{ marketState: MarketState; percentage: number; }> = ({ marketState, percentage }) => {
    const stateConfig = {
        FRIO: {
            label: "Mercado Frio",
            colorClass: 'text-cyan-300',
            emoji: '🥶',
        },
        MORNO: {
            label: "Mercado Morno",
            colorClass: 'text-yellow-300',
            emoji: '😐',
        },
        QUENTE: {
            label: "Mercado Quente",
            colorClass: 'text-orange-400',
            emoji: '🔥',
        },
        MUITO_QUENTE: {
            label: "Mercado Super Quente",
            colorClass: 'text-red-500',
            emoji: '🌋',
        }
    };

    const legacyConfig: any = {
        RECOLHENDO: stateConfig.FRIO,
        NORMAL: stateConfig.MORNO,
        PAGANDO: stateConfig.QUENTE,
    };

    const currentConfig = stateConfig[marketState] || legacyConfig[marketState] || stateConfig.MORNO;
    const indicatorPosition = Math.max(0, Math.min(100, percentage));

    return (
        <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl shadow-lg w-full h-full border border-amber-800/20 flex flex-col justify-center">
            <h4 className="text-sm font-medium text-gray-400 mb-4 text-center">Termômetro do Mercado</h4>
            <div className="relative w-full mb-2">
                <div className="h-4 w-full bg-gradient-to-r from-cyan-400 via-yellow-400 to-red-600 rounded-full"></div>
                <div 
                    className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
                    style={{ left: `calc(${indicatorPosition}% - 12px)`}}
                >
                    <div className="relative w-6 h-6">
                         <div className="absolute inset-0 bg-white rounded-full animate-pulse-strong opacity-80"></div>
                         <div className="absolute inset-1 bg-gray-800 rounded-full"></div>
                         <div className="absolute inset-0 flex items-center justify-center text-xs">{currentConfig.emoji}</div>
                    </div>
                </div>
            </div>
             <div className="flex justify-between text-xs text-gray-500 px-1">
                <span>Frio</span>
                <span>Quente</span>
            </div>
            <div className={`mt-3 text-center text-lg font-bold ${currentConfig.colorClass}`}>
                {currentConfig.label}
            </div>
        </div>
    );
};

interface RecentPlaysProps {
  historicalData: PlayWithId[];
  hotSpots?: Analysis['hotSpots'];
  highlightedStat: HighlightedStat;
  onStatHighlight: (stat: HighlightedStat) => void;
  highlightedGrandePaguePeriod: GrandePaguePeriod | null;
  highlightedPatternPlays: PlayWithId[] | null;
  highlightedBlockPlays: PlayWithId[] | null;
  marketState: MarketState;
  marketStatePercentage: number;
  scrollTarget: { sectionId: string; playId?: string } | null;
  onScrollComplete: () => void;
  onHighlightBlock: (plays: PlayWithId[]) => void;
  isPremium: boolean;
  showPremiumModal: () => void;
}

const MiniPlayDisplay: React.FC<{ play: Play }> = ({ play }) => (
    <div className={`w-12 h-8 flex items-center justify-center rounded text-xs font-bold ${getPlayStyle(play.multiplier)}`}>
        {play.multiplier.toFixed(2)}x
    </div>
);

const getDynamicPlayStyle = (multiplier: number): React.CSSProperties => {
    // Blue range: 1.00 to 1.99 -> Lightness from 65% (faint) to 45% (strong)
    if (multiplier < 2) {
        const factor = (multiplier - 1.00) / 0.99; // 0 to 1
        const lightness = 65 - (factor * 20);
        return { backgroundColor: `hsl(195, 75%, ${lightness}%)` };
    }
    // Purple range: 2.00 to 9.99 -> Lightness from 65% to 45%
    if (multiplier < 10) {
        const factor = (multiplier - 2.00) / 7.99; // 0 to 1
        const lightness = 65 - (factor * 20);
        return { backgroundColor: `hsl(265, 65%, ${lightness}%)` };
    }
    // Pink range: 10.00+ -> Lightness from 65% to 45% (log scale)
    const base = 10;
    const maxVal = 150; // Cap intensity calculation at 150x for a smooth gradient
    // Logarithmic interpolation for a smoother feel on high values
    const factor = Math.log(Math.min(multiplier, maxVal) / base) / Math.log(maxVal / base); // 0 to 1
    const lightness = 65 - (factor * 20);
    return { backgroundColor: `hsl(320, 80%, ${lightness}%)` };
};


const RecentPlays: React.FC<RecentPlaysProps> = ({ 
    historicalData, 
    hotSpots, 
    highlightedStat, 
    onStatHighlight, 
    highlightedGrandePaguePeriod, 
    highlightedPatternPlays,
    highlightedBlockPlays, 
    marketState,
    marketStatePercentage,
    scrollTarget,
    onScrollComplete,
    onHighlightBlock,
    isPremium,
    showPremiumModal,
}) => {
  const [displayCount, setDisplayCount] = useState(50);
  const [columnCount, setColumnCount] = useState(7);
  const playRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  const playsForStats = useMemo(() => historicalData.slice(-RECENT_PLAYS_FOR_STATS_LIMIT), [historicalData]);

  const streakStats = useMemo(() => calculateStreakStats(playsForStats), [playsForStats]);
  const hotMinutesSet = useMemo(() => new Set(hotSpots?.hottestMinutes?.map(m => m.replace(':', '')) ?? []), [hotSpots]);
  const hot50xMinutesSet = useMemo(() => new Set(hotSpots?.hottest50xMinutes?.map(m => m.replace(':', '')) ?? []), [hotSpots]);
  const hot100xMinutesSet = useMemo(() => new Set(hotSpots?.hottest100xMinutes?.map(m => m.replace(':', '')) ?? []), [hotSpots]);
  const hot1000xMinutesSet = useMemo(() => new Set(hotSpots?.hottest1000xMinutes?.map(m => m.replace(':', '')) ?? []), [hotSpots]);
  const hotColumnSet = useMemo(() => new Set(hotSpots?.hotColumns?.map(c => c.column) ?? []), [hotSpots]);
  
  const lastThreeRepetitions = useMemo(() => {
    const pinksWithIndices = historicalData.map((p, i) => ({ play: p, index: i })).filter(item => item.play.multiplier >= 10);
    const repetitions: { trigger: PlayWithId, result: PlayWithId, between: PlayWithId[] }[] = [];
    
    for (let i = 1; i < pinksWithIndices.length; i++) {
        const currentPink = pinksWithIndices[i];
        const prevPink = pinksWithIndices[i-1];
        const distance = currentPink.index - prevPink.index;

        if (distance > 1 && distance <= 7) {
            repetitions.push({
                trigger: prevPink.play,
                result: currentPink.play,
                between: historicalData.slice(prevPink.index + 1, currentPink.index)
            });
        }
    }
    return repetitions.slice(-3).reverse(); // newest first
  }, [historicalData]);

  const hottestPurpleTrigger = useMemo(() => {
    const triggerCounts = new Map<number, { count: number, plays: { trigger: PlayWithId, result: PlayWithId }[] }>();

    for (let i = 1; i < historicalData.length; i++) {
        const currentPlay = historicalData[i];
        const prevPlay = historicalData[i-1];

        if (currentPlay.multiplier >= 10 && prevPlay.multiplier >= 2 && prevPlay.multiplier < 10) {
            const triggerRange = Math.floor(prevPlay.multiplier);
            const currentData = triggerCounts.get(triggerRange) || { count: 0, plays: [] };
            currentData.count++;
            currentData.plays.push({ trigger: prevPlay, result: currentPlay });
            triggerCounts.set(triggerRange, currentData);
        }
    }

    if (triggerCounts.size === 0) return null;

    const sortedTriggers = Array.from(triggerCounts.entries()).sort((a, b) => b[1].count - a[1].count);
    const [range, data] = sortedTriggers[0];

    const playsToHighlight = data.plays.reduce((acc: PlayWithId[], p) => {
        acc.push(p.trigger, p.result);
        return acc;
    }, []);

    return {
        range: `${range}.xx`,
        count: data.count,
        playsToHighlight: playsToHighlight,
    };
  }, [historicalData]);


  const highlightCalculations = useMemo(() => {
    const allPinks = playsForStats.filter(p => p.multiplier >= 10);

    const pinksSince50x = (() => {
      const last50xIndex = playsForStats.map(p => p.multiplier >= 50).lastIndexOf(true);
      if (last50xIndex === -1) return allPinks.filter(p => p.multiplier < 50);
      return playsForStats.slice(last50xIndex + 1).filter(p => p.multiplier >= 10 && p.multiplier < 50);
    })();

    const pinksSince100x = (() => {
      const last100xIndex = playsForStats.map(p => p.multiplier >= 100).lastIndexOf(true);
      if (last100xIndex === -1) return allPinks.filter(p => p.multiplier < 100);
      return playsForStats.slice(last100xIndex + 1).filter(p => p.multiplier >= 10 && p.multiplier < 100);
    })();
    
    const pinksSince1000x = (() => {
        const last1000xIndex = playsForStats.map(p => p.multiplier >= 1000).lastIndexOf(true);
        if (last1000xIndex === -1) return allPinks.filter(p => p.multiplier < 1000);
        return playsForStats.slice(last1000xIndex + 1).filter(p => p.multiplier >= 10 && p.multiplier < 1000);
    })();

    const hottestHouses = (() => {
        if (!hotSpots?.hottestHousesAfterPink) return [];
        const pinkIndices = historicalData.reduce((acc: number[], play, index) => {
            if (play.multiplier >= 10) acc.push(index);
            return acc;
        }, []);
        const hottestIntervals = new Set(hotSpots.hottestHousesAfterPink);
        const playsToHighlight: PlayWithId[] = [];
        for (let i = 1; i < pinkIndices.length; i++) {
            const interval = pinkIndices[i] - pinkIndices[i-1];
            if (hottestIntervals.has(interval)) {
                playsToHighlight.push(historicalData[pinkIndices[i]]);
            }
        }
        return playsToHighlight;
    })();

    return { allPinks, pinksSince50x, pinksSince100x, pinksSince1000x, hottestHouses };
  }, [playsForStats, historicalData, hotSpots]);
  

  const highlightedPlayIds = useMemo(() => {
    if (highlightedBlockPlays) {
        return new Set(highlightedBlockPlays.map(p => p.id));
    }
    if (highlightedPatternPlays) {
        return new Set(highlightedPatternPlays.map(p => p.id));
    }
    if (highlightedGrandePaguePeriod) {
        const periodPlayKeys = new Set(highlightedGrandePaguePeriod.plays.map(p => `${p.date}-${p.time}-${p.multiplier.toFixed(2)}`));
        return new Set(historicalData.filter(p => periodPlayKeys.has(`${p.date}-${p.time}-${p.multiplier.toFixed(2)}`)).map(p => p.id));
    }
    
    if (!highlightedStat) return new Set<string>();

    let playsToHighlight: PlayWithId[] = [];
    switch (highlightedStat) {
        case 'playsSinceLastPink': playsToHighlight = streakStats.playsSinceLastPink.plays; break;
        case 'maxPurpleStreak': playsToHighlight = streakStats.maxPurpleStreak.plays; break;
        case 'lastPurpleStreak': playsToHighlight = streakStats.lastPurpleStreak.plays; break;
        case 'maxPinkStreak': playsToHighlight = streakStats.maxPinkStreak.plays; break;
        case 'hottestMinutes':
          playsToHighlight = playsForStats.filter(p => hotMinutesSet.has(p.time.split(':')[1]));
          break;
        case 'hottest50xMinutes':
            playsToHighlight = playsForStats.filter(p => hot50xMinutesSet.has(p.time.split(':')[1]) && p.multiplier >= 50);
            break;
        case 'hottest100xMinutes':
            playsToHighlight = playsForStats.filter(p => hot100xMinutesSet.has(p.time.split(':')[1]) && p.multiplier >= 100);
            break;
        case 'hottest1000xMinutes':
            playsToHighlight = playsForStats.filter(p => hot1000xMinutesSet.has(p.time.split(':')[1]) && p.multiplier >= 1000);
            break;
        case 'allPinks': playsToHighlight = highlightCalculations.allPinks; break;
        case 'hottestHouses': playsToHighlight = highlightCalculations.hottestHouses; break;
        case 'hotColumns':
            const playsToRender = historicalData.slice().reverse().slice(0, displayCount);
            playsToHighlight = playsToRender.filter((play, index) => {
                const playColumn = (index % columnCount) + 1;
                return hotColumnSet.has(playColumn) && play.multiplier >= 10;
            });
            break;
        case 'pinksTo50x':
        case 'pinksSince50x': playsToHighlight = highlightCalculations.pinksSince50x; break;
        case 'pinksTo100x':
        case 'pinksSince100x': playsToHighlight = highlightCalculations.pinksSince100x; break;
        case 'pinksTo1000x':
        case 'pinksSince1000x': playsToHighlight = highlightCalculations.pinksSince1000x; break;
        default: break;
    }
    return new Set(playsToHighlight.map(p => p.id));
  }, [highlightedBlockPlays, highlightedGrandePaguePeriod, highlightedStat, streakStats, playsForStats, historicalData, hotMinutesSet, hot50xMinutesSet, hot100xMinutesSet, hot1000xMinutesSet, hotColumnSet, displayCount, columnCount, highlightCalculations, highlightedPatternPlays]);

  useEffect(() => {
    if (!scrollTarget) return;

    const { sectionId, playId } = scrollTarget;
    
    const sectionElement = document.getElementById(sectionId);
    let playElement: HTMLDivElement | undefined | null = null;
    
    if (playId) {
        playElement = playRefs.current.get(playId);
    }
    
    if (playElement) {
        playElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
    } else if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    onScrollComplete();

  }, [scrollTarget, onScrollComplete, playRefs]);
  
  const displayPlays = historicalData.slice().reverse().slice(0, displayCount);
  const columnOptions = [7, 10, 15, 20, 25, 30];
  
  const { pinksByColumn, maxPinkCount } = useMemo(() => {
    const map = new Map<number, number>();
    displayPlays.forEach((play, index) => {
        if (play.multiplier >= 10) {
            const col = (index % columnCount) + 1;
            map.set(col, (map.get(col) || 0) + 1);
        }
    });
    const max = Math.max(1, ...Array.from(map.values()));
    return { pinksByColumn: map, maxPinkCount: max };
  }, [displayPlays, columnCount]);

  return (
    <div className="bg-gray-900/50 rounded-xl p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 items-stretch gap-6 mb-6">
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <StatDisplay title="Desde Última Rosa" value={streakStats.playsSinceLastPink.count} colorClass="text-pink-400" onClick={() => onStatHighlight('playsSinceLastPink')} isHighlighted={highlightedStat === 'playsSinceLastPink'} />
            <StatDisplay title="Maior Seq. Roxo" value={streakStats.maxPurpleStreak.count} colorClass="text-purple-400" onClick={() => onStatHighlight('maxPurpleStreak')} isHighlighted={highlightedStat === 'maxPurpleStreak'} />
            <StatDisplay title="Última Seq. Roxo" value={streakStats.lastPurpleStreak.count} colorClass="text-purple-400" onClick={() => onStatHighlight('lastPurpleStreak')} isHighlighted={highlightedStat === 'lastPurpleStreak'} />
            <StatDisplay title="Maior Seq. Rosa" value={streakStats.maxPinkStreak.count} colorClass="text-pink-400" onClick={() => onStatHighlight('maxPinkStreak')} isHighlighted={highlightedStat === 'maxPinkStreak'} />
        </div>
         <div className="lg:col-span-1">
             <MarketThermometer
                 marketState={marketState}
                 percentage={marketStatePercentage}
             />
         </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-900/50 p-4 rounded-xl">
                <h4 className="font-semibold text-gray-300 mb-2 text-center">Últimas 3 Repetições Próximas</h4>
                <div className="space-y-2">
                    {lastThreeRepetitions.length > 0 ? lastThreeRepetitions.map((rep, idx) => (
                        <div key={idx} className="flex items-center justify-center gap-2 bg-gray-900/50 p-2 rounded-lg">
                            <MiniPlayDisplay play={rep.trigger} />
                            <div className="text-center">
                                <span className="text-sm font-bold text-amber-400">{rep.between.length + 1}</span>
                                <p className="text-xs text-gray-500 -mt-1">casas</p>
                            </div>
                            <MiniPlayDisplay play={rep.result} />
                        </div>
                    )) : <p className="text-sm text-center text-gray-600 italic py-4">Nenhuma repetição recente.</p>}
                </div>
            </div>
             {hottestPurpleTrigger ? (
                <button 
                    onClick={() => onHighlightBlock(hottestPurpleTrigger.playsToHighlight)}
                    className="bg-gray-900/50 p-4 rounded-xl text-center hover:bg-gray-700/50 transition-colors"
                >
                    <h4 className="font-semibold text-gray-300 mb-2">Gatilho Roxo Mais Quente</h4>
                    <p className="text-5xl font-bold text-purple-400">{hottestPurpleTrigger.range}</p>
                    <p className="text-gray-400">Puxou rosa <span className="font-bold text-white">{hottestPurpleTrigger.count}</span> vezes</p>
                    <p className="text-xs text-amber-400 mt-2 animate-pulse">Clique para destacar no histórico</p>
                </button>
            ) : (
                 <div className="bg-gray-900/50 p-4 rounded-xl text-center flex flex-col justify-center">
                     <h4 className="font-semibold text-gray-300 mb-2">Gatilho Roxo Mais Quente</h4>
                    <p className="text-sm text-center text-gray-600 italic">Nenhum gatilho roxo-rosa encontrado.</p>
                 </div>
            )}
       </div>
      
      <div className="flex flex-col items-center justify-center gap-4 mb-6">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm text-gray-400">Mostrar:</span>
            {[50, 100, 500, 1000].map(count => {
                const isAllowed = count === 50 || isPremium;
                return (
                    <button 
                        key={count} 
                        onClick={isAllowed ? () => setDisplayCount(count) : showPremiumModal} 
                        disabled={!isAllowed || (count > historicalData.length && historicalData.length > 0)} 
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${displayCount === count ? 'bg-amber-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'} disabled:bg-gray-700/50 disabled:cursor-not-allowed`} 
                        title={!isAllowed ? "Funcionalidade Premium" : (count > historicalData.length ? `Apenas ${historicalData.length} jogadas disponíveis` : '')}
                    >
                        {count > 1000 ? `${count/1000}k` : count}
                        {!isAllowed && '👑'}
                    </button>
                )
            })}
          </div>
          <div className="flex items-center justify-center space-x-2 flex-wrap gap-y-2">
              <span className="text-sm text-gray-400">Colunas:</span>
              {columnOptions.map(count => {
                  const isAllowed = count === 7 || isPremium;
                  return (
                    <button 
                        key={count} 
                        onClick={isAllowed ? () => setColumnCount(count) : showPremiumModal}
                        disabled={!isAllowed}
                        className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-md transition-colors ${columnCount === count ? 'bg-amber-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'} disabled:bg-gray-700/50 disabled:cursor-not-allowed`}
                        title={!isAllowed ? "Funcionalidade Premium" : ''}
                    >
                        {count}
                        {!isAllowed && '👑'}
                    </button>
                  );
              })}
          </div>
      </div>
      
      <div>
        <div className="grid gap-x-2 gap-y-4" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
            {/* Column Headers */}
            {Array.from({ length: columnCount }, (_, i) => i + 1).map(colNumber => {
                const count = pinksByColumn.get(colNumber) || 0;
                const color = getColumnHeatColor(count, maxPinkCount);
                return (
                  <div
                      key={`header-${colNumber}`}
                      className="relative text-center font-bold text-white p-2 rounded-md shadow-md text-xl"
                      style={{ 
                          backgroundColor: color,
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                      }}
                  >
                      {colNumber}
                      {count > 0 && (
                          <div 
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/40 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-white/30"
                              title={`${count} rosa(s) nesta coluna`}
                          >
                              {count}
                          </div>
                      )}
                  </div>
                )
            })}

            {displayPlays.map((play, index) => {
                const isHighlighted = highlightedPlayIds.has(play.id);
                const playMinute = play.time.split(':')[1];
                const isHotMinutePlay = hotMinutesSet.has(playMinute) && play.multiplier >= 2;
                const playColumn = (index % columnCount) + 1;
                const isVerticalRepeat = play.multiplier >= 10 && (pinksByColumn.get(playColumn) || 0) > 1;

                const isBlockHighlight = highlightedBlockPlays && isHighlighted;
                
                const innerHighlightClass = !isBlockHighlight && isHighlighted
                  ? (highlightedPatternPlays ? 'animate-pulse-pattern' : 'ring-2 ring-offset-2 ring-amber-400 ring-offset-gray-950')
                  : '';
                
                const totalPlays = historicalData.length;
                const houseNumber = totalPlays - historicalData.findIndex(p => p.id === play.id);

                return (
                  <div 
                      key={play.id} 
                      ref={el => {
                          if (el) playRefs.current.set(play.id, el);
                          else playRefs.current.delete(play.id);
                      }}
                      className={`text-center transition-all duration-300 ${isBlockHighlight ? 'animate-block-highlight rounded-lg' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <div 
                          className={`w-full rounded-md h-10 md:h-12 flex flex-col items-center justify-center shadow-lg border border-black/20 relative transition-all duration-300 ${innerHighlightClass}`}
                          style={getDynamicPlayStyle(play.multiplier)}
                      >
                          <span className="font-bold text-white text-xs md:text-sm leading-tight drop-shadow-sm">
                              {`${play.multiplier.toFixed(2).replace('.', ',')}x`}
                          </span>
                          {isHotMinutePlay && (
                              <span className="absolute top-0.5 right-1 text-xs" title={`Minuto Quente: ${play.time}`}>🔥</span>
                          )}
                          {isVerticalRepeat && (
                              <span className="absolute top-0.5 left-1 text-xs" title={`Repetição Vertical na Coluna ${playColumn}`}>🎯</span>
                          )}
                      </div>
                      <div className="mt-1 md:mt-1.5 text-[10px] md:text-xs text-center">
                          <p className="text-gray-400 font-semibold">{houseNumber} 🏠</p>
                          <p className="text-gray-500">{play.time}</p>
                      </div>
                    </div>
                  </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default RecentPlays;