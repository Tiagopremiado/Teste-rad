import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, LabelList } from 'recharts';
import type { Analysis, Play } from '../types';

interface AdditionalAnalysisReportProps {
  analysis: Partial<Analysis>;
  historicalData: Play[];
}

const Gauge: React.FC<{ value: number; maxValue: number; label: string }> = ({ value, maxValue, label }) => {
    const percentage = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let colorClass = 'text-cyan-400 stroke-cyan-400';
    if (percentage > 75) {
        colorClass = 'text-red-400 stroke-red-400 animate-pulse';
    } else if (percentage > 50) {
        colorClass = 'text-amber-400 stroke-amber-400';
    }

    return (
        <div className="relative flex flex-col items-center justify-center">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                <circle className="stroke-current text-gray-700" cx="50" cy="50" r="45" fill="transparent" strokeWidth="8" />
                <circle
                    className={`stroke-current transition-all duration-500 ease-out ${colorClass}`}
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute text-center">
                <span className={`text-3xl font-bold ${colorClass}`}>{value}</span>
                <span className="text-gray-400 text-sm"> / {Math.round(maxValue)}</span>
                <p className="text-xs text-gray-500 uppercase">{label}</p>
            </div>
        </div>
    );
};

const ReportSection: React.FC<{
    title: string;
    tier: string;
    analysisData?: { lastCount: number; averagePinks: number; hasOver20xInPinks?: boolean; hasOver50xInPinks?: boolean };
    triggerText: string;
    triggerColor: string;
}> = ({ title, tier, analysisData, triggerText, triggerColor }) => {
    if (!analysisData) {
        return <div className="text-center text-gray-500">Dados de análise indisponíveis.</div>;
    }

    const { lastCount, averagePinks } = analysisData;
    const hasTrigger = tier === '50x' ? analysisData.hasOver20xInPinks : analysisData.hasOver50xInPinks;

    return (
        <div className="bg-gray-900/50 p-6 rounded-xl text-center">
            <h4 className="text-xl font-bold text-white mb-4">{title}</h4>
            <Gauge value={lastCount} maxValue={averagePinks} label="Rosas na Sequência" />
            <p className="text-xs text-gray-500 mt-2">Média histórica: {averagePinks.toFixed(1)} rosas antes de um {tier}</p>
            
            {hasTrigger && (
                <div className={`mt-4 p-3 rounded-lg border border-current animate-pulse-strong ${triggerColor}`}>
                    <p className="font-bold text-sm flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {triggerText}
                    </p>
                </div>
            )}
        </div>
    );
};

const FilterButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${isActive ? 'bg-amber-600 text-black shadow-md' : 'text-gray-300 bg-gray-700 hover:bg-gray-600'}`}
    >
        {label}
    </button>
);

const AdditionalAnalysisReport: React.FC<AdditionalAnalysisReportProps> = ({ analysis, historicalData }) => {
    const { pinksTo50xAnalysis, pinksTo100xAnalysis } = analysis.summary || {};

    const [filter, setFilter] = useState<'today' | 'last25' | 'last50' | 'last100' | string>('today');
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    const uniqueDates = useMemo(() => {
        if (!historicalData) return [];
        const dates = new Set(historicalData.map(p => p.date));
        return Array.from(dates).sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
    }, [historicalData]);

    const { chartData, chartTitle } = useMemo(() => {
        if (!historicalData) return { chartData: [], chartTitle: "Multiplicadores Rosa" };

        const allPinksWithIndices = historicalData
            .map((play, index) => ({ play, index }))
            .filter(({ play }) => play.multiplier >= 10);

        const pinksWithIntervals = allPinksWithIndices.map((current, i) => {
            const prevIndex = i > 0 ? allPinksWithIndices[i - 1].index : -1;
            const interval = prevIndex !== -1 ? current.index - prevIndex : 0;
            return { ...current.play, interval };
        });
        
        let filteredPinks: (Play & { interval: number })[] = [];
        let title = '';

        if (filter.startsWith('last')) {
            const count = parseInt(filter.replace('last', ''), 10);
            filteredPinks = pinksWithIntervals.slice(-count);
            title = `Últimos ${count} Multiplicadores Rosa`;
        } else {
            const dateToFilter = filter === 'today' ? todayStr : filter;
            filteredPinks = pinksWithIntervals.filter(p => p.date === dateToFilter);
            title = filter === 'today'
                ? "Multiplicadores Rosa de Hoje"
                : `Multiplicadores Rosa de ${new Date(String(dateToFilter) + 'T00:00:00').toLocaleDateString('pt-BR')}`;
        }

        const data = filteredPinks.map(p => ({
            name: p.time.slice(0, 5),
            multiplier: p.multiplier,
            interval: p.interval,
        }));

        return { chartData: data, chartTitle: title };
    }, [historicalData, filter, todayStr]);
    
    return (
        <div className="space-y-8">
            <p className="text-sm text-center text-gray-400">
                Esta seção monitora a contagem de multiplicadores rosa (&gt;=10x) desde o último evento de 50x ou 100x, comparando com a média histórica para indicar a proximidade de um novo evento de alto valor.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReportSection
                    title="Análise Preditiva 50x"
                    tier="50x"
                    analysisData={pinksTo50xAnalysis}
                    triggerText="Alerta: Rosa >20x detectada na sequência!"
                    triggerColor="text-yellow-300"
                />
                <ReportSection
                    title="Análise Preditiva 100x"
                    tier="100x"
                    analysisData={pinksTo100xAnalysis}
                    triggerText="Alerta: Rosa >50x detectada na sequência!"
                    triggerColor="text-red-400"
                />
            </div>

            <div className="bg-gray-900/50 p-6 rounded-xl">
                 <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                     <h4 className="font-semibold text-white">{chartTitle}</h4>
                     <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg">
                        <FilterButton label="Hoje" isActive={filter === 'today'} onClick={() => setFilter('today')} />
                        <FilterButton label="Últimas 25" isActive={filter === 'last25'} onClick={() => setFilter('last25')} />
                        <FilterButton label="Últimas 50" isActive={filter === 'last50'} onClick={() => setFilter('last50')} />
                        <FilterButton label="Últimas 100" isActive={filter === 'last100'} onClick={() => setFilter('last100')} />
                         <select
                            value={filter.startsWith('last') || filter === 'today' ? 'custom' : filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-gray-700 text-white p-1.5 rounded-md border border-gray-600 text-xs font-bold"
                          >
                            <option value="custom" disabled>Outras Datas</option>
                            {uniqueDates.map(date => (
                                <option key={date} value={date}>
                                    {new Date(String(date) + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </option>
                            ))}
                          </select>
                     </div>
                 </div>
                 {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(31, 41, 55, 0.8)',
                                    border: '1px solid #4b5563',
                                    borderRadius: '0.5rem',
                                }}
                                labelStyle={{ color: '#f3f4f6' }}
                            />
                            <Bar dataKey="multiplier" name="Multiplicador" unit="x">
                                <LabelList
                                  dataKey="interval"
                                  position="top"
                                  formatter={(value: number) => value > 0 ? `(+${value})` : ''}
                                  style={{ fill: '#a5b4fc', fontSize: 12, fontWeight: 'bold' }}
                                />
                                {chartData.map((entry, index) => {
                                    let color = '#ec4899'; // Pink
                                    if (entry.multiplier >= 100) color = '#f87171'; // Red
                                    else if (entry.multiplier >= 50) color = '#f59e0b'; // Amber
                                    return <Cell key={`cell-${index}`} fill={color} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="h-[250px] flex items-center justify-center text-gray-500">
                        Nenhuma vela rosa encontrada para a seleção atual.
                    </div>
                 )}
            </div>
        </div>
    );
};

export default AdditionalAnalysisReport;
