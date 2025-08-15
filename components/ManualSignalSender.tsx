import React, { useState, useEffect } from 'react';
import type { User, AdminSignal, AdminSignalLogEntry, AuditLogEntry } from '../types';

const ADMIN_SIGNAL_KEY = 'radar_aviator_admin_signal';
const ADMIN_SIGNAL_HISTORY_KEY = 'radar_aviator_admin_signal_history';

interface ManualSignalSenderProps {
  currentUser: User;
  logAction: (action: Omit<AuditLogEntry, 'id' | 'timestamp' | 'adminId' | 'adminName'>) => void;
}

const ManualSignalSender: React.FC<ManualSignalSenderProps> = ({ currentUser, logAction }) => {
  const [activeSignal, setActiveSignal] = useState<AdminSignal | null>(null);
  const [history, setHistory] = useState<AdminSignalLogEntry[]>([]);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    try {
      const storedSignal = localStorage.getItem(ADMIN_SIGNAL_KEY);
      if (storedSignal) setActiveSignal(JSON.parse(storedSignal));

      const storedHistory = localStorage.getItem(ADMIN_SIGNAL_HISTORY_KEY);
      if (storedHistory) setHistory(JSON.parse(storedHistory));
    } catch (e) {
      console.error("Failed to load signals from localStorage", e);
    }
  }, []);
  
  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleSendSignal = (type: AdminSignal['type']) => {
    if (activeSignal) {
        showFeedback('Já existe um sinal ativo. Retire o atual primeiro.');
        return;
    }
    const signalConfig = {
        HighMultiplier: { title: "ALERTA: OPORTUNIDADE DE VELA ALTA!", message: "IA identificou um padrão com potencial para multiplicador 10x ou superior. Fique atento!" },
        BigPayout: { title: "ALERTA: POSSÍVEL GRANDE PAGUE!", message: "O mercado está aquecido. Pode estar se iniciando uma sequência de multiplicadores roxos e rosas." },
        RiskAlert: { title: "ALERTA: ALTO RISCO NO MERCADO!", message: "Mercado instável. Recomendamos cautela ou pausar as operações temporariamente." },
    };

    const newSignal: AdminSignal = {
        id: crypto.randomUUID(),
        type,
        ...signalConfig[type],
        timestamp: new Date().toISOString(),
        sentBy: currentUser.display_name,
    };
    
    localStorage.setItem(ADMIN_SIGNAL_KEY, JSON.stringify(newSignal));
    setActiveSignal(newSignal);

    const newLogEntry: AdminSignalLogEntry = { ...newSignal, withdrawn: false };
    const updatedHistory = [newLogEntry, ...history];
    setHistory(updatedHistory);
    localStorage.setItem(ADMIN_SIGNAL_HISTORY_KEY, JSON.stringify(updatedHistory));
    
    logAction({ action: 'SEND_MANUAL_SIGNAL', targetType: 'manual_signal', targetId: type, details: `Enviou o sinal "${newSignal.title}"` });
    showFeedback('Sinal enviado para todos os usuários!');
  };

  const handleWithdrawSignal = () => {
    if (!activeSignal) return;

    localStorage.removeItem(ADMIN_SIGNAL_KEY);
    
    const updatedHistory = history.map(h => h.id === activeSignal.id ? { ...h, withdrawn: true, withdrawnTimestamp: new Date().toISOString() } : h);
    setHistory(updatedHistory);
    localStorage.setItem(ADMIN_SIGNAL_HISTORY_KEY, JSON.stringify(updatedHistory));
    
    logAction({ action: 'WITHDRAW_MANUAL_SIGNAL', targetType: 'manual_signal', targetId: activeSignal.type, details: `Retirou o sinal "${activeSignal.title}"` });
    setActiveSignal(null);
    showFeedback('Sinal retirado com sucesso.');
  };

  const SignalButton: React.FC<{ type: AdminSignal['type'], icon: string, label: string, color: string }> = ({ type, icon, label, color }) => (
    <button
      onClick={() => handleSendSignal(type)}
      disabled={!!activeSignal}
      className={`flex-1 p-4 rounded-lg font-bold text-white transition-colors flex flex-col items-center gap-2 disabled:bg-gray-700 disabled:opacity-50 ${color}`}
    >
      <span className="text-3xl">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Central de Sinais Manuais</h2>
        <p className="text-gray-400">Envie alertas estratégicos para todos os usuários em tempo real.</p>
      </div>

      <div className="bg-gray-800/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3 text-center">ENVIAR NOVO SINAL</h3>
        <div className="flex gap-4">
          <SignalButton type="HighMultiplier" icon="🚀" label="Vela Alta (10x+)" color="bg-blue-600 hover:bg-blue-500" />
          <SignalButton type="BigPayout" icon="💰" label="Grande Pague" color="bg-amber-600 hover:bg-amber-500" />
          <SignalButton type="RiskAlert" icon="🛡️" label="Alerta de Risco" color="bg-red-700 hover:bg-red-600" />
        </div>
      </div>
      
       <div className="bg-gray-800/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3 text-center">SINAL ATIVO</h3>
        {activeSignal ? (
          <div className="text-center space-y-3">
            <p><span className="font-bold text-lime-300">{activeSignal.title}</span></p>
            <button onClick={handleWithdrawSignal} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg">
              Retirar Sinal Ativo
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-500">Nenhum sinal ativo no momento.</p>
        )}
      </div>

      {feedback && (
        <p className="text-center font-semibold text-lime-300 animate-fade-in">{feedback}</p>
      )}

      <div>
        <h3 className="text-lg font-bold text-white mb-2">Histórico de Sinais Enviados</h3>
         <div className="bg-black/20 rounded-lg max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-black/30 sticky top-0">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Horário</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Sinal</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {history.map(entry => (
                        <tr key={entry.id}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{new Date(entry.timestamp).toLocaleString('pt-BR')}</td>
                            <td className="px-4 py-2 text-sm font-semibold">{entry.title}</td>
                            <td className="px-4 py-2 text-sm">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${entry.withdrawn ? 'bg-gray-700 text-gray-300' : 'bg-green-800 text-green-300'}`}>
                                    {entry.withdrawn ? `Retirado ${entry.withdrawnTimestamp ? `às ${new Date(entry.withdrawnTimestamp).toLocaleTimeString()}` : ''}` : 'Ativo'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      </div>

    </div>
  );
};

export default ManualSignalSender;