import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Target, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, total, icon, colorClass, trend, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, type: 'spring' }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="glass-panel p-5 rounded-xl border border-gray-800/60 bg-black/40 backdrop-blur-md relative overflow-hidden group shadow-lg"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 group-hover:opacity-30 transition-opacity duration-700 rounded-full ${colorClass.split(' ')[0]}`} />
    
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className="text-gray-400 font-mono text-[10px] uppercase tracking-widest">{title}</div>
      <div className={`p-2.5 rounded-lg bg-black/60 border border-gray-800 shadow-inner ${colorClass.split(' ')[1]}`}>
        {icon}
      </div>
    </div>
    
    <div className="flex items-end gap-3 relative z-10">
      <div className="text-3xl font-display font-bold text-white tracking-wider">{value}</div>
      {total && <div className="text-gray-500 font-mono mb-1 text-sm">/ {total}</div>}
    </div>
    
    {trend && (
      <div className="mt-4 text-[10px] font-mono text-accentPrimary flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
        <span className="bg-accentPrimary/20 p-0.5 rounded text-[8px]">▲</span> {trend}% from last hour
      </div>
    )}
  </motion.div>
);

const Dashboard = () => {
  const [data, setData] = useState(
    Array.from({ length: 20 }, (_, i) => ({
      time: new Date(Date.now() - (20 - i) * 2000).toLocaleTimeString().split(' ')[0],
      normal: Math.floor(Math.random() * 50) + 100,
      attack: Math.floor(Math.random() * 10) + 5
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1), {
          time: new Date().toLocaleTimeString().split(' ')[0],
          normal: Math.floor(Math.random() * 50) + 120,
          attack: Math.random() > 0.7 ? Math.floor(Math.random() * 25) + 10 : Math.floor(Math.random() * 5)
        }];
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const attackDistData = [
    { name: 'DoS', value: 4500, color: '#ff3b5c' },
    { name: 'Probe', value: 2300, color: '#ffaa00' },
    { name: 'R2L', value: 800, color: '#b938ff' },
    { name: 'U2R', value: 150, color: '#ff0055' },
    { name: 'Normal', value: 18500, color: '#00c896' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 border-b border-gray-800/80 pb-4">
        <div className="h-8 w-2 bg-accentPrimary rounded-full cyber-glow" />
        <h2 className="text-2xl font-bold font-display uppercase tracking-wider text-white">System Dashboard</h2>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          delay={0.1}
          title="Total Packets Evaluated" 
          value="24.5M" 
          icon={<Zap size={20} />} 
          colorClass="bg-blue-500 text-blue-400"
          trend="12.5"
        />
        <StatCard 
          delay={0.2}
          title="Threats Neutralized" 
          value="8,432" 
          icon={<ShieldAlert size={20} />} 
          colorClass="bg-red-500 text-accentDanger"
          trend="5.2"
        />
        <StatCard 
          delay={0.3}
          title="API Model Accuracy" 
          value="99.7%" 
          icon={<Target size={20} />} 
          colorClass="bg-green-500 text-accentPrimary"
        />
        <StatCard 
          delay={0.4}
          title="Backend API Status" 
          value="ONLINE" 
          icon={<ShieldCheck size={20} />} 
          colorClass="bg-green-500 text-accentPrimary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Traffic Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="lg:col-span-2 glass-panel p-6 rounded-xl border border-gray-800/60 shadow-[0_0_30px_rgba(0,0,0,0.5)] cyber-border"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-mono text-gray-300 uppercase text-xs tracking-widest flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accentPrimary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accentPrimary"></span>
              </span>
              Network Traffic Stream
            </h3>
            <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest uppercase">
              <div className="flex items-center gap-2"><span className="w-3 h-1 rounded bg-accentPrimary cyber-glow"></span> Normal</div>
              <div className="flex items-center gap-2"><span className="w-3 h-1 rounded bg-accentDanger cyber-glow-danger"></span> Attack</div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} opacity={0.5} />
                <XAxis dataKey="time" stroke="#4b5563" tick={{fontSize: 10, fill: '#6b7280', fontFamily: 'monospace'}} tickMargin={10} axisLine={false} />
                <YAxis stroke="#4b5563" tick={{fontSize: 10, fill: '#6b7280', fontFamily: 'monospace'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', borderColor: '#374151', color: '#fff', borderRadius: '8px', zIndex: 100, fontFamily: 'monospace', fontSize: '12px' }}
                  cursor={{ stroke: '#374151', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Line type="monotone" dataKey="normal" stroke="#00c896" strokeWidth={3} dot={false} isAnimationActive={false} activeDot={{ r: 6, fill: '#00c896', stroke: '#000', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="attack" stroke="#ff3b5c" strokeWidth={3} dot={false} isAnimationActive={false} activeDot={{ r: 6, fill: '#ff3b5c', stroke: '#000', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Distribution Chart */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="glass-panel p-6 rounded-xl border border-gray-800/60 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
          <h3 className="font-mono text-gray-300 uppercase text-xs tracking-widest mb-6 border-b border-gray-800/50 pb-3">Traffic Distribution</h3>
          <div className="h-56 relative left-[-15px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attackDistData}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="rgba(0,0,0,0.5)"
                  strokeWidth={2}
                >
                  {attackDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#374151', color: '#fff', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-2 grid grid-cols-2 gap-3 pl-2">
            {attackDistData.map(item => (
              <motion.div whileHover={{ scale: 1.05, x: 5 }} key={item.name} className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase cursor-default">
                <div className="w-2.5 h-2.5 rounded shadow-sm" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}80` }} />
                <span className="text-gray-300">{item.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
