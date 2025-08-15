

import React, { useMemo, forwardRef } from 'react';
import type { AutoCollectionStatus } from '../types';

interface SiteIframeProps {
  src: string;
  title?: string;
  handleScrapeTipminer: () => void;
  isScraping: boolean;
  isAutoCollecting: boolean;
  toggleAutoCollection: () => void;
  autoCollectStatus: AutoCollectionStatus;
  countdown: number;
}

const SiteIframe = forwardRef<HTMLIFrameElement, SiteIframeProps>(({ 
    src, 
    title = "Site Incorporado",
    handleScrapeTipminer,
    isScraping,
    isAutoCollecting,
    toggleAutoCollection,
    autoCollectStatus,
    countdown,
 }, ref) => {

    const statusInfo = useMemo(() => {
        const isActivelyCollecting = isScraping || autoCollectStatus === 'running';
        
        if (isActivelyCollecting) {
            return { color: 'text-green-400', bgColor: 'bg-green-500', text: 'Coletando...' };
        }
        if (isAutoCollecting) {
            if (autoCollectStatus === 'error') {
                 return { color: 'text-red-400', bgColor: 'bg-red-500', text: 'Erro na Coleta' };
            }
            return { color: 'text-cyan-400', bgColor: 'bg-cyan-500', text: `Próxima em: ${countdown}s` };
        }
        return { color: 'text-gray-400', bgColor: 'bg-gray-500', text: 'Inativo' };
    }, [isScraping, autoCollectStatus, isAutoCollecting, countdown]);

  return (
    <div className="mt-8">
      <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700/50 overflow-hidden relative">
        {/* Scan line effect */}
        {isScraping && (
             <div className="absolute top-0 left-0 right-0 h-full pointer-events-none z-20">
                <div className="absolute w-full h-1.5 bg-cyan-400/70 shadow-[0_0_15px_5px_rgba(0,255,255,0.5)] animate-scan-down"></div>
             </div>
        )}
        
        {/* Header with controls */}
        <div className="p-4 bg-gray-900/50 flex justify-between items-center flex-wrap gap-4 border-b border-gray-700/50">
          <div>
            <h2 className="text-2xl font-bold text-white">Nosso Site</h2>
            <p className="text-sm text-gray-400">Resultados ao vivo e sincronização</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Auto Sync Toggle */}
            <div className="flex items-center gap-3 bg-gray-800 p-2 rounded-lg">
                <label htmlFor="auto-sync-toggle" className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input type="checkbox" id="auto-sync-toggle" className="sr-only" checked={isAutoCollecting} onChange={toggleAutoCollection} />
                        <div className={`block ${isAutoCollecting ? 'bg-green-600' : 'bg-gray-600'} w-10 h-6 rounded-full transition`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${isAutoCollecting ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-2 text-sm text-white font-medium">
                        {'Auto'}
                    </div>
                </label>
                <div className="flex items-center gap-1.5 w-32" title={`Status: ${statusInfo.text}`}>
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${statusInfo.bgColor} ${(isScraping || autoCollectStatus === 'running') ? 'animate-pulse' : ''}`}></span>
                    <span className={`${statusInfo.color} text-xs font-semibold truncate`}>{statusInfo.text}</span>
                </div>
            </div>
            
            <button 
                onClick={handleScrapeTipminer} 
                disabled={isScraping || isAutoCollecting}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
                title="Simula um 'print' da tela, mas usa a API para garantir 100% de precisão dos dados."
            >
                {isScraping ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Analisando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                    Atualizar Resultado
                  </>
                )}
            </button>
          </div>
        </div>
        
        <iframe
          ref={ref}
          src={src}
          title={title}
          className="w-full h-[650px] border-0"
          allowFullScreen
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
});

export default SiteIframe;