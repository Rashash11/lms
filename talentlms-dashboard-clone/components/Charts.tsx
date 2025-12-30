
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip
} from 'recharts';
import { ACTIVITY_DATA, USER_STATS } from '../constants';

// Theme Colors
const TEAL = '#14b8a6';
const ORANGE = '#f97316';
const DARK_TEAL = '#0f766e';
const SLATE = '#475569';

export const PortalActivityChart: React.FC = () => {
  return (
    <div className="h-[250px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={ACTIVITY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
          <XAxis 
            dataKey="day" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 10 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 10 }} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0a1a1a', border: '1px solid #14b8a630', borderRadius: '8px' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Bar dataKey="logins" fill={TEAL} radius={[4, 4, 0, 0]} barSize={20} />
          <Bar dataKey="completions" fill={ORANGE} radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-4 text-[10px] uppercase tracking-widest font-bold text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
          <span>Logins</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
          <span>Completions</span>
        </div>
      </div>
    </div>
  );
};

export const UserDonutChart: React.FC = () => {
  // Update stats colors for the theme
  const THEME_STATS = [
    { name: 'Admins', value: 1, color: TEAL },
    { name: 'Instructors', value: 0, color: ORANGE },
    { name: 'Learners', value: 0, color: SLATE },
  ];

  return (
    <div className="h-[220px] w-full mt-4 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={THEME_STATS}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={75}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {THEME_STATS.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#0a1a1a', border: '1px solid #14b8a630', borderRadius: '8px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
        {THEME_STATS.map((stat, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stat.color }}></div>
            <span>{stat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
