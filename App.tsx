
import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-black text-white selection:bg-teal-500/30">
      {/* Background Glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Sidebar fixed width */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative z-10">
        <Header />
        
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Dashboard />
        </div>
      </div>
    </div>
  );
};

export default App;
