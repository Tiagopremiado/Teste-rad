import React from 'react';
import type { AuditLogEntry } from '../types';

interface AuditLogProps {
  log: AuditLogEntry[];
}

const AuditLog: React.FC<AuditLogProps> = ({ log }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-4">Log de Auditoria</h2>
      <div className="bg-gray-800/50 rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-black/20">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">Horário</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">Admin</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">Ação</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-lime-300 uppercase tracking-wider">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {log.map(entry => (
              <tr key={entry.id} className="hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(entry.timestamp).toLocaleString('pt-BR')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{entry.adminName}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-lime-900/50 text-lime-300">
                        {entry.action}
                    </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">{entry.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {log.length === 0 && <p className="text-center text-gray-500 py-8">Nenhuma ação administrativa registrada ainda.</p>}
      </div>
    </div>
  );
};

export default AuditLog;