import React, { useState } from 'react';
import type { User } from '../types';

interface SelectWinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSave: (winnerId: string) => void;
}

const SelectWinnerModal: React.FC<SelectWinnerModalProps> = ({ isOpen, onClose, users, onSave }) => {
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
  
  if (!isOpen) return null;

  const handleSave = () => {
    if (selectedWinnerId) {
        onSave(selectedWinnerId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-amber-500/50 rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-amber-500/30">
          <h2 className="text-xl font-bold text-amber-300">🏆 Escolher Vencedor do Desafio</h2>
        </div>
        <div className="p-6 space-y-4">
            <label htmlFor="winnerSelect" className="block text-sm font-medium text-gray-300 mb-1">Selecione o vencedor da semana passada:</label>
            <select
                id="winnerSelect"
                value={selectedWinnerId}
                onChange={(e) => setSelectedWinnerId(e.target.value)}
                className="w-full bg-gray-800 text-white p-2 rounded-lg border-2 border-gray-700 focus:ring-amber-400 focus:border-amber-400"
            >
                <option value="">Selecione um usuário...</option>
                {users.map(user => (
                    <option key={user.id} value={user.id}>{user.display_name}</option>
                ))}
            </select>
        </div>
        <div className="p-4 flex justify-end gap-3 bg-black/20 rounded-b-2xl">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
          <button onClick={handleSave} disabled={!selectedWinnerId} className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-4 rounded-lg disabled:opacity-50">Salvar Vencedor</button>
        </div>
      </div>
    </div>
  );
};

export default SelectWinnerModal;