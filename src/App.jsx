import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Cpu, Bell, Network, Database, LogOut } from 'lucide-react';
import Dashboard from './components/Dashboard';
import PacketAnalyzer from './components/PacketAnalyzer';
import LiveMonitor from './components/LiveMonitor';
import AlertsCenter from './components/AlertsCenter';
import ModelInfo from './components/ModelInfo';
import Login from './components/Login';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState([]);
  const [systemUptime, setSystemUptime] = useState(0);

  // Check persisted login on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('nids_token');
    const savedUser = localStorage.getItem('nids_user');
    if (savedToken) {
      setToken(savedToken);
      setUsername(savedUser || 'Admin');
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setInterval(() => {
      setSystemUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const handleLogin = (jwt, user) => {
    setToken(jwt);
    setUsername(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('http://127.0.0.1:5000/api/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch(e) { console.error('Logout error', e); }
    
    // Clear state
    localStorage.removeItem('nids_token');
    localStorage.removeItem('nids_user');
    setIsAuthenticated(false);
    setToken(null);
  };

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity size={18} /> },
    { id: 'analyzer', label: 'Packet Analyzer', icon: <Cpu size={18} /> },
    { id: 'monitor', label: 'Live Monitor', icon: <Network size={18} /> },
    { id: 'alerts', label: 'Alerts Center', icon: <Bell size={18} /> },
    { id: 'model', label: 'Model Info', icon: <Database size={18} /> }
  ];

  const handleAddAlert = (alert) => {
    setAlerts(prev => [alert, ...prev]);
  };

  // If not authenticated, return the Login Page with exit animation
  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="login-portal" exit={{ opacity: 0, y: -50, scale: 0.95 }} transition={{ duration: 0.5 }}>
          <Login onLogin={handleLogin} />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Application Layout Wrapper
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="app-dashboard"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="min-h-screen bg-[#030712] text-gray-200 relative font-sans flex flex-col"
      >
        {/* Top Notification Bar */}
        <motion.div 
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/5 text-xs py-2 px-6 flex justify-between items-center z-20 relative"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentPrimary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accentPrimary"></span>
            </span>
            <span className="text-white font-bold tracking-widest hidden sm:inline">SECURE SESSION ACTIVE</span>
            <span className="text-gray-600 mx-2 hidden sm:inline">|</span>
            <span className="text-gray-400">Operator: <strong className="text-accentPrimary">{username}</strong></span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <span className="hidden md:inline">Model: ML Realtime</span>
            <span className="text-gray-600">|</span>
            <span className="font-mono text-[10px] uppercase text-gray-400">Up: {formatUptime(systemUptime)}</span>
            <button onClick={handleLogout} className="ml-4 hover:text-accentDanger transition-colors flex items-center gap-1.5"><LogOut size={14} /> <span className="hidden sm:inline">Logout</span></button>
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row flex-1 relative z-10 overflow-hidden">
          {/* Sidebar Navigation */}
          <motion.aside 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-full md:w-64 border-r border-white/5 flex flex-col items-center py-6 px-4 shrink-0 bg-[#0B1120]/40 backdrop-blur-lg"
          >
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3 mb-10 p-3 rounded-2xl bg-white/5 border border-white/10 shadow-lg cursor-default">
              <ShieldAlert className="text-accentPrimary" size={28} />
              <div>
                <h1 className="text-xl font-bold text-white tracking-widest leading-tight font-display">NIDS</h1>
                <p className="text-[9px] text-accentPrimary/80 tracking-widest uppercase font-mono">Defense Matrix</p>
              </div>
            </motion.div>

            <nav className="flex flex-row md:flex-col gap-2 w-full overflow-x-auto pb-4 md:pb-0 hide-scrollbar overflow-y-visible">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap outline-none outline-0 group w-full ${activeTab === item.id ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  {/* The sliding background indicator */}
                  {activeTab === item.id && (
                    <motion.div
                      layoutId="active-tab"
                      className="absolute inset-0 bg-white/10 rounded-xl"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {/* The left accent bar */}
                  {activeTab === item.id && (
                    <motion.div
                      layoutId="active-bar"
                      className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-accentPrimary rounded-r-full shadow-[0_0_10px_rgba(0,229,255,0.8)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <div className="relative z-10 flex items-center gap-3 w-full">
                    {item.icon}
                    <span className="font-mono tracking-wide">{item.label}</span>
                    {item.id === 'alerts' && alerts.filter(a => a.status === 'new').length > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="ml-auto bg-accentDanger text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg"
                      >
                        {alerts.filter(a => a.status === 'new').length}
                      </motion.span>
                    )}
                  </div>
                </button>
              ))}
            </nav>
          </motion.aside>

          {/* Main Content Area */}
          <main className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto w-full relative">
            <div className="max-w-7xl mx-auto h-full relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full"
                >
                  {activeTab === 'dashboard' && <Dashboard />}
                  {activeTab === 'analyzer' && <PacketAnalyzer onAlertGenerated={handleAddAlert} />}
                  {activeTab === 'monitor' && <LiveMonitor onAlertGenerated={handleAddAlert} />}
                  {activeTab === 'alerts' && <AlertsCenter alerts={alerts} setAlerts={setAlerts} />}
                  {activeTab === 'model' && <ModelInfo />}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default App;
