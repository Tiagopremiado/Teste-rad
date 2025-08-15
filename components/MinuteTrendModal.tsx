import React from 'react';
import type { MinuteTrendData } from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface MinuteTrendModalProps {
  data: MinuteTrendData;
  onClose: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-700/80 backdrop-blur-sm p-3 border border-gray-600 rounded-lg shadow-lg">
                <p className="label font-bold text-white">{`Data: ${label}`}</p>
                <p style={{ color: '#8884d8' }}>Rosas no dia: {payload[0].value}</p>
                {payload[1] && <p style={{ color: '#82ca9d' }}>Média Móvel: {payload[1].value.toFixed(2)}</p>}
            </div>
        );
    }
    return null;
};

const MinuteTrendModal: React.FC<MinuteTrendModalProps> = ({ data, onClose }) => {
    const { minute, trend, latestSma, detailedSeries } = data;

    const chartData = React.useMemo(() => {
        const MOVING_AVERAGE_WINDOW = 7;
        return detailedSeries.map((d, i) => {
            let sma = null;
            if (i >= MOVING_AVERAGE_WINDOW - 1) {
                const window = detailedSeries.slice(i - MOVING_AVERAGE_WINDOW + 1, i + 1);
                const sum = window.reduce((acc, val) => acc + val.count, 0);
                sma = sum / MOVING_AVERAGE_WINDOW;
            }
            return { date: d.date, count: d.count, sma };
        });
    }, [detailedSeries]);
    
    const trendConfig = {
        up: { text: 'AQUECENDO', color: 'text-green-400' },
        down: { text: 'ESFRIANDO', color: 'text-red-400' },
        stable: { text: 'ESTÁVEL', color: 'text-yellow-400' },
    };

    return (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onClick={onClose}
        >
          <div 
            className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
              <div>
                 <h2 className="text-2xl font-bold">Análise de Tendência - Minuto <span className="text-amber-400">:{String(minute).padStart(2, '0')}</span></h2>
                 <p className={`font-semibold ${trendConfig[trend].color}`}>{trendConfig[trend].text}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow">
                <div className="bg-gray-900/50 p-4 rounded-lg text-center mb-4">
                    <p className="text-sm text-gray-400">MÉDIA MÓVEL (ÚLTIMOS 7 DIAS)</p>
                    <p className="text-4xl font-bold text-amber-300">{latestSma.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">rosas por dia</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} angle={-45} textAnchor="end" />
                        <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{fontSize: "14px"}}/>
                        <Bar dataKey="count" fill="#8884d8" name="Rosas no Dia" />
                        <Line type="monotone" dataKey="sma" stroke="#82ca9d" name="Média Móvel (7 Dias)" strokeWidth={2} dot={false}/>
                    </ComposedChart>
                </ResponsiveContainer>
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

export default MinuteTrendModal;