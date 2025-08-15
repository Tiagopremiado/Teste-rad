import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ReferenceLine,
  AreaChart,
  ReferenceArea,
} from 'recharts';
import type { Play, HotPinkMinute, PinkPauseRiskAnalysis, SignalPrediction, TechnicalIndicators } from '../types';

interface MarketChartProps {
  data: Play[];
  technicalIndicators?: TechnicalIndicators | null;
  aiSignals?: SignalPrediction[];
  hotMinutes?: HotPinkMinute[];
  riskAlerts?: PinkPauseRiskAnalysis[];
  isPremium: boolean;
  showPremiumModal: () => void;
}

type ChartDataPoint = {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    isUp: boolean;
    // Indicators
    sma20?: number | null;
    bollingerUpper?: number | null;
    bollingerLower?: number | null;
    rsi?: number | null;
    suggestedExit?: number | null;
    aiConfidence?: number | null;
};

const ToolbarButton: React.FC<{ active?: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode; }> = ({ active = false, onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
      active
        ? 'bg-amber-600 text-white shadow'
        : 'text-gray-400 hover:bg-gray-700'
    } disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

const formatXAxis = (tickItem: number) => {
  return new Date(tickItem).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const formattedLabel = new Date(label).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        return (
            <div className="bg-gray-700/80 backdrop-blur-sm p-3 border border-gray-600 rounded-lg shadow-lg text-sm">
                <p className="label font-bold text-white mb-2">{formattedLabel}</p>
                 <div className="space-y-1">
                    <p className="text-gray-300">Abertura: <span className="font-semibold text-white">{data.open.toFixed(2)}x</span></p>
                    <p className="text-green-400">Máxima: <span className="font-semibold text-white">{data.high.toFixed(2)}x</span></p>
                    <p className="text-red-400">Mínima: <span className="font-semibold text-white">{data.low.toFixed(2)}x</span></p>
                    <p className="text-gray-300">Fechamento: <span className="font-semibold text-white">{data.close.toFixed(2)}x</span></p>
                    {data.suggestedExit && <p className="text-emerald-400">Saída Sugerida: <span className="font-semibold text-white">{data.suggestedExit.toFixed(2)}x</span></p>}
                </div>
            </div>
        );
    }
    return null;
};

const renderConfidenceZones = (data: ChartDataPoint[]) => {
    if (!data || data.length === 0) return null;

    const zones = [];
    let currentZone: { level: string; start: number; end: number } | null = null;

    const getConfidenceLevel = (score: number | null | undefined) => {
        if (score === null || score === undefined) return 'neutral';
        if (score > 70) return 'high';
        if (score > 40) return 'medium';
        return 'low';
    };

    for (let i = 0; i < data.length; i++) {
        const point = data[i];
        const level = getConfidenceLevel(point.aiConfidence);

        if (!currentZone) {
            currentZone = { level, start: point.timestamp, end: point.timestamp };
        } else if (level !== currentZone.level) {
            zones.push(currentZone);
            currentZone = { level, start: point.timestamp, end: point.timestamp };
        } else {
            currentZone.end = point.timestamp;
        }
    }
    if (currentZone) {
        zones.push(currentZone);
    }
    
    const colors: Record<string, string> = {
        high: '#22c55e', // green-500
        medium: '#f59e0b', // amber-500
        low: '#ef4444', // red-500
        neutral: 'transparent'
    };

    return zones.map((zone, index) => (
        <ReferenceArea
            key={`zone-${index}`}
            yAxisId="left"
            x1={zone.start}
            x2={zone.end}
            stroke="none"
            fill={colors[zone.level]}
            fillOpacity={0.15}
            ifOverflow="hidden"
        />
    ));
};

