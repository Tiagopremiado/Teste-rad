

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { TrainingStatus } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface HolisticTrainerProps {
  onTrain: (file: File) => void;
  status: TrainingStatus | null;
  isTraining: boolean;
  hasAnalysis: boolean;
}

const HolisticTrainer: React.FC<HolisticTrainerProps> = ({ onTrain, status, isTraining, hasAnalysis }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleTrain = useCallback(() => {
    if (selectedFile) {
      onTrain(selectedFile);
    }
  }, [selectedFile, onTrain]);
  
  useEffect(() => {
    // Clear selection after a successful multi-chunk process is fully complete
    if (status?.isComplete) {
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [status]);
  
  const progressPercentage = status && status.totalCount > 0
    ? (status.processedCount / status.totalCount) * 100
    : 0;

  return (
    <div className="space-y-4">
        {status && (
            <div className={`text-left bg-gray-900/50 p-4 rounded-md border-l-4 ${status.error ? 'border-red-500' : 'border-teal-500'} animate-fade-in`}>
                 <p className={`font-bold mb-2 ${status.error ? 'text-red-300' : 'text-teal-300'}`}>{status.message}</p>
                 {status.error && <p className="text-sm text-red-200">{status.error}</p>}
                 
                 {!status.error && status.totalCount > 0 && (
                     <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{status.fileName}</span>
                            <span>{status.processedCount.toLocaleString('pt-BR')} / {status.totalCount.toLocaleString('pt-BR')}</span>
                        </div>
                         <div className="w-full bg-gray-700 rounded-full h-1.5">
                             <div 
                                className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercentage}%`}}
                             />
                         </div>
                     </div>
                 )}
            </div>
        )}
        
        <div className="flex flex-col items-center justify-center gap-4 pt-4">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
            />
             <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isTraining}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md disabled:opacity-50"
            >
                {selectedFile ? `Arquivo: ${selectedFile.name}` : 'Selecionar Planilha...'}
            </button>
            
            <button
                onClick={handleTrain}
                disabled={isTraining || !selectedFile}
                className="w-full max-w-md bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg disabled:bg-yellow-800/50 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                 {isTraining ? (
                    <>
                        <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div>
                        Treinando IA...
                    </>
                 ): 'Iniciar/Continuar Treinamento'}
            </button>
        </div>
        
        {!hasAnalysis && !isTraining && <p className="text-xs text-gray-500 mt-2 text-center">É necessário ter uma análise de resumo para visualizar o impacto do treinamento.</p>}
    </div>
  );
};

export default HolisticTrainer;