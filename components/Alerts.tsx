
import React from 'react';

const AlertDisplay: React.FC<{ alerts: string[] }> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="bg-yellow-900/40 border border-yellow-700 rounded-lg p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.636-1.026 2.251-1.026 2.887 0l7.265 11.72c.636 1.026-.183 2.331-1.443 2.331H2.435c-1.26 0-2.079-1.305-1.443-2.331L8.257 3.099zM10 12a1 1 0 110-2 1 1 0 010 2zm0-4a1 1 0 01-1-1V5a1 1 0 112 0v2a1 1 0 01-1 1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-300">Alertas Inteligentes</h3>
          <div className="mt-2 text-sm text-yellow-200">
            <ul className="list-disc pl-5 space-y-1">
              {alerts.map((alert, index) => (
                <li key={index}>{alert}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDisplay;