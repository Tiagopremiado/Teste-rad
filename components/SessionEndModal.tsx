import React from 'react';
import type { User } from '../types';

interface SessionEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOverride?: () => void; // Optional, only for loss
  onContinueWin?: () => void; // Optional, only for win
  type: 'win' | 'loss';
  profitOrLoss: number;
  nextBestTimeSuggestion?: string;
  user: User;
  onViewHistory: () => void;
  onDownloadReport: () => void;
  onPublishWin: () => void;
}

const SessionEndModal: React.FC<SessionEndModalProps> = ({
  isOpen,
  onClose,
  onOverride,
  onContinueWin,
  type,
  profitOrLoss,
  nextBestTimeSuggestion,
  user,
  onViewHistory,
  onDownloadReport,
  onPublishWin,
}) => {
  if (!isOpen) return null;

  const isWin = type === 'win';

  const modalConfig = {
    win: {
      icon: '🏆',
      title: 'META ATINGIDA!',
      gradient: 'from-green-500 via-yellow-500 to-amber-500',
      borderColor: 'border-amber-400',
      bgColor: 'bg-gray-900',
      message: `Parabéns, ${user.display_name}! Você alcançou sua meta com um lucro incrível. É hora de realizar os ganhos e celebrar!`,
      buttonText: 'Finalizar e Comemorar',
      buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    loss: {
      icon: '🛡️',
      title: 'PAUSA ESTRATÉGICA',
      gradient: 'from-blue-500 via-cyan-500 to-gray-500',
      borderColor: 'border-blue-400',
      bgColor: 'bg-gray-900',
      message: 'O mercado está instável. Proteger sua banca agora é a jogada mais inteligente. A paciência é a chave para a consistência.',
      buttonText: 'Entendido, Pausar Sessão',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const config = modalConfig[type];

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
    >
      <div
        className={`relative max-w-md w-full ${config.bgColor} border-2 ${config.borderColor} rounded-2xl shadow-2xl p-8 text-center animate-fade-in-up overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`absolute -top-1/4 -right-1/4 w-60 h-60 bg-gradient-to-br ${config.gradient} rounded-full opacity-10 filter blur-3xl`}></div>
        <div className={`absolute -bottom-1/4 -left-1/4 w-60 h-60 bg-gradient-to-tr ${config.gradient} rounded-full opacity-10 filter blur-3xl`}></div>
        
        <div className="relative z-10">
          <div className={`mx-auto w-24 h-24 mb-4 flex items-center justify-center rounded-full bg-gray-800/50 border-2 ${config.borderColor}`}>
            <span className="text-6xl">{config.icon}</span>
          </div>

          <h2 className={`text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${config.gradient} mb-2`}>
            {config.title}
          </h2>

          <p className={`text-5xl font-bold my-4 ${isWin ? 'text-green-400' : 'text-red-400'}`}>
            {isWin ? '+' : '-'} R$ {Math.abs(profitOrLoss).toFixed(2)}
          </p>

          <p className="text-gray-300 mb-6">{config.message}</p>

          {!isWin && nextBestTimeSuggestion && (
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 mb-6">
                <p className="text-sm text-amber-300 font-semibold">💡 Dica da IA para a Próxima Sessão</p>
                <p className="text-gray-400 mt-1">
                    O mercado parece mais promissor por volta das <strong className="text-white">{nextBestTimeSuggestion}</strong>. Considere retornar nesse horário.
                </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-700 space-y-3">
            {isWin && (
              <button
                onClick={onPublishWin}
                className="w-full font-bold py-3 px-6 rounded-lg transition-colors text-lg shadow-lg text-black bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 animate-pulse-strong"
              >
                Publicar na Resenha 🔥
              </button>
            )}
            <button
              onClick={onViewHistory}
              className="w-full font-semibold py-2 px-4 rounded-lg transition-colors text-sm shadow-sm text-cyan-300 bg-cyan-900/50 hover:bg-cyan-800/60"
            >
              Ver Histórico da Sessão
            </button>
             <button
              onClick={onDownloadReport}
              className="w-full font-semibold py-2 px-4 rounded-lg transition-colors text-sm shadow-sm text-teal-300 bg-teal-900/50 hover:bg-teal-800/60"
            >
              Baixar Relatório (PDF)
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
            <button
              onClick={onClose}
              className={`w-full font-bold py-3 px-6 rounded-lg transition-colors text-lg shadow-lg text-white ${config.buttonColor}`}
            >
              {config.buttonText}
            </button>
             {isWin && onContinueWin && (
              <button
                onClick={onContinueWin}
                className="w-full font-semibold py-2 px-6 rounded-lg transition-colors text-sm shadow-sm text-yellow-300 bg-yellow-900/50 hover:bg-yellow-800/60"
              >
                Definir Lucro e Iniciar Nova Sessão
              </button>
            )}
            {!isWin && onOverride && (
              <button
                onClick={onOverride}
                className="w-full font-semibold py-2 px-6 rounded-lg transition-colors text-sm shadow-sm text-yellow-300 bg-yellow-900/50 hover:bg-yellow-800/60"
              >
                Entendo o Risco, Continuar Sessão
              </button>
            )}
          </div>
           <div className="mt-6 text-center text-xs text-gray-500">
            <p>Radar Aviator: Uma ferramenta de análise desenvolvida por Tiago_Lux.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionEndModal;