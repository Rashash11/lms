
import React, { useState } from 'react';
import { ChevronRight, Lock, Info } from 'lucide-react';
import { NAV_ITEMS } from '../constants';

const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isDemo, setIsDemo] = useState(false);

  return (
    <aside className="w-64 glass-card rounded-none h-screen fixed left-0 top-0 overflow-hidden flex flex-col z-20" style={{ borderTop: 0, borderLeft: 0, borderBottom: 0 }}>
      {/* Logo */}
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-xl text-white">
          t
        </div>
        <span className="font-bold text-xl tracking-tight gradient-text">talentlms</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all group ${
              activeTab === item.id 
                ? 'bg-white/10 text-white border border-white/10' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className={activeTab === item.id ? 'text-teal-400' : 'text-gray-500 group-hover:text-teal-400 transition-colors'}>
              {item.icon}
            </span>
            <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
            <div className="flex items-center gap-1.5">
              {item.isLocked && <Lock size={12} className="text-gray-600" />}
              {item.hasDot && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />}
              {item.hasArrow && <ChevronRight size={14} className="text-gray-600" />}
            </div>
          </button>
        ))}
      </nav>

      {/* Demo Mode Toggle */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDemo(!isDemo)}
              className={`w-10 h-5 rounded-full relative transition-colors ${isDemo ? 'bg-teal-500' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDemo ? 'left-6' : 'left-1'}`} />
            </button>
            <span className="text-xs font-medium text-gray-300">Demo mode</span>
            <Info size={14} className="text-gray-500 cursor-help" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
