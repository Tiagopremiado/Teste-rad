import React, { useState, useEffect } from 'react';
import type { User } from '../types';

interface ProfileManagerProps {
  profiles: User[];
  onSelectProfile: (id: string) => void;
  onCreateProfile: (name: string, whatsapp: string, premiumCode?: string) => Promise<{ success: boolean, message: string }>;
  onDeleteProfile: (id: string) => void;
}

const CountdownTimer = () => {
  const getInitialTime = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
  };

  const [timeLeft, setTimeLeft] = useState(getInitialTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => (prevTime > 0 ? prevTime - 1 : getInitialTime()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
      <div className="text-center my-6">
          <div className="font-mono text-7xl text-lime-400 animate-pulse-green-text-glow">
              {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <p className="text-sm text-lime-300/80 mt-2 animate-pulse">⚠️ Após este tempo, os preços podem aumentar, seja rápido!</p>
      </div>
  );
};

const features = [
    'Análise Preditiva para 50x e Relatórios de Multiplicadores Altos',
    'Co-Piloto IA com Gerenciamento de Banca',
    'Robô de Sinais ao Vivo 24h',
    'Previsão de Sinais e Minutos com Análise Visual',
    'Alertas Inteligentes de Oportunidade',
    'Área Social Exclusiva "Resenha"',
    'Suporte VIP via WhatsApp',
    'Estratégias Recomendadas pela IA',
    'Termômetro de Mercado em Tempo Real',
    'Análise de Pressão de Rosa e Roxa',
    'Analisador de Risco de Pausa',
    'Gráfico de Mercado Avançado',
    'Análise Visual de Colunas Pagantes para Rosa',
    'Catalogador de Padrões',
    'Ranking de Padrões de Rosas com Alertas',
    'Gatilho Mais Quente para Rosa',
    'Últimas Repetições de Padrões',
    'Ranking de Casas de Repetição de Rosas',
    'Rodadas desde a última Rosa',
    'Total de Rosas e Média de Intervalo',
    'Média de Multiplicadores Roxo',
    'Contagem de Rosas desde o último 50x e 100x',
    'Multiplicador da Última Rosa',
    'Maiores Sequências (Roxo, Rosa, Azul)',
    'Histórico Recente Detalhado',
];

const PricingCard: React.FC<{
    duration: string;
    price: string;
    originalPrice: string;
    isPopular?: boolean;
    onCtaClick: () => void;
}> = ({ duration, price, originalPrice, isPopular, onCtaClick }) => {
    
    return (
        <div className={`p-6 rounded-2xl bg-slate-900/60 backdrop-blur-md border-2 ${isPopular ? 'border-lime-400 ring-2 ring-lime-400/50 shadow-2xl shadow-lime-500/20' : 'border-gray-700/80'} flex flex-col`}>
            {isPopular && (
                <div className="text-center mb-2 -mt-9">
                    <span className="bg-lime-500 text-black font-bold text-xs px-3 py-1 rounded-full">MAIS POPULAR</span>
                </div>
            )}
            <h3 className="text-2xl font-bold text-center mb-2">{duration}</h3>
            
            <p className="text-center text-5xl font-bold mb-4">
                <span className="text-gray-400 line-through text-2xl mr-2 align-middle">{originalPrice}</span>
                <span className="align-middle text-transparent bg-clip-text bg-gradient-to-r from-white to-lime-300">{price}</span>
            </p>

            <ul className="space-y-2 text-sm flex-grow mb-6">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                        <span className="text-lime-400">✔️</span>
                        <span className="text-gray-300">{feature}</span>
                    </li>
                ))}
            </ul>

            <button onClick={onCtaClick} className="w-full font-bold py-3 rounded-lg transition-colors text-lg bg-lime-500 hover:bg-lime-600 text-black">
                Adquirir via PIX
            </button>
        </div>
    );
};


