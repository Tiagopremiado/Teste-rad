import React from 'react';
import type { Notification } from '../types';

interface NotificationModalProps {
  notification: Notification | null;
  onClose: () => void;
}

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    const iconMap = {
        pattern: { icon: '📈', color: 'bg-teal-500/20 text-teal-300' },
        signal: { icon: '🎯', color: 'bg-indigo-500/20 text-indigo-300' },
        hot_minute: { icon: '🔥', color: 'bg-pink-500/20 text-pink-300' },
        info: { icon: 'ℹ️', color: 'bg-blue-500/20 text-blue-300' },
    };
    const { icon, color } = iconMap[type] || iconMap.info;
    return <div className={`w-16 h-16 rounded-full flex items-center justify-center text-5xl ${color}`}>{icon}</div>;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ notification, onClose }) => {
  if (!notification) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-950 border-2 border-amber-500/50 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-fade-in-up relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="mx-auto mb-4">
            <NotificationIcon type={notification.type} />
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          {notification.title}
        </h2>

        <p className="text-gray-300 mb-6">
          {notification.message}
        </p>

        <p className="text-xs text-gray-500 mb-6">
          Recebido em: {new Date(notification.timestamp).toLocaleString('pt-BR')}
        </p>

        <button
          onClick={onClose}
          className="w-full bg-amber-600 hover:bg-amber-700 text-black font-bold py-3 rounded-lg transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default NotificationModal;
