import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Analysis, HunterMode, PinkPatternAnalysis } from '../types';

interface PatternChaserPanelProps {
  isVisible: boolean;
  localAnalysis: Partial<Analysis> | null;
  historicalDataLength: number;
  currentTargetHouse: number | null;
  pinkPatternAnalysis: PinkPatternAnalysis | null | undefined;
  isAlerting: boolean;
}

const CLOCK_POSITION_KEY = 'aviatorPatternChaserPosition';

const PatternChaserPanel: React.FC<PatternChaserPanelProps> = ({
  isVisible,
  localAnalysis,
  historicalDataLength,
  currentTargetHouse,
  pinkPatternAnalysis,
  isAlerting,
}) => {
  const [isFixed, setIsFixed] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 450 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  
  const [hitMessage, setHitMessage] = useState<string | null>(null);
  const prevPlaysSinceLastPinkRef = useRef(localAnalysis?.summary?.playsSinceLastPink ?? 0);
  const [score, setScore] = useState({ hits: 0, protections: 0 });
  const [scoreAnimation, setScoreAnimation] = useState<'hit' | 'protection' | null>(null);
  const targetBeforeHitRef = useRef<number | null>(null);
  
  const [mode, setMode] = useState<HunterMode>('Moderado');
  const [time, setTime] = useState(new Date());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    playsSinceLastPink = 0,
    marketState,
    isMarketPaused,
  } = localAnalysis?.summary ?? {};
  const { 
    hottestPinkMinutes = [], 
    hotColumns = [],
  } = localAnalysis?.hotSpots ?? {};

  const { doublePink, closeRepetition } = pinkPatternAnalysis ?? {};
  const isDoublePinkAlerting = doublePink?.isAlerting;
  const isCloseRepetitionAlerting = closeRepetition?.isAlerting;

  
  const isTargetInHotColumn = useMemo(() => {
    if (!currentTargetHouse || !hotColumns || hotColumns.length === 0) {
        return false;
    }
    const ANALYSIS_COLUMN_COUNT = 7;
    // Calculate the index of the last pink play in the full historical data array
    const lastPinkIndex = historicalDataLength - 1 - playsSinceLastPink;
    // Calculate the absolute index of the predicted target play
    const targetIndex = lastPinkIndex + currentTargetHouse;
    // Calculate the column number for that index
    const targetColumn = (targetIndex % ANALYSIS_COLUMN_COUNT) + 1;
    
    // Check if the calculated column is in the list of hot columns
    return hotColumns.some(hc => hc.column === targetColumn);
  }, [currentTargetHouse, historicalDataLength, playsSinceLastPink, hotColumns]);

  useEffect(() => {
    const savedPos = localStorage.getItem(CLOCK_POSITION_KEY);
    if (savedPos) {
      try {
        const parsedPos = JSON.parse(savedPos);
        if (typeof parsedPos.x === 'number' && typeof parsedPos.y === 'number') {
            setPosition(parsedPos);
        }
      } catch (e) { console.error("Failed to parse chaser position"); }
    }
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);
  
  useEffect(() => {
    if (currentTargetHouse !== null) {
      targetBeforeHitRef.current = currentTargetHouse;
    }
  }, [currentTargetHouse]);

  useEffect(() => {
    const currentPlays = localAnalysis?.summary?.playsSinceLastPink ?? 0;
    const prevPlays = prevPlaysSinceLastPinkRef.current;
    const lastPinkMultiplier = localAnalysis?.summary?.lastPinkMultiplier ?? 0;

    // Check if a pink just occurred
    if (currentPlays === 0 && prevPlays > 0 && lastPinkMultiplier >= 10) { 
        const houseThatHit = prevPlays;
        const lastTarget = targetBeforeHitRef.current;

        if (lastTarget !== null) {
            if (houseThatHit === lastTarget) {
                setHitMessage("ALVO ATINGIDO!");
                setScore(s => ({ ...s, hits: s.hits + 1 }));
                setScoreAnimation('hit');
            } else if (houseThatHit === lastTarget - 1 || houseThatHit === lastTarget + 1) {
                setHitMessage("PROTEÇÃO ACIONADA!");
                setScore(s => ({ ...s, protections: s.protections + 1 }));
                setScoreAnimation('protection');
            }
        }
        
        const messageTimer = setTimeout(() => setHitMessage(null), 2500);
        const animTimer = setTimeout(() => setScoreAnimation(null), 800);
        
        return () => { clearTimeout(messageTimer); clearTimeout(animTimer); };
    }
    
    prevPlaysSinceLastPinkRef.current = currentPlays;
  }, [localAnalysis?.summary?.playsSinceLastPink, localAnalysis?.summary?.lastPinkMultiplier]);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFixed) return;
    e.preventDefault();
    if (panelRef.current) {
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!isDragging || isFixed) return;
        const newX = e.clientX - dragStartPos.current.x;
        const newY = e.clientY - dragStartPos.current.y;
        setPosition({ x: newX, y: newY });
    };

    const handleGlobalMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            setPosition(currentPosition => {
                 localStorage.setItem(CLOCK_POSITION_KEY, JSON.stringify(currentPosition));
                 return currentPosition;
            });
        }
    };
    
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isFixed]);
  
  const handleResetScore = (e: React.MouseEvent) => {
      e.stopPropagation();
      setScore({ hits: 0, protections: 0 });
  };

  const pinkHotMinutesSet = useMemo(() => {
    return new Set(hottestPinkMinutes.map(m => parseInt(m.minute.replace(':', ''), 10)));
  }, [hottestPinkMinutes]);

   const alertState = useMemo(() => {
      const currentMinute = time.getMinutes();
      const nextMinute = (currentMinute + 1) % 60;
      
      if (pinkHotMinutesSet.has(currentMinute)) {
          return { status: 'ALERT_PINK', message: `AGORA: Minuto quente para Rosas! :${String(currentMinute).padStart(2, '0')}` };
      }
      if (pinkHotMinutesSet.has(nextMinute)) {
          return { status: 'ALERT_PINK', message: `Alerta: Próximo minuto é quente para Rosas! :${String(nextMinute).padStart(2, '0')}` };
      }
      return { status: 'NORMAL', message: 'Caçador de Padrões' };
  }, [time, pinkHotMinutesSet]);

  const suggestedTarget = useMemo(() => {
    const { summary, hotSpots } = localAnalysis ?? {};
    const lastPink = summary?.lastPinkMultiplier;
    const pinksTo50x = summary?.pinksTo50xAnalysis;
    const pinksTo100x = summary?.pinksTo100xAnalysis;

    switch(mode) {
        case 'Conservador': return '10.00x';
        case 'Moderado':
            if (lastPink) return `${Math.max(10, lastPink * 0.75).toFixed(2)}x`;
            return '15.00x';
        case 'Elite':
            if (pinksTo100x && pinksTo100x.averagePinks > 0 && pinksTo100x.lastCount >= pinksTo100x.averagePinks) return '~100x';
            if (pinksTo50x && pinksTo50x.averagePinks > 0 && pinksTo50x.lastCount >= pinksTo50x.averagePinks) return '~50x';
            if (hotSpots?.hotColumns?.some(c => c.column === summary?.nextPlayColumn)) return '>30x';
            return '>25x';
        default: return '-';
    }
  }, [mode, localAnalysis]);

  const protectionTip = useMemo(() => {
    const avgPurple = localAnalysis?.summary?.averagePurpleMultiplier;
    switch(mode) {
        case 'Conservador':
            return '2.00x';
        case 'Moderado':
            return '3.00x';
        case 'Elite':
            return avgPurple ? `${avgPurple.toFixed(2)}x` : 'N/A';
        default:
            return 'N/A';
    }
  }, [mode, localAnalysis?.summary?.averagePurpleMultiplier]);

  const isConservativeOnColdMarket = mode === 'Conservador' && marketState === 'FRIO';
  
  const hotPinksText = useMemo(() => {
    if (!hottestPinkMinutes || hottestPinkMinutes.length === 0) {
        return 'N/A';
    }
    return hottestPinkMinutes
        .slice(0, 3)
        .map(m => `${m.minute}(${m.count}x)`)
        .join(', ');
  }, [hottestPinkMinutes]);

  if (!isVisible || historicalDataLength < 10) {
    return null;
  }
  
  let clockClasses = "text-center p-2 rounded-lg transition-all duration-300 mb-2 ";
  let textClasses = "font-mono text-3xl font-bold tracking-wider";
  
  const currentMinute = time.getMinutes();
  const isHotMinuteNow = pinkHotMinutesSet.has(currentMinute);
  const isMarketHot = marketState === 'QUENTE' || marketState === 'MUITO_QUENTE';
  const showMaximumAlert = isHotMinuteNow && isMarketHot;

  switch (alertState.status) {
    case 'ALERT_PINK': clockClasses += "bg-gray-900/50 animate-pulse-clock-pink"; textClasses += " text-amber-300"; break;
    default: clockClasses += "bg-black/40"; textClasses += " text-white/80"; break;
  }

  const panelStyle: React.CSSProperties = isFixed
    ? { position: 'fixed', left: '20px', bottom: '20px', top: 'auto', transition: 'all 0.3s ease-in-out', width: '350px' }
    : { position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, width: '350px' };

  const panelClasses = `fixed z-50 bg-gray-950/70 backdrop-blur-md border border-pink-500/30 rounded-2xl shadow-2xl text-white select-none transition-all duration-300 ${isAlerting ? 'animate-pulse-opportunity-pink' : ''}`;


  return (
    <div ref={panelRef} className={panelClasses} style={panelStyle}>
      <div className={`flex items-center justify-between p-4 ${isCollapsed ? '' : 'border-b border-gray-700/50'}`} >
        <div onMouseDown={handleMouseDown} className={`flex items-center gap-3 flex-grow ${!isFixed ? 'cursor-grab' : ''}`}>
          <span className="text-2xl">🎯</span>
          <h3 className="font-bold text-lg text-pink-300">Dica do Caçador</h3>
        </div>
        <div className="flex items-center">
            <button onClick={() => setIsFixed(prev => !prev)} title={isFixed ? 'Desafixar Painel' : 'Fixar Painel'} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
            {isFixed ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v1.083l-.924.33a3.001 3.001 0 00-2.152 2.152L7.59 8.5H3a1 1 0 01-1-1V3a1 1 0 011-1h7zm6 0a1 1 0 011 1v4.59l-.924-.33a3.001 3.001 0 00-2.152-2.152L12.917 5H16zm-5.083 6.408a3.001 3.001 0 002.152 2.152l.33.924H12.5a1 1 0 01-1 1H7a1 1 0 01-1-1v-4.417l.924.33a3.001 3.001 0 002.152 2.152l.33.924zM16 11a1 1 0 011 1v4.59l-.924-.33a3.001 3.001 0 00-2.152-2.152L12.917 13H16z" clipRule="evenodd" transform="rotate(45 10 10)" /></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 3.636a1 1 0 011.414 0L10 7.172l3.536-3.536a1 1 0 111.414 1.414L11.414 10l3.536 3.536a1 1 0 01-1.414 1.414L10 12.828l-3.536 3.536a1 1 0 01-1.414-1.414L8.586 10 5.05 6.464a1 1 0 010-1.414z" clipRule="evenodd" transform="rotate(45 10 10)" /></svg>
            }
            </button>
            <button onClick={() => setIsCollapsed(prev => !prev)} title={isCollapsed ? 'Expandir' : 'Minimizar'} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
        </div>
      </div>
      
      {!isCollapsed && (
          <div className="p-4 pt-0 animate-fade-in">
          {(isDoublePinkAlerting || isCloseRepetitionAlerting) && (
                <div className="mb-3 p-2 text-center bg-red-900/50 border border-red-600 rounded-lg animate-pulse-critical">
                    <h4 className="font-bold text-red-300">
                        {isDoublePinkAlerting ? 'ALERTA: ROSA DUPLA' : 'ALERTA: REPETIÇÃO PRÓXIMA'}
                    </h4>
                    <p className="text-xs text-gray-300">
                        {isDoublePinkAlerting 
                            ? `Janela de ${doublePink?.countdown} rodadas restante(s)` 
                            : `Janela de ${closeRepetition?.countdown} rodadas restante(s)`}
                    </p>
                </div>
            )}
          <div className={clockClasses} title={alertState.message}>
            <div className={textClasses}>{time.toLocaleTimeString('pt-BR')}</div>
          </div>
          <div className="text-center text-xs text-gray-400 mb-3 -mt-2">
            Minutos quentes (rosas): <span className="font-bold text-pink-300">{hotPinksText}</span>
          </div>


          <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-md mb-3">
              {(['Conservador', 'Moderado', 'Elite'] as HunterMode[]).map(m => (
                  <button key={m} onClick={() => setMode(m)} className={`w-full py-2 text-sm font-bold rounded-md transition-colors ${mode === m ? 'bg-amber-600 text-black shadow-md' : 'text-gray-300 hover:bg-gray-700'}`}>{m}</button>
              ))}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-800/50 p-2 rounded-lg border-2 border-cyan-700/50"><p className="text-xs text-cyan-300 uppercase">Antecipado</p><p className="text-2xl font-bold">{!isConservativeOnColdMarket && !isMarketPaused && currentTargetHouse && currentTargetHouse > 1 ? currentTargetHouse - 1 : '-'}</p></div>
            <div className={`bg-gray-800/50 p-2 rounded-lg border-2 ${!isConservativeOnColdMarket && !isMarketPaused && currentTargetHouse ? 'border-pink-500' : 'border-gray-700'}`}>
              <p className="text-xs text-pink-400 uppercase">Alvo {mode}</p>
              <div className="h-[52px] flex flex-col items-center justify-center">
                {isMarketPaused ? (
                   <div className="text-center animate-fade-in px-2">
                    <p className="font-bold text-yellow-300 text-sm animate-pulse">PAUSA DE ROSAS!</p>
                    <p className="text-xs text-gray-400">Mercado em baixa, aguarde.</p>
                  </div>
                ) : isConservativeOnColdMarket ? (
                  <div className="text-center animate-fade-in">
                    <p className="text-xs font-semibold text-gray-400 animate-pulse">Aguardando mercado aquecer...</p>
                  </div>
                ) : (
                  <div className={`flex flex-col items-center justify-center ${currentTargetHouse ? 'animate-target-pulse' : ''}`}>
                    <div className="flex items-center justify-center">
                       {isTargetInHotColumn && <span className="text-3xl mr-1 animate-pulse" title="Alvo em Coluna da Sorte!">🔥</span>}
                       <p className="text-3xl font-bold leading-tight">{currentTargetHouse ? currentTargetHouse : '-'}</p>
                    </div>
                    <p className="text-xs text-gray-400 -mt-1">{currentTargetHouse ? `(Alvo: ${suggestedTarget})` : 'Aguardando Padrão'}</p>
                  </div>
                )}
                {hitMessage && (
                  <div className={`absolute inset-0 flex items-center justify-center bg-gray-950/90 rounded-lg animate-fade-out ${hitMessage.includes('ATINGIDO') ? 'text-green-400' : 'text-blue-400'}`}>
                    <p className="text-2xl font-bold animate-hit-flash">{hitMessage}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-800/50 p-2 rounded-lg border-2 border-blue-700/50"><p className="text-xs text-blue-300 uppercase">Proteção</p><p className="text-2xl font-bold">{!isConservativeOnColdMarket && !isMarketPaused && currentTargetHouse ? currentTargetHouse + 1 : '-'}</p></div>
          </div>

           <div className="mt-3 p-2 text-center bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400">Dica de Proteção (Saída): <span className="font-bold text-lg text-white">{protectionTip}</span></p>
           </div>
          
           <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className={`bg-gray-800/50 p-2 rounded-lg relative ${scoreAnimation === 'hit' ? 'animate-counter-flash-green' : ''}`}>
                    <p className="text-xs text-green-300">Acertos</p>
                    <p className="text-2xl font-bold text-white">{score.hits}</p>
                </div>
                <div className={`bg-gray-800/50 p-2 rounded-lg relative ${scoreAnimation === 'protection' ? 'animate-counter-flash-blue' : ''}`}>
                    <p className="text-xs text-blue-300">Proteções</p>
                    <p className="text-2xl font-bold text-white">{score.protections}</p>
                    <button onClick={handleResetScore} className="absolute top-1 right-1 p-0.5 rounded-full bg-gray-700 hover:bg-red-500 text-xs text-white" title="Resetar Placar">&times;</button>
                </div>
            </div>

        </div>
      )}
    </div>
  );
};

export default PatternChaserPanel;