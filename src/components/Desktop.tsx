// Desktop Background Component

import React from 'react';
import { motion } from 'framer-motion';

export const Desktop: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-webos-900 via-webos-800 to-webos-900">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)
            `,
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Desktop Icons Area */}
      <div className="absolute top-8 left-8 space-y-4">
        {/* Quick Access Icons */}
        <DesktopIcon
          icon="🗂️"
          label="Files"
          onClick={() => console.log('Open Files')}
        />
        <DesktopIcon
          icon="⚙️"
          label="Settings"
          onClick={() => console.log('Open Settings')}
        />
        <DesktopIcon
          icon="🌐"
          label="Browser"
          onClick={() => console.log('Open Browser')}
        />
      </div>

      {/* Welcome Message (shown when no windows are open) */}
      <WelcomeMessage />
    </div>
  );
};

interface DesktopIconProps {
  icon: string;
  label: string;
  onClick: () => void;
}

const DesktopIcon: React.FC<DesktopIconProps> = ({ icon, label, onClick }) => {
  return (
    <motion.div
      className="flex flex-col items-center cursor-pointer group"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className="w-16 h-16 bg-white bg-opacity-10 rounded-xl flex items-center justify-center text-2xl mb-2 group-hover:bg-opacity-20 transition-all duration-200">
        {icon}
      </div>
      <span className="text-white text-sm text-center max-w-16 truncate">
        {label}
      </span>
    </motion.div>
  );
};

const WelcomeMessage: React.FC = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 1 }}
    >
      <div className="text-center text-white">
        <motion.h1 
          className="text-6xl font-light mb-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          WebOS
        </motion.h1>
        <motion.p 
          className="text-xl text-webos-300 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          Hand-Tracking Control Interface
        </motion.p>
        <motion.div 
          className="space-y-2 text-webos-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8 }}
        >
          <p className="flex items-center justify-center space-x-2">
            <span>👋</span>
            <span>Wave your hand to open the launcher</span>
          </p>
          <p className="flex items-center justify-center space-x-2">
            <span>👌</span>
            <span>Pinch to drag and interact</span>
          </p>
          <p className="flex items-center justify-center space-x-2">
            <span>👆</span>
            <span>Point forward to click</span>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};
