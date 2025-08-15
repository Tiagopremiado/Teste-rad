


import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SignalPrediction, SignalOutcome, Signal } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface SignalPredictorProps {
  predictions: SignalPrediction[] | null;
  restOfDayPredictions: SignalPrediction[] | null;
  predictions50x: SignalPrediction[] | null;
  predictionGrandePague: SignalPrediction[] | null;
  predictionVerticalRepeat: SignalPrediction[] | null;
  onFeedback: (predictionId: string, outcome: SignalOutcome) => void;
  isLoadingAll: boolean;
  isEnabled: boolean;
  signalHistory: Signal[];
  alarmHandlers: {
    isMuted: boolean;
    toggleMute: () => void;
  };
}

const SignalCard: React.FC<{ prediction: SignalPrediction; onFeedback: (predictionId: string, outcome: SignalOutcome) => void; hasResponded: boolean; isVerticalRepeat?: boolean; }> = ({ prediction, onFeedback, hasResponded, isVerticalRepeat = false }) => {
    const tempConfig = {
        'Quente': { icon: isVerticalRepeat ? '🎯' : '🔥', color: 'text-pink-400', ring: 'ring-pink-500/50' },
        'Morno': { icon: '💧', color: 'text-purple-400', ring: 'ring-purple-500/50' },
        'Grande Pague': { icon: '💲', color: 'text-yellow-400', ring: 'ring-yellow-500/50' },
    };
    const { icon, color, ring } = tempConfig[prediction.temperature] || tempConfig['Morno'];
    const cardBg = isVerticalRepeat ? 'bg-gradient-to-br from-amber-900/80 to-gray-900' : 'bg-gray-900';

    return (
        <div className={`${cardBg} p-4 rounded-xl shadow-lg border ${isVerticalRepeat ? 'border-amber-600' : 'border-gray-700'} ring-2 ring-transparent transition-all duration-300 hover:${ring} flex flex-col sm:flex-row items-center gap-4`}>
            <div className={`text-4xl ${color} bg-gray-800 p-3 rounded-lg`}>{icon}</div>
            <div className="flex-grow text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-4">
                    <p><span className="text-gray-400 text-sm">Horário:</span> <span className="font-bold text-xl">{prediction.predictedMinute}</span></p>
                    <p><span className="text-gray-400 text-sm">Casa/Alvo:</span> <span className="font-bold text-xl">{prediction.predictedHouse}</span></p>
                    <p><span className="text-gray-400 text-sm">Sinal:</span> <span className={`font-bold text-xl ${color}`}>{prediction.temperature}</span></p>
                </div>
                <p className="text-xs text-gray-500 italic mt-1" title={prediction.reasoning}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    {prediction.reasoning}
                </p>
            </div>
            <div className="flex-shrink-0 flex gap-2">
                <button
                    onClick={() => onFeedback(prediction.id, 'Win')}
                    disabled={hasResponded}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Win
                </button>
                <button
                    onClick={() => onFeedback(prediction.id, 'Loss')}
                    disabled={hasResponded}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Loss
                </button>
            </div>
        </div>
    );
};

