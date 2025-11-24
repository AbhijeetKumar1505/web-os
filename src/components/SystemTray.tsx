// System Tray Component

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemStore } from '../core/SystemStore';

export const SystemTray: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    windows, 
    isHandTrackingActive, 
    cameraPermissionGranted,
    config 
  } = useSystemStore();

  const currentTime = new Date().toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const minimizedWindows = windows.filter(w => w.minimized);

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* System Tray Bar */}
      <div className="bg-webos-800 bg-opacity-90 backdrop-blur-md border-t border-webos-600 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left Side - App Launcher */}
          <div className="flex items-center space-x-2">
            <LauncherButton />
            
            {/* Running Apps */}
            <div className="flex items-center space-x-1">
              {windows.filter(w => !w.minimized).map(window => (
                <RunningAppIndicator key={window.id} window={window} />
              ))}
            </div>
          </div>

          {/* Center - Minimized Windows */}
          <div className="flex items-center space-x-1">
            {minimizedWindows.map(window => (
              <MinimizedWindow key={window.id} window={window} />
            ))}
          </div>

          {/* Right Side - System Status */}
          <div className="flex items-center space-x-4">
            <SystemStatus />
            <div className="text-white font-mono text-sm">
              {currentTime}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded System Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="absolute bottom-full left-0 right-0 bg-webos-800 bg-opacity-95 backdrop-blur-md border-t border-webos-600 p-4"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SystemPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const LauncherButton: React.FC = () => {
  return (
    <motion.button
      className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center text-white text-xl"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        // Open app launcher
        console.log('Open launcher');
      }}
    >
      🚀
    </motion.button>
  );
};

interface RunningAppIndicatorProps {
  window: any;
}

const RunningAppIndicator: React.FC<RunningAppIndicatorProps> = ({ window }) => {
  const { setFocusedWindow } = useSystemStore();

  return (
    <motion.button
      className={`px-3 py-1 rounded text-sm transition-colors ${
        window.focused 
          ? 'bg-blue-600 text-white' 
          : 'bg-webos-700 text-webos-300 hover:bg-webos-600'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setFocusedWindow(window.id)}
    >
      {window.title}
    </motion.button>
  );
};

interface MinimizedWindowProps {
  window: any;
}

const MinimizedWindow: React.FC<MinimizedWindowProps> = ({ window }) => {
  const { updateWindow, setFocusedWindow } = useSystemStore();

  const handleRestore = () => {
    updateWindow(window.id, { minimized: false });
    setFocusedWindow(window.id);
  };

  return (
    <motion.button
      className="px-2 py-1 bg-webos-700 hover:bg-webos-600 rounded text-xs text-webos-300"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleRestore}
      title={`Restore ${window.title}`}
    >
      📄 {window.title}
    </motion.button>
  );
};

const SystemStatus: React.FC = () => {
  const { isHandTrackingActive, cameraPermissionGranted } = useSystemStore();

  return (
    <div className="flex items-center space-x-2">
      {/* Hand Tracking Status */}
      <div 
        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
          isHandTrackingActive 
            ? 'bg-green-600 text-white' 
            : 'bg-webos-700 text-webos-400'
        }`}
        title={isHandTrackingActive ? 'Hand tracking active' : 'Hand tracking inactive'}
      >
        <span>👋</span>
        <span>{isHandTrackingActive ? 'ON' : 'OFF'}</span>
      </div>

      {/* Camera Status */}
      {cameraPermissionGranted && (
        <div 
          className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-blue-600 text-white"
          title="Camera access granted"
        >
          <span>📷</span>
        </div>
      )}

      {/* Network Status */}
      <div 
        className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-green-600 text-white"
        title="Online"
      >
        <span>🌐</span>
      </div>
    </div>
  );
};

const SystemPanel: React.FC = () => {
  const { config, updateConfig } = useSystemStore();

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Quick Settings */}
      <div className="space-y-2">
        <h3 className="text-white font-semibold mb-2">Quick Settings</h3>
        
        <ToggleButton
          label="Hand Cursor"
          enabled={config.ui.showHandCursor}
          onChange={(enabled) => updateConfig({
            ui: { ...config.ui, showHandCursor: enabled }
          })}
        />
        
        <ToggleButton
          label="Gesture Hints"
          enabled={config.ui.gestureHints}
          onChange={(enabled) => updateConfig({
            ui: { ...config.ui, gestureHints: enabled }
          })}
        />
        
        <ToggleButton
          label="High Contrast"
          enabled={config.ui.accessibility.highContrast}
          onChange={(enabled) => updateConfig({
            ui: { 
              ...config.ui, 
              accessibility: { 
                ...config.ui.accessibility, 
                highContrast: enabled 
              }
            }
          })}
        />
      </div>

      {/* System Info */}
      <div className="space-y-2">
        <h3 className="text-white font-semibold mb-2">System Info</h3>
        <div className="text-webos-300 text-sm space-y-1">
          <div>WebOS v1.0.0</div>
          <div>Hand Tracking: {config.handTracking.model}</div>
          <div>Max Hands: {config.handTracking.maxHands}</div>
          <div>Confidence: {(config.handTracking.confidenceThreshold * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-white font-semibold mb-2">Quick Actions</h3>
        <div className="space-y-1">
          <QuickActionButton icon="⚙️" label="Settings" />
          <QuickActionButton icon="📁" label="Files" />
          <QuickActionButton icon="🎨" label="Drawing" />
          <QuickActionButton icon="🌐" label="Browser" />
        </div>
      </div>
    </div>
  );
};

interface ToggleButtonProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ label, enabled, onChange }) => {
  return (
    <button
      className={`flex items-center justify-between w-full px-3 py-2 rounded text-sm transition-colors ${
        enabled 
          ? 'bg-blue-600 text-white' 
          : 'bg-webos-700 text-webos-300 hover:bg-webos-600'
      }`}
      onClick={() => onChange(!enabled)}
    >
      <span>{label}</span>
      <span>{enabled ? '✓' : '○'}</span>
    </button>
  );
};

interface QuickActionButtonProps {
  icon: string;
  label: string;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon, label }) => {
  return (
    <button className="flex items-center space-x-2 w-full px-3 py-2 bg-webos-700 hover:bg-webos-600 rounded text-sm text-webos-300 transition-colors">
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
};
