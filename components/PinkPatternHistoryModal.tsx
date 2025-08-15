import React, { useMemo, useState } from 'react';
import type { PinkPatternAnalysis, PinkPatternOccurrence, PlayWithId, DailyRankedPattern, Color, GenericPatternOccurrence } from '../types';
import { Color as ColorEnum } from '../types';

interface PinkPatternHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patternInfo: { name: string; pattern?: Color[] } | null;
  analysis: PinkPatternAnalysis | null;
  dailyRanking: DailyRankedPattern[];
}

const getPlayStyle = (multiplier: number): string => {
  if (multiplier >= 10) return 'bg-pink-500 text-white border-pink-400';
  if (multiplier >= 2) return 'bg-purple-500 text-white border-purple-400';
  return 'bg-cyan-500 text-white border-cyan-400';
};

const colorMap = {
    [ColorEnum.Blue]: { name: "Azul", style: 'bg-cyan-500' },
    [ColorEnum.Purple]: { name: "Roxo", style: 'bg-purple-500' },
    [ColorEnum.Pink]: { name: "Rosa", style: 'bg-pink-500' },
};

const PatternDisplay: React.FC<{ pattern: Color[] }> = ({ pattern }) => {
  return (
     <div className="flex items-center gap-1.5 flex-wrap">
      {pattern.map((color, index) => (
        <div key={index} className={`w-5 h-5 rounded ${colorMap[color].style}`} />
      ))}
    </div>
  );
};

const PlayCard: React.FC<{ play: PlayWithId; label?: string; isTrigger?: boolean; isHit?: boolean }> = ({ play, label, isTrigger = false, isHit = false }) => {
    let baseClasses = `relative w-16 h-14 flex-shrink-0 rounded-md text-xs font-bold flex flex-col items-center justify-center transition-all duration-200 border ${getPlayStyle(play.multiplier)}`;
    if (isTrigger) {
        baseClasses += ' border-yellow-400';
    }
    if (isHit) {
        baseClasses += ' ring-2 ring-offset-2 ring-offset-gray-800 ring-yellow-400 animate-pulse';
    }

    return (
        <div className="flex flex-col items-center gap-0.5">
             {label && <p className="text-[11px] text-gray-400 font-semibold">{label}</p>}
            <div className={baseClasses} title={`${play.multiplier.toFixed(2)}x às ${play.time}`}>
                <span className="text-base font-bold leading-tight">{play.multiplier.toFixed(2)}x</span>
                <span className="text-[10px] leading-tight opacity-80">{play.time}</span>
            </div>
        </div>
    );
};


