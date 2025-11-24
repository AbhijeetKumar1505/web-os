// Main WebOS Shell Component

import React, { useEffect, useRef } from 'react';
import { WebOS } from '../core/WebOS';
import { WindowManager } from './WindowManager';
import { HandCursor } from './HandCursor';
import { SystemTray } from './SystemTray';
import { Desktop } from './Desktop';
import { GestureHints } from './GestureHints';
import { CameraFeed, CameraFeedSettings } from './CameraFeed';
import { useSystemStore } from '../core/SystemStore';

interface WebOSShellProps {
  enableHandTracking?: boolean;
  showGestureHints?: boolean;
  showCameraFeed?: boolean;
}

export const WebOSShell: React.FC<WebOSShellProps> = ({
  enableHandTracking = true,
  showGestureHints = true,
  showCameraFeed = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const webosRef = useRef<WebOS | null>(null);
  const { isHandTrackingActive, config } = useSystemStore();

  useEffect(() => {
    const initializeWebOS = async () => {
      if (!containerRef.current) return;

      try {
        const webos = await WebOS.init({
          container: containerRef.current,
          enableHandTracking,
          handTrackingOptions: config.handTracking,
          config,
        });

        webosRef.current = webos;
      } catch (error) {
        console.error('Failed to initialize WebOS:', error);
      }
    };

    initializeWebOS();

    return () => {
      if (webosRef.current) {
        webosRef.current.destroy();
      }
    };
  }, [enableHandTracking, config]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-gradient-to-br from-webos-900 via-webos-800 to-webos-900 overflow-hidden"
    >
      {/* Desktop Background */}
      <Desktop />

      {/* Window Manager */}
      <WindowManager />

      {/* System Tray */}
      <SystemTray />

      {/* Hand Cursor */}
      {isHandTrackingActive && config.ui.showHandCursor && (
        <HandCursor />
      )}

      {/* Gesture Hints */}
      {showGestureHints && config.ui.gestureHints && (
        <GestureHints />
      )}

      {/* Camera Feed */}
      {showCameraFeed && webosRef.current && (
        <CameraFeed 
          showFeed={true}
          showLandmarks={true}
          size="small"
          position="top-right"
          webosInstance={webosRef.current}
        />
      )}

      {/* Camera Settings */}
      {isHandTrackingActive && (
        <div className="fixed top-4 right-48 z-50">
          <CameraFeedSettings />
        </div>
      )}

      {/* Accessibility Overlay */}
      {config.ui.accessibility.highContrast && (
        <div className="fixed inset-0 pointer-events-none bg-black bg-opacity-20 z-40"></div>
      )}
    </div>
  );
};
