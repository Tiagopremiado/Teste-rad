import React, { useState } from 'react';
import type { User, CommunityHighlight } from '../types';

interface ManageHighlightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentHighlights: CommunityHighlight[];
  onSave: (newHighlights: CommunityHighlight[]) => void;
}

const ManageHighlightsModal: React.FC<ManageHighlightsModalProps> = ({ isOpen, onClose, users, currentHighlights, onSave }) => {
  const [legendId, setLegendId] = useState<string | null>(currentHighlights.find(h => h.type === 'legend')?.userId || null);
  const [topProfileId, setTopProfileId] = useState<string | null>(currentHighlights.find(h => h.type === 'top_profile')?.userId || null);
  
  if (!isOpen) return null;

  const handleSave = () => {
    onSave([
      { type: 'legend', userId: legendId },
      { type: 'top_profile', userId: topProfileId },
    ]);
  };

  const UserSelect: React.FC<{
    label: string;
    value: string | null;
    onChange: (value: string | null) => void;
  }> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            className="w-full bg-gray-800 text-white p-2 rounded-lg border-2 border-gray-700 focus:ring-lime-400 focus:border-lime-400"
        >
            <option value="">Ninguém</option>
            {users.map(user => (
                <option key={user.id} value={user.id}>{user.display_name}</option>
            ))}
        </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-lime-500/50 rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-lime-500/30">
          <h2 className="text-xl font-bold text-lime-300">Gerenciar Destaques da Comunidade</h2>
        </div>
        <div className="p-6 space-y-4">
            <UserSelect label="👑 Lenda da Semana" value={legendId} onChange={setLegendId} />
            <UserSelect label="🚀 Perfil em Alta" value={topProfileId} onChange={setTopProfileId} />
        </div>
        <div className="p-4 flex justify-end gap-3 bg-black/20 rounded-b-2xl">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
          <button onClick={handleSave} className="bg-lime-500 hover:bg-lime-400 text-black font-bold py-2 px-4 rounded-lg">Salvar Destaques</button>
        </div>
      </div>
    </div>
  );
};

export default ManageHighlightsModal;