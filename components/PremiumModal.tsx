
import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface PremiumModalProps {
    open: boolean;
    onClose: () => void;
    onActivate: (code: string) => Promise<boolean>;
    isLoading: boolean;
    error: string | null;
    mode?: 'default' | 'expired';
}

const PremiumModal: React.FC<PremiumModalProps> = ({ open, onClose, onActivate, isLoading, error, mode = 'default' }) => {
    const [code, setCode] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    const whatsappUrl = `https://wa.me/55991416962?text=${encodeURIComponent('Olá! Tenho interesse em adquirir o acesso premium para o Radar Aviator.')}`;
    const isExpiredMode = mode === 'expired';

    useEffect(() => {
        if (error) {
            setLocalError(error);
        }
    }, [error]);

    useEffect(() => {
        if (!open) {
            setCode('');
            setLocalError(null);
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        if (!code.trim()) {
            setLocalError('Por favor, insira um código.');
            return;
        }
        const success = await onActivate(code);
        if (success) {
            onClose();
        }
    };
    
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={!isExpiredMode ? onClose : undefined}
        >
            <div
                className="bg-gray-950 border-2 border-lime-500 rounded-2xl shadow-2xl shadow-lime-500/20 max-w-md w-full p-8 text-center animate-fade-in-up relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="absolute -top-10 -right-10 text-9xl text-lime-500/10 rotate-12">👑</div>

                <div className={`mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gradient-to-br ${isExpiredMode ? 'from-yellow-400 to-orange-500' : 'from-lime-400 to-green-500'} shadow-lg animate-pulse-neon-green`}>
                    <span className="text-4xl">{isExpiredMode ? '⏳' : '👑'}</span>
                </div>

                <h2 className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${isExpiredMode ? 'from-yellow-300 to-orange-400' : 'from-lime-300 to-green-400'} mb-3`}>
                    {isExpiredMode ? 'Seu Acesso Expirou' : 'Acesso VIP Exclusivo'}
                </h2>
                <p className="text-gray-300 mb-6">
                    {isExpiredMode
                        ? 'Seu plano premium terminou e você foi movido para a versão gratuita. Renove agora para continuar com acesso a todas as ferramentas.'
                        : 'Desbloqueie todas as ferramentas da IA e eleve seu nível de análise!'}
                </p>

                <div className="space-y-4 my-8">
                    <form onSubmit={handleSubmit} className="space-y-3">
                         <div>
                            <label htmlFor="premium-code" className="sr-only">Código de Ativação</label>
                            <input
                                type="text"
                                id="premium-code"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                className="w-full bg-gray-800 text-white text-center text-lg tracking-[0.2em] placeholder-gray-500 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-lime-500 uppercase"
                                placeholder="INSIRA SEU CÓDIGO"
                                required
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>
                        {localError && <p className="text-red-400 text-sm text-center">{localError}</p>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-lime-500 hover:bg-lime-600 text-black font-bold py-3 rounded-lg transition-colors flex justify-center items-center h-12"
                        >
                            {isLoading ? <LoadingSpinner /> : (isExpiredMode ? 'Reativar Acesso' : 'Ativar Acesso')}
                        </button>
                    </form>
                    
                     <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-gray-500 text-xs">OU</span>
                        <div className="flex-grow border-t border-gray-600"></div>
                    </div>
                    
                    {isExpiredMode ? (
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg text-lg flex items-center justify-center gap-2"
                        >
                            Continuar com a Versão Gratuita
                        </button>
                    ) : (
                         <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg text-lg flex items-center justify-center gap-2"
                         >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                               <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.847 6.062l-1.07 3.888 3.96-1.042z" />
                             </svg>
                             Quero ser Premium
                        </a>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PremiumModal;