import React from 'react';
import type { AIBotHistoryItem, BankrollManagement } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

interface AIBotHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AIBotHistoryItem[];
  bankrollState: BankrollManagement;
}

const StatCard: React.FC<{ title: string; value: React.ReactNode; colorClass?: string }> = ({ title, value, colorClass = 'text-white' }) => (
    <div className="bg-gray-900/50 p-3 rounded-lg text-center">
        <p className="text-xs text-gray-400">{title}</p>
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-700/80 backdrop-blur-sm p-3 border border-gray-600 rounded-lg shadow-lg">
                <p className="label font-bold text-white">{`Operação #${label}`}</p>
                <p style={{ color: '#8884d8' }}>
                    Banca: R$ {payload[0].value.toFixed(2)}
                </p>
            </div>
        );
    }
    return null;
};

const HistoryCard: React.FC<{ item: AIBotHistoryItem }> = ({ item }) => {
    const bet1DidWin = item.resultPlay.multiplier >= item.plan.bet1.target;
    const bet2DidWin = item.plan.bet2.amount > 0 && item.resultPlay.multiplier >= item.plan.bet2.target;
    const profitColor = item.profit >= 0 ? 'text-green-400' : 'text-red-400';
    const profitSign = item.profit >= 0 ? '+' : '';

    const marketStateColors: { [key: string]: string } = {
        'MUITO_QUENTE': 'bg-red-500/20 text-red-300 border-red-500/30',
        'QUENTE': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        'MORNO': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        'FRIO': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    };
    
    const marketStateClass = marketStateColors[item.context.marketState] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';

    return (
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700/50 space-y-3">
            <div className="flex justify-between items-start pb-2 border-b border-gray-700/50">
                <div>
                    <p className="font-bold text-white truncate" title={item.reason}>{item.reason}</p>
                    <p className="text-xs text-gray-400">{new Date(item.timestamp).toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs text-gray-400">Crash</p>
                    <p className="text-2xl font-bold text-red-400">{item.resultPlay.multiplier.toFixed(2)}x</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bet 1 Card */}
                <div className="bg-gray-800/70 p-3 rounded-md">
                    <p className="text-sm font-semibold text-gray-300 mb-1">Aposta 1 (Segurança)</p>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span>Valor:</span><span className="font-mono font-semibold text-white">R$ {item.plan.bet1.amount.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Alvo:</span><span className="font-mono font-semibold text-white">{item.plan.bet1.target.toFixed(2)}x</span></div>
                        <div className="flex justify-between items-center"><span className="font-semibold">Resultado:</span><span className={`font-bold text-sm px-2 py-0.5 rounded-md ${bet1DidWin ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{bet1DidWin ? 'WIN' : 'LOSS'}</span></div>
                    </div>
                </div>

                {/* Bet 2 Card */}
                <div className="bg-gray-800/70 p-3 rounded-md">
                    <p className="text-sm font-semibold text-gray-300 mb-1">Aposta 2 (Lucro)</p>
                     <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span>Valor:</span><span className="font-mono font-semibold text-white">{item.plan.bet2.amount > 0 ? `R$ ${item.plan.bet2.amount.toFixed(2)}` : '---'}</span></div>
                        <div className="flex justify-between"><span>Alvo:</span><span className="font-mono font-semibold text-white">{item.plan.bet2.amount > 0 ? `${item.plan.bet2.target.toFixed(2)}x` : '---'}</span></div>
                        <div className="flex justify-between items-center"><span className="font-semibold">Resultado:</span><span className={`font-bold text-sm px-2 py-0.5 rounded-md ${item.plan.bet2.amount > 0 ? (bet2DidWin ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300') : 'bg-gray-700 text-gray-500'}`}>{item.plan.bet2.amount > 0 ? (bet2DidWin ? 'WIN' : 'LOSS') : 'N/A'}</span></div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
                 <div className="text-center">
                    <p className="text-xs text-gray-400">Mercado</p>
                    <p className={`font-semibold text-xs px-2 py-0.5 rounded-full border ${marketStateClass}`}>{item.context.marketState.replace('_', ' ')}</p>
                 </div>
                 <div className="text-center">
                     <p className="text-xs text-gray-400">Lucro Total</p>
                     <p className={`font-bold text-lg ${profitColor}`}>{profitSign}R$ {item.profit.toFixed(2)}</p>
                 </div>
            </div>
        </div>
    );
};


const AIBotHistoryModal: React.FC<AIBotHistoryModalProps> = ({ isOpen, onClose, history, bankrollState }) => {
  if (!isOpen) return null;

  const totalProfit = bankrollState.currentBankroll - bankrollState.initialBankroll;
  const wins = history.filter(item => item.profit > 0).length;
  const losses = history.filter(item => item.profit < 0).length;
  const winRate = history.length > 0 ? (wins / history.length) * 100 : 0;
  
  const chartData = bankrollState.history.map((t, i) => ({
      index: i + 1,
      banca: t.newBankroll,
      time: new Date(t.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }));
  
  const gradientId = totalProfit >= 0 ? 'profitGradient' : 'lossGradient';
  const gradientColor = totalProfit >= 0 ? '#4ade80' : '#f87171';

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">Análise da Sessão</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Lucro Total" value={`R$ ${totalProfit.toFixed(2)}`} colorClass={totalProfit >= 0 ? 'text-green-400' : 'text-red-400'} />
                <StatCard title="Taxa de Acerto" value={`${winRate.toFixed(1)}%`} colorClass="text-cyan-400" />
                <StatCard title="Vitórias" value={wins} colorClass="text-green-400" />
                <StatCard title="Derrotas" value={losses} colorClass="text-red-400" />
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2 text-center">Evolução da Banca</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={gradientColor} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={gradientColor} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="index" stroke="#9ca3af" fontSize={12} label={{ value: 'Nº da Operação', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 12 }}/>
                        <YAxis stroke="#9ca3af" fontSize={12} domain={['dataMin - 10', 'dataMax + 10']} tickFormatter={(value) => `R$${value}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={bankrollState.initialBankroll} label={{ value: "Início", fill: '#a1a1aa', fontSize: 12 }} stroke="#a1a1aa" strokeDasharray="4 4" />
                        <Area type="monotone" dataKey="banca" stroke={gradientColor} fillOpacity={1} fill={`url(#${gradientId})`} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Log de Operações</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {history.length > 0 ? (
                        history.map(item => <HistoryCard key={item.id} item={item} />)
                    ) : (
                        <p className="text-center text-gray-500 italic py-8">Nenhuma operação nesta sessão.</p>
                    )}
                </div>
            </div>
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

export default AIBotHistoryModal;