const OccurrenceCard: React.FC<{ occurrence: PinkPatternOccurrence | GenericPatternOccurrence; alertWindow: { start: number; end: number } }> = ({ occurrence, alertWindow }) => {
    const hitPlay = occurrence.outcomePlays
        .slice(alertWindow.start - 1, alertWindow.end)
        .find(p => p.multiplier >= 10);
    const hitIndex = hitPlay ? occurrence.outcomePlays.findIndex(p => p.id === hitPlay.id) : -1;
    const isPinkPattern = 'distance' in occurrence;

    return (
        <div className="bg-gray-900/50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                 <p className="text-sm text-gray-400">
                    Gatilho em <span className="font-semibold text-white">{new Date(`${occurrence.triggerPlays[occurrence.triggerPlays.length - 1].date}T${occurrence.triggerPlays[occurrence.triggerPlays.length - 1].time}`).toLocaleString('pt-BR')}</span>
                 </p>
                <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${hitPlay ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {hitPlay ? `ACERTO NA ${hitIndex + 1}ª CASA (${hitPlay.multiplier.toFixed(2)}x)` : 'ERRO'}
                </div>
            </div>
            <div className="w-full overflow-x-auto pb-1">
                <div className="flex items-end gap-1.5 w-max">
                    {occurrence.triggerPlays.map((play, index) => (
                        <React.Fragment key={play.id}>
                            <PlayCard play={play} label={`Gatilho ${index + 1}`} isTrigger />
                            {isPinkPattern && index === 0 && (
                                <div className="text-center text-gray-500 px-1 self-center">
                                    <span className="text-sm font-bold">{(occurrence as PinkPatternOccurrence).distance}</span>
                                    <p className="text-xs -mt-1">casas</p>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                    
                    <div className="h-10 w-px bg-gray-600 mx-1 self-center"></div>

                    {occurrence.outcomePlays.map((play, index) => {
                        const isInWindow = index >= alertWindow.start - 1 && index < alertWindow.end;
                        const isHit = isInWindow && play.id === hitPlay?.id;
                        return <PlayCard key={play.id} play={play} label={`${index + 1}ª`} isHit={isHit} />;
                    })}
                    {occurrence.outcomePlays.length === 0 && <p className="text-xs text-gray-600 italic self-center">Fim do histórico</p>}
                 </div>
            </div>
        </div>
    );
};

const PinkPatternHistoryModal: React.FC<PinkPatternHistoryModalProps> = ({ isOpen, onClose, patternInfo, analysis, dailyRanking }) => {
    const [dateFilter, setDateFilter] = useState('all');

    const data = useMemo(() => {
        if (!patternInfo || !analysis) return null;
        
        let history: (PinkPatternOccurrence | GenericPatternOccurrence)[] | undefined;
        let alertWindow: { start: number; end: number };
        let title = patternInfo.name;
        let patternColors: Color[] | undefined = patternInfo.pattern;

        if (patternInfo.name === 'Rosa Dupla') {
            history = analysis.doublePink.history;
            alertWindow = analysis.doublePink.alertWindow;
        } else if (patternInfo.name === 'Repetição Próxima') {
            history = analysis.closeRepetition.history;
            alertWindow = analysis.closeRepetition.alertWindow;
        } else {
            const rankedPattern = dailyRanking.find(p => p.name === patternInfo.name && JSON.stringify(p.pattern) === JSON.stringify(patternInfo.pattern));
            history = rankedPattern?.history as GenericPatternOccurrence[] | undefined;
            alertWindow = { start: 1, end: 1 }; // Only next play matters for "hit" in cataloged
        }

        if (!history) return null;
        
        const uniqueDates = ['all', ...Array.from(new Set(history.map(occ => occ.triggerPlays[occ.triggerPlays.length - 1].date)))];
        
        const filteredHistory = dateFilter === 'all' 
            ? history 
            : history.filter(occ => occ.triggerPlays[occ.triggerPlays.length - 1].date === dateFilter);

        const hits = filteredHistory.filter(occ => 
            occ.outcomePlays.slice(alertWindow.start - 1, alertWindow.end).some(p => p.multiplier >= 10)
        );
        
        const hitRate = filteredHistory.length > 0 ? (hits.length / filteredHistory.length) * 100 : 0;
        
        const hitPinks = hits.map(occ => ({
            play: occ.outcomePlays.slice(alertWindow.start - 1, alertWindow.end).find(p => p.multiplier >= 10)!,
            index: occ.outcomePlays.findIndex(p => p.id === occ.outcomePlays.slice(alertWindow.start - 1, alertWindow.end).find(p => p.multiplier >= 10)!.id)
        }));

        const avgMultiplier = hitPinks.length > 0 ? hitPinks.reduce((sum, p) => sum + p.play.multiplier, 0) / hitPinks.length : 0;

        const houseHits = new Map<number, number>();
        hitPinks.forEach(hit => {
            const houseNumber = hit.index + 1;
            houseHits.set(houseNumber, (houseHits.get(houseNumber) || 0) + 1);
        });
        
        const topHittingHouses = Array.from(houseHits.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return {
            title,
            patternColors,
            history: filteredHistory.slice().reverse(), // Show newest first
            alertWindow,
            uniqueDates,
            stats: {
                total: filteredHistory.length,
                hits: hits.length,
                hitRate,
                avgMultiplier,
                topHittingHouses,
            }
        };

    }, [patternInfo, analysis, dailyRanking, dateFilter]);

    if (!isOpen || !data) return null;

    return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-3">
                Histórico: <span className="text-pink-400">{data.title}</span>
                {data.patternColors && <PatternDisplay pattern={data.patternColors} />}
            </h2>
            <p className="text-sm text-gray-400">{data.stats.total} ocorrências encontradas para o período selecionado.</p>
          </div>
           <div className="flex items-center gap-4">
             <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-gray-700 text-white p-2 rounded-lg border border-gray-600 text-sm"
              >
                {data.uniqueDates.map(date => (
                    <option key={date} value={date}>
                        {date === 'all' ? 'Todo o Período' : new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')}
                    </option>
                ))}
              </select>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>
        </div>

        <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-gray-900/50 flex-shrink-0">
             <div className="bg-gray-800 p-2 rounded-lg text-center">
                <p className="text-xs text-gray-400">Taxa de Acerto</p>
                <p className={`text-2xl font-bold ${data.stats.hitRate > 50 ? 'text-green-400' : 'text-amber-400'}`}>{data.stats.hitRate.toFixed(1)}%</p>
            </div>
             <div className="bg-gray-800 p-2 rounded-lg text-center">
                <p className="text-xs text-gray-400">Acertos / Total</p>
                <p className="text-2xl font-bold text-white">{data.stats.hits} / {data.stats.total}</p>
            </div>
             <div className="bg-gray-800 p-2 rounded-lg text-center">
                <p className="text-xs text-gray-400">Média (Acertos)</p>
                <p className="text-2xl font-bold text-pink-400">{data.stats.avgMultiplier.toFixed(2)}x</p>
            </div>
             <div className="bg-gray-800 p-2 rounded-lg text-center">
                <p className="text-xs text-gray-400">Casas Mais Quentes</p>
                <p className="text-base font-bold text-white truncate">
                    {data.stats.topHittingHouses.length > 0
                        ? data.stats.topHittingHouses.map(([house, count]) => `${house}ª (${count})`).join(', ')
                        : 'N/A'
                    }
                </p>
            </div>
        </div>
        
        <div className="p-4 overflow-y-auto space-y-3 flex-grow">
            {data.history.length > 0 ? (
                data.history.map((occurrence, index) => (
                    <OccurrenceCard key={index} occurrence={occurrence} alertWindow={data.alertWindow} />
                ))
            ) : (
                <p className="text-center text-gray-500 italic py-16">Nenhuma ocorrência deste padrão foi encontrada para a data selecionada.</p>
            )}
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

export default PinkPatternHistoryModal;