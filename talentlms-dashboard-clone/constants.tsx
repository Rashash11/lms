
import React from 'react';
import { 
  Home, Users, BookOpen, GitBranch, Share2, ShoppingCart, 
  Layers, Zap, Bell, BarChart2, Lightbulb, Settings, CreditCard 
} from 'lucide-react';
import { NavItem, ActivityData, UserStatsData, TimelineEvent } from './types';

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: <Home size={20} /> },
  { id: 'users', label: 'Users', icon: <Users size={20} /> },
  { id: 'courses', label: 'Courses', icon: <BookOpen size={20} /> },
  { id: 'paths', label: 'Learning paths', icon: <GitBranch size={20} />, isLocked: true },
  { id: 'store', label: 'Course store', icon: <ShoppingCart size={20} />, isLocked: true, hasArrow: true },
  { id: 'groups', label: 'Groups', icon: <Layers size={20} /> },
  { id: 'branches', label: 'Branches', icon: <Share2 size={20} />, hasDot: true, isLocked: true },
  { id: 'automations', label: 'Automations', icon: <Zap size={20} />, hasDot: true, isLocked: true },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
  { id: 'reports', label: 'Reports', icon: <BarChart2 size={20} />, hasArrow: true },
  { id: 'skills', label: 'Skills', icon: <Lightbulb size={20} />, hasDot: true, isLocked: true },
  { id: 'settings', label: 'Account & Settings', icon: <Settings size={20} />, hasArrow: true },
  { id: 'subscription', label: 'Subscription', icon: <CreditCard size={20} /> },
];

export const ACTIVITY_DATA: ActivityData[] = [
  { day: 'Friday', logins: 0, completions: 0 },
  { day: 'Monday', logins: 0, completions: 0 },
  { day: 'Thursday', logins: 1, completions: 0 },
];

export const USER_STATS: UserStatsData[] = [
  { name: 'Admins', value: 1, color: '#0066FF' },
  { name: 'Instructors', value: 0, color: '#1E3A8A' },
  { name: 'Learners', value: 0, color: '#0F172A' },
];

export const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: 1, type: 'sign-in', user: 'You', time: '19 minutes ago', dotColor: 'bg-blue-500' },
  { id: 2, type: 'added-to-course', user: 'You', target: 'What is TalentL...', time: '19 minutes ago', dotColor: 'bg-blue-500' },
  { id: 3, type: 'created-course', user: 'You', target: 'What is TalentLibrary? (0...', time: '19 minutes ago', dotColor: 'bg-green-500' },
  { id: 4, type: 'added-to-course', user: 'You', target: '[Edit me] Guide...', time: '19 minutes ago', dotColor: 'bg-blue-500' },
];
