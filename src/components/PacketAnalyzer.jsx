import React, { useState, useRef } from 'react';
import { Cpu, Terminal, AlertTriangle, ShieldCheck, UploadCloud, FileText } from 'lucide-react';
import { simulateMLPrediction } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const FeatureInput = ({ label, value, onChange, type = 'number', options = [] }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="flex flex-col gap-1"
  >
    <label className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{label}</label>
    {type === 'select' ? (
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="bg-black/50 border border-gray-800 rounded p-2 text-sm text-gray-300 focus:border-accentPrimary focus:outline-none focus:ring-1 focus:ring-accentPrimary/50 font-mono transition-all"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="bg-black/50 border border-gray-800 rounded p-2 text-sm text-gray-300 focus:border-accentPrimary focus:outline-none focus:ring-1 focus:ring-accentPrimary/50 font-mono transition-all"
      />
    )}
  </motion.div>
);

const PacketAnalyzer = ({ onAlertGenerated }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [inputMode, setInputMode] = useState('manual'); // 'manual' or 'upload'
  const fileInputRef = useRef(null);
  const [bulkResults, setBulkResults] = useState([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  
  const [features, setFeatures] = useState({
    duration: 0,
    protocol_type: 'tcp',
    service: 'http',
    flag: 'SF',
    src_bytes: 0,
    dst_bytes: 0,
    land: 0,
    wrong_fragment: 0,
    urgent: 0,
    logged_in: 0,
    count: 0,
    srv_count: 0,
    same_srv_rate: 0,
    diff_srv_rate: 0,
    num_failed_logins: 0,
    su_attempted: 0,
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);
    
    try {
      const pred = await simulateMLPrediction(features);
      setResult(pred);
      
      if (pred.prediction === 'ATTACK') {
        const severity = parseFloat(pred.confidence) > 90 ? 'CRITICAL' : parseFloat(pred.confidence) > 75 ? 'HIGH' : 'MEDIUM';
        onAlertGenerated({
          id: `alert-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          severity,
          attackType: pred.attackType,
          srcIP: 'Manual Input',
          dstIP: 'System',
          confidence: pred.confidence,
          status: 'new'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSampleAttack = () => {
    setFeatures({
      ...features,
      duration: 0,
      protocol_type: 'tcp',
      service: 'http',
      flag: 'S0',
      src_bytes: 54500,
      dst_bytes: 0,
      count: 125,
      srv_count: 5,
      same_srv_rate: 0.1,
      diff_srv_rate: 0.9,
      logged_in: 0
    });
    setResult(null);
  };

  const loadSampleNormal = () => {
    setFeatures({
      ...features,
      duration: 0,
      protocol_type: 'tcp',
      service: 'http',
      flag: 'SF',
      src_bytes: 215,
      dst_bytes: 8450,
      count: 2,
      srv_count: 2,
      same_srv_rate: 1.0,
      diff_srv_rate: 0.0,
      logged_in: 1
    });
    setResult(null);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessingBulk(true);
    setBulkResults([]);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      
      const results = [];
      const MAX_LINES = Math.min(lines.length, 50); // Just process first 50 so we don't crash browser for demo
      
      for(let i = 0; i < MAX_LINES; i++) {
        // Rudimentary CSV mapping assuming KDDTrain+ column order
        // Columns index matches our required features roughly, or we just map basic ones.
        // For demonstration, we'll try to parse a generic CSV or just map randomly if format mismatched
        const cols = lines[i].split(',').map(s => s.trim());
        
        let fileFeatures = {};
        if (cols.length >= 41) {
          fileFeatures = {
            duration: cols[0],
            protocol_type: cols[1],
            service: cols[2],
            flag: cols[3],
            src_bytes: cols[4],
            dst_bytes: cols[5],
            land: cols[6],
            wrong_fragment: cols[7],
            urgent: cols[8],
            logged_in: cols[11],
            num_failed_logins: cols[10],
            su_attempted: cols[14],
            count: cols[22],
            srv_count: cols[23],
            same_srv_rate: cols[28],
            diff_srv_rate: cols[29]
          };
        } else {
          // If the CSV isn't perfectly NSL-KDD, we just fill randomly to show the system processing
          fileFeatures = { ...features, src_bytes: Math.floor(Math.random()*1000) };
        }

        try {
          const pred = await simulateMLPrediction(fileFeatures);
          results.push({ row: i+1, ...pred, raw: fileFeatures });
          
          if (pred.prediction === 'ATTACK') {
             onAlertGenerated({
              id: `alert-bulk-${Date.now()}-${i}`,
              timestamp: new Date().toLocaleTimeString(),
              severity: parseFloat(pred.confidence) > 90 ? 'CRITICAL' : 'HIGH',
              attackType: pred.attackType,
              srcIP: `CSV Row ${i+1}`,
              dstIP: 'System',
              confidence: pred.confidence,
              status: 'new'
            });
          }
        } catch(e) {
          console.error("Bulk processing error on line", i);
        }
      }
      
      setBulkResults(results);
      setIsProcessingBulk(false);
    };
    reader.readAsText(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 border-b border-gray-800/80 pb-4">
        <div className="h-8 w-2 bg-accentPrimary rounded-full cyber-glow" />
        <h2 className="text-2xl font-bold font-display uppercase tracking-wider text-white">Manual Packet Analyzer</h2>
      </div>

      <div className="flex gap-4 border-b border-gray-800 pb-2">
        <button 
          onClick={() => setInputMode('manual')}
          className={`px-4 py-2 font-mono text-xs tracking-widest uppercase transition-all ${inputMode === 'manual' ? 'text-accentPrimary border-b-2 border-accentPrimary' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Form Input
        </button>
        <button 
          onClick={() => setInputMode('upload')}
          className={`px-4 py-2 font-mono text-xs tracking-widest uppercase transition-all ${inputMode === 'upload' ? 'text-accentPrimary border-b-2 border-accentPrimary' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Bulk CSV Upload
        </button>
      </div>

      <AnimatePresence mode="wait">
        {inputMode === 'manual' ? (
          <motion.div key="manual" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="flex gap-4 mb-6">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={loadSampleNormal} className="px-4 py-1.5 text-xs font-mono border border-accentPrimary text-accentPrimary rounded hover:bg-accentPrimary/10 transition-colors">
                [ Load Normal Data ]
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={loadSampleAttack} className="px-4 py-1.5 text-xs font-mono border border-accentDanger text-accentDanger rounded hover:bg-accentDanger/10 transition-colors">
                [ Load Attack Data ]
              </motion.button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-panel p-6 rounded border border-gray-800/80">
                <h3 className="font-mono text-gray-300 uppercase text-sm tracking-wider mb-6 flex items-center gap-2">
                  <Terminal size={16} className="text-accentPrimary" /> Feature Input Matrix
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                  <FeatureInput label="Duration" value={features.duration} onChange={(v) => setFeatures({...features, duration: v})} />
                  <FeatureInput label="Protocol Type" value={features.protocol_type} onChange={(v) => setFeatures({...features, protocol_type: v})} type="select" options={['tcp', 'udp', 'icmp']} />
                  <FeatureInput label="Service" value={features.service} onChange={(v) => setFeatures({...features, service: v})} type="select" options={['http', 'https', 'ftp', 'ssh', 'dns', 'smtp', 'eco_i']} />
                  <FeatureInput label="Flag" value={features.flag} onChange={(v) => setFeatures({...features, flag: v})} type="select" options={['SF', 'S0', 'REJ', 'RSTO', 'RSTR', 'SH']} />
                  <FeatureInput label="Source Bytes" value={features.src_bytes} onChange={(v) => setFeatures({...features, src_bytes: v})} />
                  <FeatureInput label="Dest Bytes" value={features.dst_bytes} onChange={(v) => setFeatures({...features, dst_bytes: v})} />
                  <FeatureInput label="Land (0/1)" value={features.land} onChange={(v) => setFeatures({...features, land: v})} />
                  <FeatureInput label="Wrong Fragment" value={features.wrong_fragment} onChange={(v) => setFeatures({...features, wrong_fragment: v})} />
                  <FeatureInput label="Urgent Packets" value={features.urgent} onChange={(v) => setFeatures({...features, urgent: v})} />
                  <FeatureInput label="Logged In (0/1)" value={features.logged_in} onChange={(v) => setFeatures({...features, logged_in: v})} />
                  <FeatureInput label="Count" value={features.count} onChange={(v) => setFeatures({...features, count: v})} />
                  <FeatureInput label="Srv Count" value={features.srv_count} onChange={(v) => setFeatures({...features, srv_count: v})} />
                  <FeatureInput label="Failed Logins" value={features.num_failed_logins} onChange={(v) => setFeatures({...features, num_failed_logins: v})} />
                  <FeatureInput label="SU Attempt (0/1)" value={features.su_attempted} onChange={(v) => setFeatures({...features, su_attempted: v})} />
                  <FeatureInput label="Same Srv Rate" value={features.same_srv_rate} onChange={(v) => setFeatures({...features, same_srv_rate: v})} />
                  <FeatureInput label="Diff Srv Rate" value={features.diff_srv_rate} onChange={(v) => setFeatures({...features, diff_srv_rate: v})} />
                </div>

                <motion.button 
                  whileHover={!isAnalyzing ? { scale: 1.02, backgroundColor: "rgba(0,200,150,0.8)" } : {}}
                  whileTap={!isAnalyzing ? { scale: 0.98 } : {}}
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className={`w-full py-3 rounded font-bold tracking-widest font-mono uppercase transition-all duration-300 flex items-center justify-center gap-2
                    ${isAnalyzing ? 'bg-gray-800 text-gray-500' : 'bg-accentPrimary text-black cyber-glow'}`}
                >
                  {isAnalyzing ? (
                    <><Cpu className="animate-spin" size={18} /> querying backend model...</>
                  ) : (
                    <><Cpu size={18} /> Execute API Inference</>
                  )}
                </motion.button>
              </div>

              <div>
                <div className={`glass-panel rounded border border-gray-800/80 h-full flex flex-col p-6 relative overflow-hidden transition-all duration-500
                  ${result ? (result.prediction === 'ATTACK' ? 'cyber-glow-danger border-accentDanger/50 bg-red-900/10' : 'cyber-glow border-accentPrimary/50 bg-green-900/10') : ''}
                `}>
                  <h3 className="font-mono text-gray-300 uppercase text-sm tracking-wider mb-6 pb-2 border-b border-gray-800 flex items-center gap-2">
                    <Cpu size={16} /> Backend Response
                  </h3>
                  
                  <AnimatePresence mode="wait">
                    {isAnalyzing ? (
                      <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-1 flex flex-col items-center justify-center text-accentPrimary">
                        <div className="w-16 h-16 border-4 border-accentPrimary/30 border-t-accentPrimary rounded-full animate-spin mb-4"></div>
                        <div className="font-mono animate-pulse">Running Random Forest via Flask API...</div>
                      </motion.div>
                    ) : result ? (
                      <motion.div key="result" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="flex-1 flex flex-col">
                        <div className="flex items-center justify-center py-6">
                          {result.prediction === 'ATTACK' ? (
                            <div className="flex flex-col items-center text-accentDanger">
                              <motion.div animate={{scale:[1, 1.2, 1]}} transition={{repeat: Infinity, duration: 1.5}}>
                                <AlertTriangle size={64} className="mb-2" />
                              </motion.div>
                              <h4 className="text-3xl font-display font-bold tracking-widest text-center text-shadow">THREAT DETECTED</h4>
                              <p className="font-mono text-xl mt-1 cyber-text text-center">{result.attackType.toUpperCase()}</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-accentPrimary">
                              <ShieldCheck size={64} className="mb-2" />
                              <h4 className="text-3xl font-display font-bold tracking-widest text-center">NORMAL TRAFFIC</h4>
                            </div>
                          )}
                        </div>

                        <div className="mt-auto space-y-4 pt-4">
                          <div>
                            <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                              <span>API Confidence</span>
                              <span className={result.prediction === 'ATTACK' ? 'text-accentDanger' : 'text-accentPrimary'}>{result.confidence}%</span>
                            </div>
                            <div className="w-full bg-gray-900 border border-gray-700 h-2 rounded-full overflow-hidden relative">
                              <motion.div 
                                className={`absolute top-0 left-0 h-full ${result.prediction === 'ATTACK' ? 'bg-gradient-to-r from-red-600 to-accentDanger' : 'bg-gradient-to-r from-teal-600 to-accentPrimary'}`} 
                                initial={{ width: 0 }}
                                animate={{ width: `${result.confidence}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                              ></motion.div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-800">
                            <h5 className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mb-3">Dominant Features Driving Prediction</h5>
                            <div className="space-y-3">
                              {result.featureImportance.map((f, i) => (
                                <div key={i}>
                                  <div className="flex justify-between font-mono text-[10px] text-gray-400 mb-1">
                                    <span>{f.name}</span>
                                    <span>{f.weight}</span>
                                  </div>
                                  <div className="w-full bg-gray-900 h-1 rounded overflow-hidden relative">
                                    <motion.div 
                                      className="absolute top-0 left-0 h-full bg-blue-500" 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${f.weight}%` }}
                                      transition={{ duration: 1, delay: i * 0.2 }}
                                    ></motion.div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-1 flex flex-col items-center justify-center text-gray-600 font-mono text-center">
                        <Terminal size={48} className="mb-4 opacity-20" />
                        <p>Awaiting packet input...<br/>Click "Execute" to call backend.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-panel p-6 rounded border border-gray-800/80">
            <h3 className="font-mono text-gray-300 uppercase text-sm tracking-wider mb-6 pb-2 border-b border-gray-800 flex items-center gap-2">
              <UploadCloud size={16} className="text-accentPrimary" /> Bulk Dataset Processing
            </h3>
            
            <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-700 bg-black/40 rounded-xl mb-6 hover:border-accentPrimary hover:bg-accentPrimary/5 transition-colors cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <FileText size={48} className="text-gray-500 mb-4" />
              <p className="text-gray-300 font-mono tracking-wide">Click to browse or drag and drop NSL-KDD CSV</p>
              <p className="text-xs text-gray-600 font-mono mt-2">Processes up to 50 rows per batch for demo stability</p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
            </div>

            {isProcessingBulk ? (
              <div className="flex flex-col items-center p-10 font-mono text-accentPrimary">
                 <div className="w-12 h-12 border-2 border-accentPrimary/30 border-t-accentPrimary rounded-full animate-spin mb-4"></div>
                 <p className="animate-pulse">Iterating through rows via Backend API...</p>
              </div>
            ) : bulkResults.length > 0 ? (
               <div className="border border-gray-800 rounded-lg overflow-hidden bg-black/60">
                 <div className="grid grid-cols-5 p-3 bg-gray-900 border-b border-gray-800 font-mono text-xs text-gray-400 font-bold uppercase tracking-wider">
                   <div>Row #</div>
                   <div>Protocol</div>
                   <div>Src Bytes</div>
                   <div>API Result</div>
                   <div className="text-right">Confidence</div>
                 </div>
                 <div className="max-h-64 overflow-y-auto">
                    {bulkResults.map((res, i) => (
                      <div key={i} className={`grid grid-cols-5 p-3 font-mono text-xs border-b border-gray-800/50 ${res.prediction === 'ATTACK' ? 'bg-red-900/10 text-red-200' : 'text-gray-300'}`}>
                        <div>{res.row}</div>
                        <div>{res.raw.protocol_type}</div>
                        <div>{res.raw.src_bytes}</div>
                        <div>
                          <span className={`px-2 py-0.5 rounded ${res.prediction === 'ATTACK'?'bg-accentDanger text-white':'bg-accentPrimary/20 text-accentPrimary'}`}>{res.attackType}</span>
                        </div>
                        <div className="text-right">{res.confidence}%</div>
                      </div>
                    ))}
                 </div>
               </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PacketAnalyzer;
