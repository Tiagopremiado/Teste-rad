
import React, { useState, useCallback, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import HolisticTrainer from './HolisticTrainer';
import type { TrainingStatus, AutoCollectionStatus, Play } from '../types';

interface DataInputHubProps {
  onFileUploaded: (file: File) => void;
  onTextPasted: (text: string) => void;
  onImageUploaded: (file: File) => void;
  isLoading: boolean;
  onReset: () => void;
  hasData: boolean;
  onBackup: () => void;
  onRestore: (file: File) => void;
  onRestoreLast: () => void;
  lastBackupExists: boolean;
  onTrainHolistic: (file: File) => void;
  trainingStatus: TrainingStatus | null;
  isTraining: boolean;
  hasCoreAnalysis: boolean;
  isAdmin: boolean;
  autoCollection: {
    status: AutoCollectionStatus;
    countdown: number;
    error: string | null;
    isCollecting: boolean;
    stats: {
        total: number;
        latest: Play | null;
        oldest: Play | null;
    };
    toggle: () => void;
  };
}

type Tab = 'paste' | 'image' | 'file';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            active 
                ? 'bg-gray-800 text-white border-b-2 border-amber-500' 
                : 'bg-transparent text-gray-400 hover:bg-gray-700/50 hover:text-white'
        }`}
    >
        {children}
    </button>
);

const DataInputHub: React.FC<DataInputHubProps> = ({ 
    onFileUploaded, 
    onTextPasted, 
    onImageUploaded, 
    isLoading,
    onReset, 
    hasData, 
    onBackup,
    onRestore,
    onRestoreLast,
    lastBackupExists,
    onTrainHolistic,
    trainingStatus,
    isTraining,
    hasCoreAnalysis,
    isAdmin,
    autoCollection,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('paste');
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const handleTextPaste = useCallback(() => {
    if (pastedText.trim()) {
      onTextPasted(pastedText);
      setPastedText(''); // Clear after processing
    }
  }, [pastedText, onTextPasted]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, handler: (file: File) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      handler(file);
    }
    event.target.value = ''; // Reset input to allow same file upload again
  };
  
  return (
    <>
      <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold">Centro de Entrada</h2>
          <p className="text-gray-400 text-sm">Adicione dados e gerencie backups para sua análise.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            {lastBackupExists && (
                <button onClick={onRestoreLast} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg transition-colors flex items-center gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a5 5 0 00-5 5v1h1a1 1 0 011 1v3a1 1 0 01-1 1H5v1a5 5 0 005 5 5 5 0 005-5v-1h-1a1 1 0 01-1-1V8a1 1 0 011-1h1V7a5 5 0 00-5-5zm-3 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" /></svg>
                    Restaurar Último
                </button>
            )}
            
            <button onClick={() => restoreInputRef.current?.click()} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 rounded-lg transition-colors flex items-center gap-2 text-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                Carregar Backup
            </button>
            <input type="file" ref={restoreInputRef} onChange={(e) => handleFileChange(e, onRestore)} accept=".json" className="hidden" />
            
            {hasData && (
                <button onClick={onBackup} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-3 rounded-lg transition-colors flex items-center gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" /></svg>
                    Fazer Backup
                </button>
            )}

            <button onClick={onReset} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg transition-colors flex items-center gap-2 text-sm" title="Limpar todos os dados e recomeçar">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
                {hasData ? 'Limpar Tudo' : 'Recomeçar'}
            </button>
        </div>
      </div>
      
       <div className="bg-gray-800/50 p-4 rounded-xl border border-teal-500/30 mb-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-white">Coleta Automática de Resultados</h3>
                    <p className="text-sm text-gray-400">Mantém seu histórico atualizado com o site da Tipminer.</p>
                </div>
                <label htmlFor="auto-collect-toggle" className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input type="checkbox" id="auto-collect-toggle" className="sr-only" checked={autoCollection.status === 'running'} onChange={autoCollection.toggle} />
                        <div className={`block ${autoCollection.status === 'running' ? 'bg-teal-500' : 'bg-gray-600'} w-14 h-8 rounded-full transition`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${autoCollection.status === 'running' ? 'translate-x-6' : ''}`}></div>
                    </div>
                </label>
            </div>
            {autoCollection.status === 'running' && (
                <div className="mt-3 pt-3 border-t border-gray-700/50 grid grid-cols-1 md:grid-cols-3 gap-2 text-center text-sm">
                    <div>
                        <span className="text-gray-400">Próxima em: </span>
                        <span className="font-bold text-white">{autoCollection.countdown}s</span>
                    </div>
                     <div>
                        <span className="text-gray-400">Última Coleta: </span>
                        <span className="font-bold text-white">{autoCollection.stats.total} jogadas</span>
                    </div>
                    <div>
                         <span className="text-gray-400">Status: </span>
                        <span className={`font-bold ${autoCollection.isCollecting ? 'text-teal-400 animate-pulse' : 'text-gray-300'}`}>{autoCollection.isCollecting ? 'Coletando...' : 'Aguardando'}</span>
                    </div>
                </div>
            )}
             {autoCollection.error && (
                <p className="text-red-400 text-sm mt-2 text-center">{autoCollection.error}</p>
            )}
        </div>


      <div className="bg-gray-900/50 rounded-lg border border-gray-700/50">
            <div className="p-2 border-b border-gray-700/50 flex space-x-1">
                <TabButton active={activeTab === 'paste'} onClick={() => setActiveTab('paste')}>
                    <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" /><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" /></svg>
                        Colar Texto
                    </span>
                </TabButton>
                <TabButton active={activeTab === 'image'} onClick={() => setActiveTab('image')}>
                     <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                        Analisar Print
                    </span>
                </TabButton>
                <TabButton active={activeTab === 'file'} onClick={() => setActiveTab('file')}>
                    <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                        Carregar Planilha
                    </span>
                </TabButton>
            </div>
            <div className="p-6">
                {isLoading ? <LoadingSpinner text="Processando dados..." /> : (
                    <>
                    {activeTab === 'paste' && (
                        <div className="space-y-4">
                            <textarea
                                value={pastedText}
                                onChange={(e) => setPastedText(e.target.value)}
                                rows={5}
                                placeholder="Cole o histórico aqui (ex: 2,15x 14:30:15)"
                                className="w-full bg-gray-700/50 text-white placeholder-gray-400 p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                            <button onClick={handleTextPaste} className="w-full bg-amber-600 hover:bg-amber-700 text-black font-bold py-3 rounded-lg transition-colors">Processar Texto</button>
                        </div>
                    )}
                    {activeTab === 'image' && (
                        <div className="text-center">
                            <button onClick={() => imageInputRef.current?.click()} className="w-full bg-amber-600 hover:bg-amber-700 text-black font-bold py-3 px-6 rounded-lg transition-colors">
                                Selecionar Print
                            </button>
                            <input type="file" ref={imageInputRef} onChange={(e) => handleFileChange(e, onImageUploaded)} accept="image/*" className="hidden" />
                            <p className="text-xs text-gray-500 mt-3">A IA irá extrair os dados da imagem. Uma nova janela se abrirá para você selecionar as áreas de interesse.</p>
                        </div>
                    )}
                    {activeTab === 'file' && (
                        <div className="text-center">
                            <button onClick={() => fileInputRef.current?.click()} className="w-full bg-amber-600 hover:bg-amber-700 text-black font-bold py-3 px-6 rounded-lg transition-colors">
                                Selecionar Planilha
                            </button>
                             <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, onFileUploaded)} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" />
                             <p className="text-xs text-gray-500 mt-3">A planilha deve conter as colunas 'Número', 'Data' e 'Horário'.</p>
                        </div>
                    )}
                    </>
                )}
            </div>
      </div>
      
      {isAdmin && (
        <div className="mt-6">
          <div className="bg-gray-800/50 border border-yellow-500/30 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3m6-7h-2M9 15H6M21 12h-3M9 9h6v6H9V9z" />
                  </svg>
                  Treinamento Holístico da IA (Admin)
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                  Envie planilhas para que a IA aprenda os padrões macro que levam a todos os tipos de resultados. O conhecimento adquirido é usado para refinar as previsões de todos os usuários.
              </p>
              <HolisticTrainer
                onTrain={onTrainHolistic}
                status={trainingStatus}
                isTraining={isTraining}
                hasAnalysis={hasCoreAnalysis}
              />
          </div>
        </div>
      )}
    </>
  );
};

export default DataInputHub;
