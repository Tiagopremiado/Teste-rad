import React, { useState, useEffect } from 'react';

interface PendingApprovalModalProps {
  onReturnToLogin: () => void;
}

const PendingApprovalModal: React.FC<PendingApprovalModalProps> = ({ onReturnToLogin }) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [showWhatsAppButton, setShowWhatsAppButton] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setShowWhatsAppButton(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const whatsappUrl = `https://wa.me/55991416962?text=${encodeURIComponent('quero ativar meu cadastro')}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div
        className="bg-gray-950 border-2 border-yellow-500 rounded-2xl shadow-2xl shadow-yellow-500/20 max-w-lg w-full p-8 text-center animate-fade-in-up relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute -top-10 -right-10 text-9xl text-yellow-500/10 rotate-12">⏳</div>

        <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
          <span className="text-4xl">⏳</span>
        </div>

        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 mb-3">
          Aguardando Liberação do Sistema
        </h2>
        <p className="text-gray-300 mb-6">
          Sua conta está em análise. Assim que confirmarmos seu cadastro na plataforma parceira, seu acesso total será liberado automaticamente.
        </p>

        <div className="font-mono text-7xl text-yellow-400 animate-pulse my-6">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        
        {showWhatsAppButton ? (
             <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg text-lg flex items-center justify-center gap-2 animate-pulse-whatsapp"
             >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.847 6.062l-1.07 3.888 3.96-1.042z" />
                 </svg>
                 Ativar Cadastro via WhatsApp
            </a>
        ) : (
             <p className="text-sm text-gray-400">Caso a liberação não ocorra, um botão de contato aparecerá aqui.</p>
        )}

        <button
          onClick={onReturnToLogin}
          className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          Voltar para Seleção de Perfil
        </button>
      </div>
    </div>
  );
};

export default PendingApprovalModal;
