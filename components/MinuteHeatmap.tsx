import React, { useState, useMemo } from 'react';
import { heatmapData as globalHeatmapData } from '../data/heatmapData';
import type { Play, MinuteTrendData } from '../types';
import MinuteTrendModal from './MinuteTrendModal';

interface MinuteHeatmapProps {
    historicalData: Play[];
}

const MinuteHeatmap: React.FC<MinuteHeatmapProps> = ({ historicalData }) => {
    const [tooltip, setTooltip] = useState<{ minute: number; count: number; temperature: string; x: number; y: number } | null>(null);
    const [analysisType, setAnalysisType] = useState<'global' | 'live' | 'trends'>('global');
    const [windowSize, setWindowSize] = useState<number>(5);
    const [selectedTrendMinute, setSelectedTrendMinute] = useState<MinuteTrendData | null>(null);

    const trendData = useMemo<MinuteTrendData[]>(() => {
        if (analysisType !== 'trends' || historicalData.length < 1) {
            return [];
        }

        const dailyMinuteCounts = new Map<string, Map<number, number>>();
        historicalData.forEach(play => {
            if (play.multiplier >= 10) {
                const dayKey = play.date;
                const minute = parseInt(play.time.split(':')[1], 10);
                if (isNaN(minute)) return;

                if (!dailyMinuteCounts.has(dayKey)) {
                    dailyMinuteCounts.set(dayKey, new Map());
                }
                const minuteMap = dailyMinuteCounts.get(dayKey)!;
                minuteMap.set(minute, (minuteMap.get(minute) || 0) + 1);
            }
        });

        const sortedDays = Array.from(dailyMinuteCounts.keys()).sort();
        if (sortedDays.length < 3) return []; // Need at least 3 days for a meaningful trend

        const minuteTimeSeries = Array.from({ length: 60 }, (_, minute) => {
            const series = sortedDays.map(day => ({
                date: day,
                count: dailyMinuteCounts.get(day)?.get(minute) || 0,
            }));
            return { minute, series };
        });
        
        const MOVING_AVERAGE_WINDOW = Math.min(7, Math.max(3, Math.floor(sortedDays.length / 2)));

        return minuteTimeSeries.map(({ minute, series }) => {
            const movingAverages: number[] = [];
            for (let i = MOVING_AVERAGE_WINDOW - 1; i < series.length; i++) {
                const window = series.slice(i - MOVING_AVERAGE_WINDOW + 1, i + 1);
                const sum = window.reduce((acc, val) => acc + val.count, 0);
                movingAverages.push(sum / MOVING_AVERAGE_WINDOW);
            }

            let trend: 'up' | 'down' | 'stable' = 'stable';
            let latestSma = 0;
            if (movingAverages.length >= 2) {
                const latest = movingAverages[movingAverages.length - 1];
                const previous = movingAverages[movingAverages.length - 2];
                latestSma = latest;
                if (latest > previous * 1.15) trend = 'up'; // 15% increase
                else if (latest < previous * 0.85) trend = 'down'; // 15% decrease
            }

            return { minute, trend, latestSma, detailedSeries: series };
        });

    }, [analysisType, historicalData]);


    const liveHeatmapData = useMemo(() => {
        if (analysisType !== 'live' || historicalData.length === 0) {
            return [];
        }

        const recentPlays = historicalData.slice(-200);
        const pinks = recentPlays
            .filter(p => p.multiplier >= 10)
            .map(p => {
                const timeParts = p.time.split(':');
                if (timeParts.length >= 2) {
                    return parseInt(timeParts[1], 10);
                }
                return -1;
            })
            .filter(minute => minute !== -1);
            
        if (pinks.length === 0) {
            return Array.from({ length: 60 }, (_, i) => ({ minute: i, count: 0 }));
        }

        return Array.from({ length: 60 }, (_, minute) => {
            let count = 0;
            for (const pinkMinute of pinks) {
                let startMinute = minute - windowSize + 1;
                if (startMinute < 0) { // Lida com a virada da hora
                    if (pinkMinute > minute && pinkMinute >= 60 + startMinute) {
                        count++;
                    } else if (pinkMinute <= minute) {
                        count++;
                    }
                } else {
                    if (pinkMinute >= startMinute && pinkMinute <= minute) {
                        count++;
                    }
                }
            }
            return { minute, count };
        });
    }, [analysisType, windowSize, historicalData]);

    const displayData = useMemo(() => {
        if (analysisType === 'live') {
            const maxCount = Math.max(1, ...liveHeatmapData.map(d => d.count));
            return liveHeatmapData.map(d => {
                let temperature: string;
                const ratio = d.count / maxCount;
                if (d.count === 0) temperature = 'Frio';
                else if (ratio > 0.8) temperature = 'Super Quente';
                else if (ratio > 0.5) temperature = 'Quente';
                else if (ratio > 0.2) temperature = 'Morno';
                else temperature = 'Frio';
                return { ...d, temperature };
            });
        }
        return globalHeatmapData;
    }, [analysisType, liveHeatmapData]);


    const getColor = (temperature: string) => {
        switch (temperature) {
            case 'Super Quente': return 'bg-red-600 hover:bg-red-500 border-red-500';
            case 'Quente': return 'bg-orange-500 hover:bg-orange-400 border-orange-400';
            case 'Morno': return 'bg-yellow-500 hover:bg-yellow-400 border-yellow-400';
            case 'Frio': return 'bg-cyan-600 hover:bg-cyan-500 border-cyan-500';
            default: return 'bg-gray-700 hover:bg-gray-600';
        }
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, data: (typeof displayData)[0]) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({ ...data, x: rect.left + window.scrollX, y: rect.top + window.scrollY });
    };

    const description = analysisType === 'global'
        ? "Visualização da 'temperatura' de cada minuto, baseada em uma análise global de +150.000 rodadas."
        : analysisType === 'live'
        ? `Análise dinâmica das últimas ${Math.min(200, historicalData.length)} rodadas, mostrando a contagem de rosas em uma janela deslizante de ${windowSize} minutos.`
        : "Análise da tendência de longo prazo. Mostra se a frequência de rosas de um minuto está aumentando (🔼), diminuindo (🔽) ou estável (↔️) ao longo do tempo.";

    const ControlButton: React.FC<{
        label: string;
        isActive: boolean;
        onClick: () => void;
    }> = ({ label, isActive, onClick }) => (
        <button
            onClick={onClick}
            className={`px-3 py-2 text-xs font-bold rounded-md transition-colors ${isActive ? 'bg-amber-600 text-black shadow-md' : 'text-gray-300 hover:bg-gray-700'}`}
        >
            {label}
        </button>
    );

    const TrendIndicator: React.FC<{ trend: 'up' | 'down' | 'stable' }> = ({ trend }) => {
        const config = {
            up: { icon: '🔼', color: 'text-green-400', title: 'Tendência de Alta' },
            down: { icon: '🔽', color: 'text-red-400', title: 'Tendência de Baixa' },
            stable: { icon: '↔️', color: 'text-yellow-400', title: 'Tendência Estável' },
        };
        return <span title={config[trend].title} className={`text-lg ${config[trend].color}`}>{config[trend].icon}</span>;
    };

    return (
        <div className="bg-gray-800 rounded-xl p-6 shadow-xl relative">
            {selectedTrendMinute && <MinuteTrendModal data={selectedTrendMinute} onClose={() => setSelectedTrendMinute(null)} />}

            <h3 className="text-xl font-bold mb-2 text-center">Mapa de Calor & Tendências</h3>
            <p className="text-sm text-gray-400 mb-4 text-center min-h-[40px]">
                {description}
            </p>
            <div className="flex justify-center items-center gap-2 mb-4 bg-gray-900/50 p-1.5 rounded-lg flex-wrap">
                <ControlButton label="Global" isActive={analysisType === 'global'} onClick={() => setAnalysisType('global')} />
                <ControlButton label="Ao Vivo (5 min)" isActive={analysisType === 'live' && windowSize === 5} onClick={() => { setAnalysisType('live'); setWindowSize(5); }} />
                <ControlButton label="Ao Vivo (10 min)" isActive={analysisType === 'live' && windowSize === 10} onClick={() => { setAnalysisType('live'); setWindowSize(10); }} />
                <ControlButton label="Ao Vivo (15 min)" isActive={analysisType === 'live' && windowSize === 15} onClick={() => { setAnalysisType('live'); setWindowSize(15); }} />
                <ControlButton label="Tendências" isActive={analysisType === 'trends'} onClick={() => setAnalysisType('trends')} />
            </div>

            {analysisType === 'trends' ? (
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                    {trendData.length > 0 ? trendData.map(data => (
                         <button
                            key={data.minute}
                            onClick={() => setSelectedTrendMinute(data)}
                            className="w-full aspect-square rounded-lg flex flex-col items-center justify-center font-bold text-white text-sm transition-all duration-200 bg-gray-900 hover:bg-gray-700 border-2 border-gray-700"
                            title={`Clique para ver detalhes do minuto :${String(data.minute).padStart(2, '0')}`}
                        >
                            <TrendIndicator trend={data.trend} />
                            <span className="text-xs">:{String(data.minute).padStart(2, '0')}</span>
                            <span className="text-xs text-gray-400">SMA: {data.latestSma.toFixed(1)}</span>
                        </button>
                    )) : (
                        <div className="col-span-10 text-center py-8 text-gray-500">
                            <p>Dados insuficientes para análise de tendência.</p>
                            <p className="text-xs">É necessário um histórico de pelo menos 3 dias distintos.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-10 gap-2">
                    {displayData.map(data => (
                        <div
                            key={data.minute}
                            className={`w-full aspect-square rounded-lg flex items-center justify-center font-bold text-white text-sm transition-all duration-200 border-2 border-transparent cursor-pointer ${getColor(data.temperature)}`}
                            onMouseEnter={(e) => handleMouseEnter(e, data)}
                            onMouseLeave={() => setTooltip(null)}
                        >
                            :{String(data.minute).padStart(2, '0')}
                        </div>
                    ))}
                </div>
            )}

            {tooltip && analysisType !== 'trends' && (
                <div 
                    className="absolute bg-gray-900 text-white p-3 rounded-lg shadow-lg pointer-events-none z-10 animate-fade-in text-sm border border-gray-600"
                    style={{ top: tooltip.y - 100, left: tooltip.x - 40 }}
                >
                    <p className="font-bold">Minuto :{String(tooltip.minute).padStart(2, '0')}</p>
                    <p>Temperatura: <span className="font-semibold">{tooltip.temperature}</span></p>
                    <p>
                        {analysisType === 'global' ? 'Rosas (dataset global):' : 'Rosas na janela:'}
                        <span className="font-semibold ml-1">{tooltip.count}</span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default MinuteHeatmap;