// Settings Application - System Configuration Interface

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSystemStore } from '../core/SystemStore';

interface SettingsAppProps {
  windowId: string;
}

type SettingsTab = 'handtracking' | 'privacy' | 'ui' | 'gestures' | 'about';

export const SettingsApp: React.FC<SettingsAppProps> = ({ windowId }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('handtracking');
  const { config, updateConfig, isHandTrackingActive, cameraPermissionGranted } = useSystemStore();

  const tabs = [
    { id: 'handtracking', name: 'Hand Tracking', icon: '👋' },
    { id: 'privacy', name: 'Privacy', icon: '🔒' },
    { id: 'ui', name: 'Interface', icon: '🎨' },
    { id: 'gestures', name: 'Gestures', icon: '✋' },
    { id: 'about', name: 'About', icon: 'ℹ️' },
  ];

  const handleConfigUpdate = (updates: any) => {
    updateConfig(updates);
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Settings
          </h1>
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'handtracking' && (
              <HandTrackingSettings config={config} onUpdate={handleConfigUpdate} />
            )}
            {activeTab === 'privacy' && (
              <PrivacySettings config={config} onUpdate={handleConfigUpdate} />
            )}
            {activeTab === 'ui' && (
              <UISettings config={config} onUpdate={handleConfigUpdate} />
            )}
            {activeTab === 'gestures' && (
              <GestureSettings config={config} onUpdate={handleConfigUpdate} />
            )}
            {activeTab === 'about' && (
              <AboutSettings />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Hand Tracking Settings Panel
const HandTrackingSettings: React.FC<{ config: any; onUpdate: (updates: any) => void }> = ({
  config,
  onUpdate,
}) => {
  const { isHandTrackingActive, cameraPermissionGranted } = useSystemStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Hand Tracking Configuration
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure hand tracking settings for optimal performance and accuracy.
        </p>
      </div>

      {/* Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Camera Permission</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              cameraPermissionGranted 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            }`}>
              {cameraPermissionGranted ? 'Granted' : 'Not Granted'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Hand Tracking</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              isHandTrackingActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {isHandTrackingActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Model Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Model Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model Quality
            </label>
            <select
              value={config.handTracking.model}
              onChange={(e) => onUpdate({
                handTracking: {
                  ...config.handTracking,
                  model: e.target.value as 'lite' | 'full'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="lite">Lite (Faster, Less Accurate)</option>
              <option value="full">Full (Slower, More Accurate)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Hands: {config.handTracking.maxHands}
            </label>
            <input
              type="range"
              min="1"
              max="4"
              value={config.handTracking.maxHands}
              onChange={(e) => onUpdate({
                handTracking: {
                  ...config.handTracking,
                  maxHands: parseInt(e.target.value)
                }
              })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Detection Confidence: {(config.handTracking.confidenceThreshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={config.handTracking.confidenceThreshold}
              onChange={(e) => onUpdate({
                handTracking: {
                  ...config.handTracking,
                  confidenceThreshold: parseFloat(e.target.value)
                }
              })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>10%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Smoothing: {(config.handTracking.smoothing * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={config.handTracking.smoothing}
              onChange={(e) => onUpdate({
                handTracking: {
                  ...config.handTracking,
                  smoothing: parseFloat(e.target.value)
                }
              })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>No Smoothing</span>
              <span>Heavy Smoothing</span>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="flipHorizontal"
              checked={config.handTracking.flipHorizontal}
              onChange={(e) => onUpdate({
                handTracking: {
                  ...config.handTracking,
                  flipHorizontal: e.target.checked
                }
              })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="flipHorizontal" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Mirror camera horizontally (recommended for natural interaction)
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// Privacy Settings Panel
const PrivacySettings: React.FC<{ config: any; onUpdate: (updates: any) => void }> = ({
  config,
  onUpdate,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Privacy & Security
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Control how your data is processed and stored.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Data Processing</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Local Processing Only</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                All hand tracking runs locally in your browser
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.privacy.localInferenceOnly}
              onChange={(e) => onUpdate({
                privacy: {
                  ...config.privacy,
                  localInferenceOnly: e.target.checked
                }
              })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Anonymous Telemetry</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Send anonymous usage statistics to improve the system
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.privacy.telemetryEnabled}
              onChange={(e) => onUpdate({
                privacy: {
                  ...config.privacy,
                  telemetryEnabled: e.target.checked
                }
              })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-blue-600 dark:text-blue-400 mr-3 mt-0.5">🔒</div>
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-300">Privacy Guarantee</h4>
            <p className="text-sm text-blue-800 dark:text-blue-400 mt-1">
              Your camera data never leaves your device. All hand tracking processing happens locally in your browser using TensorFlow.js.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// UI Settings Panel
const UISettings: React.FC<{ config: any; onUpdate: (updates: any) => void }> = ({
  config,
  onUpdate,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          User Interface
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Customize the appearance and behavior of the interface.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Visual Elements</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Show Hand Cursor</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Display a cursor that follows your hand position
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.ui.showHandCursor}
              onChange={(e) => onUpdate({
                ui: {
                  ...config.ui,
                  showHandCursor: e.target.checked
                }
              })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Gesture Hints</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Show helpful gesture tutorials and hints
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.ui.gestureHints}
              onChange={(e) => onUpdate({
                ui: {
                  ...config.ui,
                  gestureHints: e.target.checked
                }
              })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Accessibility</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">High Contrast Mode</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Increase contrast for better visibility
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.ui.accessibility.highContrast}
              onChange={(e) => onUpdate({
                ui: {
                  ...config.ui,
                  accessibility: {
                    ...config.ui.accessibility,
                    highContrast: e.target.checked
                  }
                }
              })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Large Targets</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Make buttons and interactive elements larger
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.ui.accessibility.largeTargets}
              onChange={(e) => onUpdate({
                ui: {
                  ...config.ui,
                  accessibility: {
                    ...config.ui.accessibility,
                    largeTargets: e.target.checked
                  }
                }
              })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Voice Feedback</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Provide audio feedback for actions
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.ui.accessibility.voiceFeedback}
              onChange={(e) => onUpdate({
                ui: {
                  ...config.ui,
                  accessibility: {
                    ...config.ui.accessibility,
                    voiceFeedback: e.target.checked
                  }
                }
              })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Gesture Settings Panel
const GestureSettings: React.FC<{ config: any; onUpdate: (updates: any) => void }> = ({
  config,
  onUpdate,
}) => {
  const gestures = Object.entries(config.gestures || {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Gesture Mappings
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Customize how gestures control the system.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Current Mappings</h3>
        <div className="space-y-3">
          {gestures.map(([gestureType, mapping]: [string, any]) => (
            <div key={gestureType} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white capitalize">
                  {gestureType.replace('_', ' ')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Action: {mapping.action}
                  {mapping.global && ' (Global)'}
                  {mapping.requireFocus && ' (Requires Focus)'}
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {mapping.holdMillis && `${mapping.holdMillis}ms hold`}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5">⚠️</div>
          <div>
            <h4 className="font-medium text-yellow-900 dark:text-yellow-300">Advanced Configuration</h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-400 mt-1">
              Gesture mapping customization will be available in a future update. Current mappings are optimized for the best user experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// About Settings Panel
const AboutSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          About WebOS
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Information about this hand-tracking web operating system.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">👋</div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">WebOS</h3>
          <p className="text-gray-600 dark:text-gray-400">Hand-Tracking Control Interface</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-700 dark:text-gray-300">Version</span>
            <span className="font-medium text-gray-900 dark:text-white">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 dark:text-gray-300">Build Date</span>
            <span className="font-medium text-gray-900 dark:text-white">November 2024</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 dark:text-gray-300">Hand Tracking</span>
            <span className="font-medium text-gray-900 dark:text-white">TensorFlow.js HandPose</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 dark:text-gray-300">Framework</span>
            <span className="font-medium text-gray-900 dark:text-white">React + TypeScript</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Features</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Real-time hand tracking with TensorFlow.js
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Privacy-first local processing
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Gesture-controlled window management
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Progressive Web App (PWA) support
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Accessibility features and fallbacks
          </li>
        </ul>
      </div>
    </div>
  );
};
