import React, { useEffect, useState } from 'react';
import type { Notification } from '../types';

interface ToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const ToastIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    const iconMap = {
        pattern: { icon: '📈', color: 'bg-teal-500/20 text-teal-300' },
        signal: { icon: '🎯', color: 'bg-indigo-500/20 text-indigo-300' },
        hot_minute: { icon: '🔥', color: 'bg-pink-500/20 text-pink-300' },
        info: { icon: 'ℹ️', color: 'bg-blue-500/20 text-blue-300' },
    };
    const { icon } = iconMap[type] || iconMap.info;
    return <span className="text-2xl">{icon}</span>;
}

const Toast: React.FC<ToastProps> = ({ notification, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            const exitTimer = setTimeout(() => onDismiss(notification.id), 400); // match animation duration
            return () => clearTimeout(exitTimer);
        }, 5000);

        return () => clearTimeout(timer);
    }, [notification.id, onDismiss]);
    
    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(notification.id), 400);
    };

    return (
        <div 
            className={`w-full max-w-sm bg-gray-800/80 backdrop-blur-md shadow-lg rounded-xl pointer-events-auto ring-1 ring-lime-500/30 overflow-hidden transition-all duration-300 ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}`}
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        <ToastIcon type={notification.type} />
                    </div>
                    <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-white">
                            {notification.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-400">
                            {notification.message}
                        </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={handleDismiss}
                            className="inline-flex text-gray-400 rounded-md hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-lime-500"
                        >
                            <span className="sr-only">Close</span>
                             <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Toast;
