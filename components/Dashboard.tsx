
import React from 'react';
import { 
  ChevronDown, UserPlus, FilePlus, Settings, Users, BarChart, 
  ChevronRight, Users as UsersIcon, Book, Clock, BookOpen, Plus
} from 'lucide-react';
import { PortalActivityChart, UserDonutChart } from './Charts';
import { TIMELINE_EVENTS } from '../constants';

const Dashboard: React.FC = () => {
  return (
    <main className="p-8 pb-16 max-w-[1600px] mx-auto animate-fade-in">
      {/* Hero Welcome Section */}
      <div className="hero-glass-card p-8 mb-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-orange-500 to-teal-500"></div>
        <h1 className="text-3xl font-bold gradient-text mb-2 animate-slide-up">
          Welcome Back, mostafa
        </h1>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Your portal is running smoothly. You have 14 days left on your trial.
        </p>
        <button className="mt-4 flex items-center gap-2 mx-auto px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all">
          Customize Dashboard <ChevronDown size={14} />
        </button>
      </div>

      {/* Primary Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        
        {/* Portal Activity */}
        <div className="glass-card p-6 flex flex-col h-full hover:shadow-[0_0_20px_rgba(20,184,166,0.1)] transition-all">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-200">Portal activity</h2>
            <div className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-teal-400 font-medium cursor-pointer hover:bg-white/10">
              Week <ChevronDown size={14} />
            </div>
          </div>
          <PortalActivityChart />
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6 flex flex-col h-full hover:shadow-[0_0_20px_rgba(249,115,22,0.1)] transition-all">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-200">Quick actions</h2>
            <Plus size={18} className="text-gray-500" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: <UserPlus size={18} />, label: 'Add user', color: 'text-teal-400' },
              { icon: <FilePlus size={18} />, label: 'Add course', color: 'text-teal-400' },
              { icon: <Settings size={18} />, label: 'Portal settings', color: 'text-gray-400' },
              { icon: <Users size={18} />, label: 'Add group', color: 'text-teal-400' },
              { icon: <BarChart size={18} />, label: 'Custom reports', color: 'text-teal-400' },
            ].map((action, i) => (
              <button key={i} className="flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 transition-all text-sm font-medium text-left">
                <span className={action.color}>{action.icon}</span>
                <span className="text-gray-300">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview */}
        <div className="glass-card p-6 flex flex-col h-full">
          <h2 className="font-bold text-gray-200 mb-6">Overview</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
              <div className="flex items-center gap-4 text-sm font-semibold text-teal-400">
                <UsersIcon size={18} /> Active users
              </div>
              <span className="font-bold text-xl text-white">1</span>
            </div>
            <div className="flex items-center justify-between px-3">
              <div className="flex items-center gap-4 text-sm font-semibold text-gray-500">
                <Book size={18} /> Assigned courses
              </div>
              <span className="font-bold text-xl text-gray-300">0</span>
            </div>
            <div className="flex items-center justify-between px-3">
              <div className="flex items-center gap-4 text-sm font-semibold text-teal-400">
                <UsersIcon size={18} /> Groups
              </div>
              <span className="font-bold text-xl text-white">0</span>
            </div>
            <div className="flex items-center justify-between px-3">
              <div className="flex items-center gap-4 text-sm font-semibold text-gray-500">
                <Clock size={18} /> Training time
              </div>
              <span className="font-bold text-xl text-gray-300">0h 0m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Timeline */}
        <div className="glass-card p-6 flex flex-col h-full lg:col-span-1 xl:col-span-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-200 flex items-center gap-1 group cursor-pointer hover:text-teal-400 transition-colors">
              Timeline <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </h2>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {TIMELINE_EVENTS.map((event) => (
              <div key={event.id} className="flex gap-4 relative">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${event.dotColor} shadow-[0_0_8px_rgba(20,184,166,0.4)]`} />
                <div className="flex flex-col gap-1 w-full">
                  <p className="text-xs text-gray-400 leading-tight">
                    <span className="font-semibold text-gray-200">{event.user}</span> 
                    {event.type === 'sign-in' && ' signed in'}
                    {event.type === 'added-to-course' && ' joined course '}
                    {event.type === 'created-course' && ' created '}
                    {event.target && <span className="text-teal-400 font-medium cursor-pointer hover:underline"> {event.target}</span>}
                  </p>
                  <span className="text-[10px] text-gray-600 uppercase tracking-widest">{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users Distribution */}
        <div className="glass-card p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-200 flex items-center gap-1 group cursor-pointer hover:text-teal-400">
              Users <ChevronRight size={18} />
            </h2>
            <span className="text-xl font-bold text-teal-400">1</span>
          </div>
          <UserDonutChart />
        </div>

        {/* Courses Progress (Empty State) */}
        <div className="glass-card p-6 flex flex-col h-full min-h-[300px]">
          <h2 className="font-bold text-gray-200 flex items-center gap-1 group cursor-pointer mb-8 hover:text-teal-400">
            Course progress <ChevronRight size={18} />
          </h2>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 bg-white/5 border border-white/10 text-teal-400 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <BookOpen size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-200 mb-1">No activity yet</h3>
            <p className="text-xs text-gray-500 mb-6">Assign your first course to see analytics</p>
            <button className="text-teal-400 font-bold text-sm hover:text-teal-300 underline underline-offset-4 decoration-teal-500/30">Go to courses</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center">
        <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-teal-500/20 to-transparent mx-auto mb-6"></div>
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">
          Powered by <span className="font-bold text-gray-400">TalentLMS</span> • NCOSH Hub Edition
        </p>
      </footer>
    </main>
  );
};

export default Dashboard;
