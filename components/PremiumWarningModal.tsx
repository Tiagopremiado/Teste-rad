import React, { useState, useEffect } from 'react';

interface PremiumWarningModalProps {
  open: boolean;
  onClose: () => void; // "Lembrar Mais Tarde"
  onRenew: () => void; // "Renovar Agora"
  expiryTimestamp: number;
}

const PremiumWarningModal: React.FC<PremiumWarningModalProps> = ({ open, onClose, onRenew, expiryTimestamp }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!open || !expiryTimestamp) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const distance = expiryTimestamp - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, expiryTimestamp]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
    >
      <div
        className="bg-gray-950 border-2 border-yellow-500 rounded-2xl shadow-2xl shadow-yellow-500/20 max-w-md w-full p-8 text-center animate-fade-in-up relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute -top-10 -right-10 text-9xl text-yellow-500/10 rotate-12">⏳</div>

        <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
          <span className="text-4xl">⏳</span>
        </div>

        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 mb-3">
          Seu Acesso Premium Expira em Breve!
        </h2>
        <p className="text-gray-300 mb-6">
          Não perca acesso às análises avançadas da IA. Renove seu plano para continuar na frente.
        </p>

        <div className="flex justify-center gap-4 my-6 font-mono text-white">
          <div className="text-center">
            <div className="text-5xl font-bold">{String(timeLeft.days).padStart(2, '0')}</div>
            <div className="text-xs text-gray-400">DIAS</div>
          </div>
           <div className="text-5xl font-bold">:</div>
          <div className="text-center">
            <div className="text-5xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
            <div className="text-xs text-gray-400">HORAS</div>
          </div>
          <div className="text-5xl font-bold">:</div>
          <div className="text-center">
            <div className="text-5xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
            <div className="text-xs text-gray-400">MIN</div>
          </div>
           <div className="text-5xl font-bold">:</div>
          <div className="text-center">
            <div className="text-5xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
            <div className="text-xs text-gray-400">SEG</div>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="w-full sm:w-1/2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Lembrar Mais Tarde
            </button>
            <button
              onClick={onRenew}
              className="w-full sm:w-1/2 bg-lime-500 hover:bg-lime-600 text-black font-bold py-3 rounded-lg transition-colors"
            >
              Renovar Agora
            </button>
        </div>

      </div>
    </div>
  );
};

export default PremiumWarningModal;
