import React from 'react';
import type { AdminNotificationSettings } from '../types';

interface AdminNotificationSettingsProps {
  settings: AdminNotificationSettings;
  onSettingsChange: (newSettings: AdminNotificationSettings) => void;
}

const Toggle: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="bg-gray-800/50 p-4 rounded-lg flex justify-between items-center">
    <div>
      <h4 className="font-semibold text-white">{label}</h4>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
    <label htmlFor={`toggle-${label}`} className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          id={`toggle-${label}`}
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`block ${checked ? 'bg-lime-500' : 'bg-gray-600'} w-14 h-8 rounded-full transition`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${checked ? 'translate-x-6' : ''}`}></div>
      </div>
    </label>
  </div>
);

const AdminNotificationSettings: React.FC<AdminNotificationSettingsProps> = ({ settings, onSettingsChange }) => {

  const handleToggle = (key: keyof AdminNotificationSettings) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Configurações de Notificação</h2>
      <p className="text-gray-400 mb-6">
        Escolha quais tipos de notificações automáticas você deseja receber no sino de alertas.
      </p>
      <div className="space-y-4 max-w-2xl mx-auto">
        <Toggle
          label="Novos Usuários"
          description="Receber alerta quando um novo usuário se cadastrar e aguardar aprovação."
          checked={settings.newUser}
          onChange={() => handleToggle('newUser')}
        />
        <Toggle
          label="Planos Expirando"
          description="Receber alerta para planos premium que expiram nos próximos 3 dias."
          checked={settings.expiringPlans}
          onChange={() => handleToggle('expiringPlans')}
        />
        <Toggle
          label="Novas Publicações"
          description="Receber alerta sempre que uma nova postagem for criada na 'Resenha'."
          checked={settings.newPost}
          onChange={() => handleToggle('newPost')}
        />
        <Toggle
          label="Novas Sugestões"
          description="Receber alerta quando um membro da comunidade enviar uma nova sugestão."
          checked={settings.newSuggestion}
          onChange={() => handleToggle('newSuggestion')}
        />
      </div>
    </div>
  );
};

export default AdminNotificationSettings;