const SignalPredictor: React.FC<SignalPredictorProps> = ({ predictions, restOfDayPredictions, predictions50x, predictionGrandePague, predictionVerticalRepeat, onFeedback, isLoadingAll, isEnabled, signalHistory, alarmHandlers }) => {
    
    const respondedPredictionIds = new Set(signalHistory.map(s => s.prediction.id));

    const handleDownloadPdf = (signals: SignalPrediction[], title: string, filename: string) => {
        if (!signals || signals.length === 0) return;

        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 29);

        const tableColumn = ["Horário", "Casa", "Temperatura", "Raciocínio da IA"];
        const tableRows: string[][] = [];

        signals.forEach(p => {
            const predictionData = [
                String(p.predictedMinute || 'N/A'),
                String(p.predictedHouse || 'N/A'),
                String(p.temperature || 'N/A'),
                String(p.reasoning || 'N/A')
            ];
            tableRows.push(predictionData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: '#111827' }, // gray-900
            styles: { font: 'helvetica', fontSize: 10 },
        });
        
        doc.save(filename);
    };

    const renderPredictionList = (
        signalList: SignalPrediction[],
        title: string,
        pdfTitle: string,
        pdfFilename: string,
        listType: 'hourly' | 'daily' | '50x' | 'grandePague' | 'vertical',
        isVerticalRepeat?: boolean,
    ) => {
        if (signalList.length === 0) {
            if (listType === 'vertical') return null; // Don't show a message if there's no vertical repeat signal
            let message = '';
            switch (listType) {
                case 'hourly': message = 'para a próxima hora.'; break;
                case 'daily': message = 'para o resto do dia.'; break;
                case '50x': message = 'para velas 50x+. Tente mais tarde.'; break;
                case 'grandePague': message = 'para o cenário "Grande Pague".'; break;
            }
            return (
                <div className="text-center py-4 border-t border-gray-700/50 mt-4">
                    <p className="text-gray-400">A IA não identificou padrões claros para gerar novos sinais {message}</p>
                </div>
            )
        }

        return (
            <div className="space-y-4 pt-4 border-t border-gray-700/50 mt-6">
                <div className="flex justify-between items-center">
                    <h4 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                        {isVerticalRepeat && '🎯'} {title}
                    </h4>
                    <button 
                        onClick={() => handleDownloadPdf(signalList, pdfTitle, pdfFilename)}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        Baixar PDF
                    </button>
                </div>
                <div className="space-y-3">
                    {signalList.map(p => (
                        <SignalCard 
                            key={p.id} 
                            prediction={p} 
                            onFeedback={onFeedback}
                            hasResponded={respondedPredictionIds.has(p.id)}
                            isVerticalRepeat={isVerticalRepeat}
                        />
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Previsão de Sinal com IA</h3>
                <button
                    onClick={alarmHandlers.toggleMute}
                    disabled={!isEnabled}
                    className="p-3 rounded-full transition-colors text-gray-300 hover:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    title={alarmHandlers.isMuted ? "Ativar som do alarme" : "Silenciar alarme"}
                >
                    {alarmHandlers.isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
             </div>
            
            {isLoadingAll ? (
                <LoadingSpinner text="A IA está analisando os dados para gerar os sinais..." />
            ) : !isEnabled ? (
                 <p className="text-gray-400 text-center text-sm py-4">Execute a Análise Completa para habilitar a geração de sinais.</p>
            ) : (
                <div className="space-y-6">
                    {predictionVerticalRepeat && renderPredictionList(
                        predictionVerticalRepeat,
                        "Sinal de Repetição Vertical",
                        "Relatório de Sinais (Repetição Vertical) - Radar Aviator",
                        "relatorio_sinais_vertical.pdf",
                        "vertical",
                        true
                    )}
                    {predictionGrandePague && renderPredictionList(
                        predictionGrandePague, 
                        "Sinais da IA para Grande Pague 💲", 
                        "Relatório de Sinais (Grande Pague) - Radar Aviator", 
                        "relatorio_sinais_grande_pague.pdf",
                        "grandePague"
                    )}
                    {predictions50x && renderPredictionList(
                        predictions50x, 
                        "Sinais da IA para 50x+", 
                        "Relatório de Sinais (50x+) - Radar Aviator", 
                        "relatorio_sinais_50x.pdf",
                        "50x"
                    )}
                    {predictions && renderPredictionList(
                        predictions, 
                        "Sinais da IA para a Próxima Hora", 
                        "Relatório de Sinais (Próxima Hora) - Radar Aviator", 
                        "relatorio_sinais_hora.pdf",
                        "hourly"
                    )}
                    {restOfDayPredictions && renderPredictionList(
                        restOfDayPredictions,
                        "Sinais da IA para o Restante do Dia",
                        "Relatório de Sinais (Resto do Dia) - Radar Aviator",
                        "relatorio_sinais_dia.pdf",
                        "daily"
                    )}
                </div>
            )}
        </div>
    );
};

export default SignalPredictor;