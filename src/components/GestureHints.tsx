// Gesture Hints Component

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemStore } from '../core/SystemStore';

interface GestureHint {
  id: string;
  gesture: string;
  description: string;
  icon: string;
  position: { x: number; y: number };
  timeout?: number;
}

export const GestureHints: React.FC = () => {
  const [hints, setHints] = useState<GestureHint[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const { isHandTrackingActive, windows } = useSystemStore();

  useEffect(() => {
    // Show initial tutorial if no windows are open
    if (isHandTrackingActive && windows.length === 0) {
      setShowTutorial(true);
    }
  }, [isHandTrackingActive, windows.length]);

  useEffect(() => {
    // Auto-hide tutorial after 10 seconds
    if (showTutorial) {
      const timer = setTimeout(() => {
        setShowTutorial(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showTutorial]);

  const addHint = (hint: Omit<GestureHint, 'id'>) => {
    const id = `hint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newHint = { ...hint, id };
    
    setHints(prev => [...prev, newHint]);

    // Auto-remove hint after timeout
    if (hint.timeout) {
      setTimeout(() => {
        setHints(prev => prev.filter(h => h.id !== id));
      }, hint.timeout);
    }
  };

  const removeHint = (id: string) => {
    setHints(prev => prev.filter(h => h.id !== id));
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <TutorialOverlay onClose={() => setShowTutorial(false)} />
        )}
      </AnimatePresence>

      {/* Dynamic Hints */}
      <AnimatePresence>
        {hints.map(hint => (
          <GestureHintBubble
            key={hint.id}
            hint={hint}
            onClose={() => removeHint(hint.id)}
          />
        ))}
      </AnimatePresence>

      {/* Contextual Hints */}
      <ContextualHints />
    </div>
  );
};

interface TutorialOverlayProps {
  onClose: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
  return (
    <motion.div
      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center pointer-events-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-webos-800 rounded-xl p-8 max-w-2xl mx-4 border border-webos-600"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Hand Gesture Tutorial</h2>
          <button
            onClick={onClose}
            className="text-webos-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <GestureTutorialItem
            icon="👋"
            title="Open Palm"
            description="Show your open palm to open the app launcher"
            animation="wave"
          />
          <GestureTutorialItem
            icon="👌"
            title="Pinch"
            description="Pinch with thumb and index finger to drag windows"
            animation="pinch"
          />
          <GestureTutorialItem
            icon="👆"
            title="Point Forward"
            description="Point your index finger forward to click"
            animation="point"
          />
          <GestureTutorialItem
            icon="✋"
            title="Swipe"
            description="Swipe left or right to navigate between desktops"
            animation="swipe"
          />
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Got it!
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface GestureTutorialItemProps {
  icon: string;
  title: string;
  description: string;
  animation: string;
}

const GestureTutorialItem: React.FC<GestureTutorialItemProps> = ({
  icon,
  title,
  description,
  animation,
}) => {
  return (
    <div className="text-center">
      <motion.div
        className="text-4xl mb-2"
        animate={getAnimationVariants(animation)}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      >
        {icon}
      </motion.div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-webos-300 text-sm">{description}</p>
    </div>
  );
};

const getAnimationVariants = (animation: string) => {
  switch (animation) {
    case 'wave':
      return { rotate: [-10, 10, -10] };
    case 'pinch':
      return { scale: [1, 0.8, 1] };
    case 'point':
      return { x: [0, 10, 0] };
    case 'swipe':
      return { x: [-10, 10, -10] };
    default:
      return {};
  }
};

interface GestureHintBubbleProps {
  hint: GestureHint;
  onClose: () => void;
}

const GestureHintBubble: React.FC<GestureHintBubbleProps> = ({ hint, onClose }) => {
  return (
    <motion.div
      className="absolute pointer-events-auto"
      style={{
        left: hint.position.x,
        top: hint.position.y,
      }}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      <div className="bg-webos-800 bg-opacity-95 backdrop-blur-sm rounded-lg p-3 border border-webos-600 shadow-lg max-w-xs">
        <div className="flex items-start space-x-2">
          <span className="text-xl">{hint.icon}</span>
          <div className="flex-1">
            <div className="font-medium text-white text-sm">{hint.gesture}</div>
            <div className="text-webos-300 text-xs">{hint.description}</div>
          </div>
          <button
            onClick={onClose}
            className="text-webos-400 hover:text-white text-sm"
          >
            ×
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ContextualHints: React.FC = () => {
  const { windows, focusedWindowId } = useSystemStore();
  const focusedWindow = windows.find(w => w.id === focusedWindowId);

  return (
    <>
      {/* Show window controls hint when a window is focused */}
      {focusedWindow && (
        <motion.div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="bg-webos-800 bg-opacity-90 backdrop-blur-sm rounded-lg px-4 py-2 border border-webos-600">
            <div className="flex items-center space-x-4 text-sm text-webos-300">
              <span className="flex items-center space-x-1">
                <span>👌</span>
                <span>Drag</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>✌️</span>
                <span>Resize</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>✊</span>
                <span>Close</span>
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Show launcher hint when no windows are open */}
      {windows.length === 0 && (
        <motion.div
          className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className="bg-webos-800 bg-opacity-90 backdrop-blur-sm rounded-lg px-4 py-2 border border-webos-600">
            <div className="flex items-center space-x-2 text-sm text-webos-300">
              <motion.span
                className="text-xl"
                animate={{ rotate: [-10, 10, -10] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                👋
              </motion.span>
              <span>Wave your hand to open the launcher</span>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};
