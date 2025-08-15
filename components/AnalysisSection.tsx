import React, { ReactNode, useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface AnalysisSectionProps {
  title: React.ReactNode;
  isAnalyzed: boolean;
  isLoading: boolean;
  onAnalyze: () => void;
  children: ReactNode;
  ctaText?: string;
  description?: string;
  disabled?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isUpToDate?: boolean;
  isPremium: boolean;
  countdown?: number;
  isAlerting?: boolean;
  isPremiumFeature?: boolean;
}

const CollapseIcon = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-lime-200/70 transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
    </svg>
);

const CountdownTimer: React.FC<{ seconds: number }> = ({ seconds }) => {
    const formatTime = (s: number) => {
        const minutes = Math.floor(s / 60);
        const remainingSeconds = s % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    if (seconds <= 0) {
        return <span className="text-xs font-semibold bg-lime-400/10 text-lime-300 px-2.5 py-1 rounded-full">Atualizado</span>;
    }

    return (
        <span className="text-xs font-semibold bg-gray-700/50 text-gray-300 px-2.5 py-1 rounded-full" title="Próxima atualização automática">
            Atualizando em: {formatTime(seconds)}
        </span>
    );
};

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ 
    title, 
    isAnalyzed, 
    isLoading, 
    onAnalyze, 
    children, 
    ctaText = "Analisar", 
    description, 
    disabled = false, 
    isCollapsed, 
    onToggleCollapse, 
    isUpToDate, 
    isPremium,
    countdown,
    isAlerting = false,
    isPremiumFeature = false,
}) => {
  const isUpdateAvailable = isAnalyzed && !isUpToDate;

  return (
    <div className={`bg-gray-900 backdrop-blur-md rounded-xl shadow-xl border border-lime-500/30 transition-all duration-300 ${isAlerting ? 'animate-pulse-opportunity' : ''}`}>
      <button onClick={onToggleCollapse} className="w-full flex justify-between items-center p-6 text-left" aria-expanded={!isCollapsed}>
        <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-lime-300 flex items-center gap-2">
                {title}
                {!isPremium && <span className="text-lime-400" title="Funcionalidade Premium">👑</span>}
            </h3>
            {isAnalyzed && !isLoading && isPremium && countdown !== undefined && (
                <CountdownTimer seconds={countdown} />
            )}
        </div>
        <CollapseIcon isCollapsed={isCollapsed} />
      </button>

      {!isCollapsed && (
        <div className="px-6 pb-6">
          <div className="border-t border-lime-500/30 pt-6">
            {(isAnalyzed && isPremium) || isLoading ? (
                <>
                  {isLoading ? <LoadingSpinner text="Analisando..." /> : children}
                </>
            ) : (
                <div className="text-center py-8">
                    {description && <p className="text-gray-400 mb-6">{description}</p>}
                    <button
                        onClick={(e) => { e.stopPropagation(); onAnalyze(); }}
                        disabled={disabled || isLoading}
                        className="bg-lime-500 hover:bg-lime-600 text-black font-bold py-3 px-6 rounded-lg transition-colors shadow-lg disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-black"></div>
                              Analisando...
                            </>
                        ) : (
                           isPremium ? ctaText : <span className="flex items-center gap-2">👑 Desbloquear com Premium</span>
                        )}
                    </button>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisSection;