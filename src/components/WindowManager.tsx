// Window Manager Component

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemStore } from '../core/SystemStore';
import { Window } from './Window';

export const WindowManager: React.FC = () => {
  const { windows } = useSystemStore();

  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence>
        {windows.map((window) => (
          <React.Suspense
            key={window.id}
            fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-50">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }
          >
            <Window window={window} />
          </React.Suspense>
        ))}
      </AnimatePresence>
    </div>
  );
};
