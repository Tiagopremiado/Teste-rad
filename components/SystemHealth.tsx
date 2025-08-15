import React, { useState, useEffect } from 'react';

const initialApiUsage = [
    { name: 'Summary', usage: 75, limit: 1000 },
    { name: 'Prediction', usage: 120, limit: 500 },
    { name: 'Strategy', usage: 45, limit: 500 },
    { name: 'Moderation', usage: 250, limit: 2000 },
];

const initialErrorLog = [
    { time: new Date(Date.now() - 1000 * 60 * 2).toISOString(), level: 'WARN', message: 'API key rotation triggered due to rate limit on key #1.' },
    { time: new Date(Date.now() - 1000 * 60 * 15).toISOString(), level: 'ERROR', message: 'Failed to parse JSON from prediction model. Fallback triggered.' },
    { time: new Date(Date.now() - 1000 * 60 * 62).toISOString(), level: 'INFO', message: 'User "ReiDoPink" session started.' },
];

const mockLogMessages = [
    { level: 'INFO', message: 'Auto-collection successful. 5 new plays added.' },
    { level: 'INFO', message: 'User "Estrategista" created a new post.' },
    { level: 'WARN', message: 'High latency detected on image analysis endpoint (> 3s).' },
    { level: 'INFO', message: 'AI Co-Pilot session started.' },
    { level: 'ERROR', message: 'Failed to fetch remote data from source. Retrying.' },
    { level: 'INFO', 'message': 'Backup created successfully.'},
];


const SystemHealth: React.FC = () => {
    const [apiUsage, setApiUsage] = useState(initialApiUsage);
    const [errorLog, setErrorLog] = useState(initialErrorLog);

    useEffect(() => {
        const usageInterval = setInterval(() => {
            setApiUsage(prevUsage => prevUsage.map(api => ({
                ...api,
                usage: Math.min(api.limit, api.usage + Math.floor(Math.random() * 5))
            })));
        }, 5000); // Update every 5 seconds

        const logInterval = setInterval(() => {
            setErrorLog(prevLog => {
                const newLogEntry = {
                    time: new Date().toISOString(),
                    ...mockLogMessages[Math.floor(Math.random() * mockLogMessages.length)]
                };
                return [newLogEntry, ...prevLog].slice(0, 50); // Keep last 50 entries
            });
        }, 8000); // Add a new log every 8 seconds

        return () => {
            clearInterval(usageInterval);
            clearInterval(logInterval);
        };
    }, []);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Saúde do Sistema</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* API Usage */}
                <div className="bg-gray-800/50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold mb-4">Uso da API Gemini (Ao Vivo)</h3>
                    <div className="space-y-4">
                        {apiUsage.map(api => {
                            const percentage = (api.usage / api.limit) * 100;
                            let barColor = 'bg-green-500';
                            if (percentage > 85) barColor = 'bg-red-500';
                            else if (percentage > 60) barColor = 'bg-yellow-500';

                            return (
                                <div key={api.name}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-semibold text-white">{api.name}</span>
                                        <span className="text-sm text-gray-400">{api.usage} / {api.limit} chamadas</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                                        <div className={`${barColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* Error Log */}
                <div className="bg-gray-800/50 p-6 rounded-lg">
                    <h3 className="text-lg font-bold mb-4">Log de Eventos do Sistema</h3>
                    <div className="bg-black/50 h-64 rounded-md p-3 overflow-y-auto font-mono text-xs space-y-2">
                        {errorLog.map((log, index) => {
                            let levelColor = 'text-gray-400';
                            if (log.level === 'ERROR') levelColor = 'text-red-400';
                            else if (log.level === 'WARN') levelColor = 'text-yellow-400';
                            else if (log.level === 'INFO') levelColor = 'text-cyan-400';
                            
                            return (
                                <p key={index}>
                                    <span className="text-gray-500">{new Date(log.time).toLocaleTimeString('pt-BR')} - </span>
                                    <span className={`font-bold ${levelColor}`}>[{log.level}]</span>
                                    <span className="text-gray-300 ml-2">{log.message}</span>
                                </p>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemHealth;