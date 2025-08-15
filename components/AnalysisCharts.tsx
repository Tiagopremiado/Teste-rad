
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ChartData } from '../types';

interface AnalysisChartsProps {
    chartsData: ChartData;
}

const COLORS = {
    Pink: '#ec4899',
    Purple: '#a855f7',
    Blue: '#3b82f6'
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-700/80 backdrop-blur-sm p-3 border border-gray-600 rounded-lg shadow-lg">
                <p className="label font-bold text-white">{payload[0].payload.house ? `Casa: ${label}` : `Hora: ${label}`}</p>
                {payload.map((pld: any) => (
                    <p key={pld.dataKey} style={{ color: pld.color }}>
                        {`${pld.name}: ${pld.value}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const AnalysisCharts: React.FC<AnalysisChartsProps> = ({ chartsData }) => {
    return (
        <div className="bg-gray-900 rounded-xl p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-6">Análise Visual</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h4 className="text-center text-gray-300 mb-4 font-semibold">Frequência de Cores por Hora</h4>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartsData.colorFrequencyByHour} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }} />
                            <Legend wrapperStyle={{fontSize: "14px"}}/>
                            <Bar dataKey="Blue" stackId="a" fill={COLORS.Blue} name="Azul" />
                            <Bar dataKey="Purple" stackId="a" fill={COLORS.Purple} name="Roxo"/>
                            <Bar dataKey="Pink" stackId="a" fill={COLORS.Pink} name="Rosa" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <h4 className="text-center text-gray-300 mb-4 font-semibold">Distribuição de Rosas por Casa</h4>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartsData.pinkDistributionByHouse} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                             <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="house" stroke="#9ca3af" fontSize={12} label={{ value: 'Jogadas após a Rosa anterior', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 12 }}/>
                            <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(236, 72, 153, 0.1)' }} />
                            <Bar dataKey="count" fill={COLORS.Pink} name="Contagem de Rosas" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default AnalysisCharts;