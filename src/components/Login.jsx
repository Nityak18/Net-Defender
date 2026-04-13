import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = ({ onLogin }) => {
  const [isLoginModel, setIsLoginModel] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const endpoint = isLoginModel ? '/api/login' : '/api/register';
    
    try {
      const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Success! Pass token to parent
      localStorage.setItem('nids_token', data.token);
      localStorage.setItem('nids_user', data.username);
      onLogin(data.token, data.username);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0A0F1C]">
      {/* Soft Ambient Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-accentPrimary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md z-10 relative"
      >
        <div className="glass-panel p-10 rounded-2xl border border-white/10 shadow-2xl bg-black/40 backdrop-blur-2xl">
          <div className="flex flex-col items-center justify-center mb-10">
            <motion.div 
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7, type: "spring" }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accentPrimary/20 to-accentPrimary/5 border border-accentPrimary/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,200,150,0.2)] mb-4"
            >
              <ShieldCheck className="text-accentPrimary" size={32} />
            </motion.div>
            <h1 className="text-3xl font-display font-bold text-white tracking-wide">NIDS Gateway</h1>
            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mt-2">{isLoginModel ? 'Secure System Access' : 'Create Access Vector'}</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }} 
                className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2 mb-6 font-mono"
              >
                <ShieldAlert size={14} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest pl-1">Identifier</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-gray-800 text-white text-sm rounded-lg py-3 pl-10 pr-4 outline-none focus:border-accentPrimary focus:ring-1 focus:ring-accentPrimary/50 transition-all font-mono"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest pl-1">Passphrase</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-gray-800 text-white text-sm rounded-lg py-3 pl-10 pr-4 outline-none focus:border-accentPrimary focus:ring-1 focus:ring-accentPrimary/50 transition-all font-mono tracking-widest"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              type="submit"
              className="w-full py-3.5 mt-4 rounded-lg bg-accentPrimary text-black font-bold tracking-wider font-mono uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,200,150,0.3)] hover:shadow-[0_0_30px_rgba(0,200,150,0.5)] transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              ) : (
                <>{isLoginModel ? 'Authenticate' : 'Register' } <ArrowRight size={18} /></>
              )}
            </motion.button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800/50 text-center">
            <button 
              onClick={() => {setIsLoginModel(!isLoginModel); setError('');}}
              className="text-xs text-gray-500 hover:text-accentPrimary font-mono transition-colors"
            >
              {isLoginModel ? "Need authentication clearance? Request Access" : "Already have clearance? Initiate Login"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
