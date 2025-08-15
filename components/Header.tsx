import React, { useState, useEffect, useMemo } from 'react';
import type { User, AutoCollectionStatus, ApiInfo, Notification, Analysis } from '../types';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  onOpenDataInput: () => void;
  onLogout: () => void;
  user: User;
  onOpenPremiumModal: () => void;
  isCollecting: boolean;
  autoCollectionStatus: AutoCollectionStatus;
  onOpenAdminLogin: () => void;
  isApiLoading: boolean;
  lastApiCall: ApiInfo | null;
  isPatternChaserVisible: boolean;
  onTogglePatternChaser: () => void;
  isPremium: boolean;
  expiryTimestamp: number | null;
  activeView: 'dashboard' | 'social' | 'admin';
  onViewChange: (view: 'dashboard' | 'social' | 'admin') => void;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  clearAllNotifications: () => void;
  isAutoAnalysisPaused: boolean;
  onToggleAutoAnalysis: () => void;
  onOpenHelpModal: () => void;
  localAnalysis: Partial<Analysis> | null;
}

const CollectionIndicator: React.FC<{ isCollecting: boolean, status: AutoCollectionStatus }> = ({ isCollecting, status }) => {
    const baseClasses = 'w-3 h-3 rounded-full transition-all';
    let colorClass = 'bg-gray-500'; // idle
    let pulseClass = '';
    if (isCollecting) {
        colorClass = 'bg-teal-400';
        pulseClass = 'animate-pulse';
    } else if (status === 'error') {
        colorClass = 'bg-red-500';
    }
    
    return <div className={`${baseClasses} ${colorClass} ${pulseClass}`} title={`Coleta Automática: ${status}`}></div>;
};

const ApiIndicator: React.FC<{ isLoading: boolean; lastApiCall: ApiInfo | null }> = ({ isLoading, lastApiCall }) => {
    let title = 'API Status: Inativo';
    let colorClass = 'bg-gray-500';
    if (isLoading) {
        title = 'API Status: Carregando...';
        colorClass = 'bg-amber-500 animate-pulse';
    } else if (lastApiCall) {
        title = `API Status: Última chamada via ${lastApiCall.provider} (Chave ${lastApiCall.keyIndex})`;
        colorClass = lastApiCall.provider === 'Gemini' ? 'bg-green-500' : 'bg-blue-500';
    }

    return <div className={`w-3 h-3 rounded-full transition-colors`} style={{ backgroundColor: colorClass.split(' ')[0] }} title={title}></div>;
};

