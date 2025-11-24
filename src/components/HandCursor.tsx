// Hand Cursor Component

import React from 'react';
import { motion } from 'framer-motion';
import { useSystemStore } from '../core/SystemStore';

export const HandCursor: React.FC = () => {
  const { handCursor } = useSystemStore();

  if (!handCursor.visible) {
    return null;
  }

  return (
    <motion.div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: handCursor.x * window.innerWidth,
        top: handCursor.y * window.innerHeight,
      }}
      animate={{
        x: handCursor.x * window.innerWidth,
        y: handCursor.y * window.innerHeight,
      }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
      }}
    >
      {/* Main cursor */}
      <div className="relative">
        <motion.div
          className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Ripple effect */}
        <motion.div
          className="absolute inset-0 w-6 h-6 bg-blue-400 rounded-full opacity-30"
          animate={{
            scale: [1, 2, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    </motion.div>
  );
};