const MarketChart: React.FC<MarketChartProps> = ({ data, technicalIndicators, aiSignals = [], hotMinutes = [], riskAlerts = [], isPremium, showPremiumModal }) => {
    const [settings, setSettings] = useState(() => {
        const savedSettings = localStorage.getItem('marketChartSettings');
        if (savedSettings) {
            try {
                return JSON.parse(savedSettings);
            } catch (e) { console.error("Failed to parse saved chart settings"); }
        }
        return { chartType: 'velas', timeframe: '1m', showBollinger: true, showRSI: true, showConfidence: true };
    });
    
    useEffect(() => {
        localStorage.setItem('marketChartSettings', JSON.stringify(settings));
    }, [settings]);
    
    const handleTimeframeChange = (timeframe: string) => {
        if (timeframe !== 'tick') {
            setSettings((prev: any) => ({ ...prev, timeframe, chartType: 'velas' }));
        } else {
            setSettings((prev: any) => ({ ...prev, timeframe, chartType: 'area' }));
        }
    };

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
    }, [data]);
    
    const chartData: ChartDataPoint[] = useMemo(() => {
        let aggregatedData: any[];
        const timeframeMs = settings.timeframe === 'tick' ? 0 : parseInt(settings.timeframe.replace('m', '')) * 60 * 1000;
        
        if (timeframeMs === 0) {
            aggregatedData = sortedData.map((d, i) => {
                const open = i > 0 ? sortedData[i - 1].multiplier : d.multiplier;
                const close = d.multiplier;
                return {
                    timestamp: new Date(`${d.date}T${d.time}`).getTime(),
                    open: open,
                    high: Math.max(open, close),
                    low: Math.min(open, close),
                    close: close,
                };
            });
        } else {
            const grouped = new Map<number, any[]>();
            sortedData.forEach(d => {
                const timestamp = new Date(`${d.date}T${d.time}`).getTime();
                const groupKey = Math.floor(timestamp / timeframeMs) * timeframeMs;
                if (!grouped.has(groupKey)) grouped.set(groupKey, []);
                grouped.get(groupKey)!.push(d);
            });
            
            aggregatedData = Array.from(grouped.entries()).map(([timestamp, plays]) => ({
                timestamp,
                open: plays[0].multiplier,
                high: Math.max(...plays.map(p => p.multiplier)),
                low: Math.min(...plays.map(p => p.multiplier)),
                close: plays[plays.length - 1].multiplier,
            }));
        }

        return aggregatedData.map((d, i) => {
            const isUp = d.close >= d.open;
            let suggestedExit: number | null = null;
            const sma = technicalIndicators?.sma20[i];
            const upper = technicalIndicators?.bollingerUpper[i];

            if (sma != null && upper != null) {
                const recentPurples = sortedData.slice(Math.max(0, i - 10), i + 1).filter(p => p.multiplier >= 2 && p.multiplier < 10);
                const avgPurple = recentPurples.length > 2 ? recentPurples.reduce((sum, p) => sum + p.multiplier, 0) / recentPurples.length : 2.5;

                const technicalTarget = sma + ((upper - sma) * 0.6); // 60% towards upper band is aggressive but reasonable
                const performanceTarget = avgPurple * 1.2; // 20% above recent purple avg is a safe bet

                const calculatedExit = Math.min(technicalTarget, performanceTarget);
                suggestedExit = Math.max(1.90, Math.min(50, calculatedExit));
            }

            return {
                ...d,
                isUp,
                bodyRange: isUp ? [d.open, d.close] : [d.close, d.open],
                wickRange: [d.low, d.high],
                rsi: technicalIndicators?.rsi[i] ?? null,
                sma20: technicalIndicators?.sma20[i] ?? null,
                bollingerUpper: technicalIndicators?.bollingerUpper[i] ?? null,
                bollingerLower: technicalIndicators?.bollingerLower[i] ?? null,
                suggestedExit,
                aiConfidence: technicalIndicators?.aiConfidence?.[i] ?? null,
            };
        });
    }, [sortedData, settings.timeframe, technicalIndicators]);

    const [brushDomain, setBrushDomain] = useState<{ startIndex?: number, endIndex?: number }>({});

    const { xAxisDomain, yAxisDomain, lastSuggestedExit } = useMemo(() => {
        const { startIndex = 0, endIndex = chartData.length > 0 ? chartData.length - 1 : 0 } = brushDomain;
        const visibleData = chartData.slice(startIndex, endIndex + 1);

        if (visibleData.length === 0) {
            return {
                xAxisDomain: ['dataMin', 'dataMax'] as [any, any],
                yAxisDomain: [0.95, 'auto'] as [any, any],
                lastSuggestedExit: null
            };
        }
        
        let lastExit: number | null = null;
        for (let i = visibleData.length - 1; i >= 0; i--) {
            if (visibleData[i].suggestedExit) {
                lastExit = visibleData[i].suggestedExit;
                break;
            }
        }

        const newXAxisDomain: [number, number] = [visibleData[0].timestamp, visibleData[visibleData.length - 1].timestamp];

        let yMin = Infinity;
        let yMax = -Infinity;

        visibleData.forEach(d => {
            yMin = Math.min(yMin, d.low);
            yMax = Math.max(yMax, d.high);
            if (isPremium && settings.showBollinger) {
                if (d.bollingerLower !== null && d.bollingerLower !== undefined) yMin = Math.min(yMin, d.bollingerLower);
                if (d.bollingerUpper !== null && d.bollingerUpper !== undefined) yMax = Math.max(yMax, d.bollingerUpper);
            }
        });

        if (yMin === Infinity || yMax === -Infinity) {
            return {
                xAxisDomain: newXAxisDomain,
                yAxisDomain: [0.95, 'auto'] as [any, any],
                lastSuggestedExit: lastExit
            };
        }
        
        const padding = (yMax - yMin) * 0.1;
        const newYAxisDomain: [number, number] = [
            Math.max(0.95, yMin - padding),
            yMax + padding
        ];

        return { xAxisDomain: newXAxisDomain, yAxisDomain: newYAxisDomain, lastSuggestedExit: lastExit };

    }, [chartData, brushDomain, settings.showBollinger, isPremium]);
    
    const handleZoom = (factor: number) => {
        const { startIndex = 0, endIndex = chartData.length - 1 } = brushDomain;
        const range = endIndex - startIndex;
        const newRange = Math.round(range * factor);
        const middleIndex = startIndex + Math.round(range / 2);
        
        let newStartIndex = middleIndex - Math.round(newRange / 2);
        let newEndIndex = middleIndex + Math.round(newRange / 2);

        newStartIndex = Math.max(0, newStartIndex);
        newEndIndex = Math.min(chartData.length - 1, newEndIndex);

        if (newEndIndex - newStartIndex < 5) {
            newEndIndex = newStartIndex + 5;
            if (newEndIndex > chartData.length - 1) {
                newEndIndex = chartData.length - 1;
                newStartIndex = Math.max(0, newEndIndex - 5);
            }
        }
        
        setBrushDomain({ startIndex: newStartIndex, endIndex: newEndIndex });
    };

    const handleResetZoom = useCallback(() => {
        if (chartData.length > 0) {
            const endIndex = chartData.length - 1;
            const startIndex = Math.max(0, endIndex - 100);
            setBrushDomain({ startIndex, endIndex });
        }
    }, [chartData]);
    
    useEffect(() => {
        handleResetZoom();
    }, [data, settings.timeframe, handleResetZoom]);

    if (data.length === 0) {
        return <div className="text-center text-gray-500 py-10">Dados insuficientes para exibir o gráfico.</div>;
    }

    return (
        <div className="space-y-4 relative">
             <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-1">
                    <ToolbarButton active={settings.timeframe === 'tick'} onClick={() => handleTimeframeChange('tick')}>Tick</ToolbarButton>
                    <ToolbarButton active={settings.timeframe === '1m'} onClick={() => handleTimeframeChange('1m')}>1m</ToolbarButton>
                    <ToolbarButton active={settings.timeframe === '5m'} onClick={() => handleTimeframeChange('5m')}>5m</ToolbarButton>
                    <ToolbarButton active={settings.timeframe === '15m'} onClick={() => handleTimeframeChange('15m')}>15m</ToolbarButton>
                </div>
                 <div className="h-4 w-px bg-gray-700 hidden sm:block"></div>
                <div className="flex items-center gap-1">
                    <ToolbarButton active={settings.chartType === 'area'} onClick={() => setSettings(s => ({...s, chartType: 'area'}))} disabled={settings.timeframe !== 'tick'}>Área</ToolbarButton>
                    <ToolbarButton active={settings.chartType === 'line'} onClick={() => setSettings(s => ({...s, chartType: 'line'}))} disabled={settings.timeframe !== 'tick'}>Linha</ToolbarButton>
                    <ToolbarButton active={settings.chartType === 'velas'} onClick={() => setSettings(s => ({...s, chartType: 'velas'}))}>Velas</ToolbarButton>
                </div>
                <div className="h-4 w-px bg-gray-700 hidden sm:block"></div>
                <div className="flex items-center gap-1">
                    <ToolbarButton active={isPremium && settings.showBollinger} onClick={isPremium ? () => setSettings(s => ({...s, showBollinger: !s.showBollinger})) : showPremiumModal}>Bollinger {!isPremium && '👑'}</ToolbarButton>
                    <ToolbarButton active={isPremium && settings.showRSI} onClick={isPremium ? () => setSettings(s => ({...s, showRSI: !s.showRSI})) : showPremiumModal}>RSI {!isPremium && '👑'}</ToolbarButton>
                    <ToolbarButton active={isPremium && settings.showConfidence} onClick={isPremium ? () => setSettings(s => ({...s, showConfidence: !s.showConfidence})) : showPremiumModal}>Confiança IA {!isPremium && '👑'}</ToolbarButton>
                </div>
                <div className="h-4 w-px bg-gray-700 hidden sm:block"></div>
                 <div className="flex items-center gap-1">
                    <ToolbarButton onClick={() => handleZoom(0.5)}>Zoom In</ToolbarButton>
                    <ToolbarButton onClick={() => handleZoom(2)}>Zoom Out</ToolbarButton>
                    <ToolbarButton onClick={handleResetZoom}>Reset</ToolbarButton>
                </div>
            </div>
            
            <ResponsiveContainer width="100%" height={settings.showRSI && isPremium ? 250 : 400}>
                <ComposedChart data={chartData} syncId="marketChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis dataKey="timestamp" type="number" domain={xAxisDomain} tickFormatter={formatXAxis} stroke="#9ca3af" fontSize={12} minTickGap={80} hide={settings.showRSI && isPremium} allowDataOverflow/>
                    <YAxis yAxisId="left" scale="log" domain={yAxisDomain} allowDataOverflow stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `${value.toFixed(0)}x`} />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {isPremium && settings.showConfidence && renderConfidenceZones(chartData)}
                    
                    {isPremium && settings.showBollinger && <Area yAxisId="left" dataKey="bollingerUpper" fill="#f59e0b" stroke="#f59e0b" fillOpacity={0.1} strokeWidth={1} strokeDasharray="3 3" name="Bollinger Superior" isAnimationActive={false} />}
                    {isPremium && settings.showBollinger && <Area yAxisId="left" dataKey="bollingerLower" fill="#f59e0b" stroke="#f59e0b" fillOpacity={0.1} strokeWidth={1} strokeDasharray="3 3" name="Bollinger Inferior" isAnimationActive={false} />}

                    {settings.chartType === 'area' && <Area yAxisId="left" isAnimationActive={false} type="monotone" dataKey="close" name="Multiplicador" stroke="#22d3ee" fill="url(#colorArea)" />}
                    {settings.chartType === 'line' && <Line yAxisId="left" isAnimationActive={false} type="monotone" dataKey="close" name="Multiplicador" stroke="#22d3ee" dot={false} strokeWidth={2} />}
                    
                    {settings.chartType === 'velas' && (
                        <>
                            <Bar yAxisId="left" dataKey="wickRange" name="Range" isAnimationActive={false} barSize={2} radius={1}>
                                {chartData.map((entry, index) => <Cell key={`cell-wick-${index}`} fill={entry.isUp ? '#22c55e' : '#ef4444'} />)}
                            </Bar>
                             <Bar yAxisId="left" dataKey="bodyRange" name="Corpo" isAnimationActive={false} barSize={10}>
                                {chartData.map((entry, index) => <Cell key={`cell-body-${index}`} fill={entry.isUp ? '#22c55e' : '#ef4444'} />)}
                            </Bar>
                        </>
                    )}
                    
                    {isPremium && settings.showBollinger && <Line yAxisId="left" dataKey="sma20" stroke="#f59e0b" dot={false} strokeWidth={1} name="SMA 20" isAnimationActive={false} />}
                    
                    {isPremium && <Line yAxisId="left" dataKey="suggestedExit" stroke="#34d399" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Saída Sugerida" isAnimationActive={false} />}

                    {isPremium && lastSuggestedExit && (
                        <ReferenceLine
                            y={lastSuggestedExit}
                            yAxisId="left"
                            stroke="#34d399"
                            strokeWidth={2}
                            strokeDasharray="8 4"
                            label={{
                                position: 'right',
                                value: `Saída: ${lastSuggestedExit.toFixed(2)}x`,
                                fill: '#34d399',
                                fontSize: 12,
                                fontWeight: 'bold',
                                dy: -5
                            }}
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
            
            {isPremium && settings.showRSI && (
                <ResponsiveContainer width="100%" height={100}>
                    <ComposedChart data={chartData} syncId="marketChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                         <XAxis dataKey="timestamp" type="number" domain={xAxisDomain} tickFormatter={formatXAxis} stroke="#9ca3af" fontSize={12} minTickGap={80} allowDataOverflow/>
                         <YAxis yAxisId="rsi" domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
                         <Tooltip />
                         <ReferenceLine yAxisId="rsi" y={70} label="Sobrecompra" stroke="red" strokeDasharray="3 3" />
                         <ReferenceLine yAxisId="rsi" y={30} label="Sobrevenda" stroke="green" strokeDasharray="3 3" />
                         <Line yAxisId="rsi" type="monotone" dataKey="rsi" stroke="#c084fc" dot={false} name="RSI" isAnimationActive={false}/>
                    </ComposedChart>
                </ResponsiveContainer>
            )}

             <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="timestamp" hide />
                    <YAxis scale="log" domain={[0.95, 'dataMax']} hide />
                    <Area type="monotone" dataKey="close" stroke="#8884d8" fill="#8884d8" isAnimationActive={false} />
                    <Brush 
                        dataKey="timestamp" 
                        height={30} 
                        stroke="#f59e0b" 
                        startIndex={brushDomain.startIndex} 
                        endIndex={brushDomain.endIndex} 
                        onChange={(e: any) => setBrushDomain({ startIndex: e.startIndex, endIndex: e.endIndex })} 
                        tickFormatter={formatXAxis} 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MarketChart;