const ProfileManager: React.FC<ProfileManagerProps> = ({ profiles, onSelectProfile, onCreateProfile, onDeleteProfile }) => {
  const [activeTab, setActiveTab] = useState('register');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [indicationCode, setIndicationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
        setError("O nome de usuário é obrigatório.");
        return;
    }

    const sanitizedWhatsapp = whatsapp.replace(/\D/g, '');
    if (sanitizedWhatsapp.length < 11) {
      setError("O número de WhatsApp deve ter no mínimo 11 dígitos (DDD + número).");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    // Check for duplicates
    if (profiles.some(p => p.display_name.toLowerCase() === name.trim().toLowerCase())) {
        setError("Este nome de usuário já está em uso. Por favor, escolha outro.");
        return;
    }

    if (profiles.some(p => p.whatsapp.replace(/\D/g, '') === sanitizedWhatsapp)) {
        setError("Este número de WhatsApp já está cadastrado.");
        return;
    }


    setIsLoading(true);
    const result = await onCreateProfile(name, whatsapp, indicationCode);
    if (!result.success) {
      setError(result.message);
      setIsLoading(false);
    }
    // On success, the main App component will handle the view change.
  };

  return (
    <div className="min-h-screen bg-login-pattern text-gray-200 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      <main className="z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-fade-in-up">
        {/* Left side: Login/Register Form and Countdown */}
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-white">Tiago <span className="text-lime-400">Lux</span> Análise</h1>
            <p className="text-lime-400/80 mt-1 max-w-lg mx-auto">Deixe de ser mais um na multidão. Nossa IA analisa milhares de rodadas por você, revelando os padrões que a maioria não vê. Tenha acesso a sinais preditivos e ao Co-Piloto automático. A ferramenta definitiva para operar como um profissional.</p>
          </div>
          
          <CountdownTimer />

          <div className="bg-slate-900/60 backdrop-blur-lg border border-lime-500/20 rounded-2xl shadow-2xl shadow-lime-500/10 p-2 sm:p-4">
            <div className="flex border-b-2 border-lime-500/20">
              <button onClick={() => setActiveTab('register')} className={`flex-1 p-3 font-bold transition-colors ${activeTab === 'register' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-400'}`}>Criar Cadastro</button>
              <button onClick={() => setActiveTab('login')} className={`flex-1 p-3 font-bold transition-colors ${activeTab === 'login' ? 'text-lime-400 border-b-2 border-lime-400' : 'text-gray-400'}`}>Entrar</button>
            </div>

            <div className="p-4 sm:p-6">
              {activeTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
                  <input type="text" placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-800 p-3 rounded-lg border-2 border-gray-700 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/30" />
                  <div>
                    <input type="tel" placeholder="Seu Nº de WhatsApp com DDD" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required minLength={11} className="w-full bg-gray-800 p-3 rounded-lg border-2 border-gray-700 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/30" />
                    <p className="text-xs text-lime-300/70 mt-1 px-2 text-center">
                        O acesso ao sistema só será liberado para o número de WhatsApp informado.
                    </p>
                  </div>
                  <input type="password" placeholder="Crie uma Senha (mín. 8 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className="w-full bg-gray-800 p-3 rounded-lg border-2 border-gray-700 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/30" />
                  <input type="password" placeholder="Confirme a Senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} className="w-full bg-gray-800 p-3 rounded-lg border-2 border-gray-700 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/30" />
                  <input type="text" placeholder="Código de Indicação (Opcional)" value={indicationCode} onChange={e => setIndicationCode(e.target.value.toUpperCase())} className="w-full bg-gray-800 p-3 rounded-lg border-2 border-gray-700 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/30" />
                  {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                  <button type="submit" disabled={isLoading} className="w-full bg-lime-500 hover:bg-lime-600 text-black font-bold py-3 rounded-lg transition-colors text-lg disabled:opacity-50">
                    {isLoading ? 'Criando...' : 'Cadastrar e Aguardar Liberação'}
                  </button>
                </form>
              )}
              {activeTab === 'login' && (
                <div className="space-y-3 animate-fade-in">
                  {profiles.length > 0 ? profiles.map(profile => (
                     <div key={profile.id} className="group relative bg-gray-900/50 p-3 rounded-xl flex items-center gap-4 transition-all duration-300 hover:bg-gray-800/60 hover:ring-1 hover:ring-lime-500/50">
                        <button onClick={() => onSelectProfile(profile.id)} className="flex items-center gap-4 flex-grow text-left">
                            <img src={profile.avatar_url} alt={profile.display_name} className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-700" />
                            <div>
                                <p className="font-bold text-white">{profile.display_name}</p>
                            </div>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteProfile(profile.id); }} className="p-2 rounded-full text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Deletar Perfil">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                  )) : (
                    <p className="text-center text-gray-500 py-4">Nenhum perfil encontrado. Crie um na aba ao lado.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PricingCard duration="Plano Diário" price="R$ 19,99" originalPrice="R$ 39,90" onCtaClick={() => setActiveTab('register')} />
            <PricingCard duration="Plano 7 Dias" price="R$ 29,90" originalPrice="R$ 69,90" onCtaClick={() => setActiveTab('register')} />
            <PricingCard duration="Plano 15 Dias" price="R$ 39,90" originalPrice="R$ 99,90" onCtaClick={() => setActiveTab('register')} />
            <PricingCard duration="Plano 30 Dias" price="R$ 59,90" originalPrice="R$ 149,90" isPopular={true} onCtaClick={() => setActiveTab('register')} />
        </div>
      </main>
    </div>
  );
};

export default ProfileManager;