const DigitalClock: React.FC<{ hotSpots?: Analysis['hotSpots'] }> = ({ hotSpots }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const hotMinuteStatus = useMemo(() => {
        if (!hotSpots) return null;

        const currentMinute = String(time.getMinutes());

        const isHotFor50x = hotSpots.hottest50xMinutes?.some(m => m.replace(':', '') === currentMinute);
        const isHotFor100x = hotSpots.hottest100xMinutes?.some(m => m.replace(':', '') === currentMinute);
        const isHotFor1000x = hotSpots.hottest1000xMinutes?.some(m => m.replace(':', '') === currentMinute);

        if (isHotFor50x || isHotFor100x || isHotFor1000x) {
            return { type: 'gold', message: 'Minuto quente para multiplicador alto!' };
        }

        const isHotForPink = hotSpots.hottestPinkMinutes?.some(m => m.minute.replace(':', '') === currentMinute);
        if (isHotForPink) {
            return { type: 'pink', message: 'Minuto quente para rosas!' };
        }

        return null;
    }, [time, hotSpots]);

    const animationClass = hotMinuteStatus?.type === 'gold' 
        ? 'animate-pulse-clock-gold-text' 
        : hotMinuteStatus?.type === 'pink' 
        ? 'animate-pulse-clock-pink-text'
        : '';

    return (
        <div 
          className={`font-mono text-lg text-lime-300 transition-all ${animationClass}`} 
          title={hotMinuteStatus?.message || "Horário Local"}
        >
            {time.toLocaleTimeString('pt-BR')}
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({
  onOpenDataInput,
  onLogout,
  user,
  onOpenPremiumModal,
  isCollecting,
  autoCollectionStatus,
  onOpenAdminLogin,
  isApiLoading,
  lastApiCall,
  isPatternChaserVisible,
  onTogglePatternChaser,
  isPremium,
  expiryTimestamp,
  activeView,
  onViewChange,
  notifications,
  onNotificationClick,
  clearAllNotifications,
  isAutoAnalysisPaused,
  onToggleAutoAnalysis,
  onOpenHelpModal,
  localAnalysis,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (isPremium && expiryTimestamp && expiryTimestamp !== Infinity) {
      const interval = setInterval(() => {
        const now = Date.now();
        const distance = expiryTimestamp - now;

        if (distance < 0) {
          setTimeLeft('Expirado');
          clearInterval(interval);
          return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      }, 1000);

      return () => clearInterval(interval);
    } else if (isPremium && expiryTimestamp === Infinity) {
        setTimeLeft('Vitalício');
    }
  }, [isPremium, expiryTimestamp]);

  return (
    <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-lg border-b border-gray-800 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✈️</span>
              <div className="flex flex-col">
                 <h1 className="text-xl font-bold text-white">Radar Aviator</h1>
                  {isPremium && (
                      <div className="text-xs text-lime-300 font-semibold" title="Tempo restante da assinatura">
                          👑 Premium: {timeLeft}
                      </div>
                  )}
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 border-l border-gray-700 pl-4">
                <button 
                    onClick={() => onViewChange('dashboard')} 
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'dashboard' ? 'bg-lime-500 text-black shadow-[0_0_8px_theme(colors.lime.500)]' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                    Dashboard
                </button>
                <button 
                    onClick={() => onViewChange('social')} 
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${activeView === 'social' ? 'bg-lime-500 text-black shadow-[0_0_8px_theme(colors.lime.500)]' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                    Resenha 🔥 {!isPremium && <span className="text-lime-400" title="Premium">👑</span>}
                </button>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <DigitalClock hotSpots={localAnalysis?.hotSpots} />

            <button
              onClick={onOpenHelpModal}
              title="Ajuda & Dicas"
              className="p-2 rounded-full text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <NotificationBell
              notifications={notifications}
              onNotificationClick={onNotificationClick}
              onClearAll={clearAllNotifications}
            />

            <div className="flex items-center gap-2 bg-gray-900/50 p-1.5 rounded-lg border border-gray-700">
              <ApiIndicator isLoading={isApiLoading} lastApiCall={lastApiCall} />
              <div className="h-4 w-px bg-gray-700"></div>
              <CollectionIndicator isCollecting={isCollecting} status={autoCollectionStatus} />
              <div className="h-4 w-px bg-gray-700"></div>
              <button
                onClick={onToggleAutoAnalysis}
                title={isAutoAnalysisPaused ? "Continuar Análises da IA" : "Pausar Análises da IA"}
                className="p-1 rounded-md transition-colors text-gray-400 hover:bg-gray-700"
              >
                {isAutoAnalysisPaused ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>

            {activeView === 'dashboard' && (
              <>
                <div className="hidden sm:flex items-center gap-1 bg-gray-900/50 p-1 rounded-lg border border-gray-700">
                   <button onClick={onTogglePatternChaser} title={isPatternChaserVisible ? "Ocultar Caçador de Padrões" : "Mostrar Caçador de Padrões"} className={`p-2 rounded-md transition-colors ${isPatternChaserVisible ? 'bg-pink-600/20 text-pink-300' : 'text-gray-400 hover:bg-gray-700'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 4.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM10 2a8 8 0 100 16 8 8 0 000-16z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                   </button>
                </div>

                <button
                  onClick={onOpenDataInput}
                  className="hidden sm:inline-flex items-center justify-center bg-lime-500 hover:bg-lime-600 text-black font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L13 9.414V13h-1.5z" /><path d="M9 13h2v5a1 1 0 11-2 0v-5z" /></svg>
                  Adicionar Dados
                </button>
              </>
            )}
            
            {user.role === 'admin' && (
                <button
                    onClick={() => onViewChange('admin')}
                    title="Painel do Administrador"
                    className="hidden sm:inline-flex items-center justify-center bg-lime-600 hover:bg-lime-700 text-black font-bold py-2 px-3 rounded-lg transition-colors text-sm animate-pulse-neon-green"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                    Painel ADM
                </button>
            )}

            <div className="relative">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-gray-800">
                <img className="w-9 h-9 rounded-full object-cover" src={user.avatar_url} alt="User Avatar" />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-900 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm text-white font-medium truncate">{user.display_name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.whatsapp}</p>
                    </div>
                    
                    {/* Mobile Navigation */}
                    <div className="sm:hidden border-b border-gray-700 py-1">
                        <button onClick={() => { onViewChange('dashboard'); setIsMenuOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm ${activeView === 'dashboard' ? 'bg-lime-500 text-black' : 'text-gray-300 hover:bg-gray-800'}`}>Dashboard</button>
                        <button onClick={() => { onViewChange('social'); setIsMenuOpen(false); }} className={`flex items-center gap-1 block w-full text-left px-4 py-2 text-sm ${activeView === 'social' ? 'bg-lime-500 text-black' : 'text-gray-300 hover:bg-gray-800'}`}>Resenha 🔥 {!isPremium && <span className="text-lime-400" title="Premium">👑</span>}</button>
                    </div>
                    
                    {!isPremium && <button onClick={() => { onOpenPremiumModal(); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-lime-300 hover:bg-gray-800">👑 Tornar-se Premium</button>}
                    {activeView === 'dashboard' && <button onClick={() => { onOpenDataInput(); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm sm:hidden text-gray-300 hover:bg-gray-800">Adicionar Dados</button>}
                    {user.role === 'admin' && <button onClick={() => { onViewChange('admin'); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-lime-300 hover:bg-gray-800">Painel ADM</button>}
                    <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800">Sair</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;