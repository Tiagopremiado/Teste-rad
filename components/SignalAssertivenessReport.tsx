

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Signal, SignalTemperature } from '../types';

interface SignalAssertivenessReportProps {
  signals: Signal[];
}

const COLORS = {
  win: '#22c55e', // green-500
  loss: '#ef4444', // red-500
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700/80 backdrop-blur-sm p-3 border border-gray-600 rounded-lg shadow-lg">
        <p className="font-bold text-white">{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const StatCard: React.FC<{ title: string; value: string; className?: string }> = ({ title, value, className = '' }) => (
    <div className={`bg-gray-800 p-4 rounded-lg text-center ${className}`}>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
);

const TypeStatCard: React.FC<{ title: string; winRate: number; wins: number; total: number; colorClass: string }> = ({ title, winRate, wins, total, colorClass }) => (
    <div className="bg-gray-800 p-4 rounded-lg">
        <p className={`text-sm ${colorClass} font-semibold`}>{title}</p>
        <p className="text-xl font-bold">{winRate.toFixed(1)}% de acerto</p>
        <p className="text-xs text-gray-500">({wins} de {total})</p>
    </div>
);

const SignalAssertivenessReport: React.FC<SignalAssertivenessReportProps> = ({ signals }) => {
    const processedSignals = useMemo(() => signals.filter(s => s.outcome !== 'Pending'), [signals]);

    const stats = useMemo(() => {
        if (processedSignals.length === 0) {
            return null;
        }
        
        const calculateRate = (type: SignalTemperature) => {
            const filtered = processedSignals.filter(s => s.prediction.temperature === type);
            const wins = filtered.filter(s => s.outcome === 'Win').length;
            const total = filtered.length;
            return { total, wins, winRate: total > 0 ? (wins / total) * 100 : 0 };
        };

        const overall = {
            total: processedSignals.length,
            wins: processedSignals.filter(s => s.outcome === 'Win').length,
            losses: processedSignals.filter(s => s.outcome === 'Loss').length,
            winRate: 0,
        };
        overall.winRate = overall.total > 0 ? (overall.wins / overall.total) * 100 : 0;

        return { 
            overall, 
            quente: calculateRate('Quente'), 
            morno: calculateRate('Morno'),
            grandePague: calculateRate('Grande Pague'),
        };
    }, [processedSignals]);

    if (!stats) {
        return null;
    }

    const { overall, quente, morno, grandePague } = stats;

    const pieData = [
        { name: 'Acertos', value: overall.wins },
        { name: 'Erros', value: overall.losses },
    ];
    
    const getAnalysisText = (winRate: number) => {
        if (winRate > 75) return "Excelente! A taxa de acerto está muito alta, indicando que os padrões identificados pela IA são altamente confiáveis.";
        if (winRate > 60) return "Ótimo! A assertividade está alta. Continue monitorando para confirmar a consistência dos padrões.";
        if (winRate > 45) return "Bom. A taxa de acerto é positiva. Analise os sinais de erro para refinar futuras entradas.";
        if (winRate > 30) return "Moderado. A taxa de acerto indica que há um padrão, mas requer cautela e boa gestão de banca.";
        return "Baixo. A taxa de acerto está baixa. O mercado pode estar volátil ou os padrões podem ter mudado. Redobre a atenção.";
    };

    return (
        <div className="mt-8 bg-gray-900/50 p-6 rounded-xl border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-4">Relatório de Assertividade</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                <div className="lg:col-span-1 h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.win : COLORS.loss} />
                                ))}
                            </Pie>
                             <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '14px', bottom: '0px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <p className="text-4xl font-bold text-white">{overall.winRate.toFixed(1)}%</p>
                            <p className="text-sm text-gray-400">de Acerto</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard title="Sinais Analisados" value={String(overall.total)} />
                        <StatCard title="Acertos (Win)" value={String(overall.wins)} className="!bg-green-900/50" />
                        <StatCard title="Erros (Loss)" value={String(overall.losses)} className="!bg-red-900/50" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <TypeStatCard title="Quentes 🔥" {...quente} colorClass="text-pink-400" />
                         <TypeStatCard title="Mornos 💧" {...morno} colorClass="text-purple-400" />
                         <TypeStatCard title="Grande Pague 💲" {...grandePague} colorClass="text-yellow-400" />
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-300">Análise da Assertividade</h4>
                        <p className="text-sm text-gray-400 mt-1 italic">{getAnalysisText(overall.winRate)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignalAssertivenessReport;