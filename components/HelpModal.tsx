import React, { useState } from 'react';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

type TabKey = 'gettingStarted' | 'interface' | 'metrics' | 'hunters' | 'marketChart' | 'copilot' | 'signals';

const HelpModal: React.FC<HelpModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('gettingStarted');

  if (!open) return null;

  const tabs: Record<TabKey, { icon: string, title: string }> = {
    gettingStarted: { icon: '🚀', title: 'Primeiros Passos' },
    interface: { icon: '🖥️', title: 'Interface & Alertas' },
    metrics: { icon: '📊', title: 'Métricas Principais' },
    hunters: { icon: '🎯', title: 'Ferramentas de Caça' },
    marketChart: { icon: '📈', title: 'Gráfico Avançado' },
    copilot: { icon: '🤖', title: 'Co-Piloto & Banca' },
    signals: { icon: '📡', title: 'Sinais & Social' },
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'gettingStarted':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-amber-300">Como Começar a Usar o Radar</h3>
            <p>Seja bem-vindo! O Radar Aviator é uma ferramenta poderosa para analisar o jogo. Siga estes passos para extrair o máximo de proveito:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li><strong>Adicione Dados:</strong> A análise começa com o histórico de jogadas. Vá em <strong className="text-white">"Adicionar Dados"</strong> no cabeçalho. Você pode:
                <ul className="list-disc list-inside ml-4 mt-1 text-gray-400">
                  <li><strong>Colar Texto:</strong> Copie e cole o histórico de um site de resultados.</li>
                  <li><strong>Analisar Print:</strong> Tire um screenshot da tela de resultados e a IA extrairá os dados.</li>
                  <li><strong>Carregar Planilha:</strong> Use uma planilha .xlsx com as colunas "Número", "Data" e "Horário".</li>
                </ul>
              </li>
              <li><strong>Entenda as Análises:</strong> Após carregar os dados, você verá a <strong className="text-white">Análise Local</strong> (instantânea, com dados brutos como contagens e médias). Para insights mais profundos, clique em <strong className="text-white">"Analisar com IA"</strong> (requer Premium). A IA interpreta os padrões e oferece previsões e estratégias.</li>
              <li><strong>Explore os Painéis:</strong> Cada seção do dashboard é um painel. Clique nos títulos para expandir ou recolher e focar no que é mais importante para você no momento.</li>
            </ol>
            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
              <p className="font-semibold text-white">Dica de Ouro:</p>
              <p className="text-sm text-gray-400">Mantenha a <strong className="text-teal-300">Coleta Automática</strong> ativada (no menu "Adicionar Dados") para que seu histórico esteja sempre atualizado sem esforço manual.</p>
            </div>
          </div>
        );
      case 'interface':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-amber-300">Navegando na Interface</h3>
            <p>Conheça os principais indicadores e controles no cabeçalho do sistema:</p>
            <ul className="space-y-3 text-gray-300">
              <li>
                <strong className="text-white">Indicadores de Status (Luzes):</strong>
                <ul className="list-disc list-inside ml-4 mt-1 text-gray-400">
                  <li><strong className="text-green-400">Luz Verde/Azul:</strong> Indica que a última chamada à IA (Gemini) ou análise local foi bem-sucedida.</li>
                  <li><strong className="text-amber-400">Luz Laranja (Pulsando):</strong> A IA está processando uma solicitação.</li>
                  <li><strong className="text-teal-400">Luz Verde-Água (Pulsando):</strong> A coleta automática de dados está em andamento.</li>
                </ul>
              </li>
              <li><strong className="text-white">⏯️ Pausar Análises da IA:</strong> Este botão permite que você pause as atualizações automáticas da IA. Útil para analisar um cenário específico sem que os dados mudem.</li>
              <li><strong className="text-white">🔔 Sino de Notificações:</strong> O sistema envia alertas importantes aqui, como quando um padrão de rosa é detectado, um minuto quente está ativo ou o Co-Piloto toma uma decisão. Fique sempre de olho!</li>
            </ul>
            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
              <p className="font-semibold text-white">Dica de Ouro:</p>
              <p className="text-sm text-gray-400">Passe o mouse sobre as luzes de status para ver mais detalhes, como qual chave da API foi usada e o status exato da coleta de dados.</p>
            </div>
          </div>
        );
      case 'metrics':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-amber-300">Decifrando as Métricas</h3>
            <p>Entenda os principais indicadores do painel de Resumo:</p>
            <ul className="space-y-3 text-gray-300">
              <li><strong className="text-white">🌡️ Termômetro do Mercado:</strong> Mede o "calor" do jogo nas últimas 24 rodadas. <span className="text-red-400">Super Quente</span> indica uma alta concentração de velas rosas recentes, sinalizando um mercado pagador.</li>
              <li><strong className="text-white">📊 Barras de Pressão (Rosa & Roxa):</strong> Indicam a probabilidade de uma vela de alto valor aparecer em breve. Quando a barra de <strong className="text-pink-400">Pressão de Rosas</strong> fica <strong className="text-red-400">CRÍTICA</strong>, a chance é máxima. É um dos gatilhos mais fortes para o Co-Piloto IA.</li>
              <li><strong className="text-white">⏸️ Risco de Pausa:</strong> Analisa a probabilidade do mercado entrar em uma "pausa", uma longa sequência sem rosas. Um nível <strong className="text-red-400">CRÍTICO</strong> sugere cautela máxima e pode pausar o Co-Piloto se o modo defensivo estiver ativo.</li>
              <li><strong className="text-white">🏠 Ranking de Casas:</strong> Mostra os intervalos (casas) que mais se repetiram entre as velas rosas. Casas que se repetem com frequência são alvos importantes.</li>
            </ul>
             <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
              <p className="font-semibold text-white">Dica de Ouro:</p>
              <p className="text-sm text-gray-400">Combine os indicadores! Um mercado <strong className="text-red-400">Super Quente</strong> com uma Pressão de Rosas <strong className="text-red-400">CRÍTICA</strong> é o cenário mais forte possível para buscar uma vela rosa.</p>
            </div>
          </div>
        );
      case 'hunters':
         return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-amber-300">Ferramentas de Caça</h3>
            <p>Estas ferramentas são para encontrar padrões específicos e oportunidades.</p>
            <ul className="space-y-3 text-gray-300">
              <li><strong className="text-white">🎯 Dica do Caçador (Painel Flutuante):</strong> É um localizador de alvos em tempo real. Ele monitora a <strong className="text-pink-400">repetição de casas</strong>, que é um dos padrões mais fortes.
                 <ul className="list-disc list-inside ml-4 mt-1 text-gray-400">
                    <li><strong>Alvo:</strong> A casa exata que se repetiu.</li>
                    <li><strong>Antecipado e Proteção:</strong> As casas anterior e posterior ao alvo. É muito comum a rosa vir nelas. Fazer uma aposta de segurança nessas casas é uma ótima estratégia.</li>
                 </ul>
              </li>
              <li><strong className="text-white">🗺️ Catalogador de Padrões:</strong> Permite que você descubra seus próprios padrões. Use a busca manual para testar sequências (ex: Azul, Azul, Roxo) ou clique em <strong className="text-teal-300">"Catalogar Padrões Quentes"</strong> para que a IA encontre as sequências mais lucrativas no histórico carregado.</li>
            </ul>
             <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
              <p className="font-semibold text-white">Dica de Ouro:</p>
              <p className="text-sm text-gray-400">Quando a <strong className="text-pink-400">Dica do Caçador</strong> mostrar um alvo, considere fazer 3 entradas: uma no alvo principal e uma em cada proteção. Retire a das proteções em 2x-3x e deixe a do alvo principal para um multiplicador mais alto.</p>
            </div>
          </div>
        );
      case 'marketChart':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-amber-300">Gráfico de Mercado Avançado</h3>
            <p>Esta é uma ferramenta de análise técnica para visualizar o comportamento do mercado.</p>
            <ul className="space-y-3 text-gray-300">
              <li><strong className="text-white">Tipos de Gráfico:</strong> Você pode alternar entre <strong className="text-amber-300">Velas (Candles)</strong>, Linha e Área. As velas são ótimas para ver a volatilidade de cada período.</li>
              <li>
                <strong className="text-white">Indicadores Técnicos:</strong>
                <ul className="list-disc list-inside ml-4 mt-1 text-gray-400">
                  <li><strong>Bandas de Bollinger:</strong> Mostram a volatilidade. Quando as bandas se apertam, pode indicar que uma grande movimentação (para cima ou para baixo) está por vir.</li>
                  <li><strong>RSI (Índice de Força Relativa):</strong> Mede a "sobrecompra" ou "sobrevenda". Um RSI abaixo de 30 (sobrevenda) pode sugerir que uma recuperação (vela roxa/rosa) está próxima.</li>
                  <li><strong>Confiança da IA:</strong> Uma área colorida no fundo do gráfico que mostra o nível de "confiança" da IA em uma vela alta no momento. <span className="text-green-400">Verde</span> é alta confiança, <span className="text-red-400">Vermelho</span> é baixa.</li>
                </ul>
              </li>
            </ul>
            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
              <p className="font-semibold text-white">Dica de Ouro:</p>
              <p className="text-sm text-gray-400">Procure por confluência! Um bom sinal de entrada é quando o preço toca a banda de Bollinger inferior, o RSI está abaixo de 30, e a área de Confiança da IA fica verde. Isso indica que múltiplos fatores apontam para uma alta.</p>
            </div>
          </div>
        );
      case 'copilot':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-amber-300">Dominando o Co-Piloto IA</h3>
            <p>O Co-Piloto é seu assistente de apostas automático. Ele toma decisões com base na sua configuração e na análise do mercado em tempo real.</p>
            <ul className="space-y-3 text-gray-300">
              <li><strong className="text-white">Modo de Gerenciamento:</strong>
                 <ul className="list-disc list-inside ml-4 mt-1 text-gray-400">
                    <li><strong>IA:</strong> A IA define os valores das apostas com base no seu perfil de risco e no tamanho da sua banca. Totalmente automático.</li>
                    <li><strong>Apostador:</strong> Você define o valor da aposta base e os multiplicadores de recuperação (gale), e a IA decide <span className="italic">quando</span> entrar.</li>
                 </ul>
              </li>
               <li><strong className="text-white">Painel de Táticas:</strong> Ajuste fino do cérebro da IA. Aumente o "peso" de uma tática para que a IA a priorize. Por exemplo, se você confia mais na repetição de casas, aumente o peso do <strong className="text-amber-300">"Caçador de Casas"</strong>.</li>
               <li><strong className="text-white">Relatório da Sessão:</strong> Ao final de cada sessão, você pode baixar um relatório detalhado com todas as decisões da IA, o contexto e o resultado, perfeito para estudar e refinar sua estratégia.</li>
            </ul>
            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
              <p className="font-semibold text-white">Dica de Ouro:</p>
              <p className="text-sm text-gray-400">Comece no modo <strong className="text-amber-300">IA</strong> com o perfil <strong className="text-amber-300">Moderado</strong>. Observe o comportamento do robô e, conforme ganha confiança, explore o Painel de Táticas para personalizar as decisões dele ao seu estilo.</p>
            </div>
          </div>
        );
      case 'signals':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-amber-300">Sinais & Comunidade</h3>
            <p>Receba insights da IA e interaja com outros apostadores.</p>
            <ul className="space-y-3 text-gray-300">
              <li><strong className="text-white">📡 Robô de Sinais ao Vivo:</strong> Quando ativado, a IA analisa o mercado a cada 5 segundos buscando por micro-padrões. Se um padrão de alta probabilidade é encontrado, ele emite um sinal com Alvo, Confiança e o Gatilho (o porquê do sinal).</li>
              <li><strong className="text-white">🔮 Previsão de Sinais (Análise IA):</strong> Diferente do Robô ao Vivo, esta é uma previsão de longo prazo. Após fazer uma <strong className="text-amber-300">Análise com IA</strong>, o sistema gera uma lista de possíveis sinais para a próxima hora e para o resto do dia, com base em padrões macro.</li>
              <li><strong className="text-white">🔥 Resenha dos Apostadores:</strong> Sua área social exclusiva. Compartilhe suas vitórias, discuta estratégias e veja o que os outros membros estão fazendo. A interação e a troca de conhecimento são chaves para o sucesso!</li>
            </ul>
             <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
              <p className="font-semibold text-white">Dica de Ouro:</p>
              <p className="text-sm text-gray-400">Use o <strong className="text-amber-300">Robô ao Vivo</strong> para o jogo do momento e a <strong className="text-amber-300">Previsão de Sinais</strong> para planejar suas próximas sessões. Fique de olho na <strong className="text-amber-300">Resenha</strong> para pegar dicas quentes de outros jogadores.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-amber-500/50 rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col md:flex-row overflow-hidden animate-fade-in-up" onClick={e => e.stopPropagation()}>
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-950/50 p-4 border-b md:border-b-0 md:border-r border-gray-700/50 flex-shrink-0 overflow-y-auto">
          <h2 className="text-xl font-bold text-white mb-4">Guia do Sistema</h2>
          <nav className="space-y-1">
            {Object.entries(tabs).map(([key, { icon, title }]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as TabKey)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors text-sm ${
                  activeTab === key ? 'bg-amber-600 text-black font-semibold' : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="text-xl">{icon}</span>
                {title}
              </button>
            ))}
          </nav>
        </div>
        {/* Content */}
        <div className="flex-grow p-6 overflow-y-auto text-gray-400">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;