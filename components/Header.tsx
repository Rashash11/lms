
import React from 'react';
import { Search, Bell, Mail, ChevronDown } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="h-16 glass-card rounded-none border-t-0 border-l-0 border-r-0 flex items-center justify-between px-6 sticky top-0 z-10 backdrop-blur-xl bg-black/10">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search everything..."
            className="w-full pl-4 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 text-sm text-white placeholder:text-gray-500 transition-all"
          />
          <Search className="absolute right-3 top-2.5 text-gray-500 group-focus-within:text-teal-400 transition-colors" size={18} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-teal-500/10 px-3 py-1.5 rounded-full border border-teal-500/20">
          <span className="w-6 h-6 bg-teal-500 text-white flex items-center justify-center rounded-full text-[10px] font-bold">14</span>
          <button className="text-teal-400 font-semibold text-sm hover:text-teal-300 transition-colors">Upgrade</button>
        </div>
        
        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all relative">
          <Mail size={20} />
          <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 border-2 border-black rounded-full"></div>
        </button>

        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all">
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/10 ml-2 group cursor-pointer hover:bg-white/5 py-1.5 px-2 rounded-lg transition-all">
          <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
            M
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-gray-200 leading-tight">m. mostafa</p>
            <p className="text-[10px] text-gray-500">Administrator</p>
          </div>
          <ChevronDown size={14} className="text-gray-500" />
        </div>
      </div>
    </header>
  );
};

export default Header;
