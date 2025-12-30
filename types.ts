
// Fix: Import React to resolve the 'Cannot find namespace React' error when using React.ReactNode
import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  hasDot?: boolean;
  hasArrow?: boolean;
  isLocked?: boolean;
}

export interface ActivityData {
  day: string;
  logins: number;
  completions: number;
}

export interface UserStatsData {
  name: string;
  value: number;
  color: string;
}

export interface TimelineEvent {
  id: number;
  type: 'sign-in' | 'added-to-course' | 'created-course';
  user: string;
  target?: string;
  time: string;
  dotColor: string;
}