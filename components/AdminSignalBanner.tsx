import React from 'react';
import type { AdminSignal } from '../types';

interface AdminSignalBannerProps {
  signal: AdminSignal | null;
  onDismiss: () => void;
}

const AdminSignalBanner: React.FC<AdminSignalBannerProps> = ({ signal, onDismiss }) => {
  if (!signal) return null;

  const config = {
    HighMultiplier: {
      icon: '🚀',
      color: 'bg-blue-500/80 border-blue-400',
      animation: 'animate-pulse-blue-banner',
    },
    BigPayout: {
      icon: '💰',
      color: 'bg-amber-500/80 border-amber-400',
      animation: 'animate-pulse-gold-banner',
    },
    RiskAlert: {
      icon: '🛡️',
      color: 'bg-red-600/80 border-red-500',
      animation: 'animate-pulse-red-banner',
    },
  };

  const { icon, color, animation } = config[signal.type];

  return (
    <div className={`sticky top-0 z-50 p-3 text-white backdrop-blur-md border-b ${color} ${animation} shadow-lg animate-fade-in`}>
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{icon}</span>
          <div>
            <h3 className="font-bold text-lg">{signal.title}</h3>
            <p className="text-sm">{signal.message}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs text-gray-300 hidden sm:block">Enviado por: {signal.sentBy}</p>
          <button
            onClick={onDismiss}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Dispensar alerta"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSignalBanner;