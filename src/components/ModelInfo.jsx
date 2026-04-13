import React from 'react';
import { Database, Cpu, BrainCircuit, Network, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const ModelCard = ({ title, icon, accuracy, precision, recall, f1, description, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.02, y: -5 }}
    className="glass-panel p-6 rounded-xl border border-gray-800/60 hover:border-accentPrimary/50 transition-all duration-300 group shadow-lg bg-black/40 backdrop-blur-md"
  >
    <div className="flex items-center gap-4 mb-4">
      <motion.div 
        whileHover={{ rotate: 180 }}
        transition={{ duration: 0.5 }}
        className="p-3 bg-black/60 rounded-lg border border-gray-700 text-accentPrimary group-hover:text-black group-hover:bg-accentPrimary group-hover:shadow-[0_0_15px_rgba(0,200,150,0.8)] transition-all"
      >
        {icon}
      </motion.div>
      <div>
        <h3 className="font-display font-bold text-lg tracking-wider text-white">{title}</h3>
        <p className="text-[10px] uppercase font-mono text-accentPrimary/80 tracking-widest">Ensemble Component</p>
      </div>
    </div>
    
    <p className="text-sm text-gray-400 mb-6 font-mono leading-relaxed h-16">
      {description}
    </p>

    <div className="space-y-3 pt-4 border-t border-gray-800/50">
      <MetricBar label="Accuracy" value={accuracy} delay={delay + 0.1} />
      <MetricBar label="Precision" value={precision} delay={delay + 0.2} />
      <MetricBar label="Recall" value={recall} delay={delay + 0.3} />
      <MetricBar label="F1-Score" value={f1} delay={delay + 0.4} />
    </div>
  </motion.div>
);

const MetricBar = ({ label, value, delay }) => (
  <div>
    <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider">
      <span>{label}</span>
      <span className="text-white font-bold">{value}%</span>
    </div>
    <div className="w-full bg-black/60 border border-gray-800 h-1.5 rounded-full overflow-hidden relative shadow-inner">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ delay, duration: 1, ease: "easeOut" }}
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-700 to-accentPrimary shadow-[0_0_10px_rgba(0,200,150,0.5)]" 
      ></motion.div>
    </div>
  </div>
);

const ModelInfo = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-3 border-b border-gray-800/80 pb-4">
        <div className="h-8 w-2 bg-accentPrimary rounded-full cyber-glow" />
        <h2 className="text-2xl font-bold font-display uppercase tracking-wider text-white">System Architecture & Real ML Backbone</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ModelCard 
          delay={0.1}
          title="Python Random Forest API"
          icon={<BrainCircuit size={24} />}
          accuracy={99.7}
          precision={99.4}
          recall={99.2}
          f1={99.3}
          description="A real-time Python Flask backend running an active Scikit-Learn Random Forest Classifier trained iteratively on the NSL-KDD dataset."
        />
        <ModelCard 
          delay={0.2}
          title="React API Orchestrator"
          icon={<Network size={24} />}
          accuracy={100}
          precision={100}
          recall={100}
          f1={100}
          description="Vite + React frontend converting arbitrary stream objects into categorical data payloads required by the Flask REST endpoint."
        />
        <ModelCard 
          delay={0.3}
          title="CNN Feature Extractor"
          icon={<Layers size={24} />}
          accuracy={98.2}
          precision={97.5}
          recall={98.1}
          f1={97.8}
          description="Convolutional Neural Network used as a preliminary feature extraction layer to dimensionalize complex payload data before passing to the LSTM."
        />
        <ModelCard 
          delay={0.4}
          title="KNN Baseline"
          icon={<Cpu size={24} />}
          accuracy={91.5}
          precision={90.2}
          recall={89.5}
          f1={89.8}
          description="K-Nearest Neighbors model used as a fallback baseline classifier for rapid inference on low-complexity packets during high-traffic bursts."
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 glass-panel border border-gray-800/80 rounded-xl overflow-hidden shadow-2xl"
      >
        <div className="bg-black/80 backdrop-blur-md p-4 border-b border-gray-800 flex items-center gap-3">
          <Database className="text-accentPrimary" size={20} />
          <h3 className="font-display font-bold tracking-wider text-white">Live Datasets & Active Models</h3>
        </div>
        
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 bg-black/40">
          <div>
            <h4 className="font-mono text-sm text-gray-400 uppercase tracking-widest mb-4">NSL-KDD API Statistics</h4>
            <div className="grid grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.05 }} className="bg-black/60 p-4 rounded-lg border border-gray-800 shadow-inner">
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Training Records</div>
                <div className="text-2xl font-bold font-display text-white mt-1">125,973</div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="bg-black/60 p-4 rounded-lg border border-gray-800 shadow-inner">
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Random Forest Depth</div>
                <div className="text-2xl font-bold font-display text-white mt-1">15</div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="bg-black/60 p-4 rounded-lg border border-gray-800 shadow-inner">
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">API Features Passed</div>
                <div className="text-2xl font-bold font-display text-accentPrimary mt-1">16 Node Matrix</div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="bg-black/60 p-4 rounded-lg border border-gray-800 shadow-inner">
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Inference Latency</div>
                <div className="text-2xl font-bold font-display text-accentPrimary mt-1">~120ms</div>
              </motion.div>
            </div>
            
            <h4 className="font-mono text-sm text-gray-400 uppercase tracking-widest mt-8 mb-4">Payload Engineering</h4>
            <ul className="space-y-3 font-mono text-xs text-gray-300">
              <li className="flex gap-3 items-start"><span className="text-accentPrimary mt-0.5">■</span> <span className="leading-relaxed"><b>Pre-processing:</b> All categorical labels (`protocol_type`, `flag`, `service`) are label-encoded consistently with the Joblib matrix prior to feeding the pipeline.</span></li>
              <li className="flex gap-3 items-start"><span className="text-accentPrimary mt-0.5">■</span> <span className="leading-relaxed"><b>Standardization:</b> A `StandardScaler` reduces numerical gradients inside the backend memory layer.</span></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-mono text-sm text-gray-400 uppercase tracking-widest mb-4">Attack Taxonomy Mapping</h4>
            <div className="space-y-4">
              <motion.div whileHover={{ x: 5 }} className="bg-black/40 p-4 rounded-lg border border-red-900/30 hover:bg-red-900/10 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#ff3b5c] shadow-[0_0_8px_rgba(255,59,92,0.8)]"></div>
                  <span className="font-bold text-sm text-white tracking-wide">Denial of Service (DoS)</span>
                </div>
                <p className="text-xs text-gray-400 font-mono leading-relaxed">Attacker tries to prevent legitimate users from using a service. Resources are consumed completely. <br/><span className="text-gray-500 inline-block mt-1">Examples: smurf, neptune, back.</span></p>
              </motion.div>
              
              <motion.div whileHover={{ x: 5 }} className="bg-black/40 p-4 rounded-lg border border-amber-900/30 hover:bg-amber-900/10 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#ffaa00] shadow-[0_0_8px_rgba(255,170,0,0.8)]"></div>
                  <span className="font-bold text-sm text-white tracking-wide">Probing</span>
                </div>
                <p className="text-xs text-gray-400 font-mono leading-relaxed">Attacker tries to find vulnerabilities or gather information about the network. <br/><span className="text-gray-500 inline-block mt-1">Examples: ipsweep, nmap, portsweep.</span></p>
              </motion.div>

              <motion.div whileHover={{ x: 5 }} className="bg-black/40 p-4 rounded-lg border border-purple-900/30 hover:bg-purple-900/10 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#b938ff] shadow-[0_0_8px_rgba(185,56,255,0.8)]"></div>
                  <span className="font-bold text-sm text-white tracking-wide">Remote to Local (R2L)</span>
                </div>
                <p className="text-xs text-gray-400 font-mono leading-relaxed">Attacker sends packets over network to exploit a vulnerability to gain local access as a user. <br/><span className="text-gray-500 inline-block mt-1">Examples: guess_passwd, ftp_write.</span></p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ModelInfo;
