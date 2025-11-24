// App Launcher Component

import React from 'react';
import { motion } from 'framer-motion';
import { useSystemStore } from '../core/SystemStore';

interface AppLauncherProps {
  windowId: string;
}

export const AppLauncher: React.FC<AppLauncherProps> = ({ windowId }) => {
  const { apps, removeWindow } = useSystemStore();

  const handleAppClick = (appId: string) => {
    // Open the selected app
    console.log(`Opening app: ${appId}`);
    
    // Close launcher after opening app
    removeWindow(windowId);
  };

  return (
    <div className="h-full bg-gradient-to-br from-webos-50 to-webos-100 dark:from-webos-800 dark:to-webos-900 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-webos-900 dark:text-white mb-2">
          Applications
        </h1>
        <p className="text-webos-600 dark:text-webos-300">
          Choose an application to launch
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {apps.map((app, index) => (
          <AppIcon
            key={app.id}
            app={app}
            index={index}
            onClick={() => handleAppClick(app.id)}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-webos-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            icon="⚙️"
            title="Settings"
            description="System configuration"
            onClick={() => handleAppClick('settings')}
          />
          <QuickAction
            icon="📁"
            title="File Manager"
            description="Browse files"
            onClick={() => handleAppClick('filemanager')}
          />
          <QuickAction
            icon="🌐"
            title="Web Browser"
            description="Browse the internet"
            onClick={() => handleAppClick('browser')}
          />
          <QuickAction
            icon="💻"
            title="Terminal"
            description="Command line interface"
            onClick={() => handleAppClick('terminal')}
          />
        </div>
      </div>
    </div>
  );
};

interface AppIconProps {
  app: any;
  index: number;
  onClick: () => void;
}

const AppIcon: React.FC<AppIconProps> = ({ app, index, onClick }) => {
  return (
    <motion.div
      className="flex flex-col items-center p-4 rounded-xl bg-white dark:bg-webos-700 shadow-sm hover:shadow-md cursor-pointer group transition-all duration-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className="w-12 h-12 text-3xl mb-2 group-hover:scale-110 transition-transform">
        {app.icon}
      </div>
      <span className="text-sm font-medium text-webos-900 dark:text-white text-center">
        {app.name}
      </span>
    </motion.div>
  );
};

interface QuickActionProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, title, description, onClick }) => {
  return (
    <motion.div
      className="flex items-center p-3 rounded-lg bg-white dark:bg-webos-700 shadow-sm hover:shadow-md cursor-pointer group transition-all duration-200"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="w-10 h-10 text-2xl mr-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <div className="font-medium text-webos-900 dark:text-white text-sm">
          {title}
        </div>
        <div className="text-xs text-webos-600 dark:text-webos-400">
          {description}
        </div>
      </div>
    </motion.div>
  );
};
