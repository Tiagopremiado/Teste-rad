import React from 'react';
import type { ImportFeedback } from '../types';

interface KnowledgeImportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: ImportFeedback | null;
}

const KnowledgeImportReportModal: React.FC<KnowledgeImportReportModalProps> = ({ isOpen, onClose, feedback }) => {
  if (!isOpen || !feedback) return null;

  const { newPatternsCount, totalPatternsCount, delta } = feedback;

  const deltaItems = [
    { label: 'Gatilhos de Alto Valor', value: delta.highValueTriggers, color: 'text-pink-400' },
    { label: 'Padrões de Sequência', value: delta.streakPatterns, color: 'text-purple-400' },
    { label: 'Padrões de Horário', value: delta.timeBasedPatterns, color: 'text-cyan-400' },
    { label: 'Observações Gerais', value: delta.generalObservations, color: 'text-green-400' },
  ].filter(item => item.value > 0);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 border-2 border-teal-500 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
             <span className="text-3xl">🧠</span>
            Conhecimento da IA Atualizado!
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
            <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                <p className="text-lg text-gray-300">A importação foi um sucesso. A base de conhecimento da IA foi expandida.</p>
                <div className="mt-4 text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-400">
                    +{newPatternsCount}
                </div>
                <p className="font-semibold text-gray-400">Novos Padrões Aprendidos</p>
            </div>
            
            {deltaItems.length > 0 && (
                <div>
                    <h3 className="text-center font-semibold text-gray-300 mb-3">Detalhes da Atualização:</h3>
                    <div className="space-y-2">
                        {deltaItems.map(item => (
                            <div key={item.label} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                                <span className={`font-medium ${item.color}`}>{item.label}</span>
                                <span className="font-bold text-lg text-white">+{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-700 text-center">
                 <p className="text-sm text-gray-400 uppercase tracking-wider">Total de Padrões na IA</p>
                <p className="font-bold text-4xl text-amber-300">{totalPatternsCount}</p>
            </div>
        </div>

        <div className="p-4 border-t border-gray-700 text-right flex-shrink-0">
            <button
                onClick={onClose}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-5 rounded-lg transition-colors"
            >
                Entendido!
            </button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeImportReportModal;
