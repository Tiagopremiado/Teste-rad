import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onClear: () => void;
  onDismiss: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onClear, onDismiss }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex justify-center items-center z-40 p-4">
        <div className="relative max-w-md w-full bg-red-900/50 border border-red-700 text-red-200 px-6 py-8 rounded-lg text-center shadow-2xl">
            <button
              onClick={onDismiss}
              className="absolute top-2 right-2 text-red-300/50 hover:text-white text-2xl"
              aria-label="Fechar erro"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-white mb-4">Ocorreu um Erro</h2>
            <p className="mb-6">{message}</p>
            <button
                onClick={onClear}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                title="Isto irá limpar todos os dados e recomeçar."
            >
                Limpar Tudo e Tentar Novamente
            </button>
        </div>
    </div>
  );
};

export default ErrorDisplay;
