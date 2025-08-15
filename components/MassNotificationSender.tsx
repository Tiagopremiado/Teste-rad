import React, { useState, useEffect } from 'react';
import type { MassNotificationEntry } from '../types';

interface MassNotificationSenderProps {
  onSend: (targetGroup: 'all' | 'premium' | 'free', title: string, message: string) => Promise<number>;
}

const NOTIFICATION_HISTORY_KEY = 'radar_aviator_mass_notification_history';

const MassNotificationSender: React.FC<MassNotificationSenderProps> = ({ onSend }) => {
  const [targetGroup, setTargetGroup] = useState<'all' | 'premium' | 'free'>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState<MassNotificationEntry[]>(() => {
    try {
        const stored = localStorage.getItem(NOTIFICATION_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setFeedback({ message: 'Título e mensagem são obrigatórios.', type: 'error' });
      return;
    }

    setIsSending(true);
    setFeedback(null);

    try {
        const sentCount = await onSend(targetGroup, title, message);

        const newEntry: MassNotificationEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            targetGroup,
            title,
            message,
        };
        setHistory(prev => [newEntry, ...prev]);

        setFeedback({ message: `Notificação enviada com sucesso para ${sentCount} usuários!`, type: 'success' });
        setTitle('');
        setMessage('');
    } catch (error) {
        setFeedback({ message: 'Ocorreu um erro ao enviar as notificações.', type: 'error' });
    } finally {
        setIsSending(false);
    }
  };

  const targetGroupLabels = {
    all: 'Todos',
    premium: 'Premium',
    free: 'Grátis'
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Form Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Comunicação em Massa</h2>
          <div className="bg-gray-800/50 p-6 rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="targetGroup" className="block text-sm font-medium text-gray-300 mb-1">Enviar para:</label>
                <select
                  id="targetGroup"
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value as 'all' | 'premium' | 'free')}
                  className="w-full bg-gray-800 text-white p-2 rounded-lg border-2 border-gray-700 focus:ring-lime-400 focus:border-lime-400"
                >
                  <option value="all">Todos os Usuários</option>
                  <option value="premium">Apenas Premium</option>
                  <option value="free">Apenas Grátis</option>
                </select>
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Título da Notificação:</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Nova Funcionalidade!"
                  className="w-full bg-gray-800 text-white p-2 rounded-lg border-2 border-gray-700 focus:ring-lime-400 focus:border-lime-400"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">Mensagem:</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Escreva a mensagem que será enviada para o sino de notificações dos usuários."
                  className="w-full bg-gray-800 text-white p-2 rounded-lg border-2 border-gray-700 focus:ring-lime-400 focus:border-lime-400"
                />
              </div>
              {feedback && (
                <div className={`p-3 rounded-lg text-center font-semibold text-sm ${feedback.type === 'success' ? 'bg-lime-900/50 text-lime-300' : 'bg-red-900/50 text-red-300'}`}>
                    {feedback.message}
                </div>
              )}
              <div>
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center disabled:bg-lime-900/50 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-black mr-2"></div>
                      Enviando...
                    </>
                  ) : 'Enviar Notificações'}
                </button>
              </div>
            </form>
          </div>
        </div>
        {/* History Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Histórico de Envios</h2>
          <div className="bg-gray-800/50 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum envio registrado.</p>
            ) : (
              <div className="space-y-4">
                {history.map(entry => (
                  <div key={entry.id} className="bg-black/20 p-3 rounded-lg border-l-4 border-lime-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-white">{entry.title}</p>
                            <p className="text-xs text-gray-400">
                                <span className="font-semibold text-lime-400">{targetGroupLabels[entry.targetGroup]}</span> - {new Date(entry.timestamp).toLocaleString('pt-BR')}
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{entry.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MassNotificationSender;