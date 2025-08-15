import React, { useState, useMemo } from 'react';
import type { AdminNotification } from '../types';

interface AdminNotificationBellProps {
  notifications: AdminNotification[];
  onNotificationClick: (notification: AdminNotification) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

const timeAgo = (date: string): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}a`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}m`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}min`;
    return `${Math.floor(seconds)}s`;
};

const NotificationIcon: React.FC<{ type: AdminNotification['type'] }> = ({ type }) => {
    const iconMap = {
        new_user: { icon: '👤', color: 'bg-green-500/20 text-green-300' },
        expiring_plan: { icon: '⏳', color: 'bg-yellow-500/20 text-yellow-300' },
        new_post: { icon: '📝', color: 'bg-blue-500/20 text-blue-300' },
        new_suggestion: { icon: '💡', color: 'bg-purple-500/20 text-purple-300' },
    };
    const { icon, color } = iconMap[type] || { icon: '🔔', color: 'bg-gray-500/20 text-gray-300' };
    return <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-lg ${color}`}>{icon}</div>;
}

const AdminNotificationBell: React.FC<AdminNotificationBellProps> = ({ notifications, onNotificationClick, onMarkAllRead, onClearAll }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const handleToggle = () => setIsOpen(prev => !prev);

  const handleNotificationClick = (e: React.MouseEvent, notification: AdminNotification) => {
    e.stopPropagation();
    onNotificationClick(notification);
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <button onClick={handleToggle} className="relative p-2 rounded-full text-gray-300 hover:bg-gray-700 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 rounded-full ring-2 ring-gray-900 bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 rounded-lg shadow-2xl border border-gray-700/50 z-50 flex flex-col max-h-[60vh]">
          <div className="p-3 flex justify-between items-center border-b border-gray-700/50">
            <h3 className="font-bold text-white">Notificações</h3>
            {notifications.length > 0 && (
                <div className="flex gap-2">
                    <button onClick={onMarkAllRead} className="text-xs text-indigo-400 hover:underline">Marcar como lidas</button>
                    <button onClick={onClearAll} className="text-xs text-red-400 hover:underline">Limpar</button>
                </div>
            )}
          </div>
          <div className="flex-grow overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-3 flex items-start gap-3 transition-colors cursor-pointer ${notification.read ? 'opacity-60 hover:bg-gray-800' : 'bg-gray-800/50 hover:bg-gray-700'}`}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleNotificationClick(e, notification)}
                >
                  <NotificationIcon type={notification.type} />
                  <div className="flex-grow">
                    <p className="text-sm text-gray-200">{notification.message}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-500">{timeAgo(notification.timestamp)}</p>
                    {!notification.read && <div className="mt-1 w-2 h-2 bg-blue-500 rounded-full mx-auto"></div>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 text-sm p-8">Nenhuma notificação ainda.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;
