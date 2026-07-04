import React, { useState, useEffect, useRef } from 'react';
import { Network, Pause, Play, AlertOctagon, ShieldAlert, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LiveMonitor = ({ onAlertGenerated }) => {
  const [packets, setPackets] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState('all'); 
  const [attackRate, setAttackRate] = useState(0);
  const [statusInfo, setStatusInfo] = useState({
    active: false,
    error: 'Checking sniffer status...',
    is_admin: false,
    npcap_installed: false,
    scapy_installed: false
  });
  const tableRef = useRef(null);

  // Check sniffer status periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('nids_token');
        const res = await fetch('http://127.0.0.1:5000/api/sniffer_status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setStatusInfo(data);
        } else {
          setStatusInfo(prev => ({ ...prev, error: 'Could not fetch status from backend API' }));
        }
      } catch (err) {
        console.error("Failed to check sniffer status", err);
        setStatusInfo(prev => ({ ...prev, error: 'Backend server is offline or unreachable' }));
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // SSE Stream
  useEffect(() => {
    if (isPaused) return;

    const token = localStorage.getItem('nids_token');
    const eventSource = new EventSource(`http://127.0.0.1:5000/api/live_stream?token=${token}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newPacket = {
          id: `pkt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          timestamp: new Date().toLocaleTimeString(),
          ...data
        };

        setPackets(prev => {
          const updated = [...prev, newPacket].slice(-50); 
          
          const last10 = updated.slice(-10);
          const attacks = last10.filter(p => p.prediction === 'ATTACK').length;
          const currentRate = (attacks / Math.max(1, last10.length)) * 100;
          setAttackRate(currentRate);
          
          if (currentRate >= 30 && newPacket.prediction === 'ATTACK') {
            onAlertGenerated({
              id: `alert-auto-${newPacket.id}`,
              timestamp: newPacket.timestamp,
              severity: parseFloat(newPacket.confidence) > 90 ? 'CRITICAL' : 'HIGH',
              attackType: newPacket.attackType,
              srcIP: newPacket.srcIP,
              dstIP: newPacket.dstIP,
              confidence: newPacket.confidence,
              status: 'new'
            });
          }
          
          return updated;
        });
      } catch (err) {
        console.error("SSE parsing error", err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE stream error", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [isPaused, onAlertGenerated]);

  useEffect(() => {
    if (tableRef.current && !isPaused) {
      tableRef.current.scrollTop = tableRef.current.scrollHeight;
    }
  }, [packets, isPaused]);

  const filteredPackets = packets.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'normal' && p.prediction === 'NORMAL') return true;
    if (filter === 'attack' && p.prediction === 'ATTACK') return true;
    return false;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 flex flex-col h-[calc(100vh-140px)]"
    >
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-2 bg-accentPrimary rounded-full cyber-glow" />
          <div>
            <h2 className="text-2xl font-bold font-display uppercase tracking-wider text-white flex items-center gap-3">
              Live Network Monitor
              {statusInfo?.active ? (
                <span className="text-[10px] bg-accentPrimary/10 text-accentPrimary border border-accentPrimary/30 px-2 py-0.5 rounded font-mono flex items-center gap-1.5 normal-case">
                  <CheckCircle size={10} /> Sniffer Active
                </span>
              ) : (
                <span className="text-[10px] bg-accentDanger/10 text-accentDanger border border-accentDanger/30 px-2 py-0.5 rounded font-mono flex items-center gap-1.5 normal-case animate-pulse">
                  <AlertOctagon size={10} /> Sniffer Inactive
                </span>
              )}
            </h2>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-2 p-1 bg-black/40 rounded-lg border border-gray-800 backdrop-blur-md">
            {['all', 'normal', 'attack'].map(f => (
              <motion.button 
                key={f}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-xs font-mono rounded-md uppercase tracking-wider transition-all duration-300
                  ${filter === f 
                    ? f === 'attack' ? 'bg-accentDanger/20 text-accentDanger cyber-glow-danger border border-accentDanger/50' 
                                     : 'bg-accentPrimary/20 text-accentPrimary cyber-glow border border-accentPrimary/50' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'}`}
              >
                {f}
              </motion.button>
            ))}
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-2 px-5 py-2 text-xs font-bold font-mono uppercase tracking-wider rounded-lg border transition-all duration-300 backdrop-blur-md
              ${isPaused ? 'border-accentWarning text-accentWarning bg-accentWarning/10 shadow-[0_0_15px_rgba(255,170,0,0.2)]' : 'border-accentPrimary text-accentPrimary bg-accentPrimary/5 hover:bg-accentPrimary/20 shadow-[0_0_15px_rgba(0,200,150,0.2)]'}`}
          >
            {isPaused ? <><Play size={14} /> Resume</> : <><Pause size={14} /> Pause Stream</>}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {statusInfo && !statusInfo.active && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-accentDanger/10 backdrop-blur-md border border-accentDanger/30 p-4 rounded-lg flex items-start gap-4 text-accentDanger shadow-[0_0_20px_rgba(255,59,92,0.15)] shrink-0"
          >
            <ShieldAlert size={28} className="mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-bold tracking-wider font-display text-sm">HARDWARE PACKET SNIFFER OFFLINE</h4>
              <p className="text-xs font-mono opacity-90 leading-relaxed">
                {statusInfo.error || "The real-time network sniffer is currently disabled."}
              </p>
              <div className="pt-2 flex flex-wrap gap-x-6 gap-y-1 text-[10px] font-mono">
                <span>Admin Rights: <strong className={statusInfo.is_admin ? "text-accentPrimary" : "text-accentDanger"}>{statusInfo.is_admin ? "YES" : "NO (REQUIRED)"}</strong></span>
                <span>Npcap Installed: <strong className={statusInfo.npcap_installed ? "text-accentPrimary" : "text-accentDanger"}>{statusInfo.npcap_installed ? "YES" : "NO (REQUIRED)"}</strong></span>
                <span>Scapy Installed: <strong className={statusInfo.scapy_installed ? "text-accentPrimary" : "text-accentDanger"}>{statusInfo.scapy_installed ? "YES" : "NO (REQUIRED)"}</strong></span>
              </div>
            </div>
          </motion.div>
        )}

        {attackRate >= 30 && statusInfo?.active && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-accentDanger/10 backdrop-blur-md border border-accentDanger p-4 rounded-lg flex items-center gap-4 text-accentDanger shadow-[0_0_20px_rgba(255,59,92,0.2)] shrink-0"
          >
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
              <AlertOctagon size={28} />
            </motion.div>
            <div>
              <h4 className="font-bold tracking-wider font-display">CRITICAL ALERT: HIGH INCIDENT RATE DETECTED</h4>
              <p className="text-sm font-mono opacity-80">Attack density in recent 10 packets is {attackRate.toFixed(1)}% - Automatic mitigation protocols recommended.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 glass-panel rounded-xl border border-gray-800/80 overflow-hidden flex flex-col relative bg-black/30 backdrop-blur-lg">
        <div className="grid grid-cols-8 gap-4 p-4 border-b border-gray-800 bg-black/60 font-mono text-xs uppercase tracking-wider text-gray-500 font-bold shrink-0">
          <div>Time</div>
          <div className="col-span-2">Source IP</div>
          <div>Protocol</div>
          <div>Size</div>
          <div>Prediction</div>
          <div className="col-span-2">API Confidence</div>
        </div>
        
        <div 
          ref={tableRef}
          className="flex-1 overflow-y-auto p-2 space-y-2 scroll-smooth"
        >
          {filteredPackets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 font-mono p-8 text-center">
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Network size={32} className="mb-2 opacity-50 mx-auto" />
              </motion.div>
              <p className="text-sm font-medium">Awaiting API inferences from Python Backend...</p>
              {statusInfo && !statusInfo.active && (
                <p className="text-xs text-accentDanger mt-2 font-mono">
                  Diagnostics: Please check status indicators above to troubleshoot offline sniffer.
                </p>
              )}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filteredPackets.map((packet) => (
                <motion.div 
                  key={packet.id} 
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  layout
                  className={`grid grid-cols-8 gap-4 p-3 rounded-lg font-mono text-sm items-center transition-all duration-300
                    ${packet.prediction === 'ATTACK' ? 'bg-accentDanger/10 border border-accentDanger/40 text-red-100 shadow-[0_0_10px_rgba(255,59,92,0.1)]' : 'bg-black/40 border border-gray-800/50 text-gray-300 hover:bg-white/5'}`}
                >
                  <div className="text-xs text-gray-500">{packet.timestamp}</div>
                  <div className="col-span-2 font-mono flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${packet.prediction === 'ATTACK' ? 'bg-accentDanger animate-pulse shadow-[0_0_8px_rgba(255,59,92,1)]' : 'bg-accentPrimary shadow-[0_0_8px_rgba(0,200,150,0.5)]'}`}></div>
                    {packet.srcIP}
                  </div>
                  <div className="text-gray-400 font-bold">{packet.protocol}</div>
                  <div>{packet.bytes} B</div>
                  <div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase
                      ${packet.prediction === 'ATTACK' ? 'bg-accentDanger text-white cyber-glow-danger' : 'bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/30'}`}>
                      {packet.prediction === 'ATTACK' ? packet.attackType : 'NORMAL'}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="flex-1 bg-black/60 border border-gray-800 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${packet.confidence}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full ${packet.prediction === 'ATTACK' ? 'bg-gradient-to-r from-red-600 to-accentDanger' : 'bg-gradient-to-r from-teal-600 to-accentPrimary'}`} 
                      ></motion.div>
                    </div>
                    <span className="text-[10px] font-bold">{packet.confidence}%</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LiveMonitor;
