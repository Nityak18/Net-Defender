import React from 'react';
import { AlertCircle, ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

const AlertsCenter = ({ alerts, setAlerts }) => {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'text-accentDanger border-accentDanger bg-accentDanger/10';
      case 'HIGH': return 'text-orange-500 border-orange-500/50 bg-orange-500/10';
      case 'MEDIUM': return 'text-accentWarning border-accentWarning/50 bg-accentWarning/10';
      default: return 'text-blue-400 border-blue-400/50 bg-blue-400/10';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL': return <ShieldAlert size={20} />;
      case 'HIGH': return <AlertOctagon size={20} />;
      case 'MEDIUM': return <AlertTriangle size={20} />;
      default: return <Info size={20} />;
    }
  };
  
  // Note: Replacing missing AlertOctagon with ShieldAlert for HIGH to avoid undefined import. Actually I'll use AlertCircle
  const AlertOctagon = AlertCircle;

  const handleAcknowledge = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
  };

  const handleResolve = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
  };

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'resolved').length;
  const newCount = alerts.filter(a => a.status === 'new').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-800/80 pb-4">
        <div className="h-8 w-2 bg-accentPrimary rounded-full cyber-glow" />
        <h2 className="text-2xl font-bold font-display uppercase tracking-wider text-white">Alerts Center</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-4 rounded border border-gray-800 flex justify-between items-center">
          <div>
            <div className="text-gray-400 font-mono text-xs uppercase">Total Active Alerts</div>
            <div className="text-3xl font-display font-bold mt-1 text-white">{alerts.filter(a => a.status !== 'resolved').length}</div>
          </div>
          <AlertCircle size={32} className="text-gray-600" />
        </div>
        <div className="glass-panel p-4 rounded border border-accentDanger/50 flex justify-between items-center cyber-glow-danger">
          <div>
            <div className="text-accentDanger font-mono text-xs uppercase">Critical Threats</div>
            <div className="text-3xl font-display font-bold mt-1 text-accentDanger">{criticalCount}</div>
          </div>
          <ShieldAlert size={32} className="text-accentDanger" />
        </div>
        <div className="glass-panel p-4 rounded border border-accentPrimary/30 flex justify-between items-center">
          <div>
            <div className="text-accentPrimary font-mono text-xs uppercase">Resolved Today</div>
            <div className="text-3xl font-display font-bold mt-1 text-accentPrimary">{alerts.filter(a => a.status === 'resolved').length}</div>
          </div>
          <CheckCircle2 size={32} className="text-accentPrimary" />
        </div>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="glass-panel p-12 rounded border border-gray-800 flex flex-col items-center justify-center text-gray-500 font-mono">
            <ShieldCheck size={48} className="mb-4 text-accentPrimary opacity-50" />
            <p>No alerts detected.</p>
            <p className="text-xs mt-2">System is operating normally.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div 
              key={alert.id}
              className={`glass-panel p-4 rounded border flex flex-col md:flex-row gap-4 justify-between items-start md:items-center transition-all ${getSeverityColor(alert.severity)} ${alert.status === 'resolved' ? 'opacity-50 grayscale' : ''}`}
            >
              <div className="flex gap-4 items-start">
                <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold font-display tracking-wider">{alert.attackType}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border bg-black/40 font-mono">CONF: {alert.confidence}%</span>
                    {alert.status === 'new' && (
                      <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">NEW</span>
                    )}
                  </div>
                  <div className="font-mono text-xs opacity-80 grid gap-1">
                    <div><span className="text-black/50 dark:text-white/40">TIME:</span> {alert.timestamp}</div>
                    <div><span className="text-black/50 dark:text-white/40">SRC:</span> {alert.srcIP} &rarr; <span className="text-black/50 dark:text-white/40">DST:</span> {alert.dstIP}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                {alert.status !== 'resolved' && (
                  <>
                    {alert.status === 'new' && (
                      <button 
                        onClick={() => handleAcknowledge(alert.id)}
                        className="flex-1 md:flex-none px-4 py-2 bg-black/40 border hover:bg-black/60 rounded text-xs font-mono font-bold transition-colors"
                      >
                        ACKNOWLEDGE
                      </button>
                    )}
                    <button 
                      onClick={() => handleResolve(alert.id)}
                      className="flex-1 md:flex-none px-4 py-2 bg-accentPrimary text-black border border-accentPrimary hover:bg-accentPrimary/90 rounded text-xs font-mono font-bold transition-colors"
                    >
                      RESOLVE
                    </button>
                  </>
                )}
                {alert.status === 'resolved' && (
                  <span className="px-4 py-2 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 size={14} /> Resolved
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Add ShieldCheck icon since it's used in empty state
import { ShieldCheck } from 'lucide-react';

export default AlertsCenter;
