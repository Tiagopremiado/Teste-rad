import React, { useState } from 'react';

interface AffiliateRegistrationModalProps {
  onSubmitUsername: (username: string) => void;
  affiliateLink: string;
}

const AffiliateRegistrationModal: React.FC<AffiliateRegistrationModalProps> = ({ onSubmitUsername, affiliateLink }) => {
  const [username, setUsername] = useState('');

  const handlePrimaryAction = () => {
    window.open(affiliateLink, '_blank');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
        onSubmitUsername(username.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-950 border-2 border-amber-500 rounded-2xl shadow-2xl shadow-amber-500/20 max-w-lg w-full p-8 text-center animate-fade-in-up relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute -top-10 -right-10 text-9xl text-amber-500/10 rotate-12">🔗</div>

        <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg">
          <span className="text-4xl">🚀</span>
        </div>

        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 mb-3">
          Passo Final: Ativação do Sistema
        </h2>
        <p className="text-gray-300 mb-2">
          Parabéns! Para ativar a **coleta de dados em tempo real** e a análise de padrões da nossa IA, siga os 2 passos abaixo:
        </p>

        <div className="space-y-4 my-6 text-left">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <p className="font-bold text-lg text-lime-300">1. Crie sua conta na plataforma parceira</p>
                <p className="text-sm text-gray-400 mb-3">Clique no botão abaixo para abrir o site em uma nova aba e fazer seu cadastro gratuito.</p>
                 <a
                    href={affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handlePrimaryAction}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded-lg transition-colors flex justify-center items-center shadow-lg"
                  >
                    Abrir Plataforma Parceira
                </a>
            </div>
             <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <p className="font-bold text-lg text-lime-300">2. Informe seu nome de usuário</p>
                <p className="text-sm text-gray-400 mb-3">Após criar sua conta na plataforma, digite o nome de usuário que você escolheu lá e clique em "Enviar para Aprovação".</p>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-700 text-white text-center text-lg placeholder-gray-500 border border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-lime-500"
                    placeholder="SEU NOME DE USUÁRIO LÁ"
                    required
                />
            </div>
        </div>
        
        <button
          type="submit"
          disabled={!username.trim()}
          className="w-full bg-lime-500 hover:bg-lime-60á00 text-black font-bold py-3 px-6 rounded-lg transition-colors flex justify-center items-center h-12 text-lg shadow-lg disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          Enviar para Aprovação
        </button>

      </form>
    </div>
  );
};

export default AffiliateRegistrationModal;