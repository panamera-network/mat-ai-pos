import React, { createContext, useContext, useState } from 'react';
import { cn } from '../lib/utils';

interface TabsContextValue { activeTab: string; setActiveTab: (id: string) => void; }
const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps { defaultTab: string; children: React.ReactNode; className?: string; }
export const Tabs: React.FC<TabsProps> = ({ defaultTab, children, className }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return <TabsContext.Provider value={{ activeTab, setActiveTab }}><div className={cn('flex flex-col', className)}>{children}</div></TabsContext.Provider>;
};

export interface TabListProps extends React.HTMLAttributes<HTMLDivElement> { variant?: 'default' | 'pills' | 'underline'; }
export const TabList: React.FC<TabListProps> = ({ variant = 'default', className, children, ...props }) => {
  const variants = { default: 'flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl', pills: 'flex gap-2', underline: 'flex gap-0 border-b border-gray-200 dark:border-gray-800' };
  return <div className={cn(variants[variant], className)} {...props}>{children}</div>;
};

export interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { id: string; }
export const Tab: React.FC<TabProps> = ({ id, className, children, ...props }) => {
  const ctx = useContext(TabsContext); if (!ctx) throw new Error('Tab must be inside Tabs');
  const isActive = ctx.activeTab === id;
  return <button onClick={() => ctx.setActiveTab(id)} className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200', isActive ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200', className)} {...props}>{children}</button>;
};

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> { id: string; }
export const TabPanel: React.FC<TabPanelProps> = ({ id, className, children, ...props }) => {
  const ctx = useContext(TabsContext); if (!ctx) throw new Error('TabPanel must be inside Tabs');
  if (ctx.activeTab !== id) return null;
  return <div className={cn('animate-fade-in', className)} {...props}>{children}</div>;
};