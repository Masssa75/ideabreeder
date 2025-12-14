'use client';

import { useEffect, useRef } from 'react';

interface ActivityLogProps {
  logs: string[];
}

export default function ActivityLog({ logs }: ActivityLogProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass rounded-xl p-4">
      <h2 className="text-lg font-semibold text-white/90 mb-3">Activity Log</h2>
      <div
        ref={logRef}
        className="h-[200px] overflow-y-auto font-mono text-xs space-y-1 pr-2"
      >
        {logs.length === 0 ? (
          <p className="text-white/30">Waiting for evolution to start...</p>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className="text-white/60 py-0.5 border-b border-white/5"
            >
              <span className="text-white/30 mr-2">
                {new Date().toLocaleTimeString()}
              </span>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
