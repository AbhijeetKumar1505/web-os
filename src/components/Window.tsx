// Individual Window Component

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSystemStore } from '../core/SystemStore';
import type { WebOSWindow } from '../types';

interface WindowProps {
  window: WebOSWindow;
}

export const Window: React.FC<WindowProps> = ({ window }) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const { updateWindow, setFocusedWindow, removeWindow } = useSystemStore();

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFocusedWindow(window.id);
  };

  const handleClose = () => {
    removeWindow(window.id);
  };

  const handleMinimize = () => {
    updateWindow(window.id, { minimized: true });
  };

  const handleMaximize = () => {
    updateWindow(window.id, { maximized: !window.maximized });
  };

  // Don't render minimized windows
  if (window.minimized) {
    return null;
  }

  const windowStyle = window.maximized
    ? { x: 0, y: 0, width: '100vw', height: '100vh' }
    : {
        x: window.position.x,
        y: window.position.y,
        width: window.size.width,
        height: window.size.height,
      };

  return (
    <motion.div
      ref={windowRef}
      data-window-id={window.id}
      className={`absolute pointer-events-auto bg-white dark:bg-webos-800 rounded-lg shadow-2xl border border-webos-600 overflow-hidden ${
        window.focused ? 'ring-2 ring-blue-500' : ''
      }`}
      style={{
        zIndex: window.zIndex,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
        ...windowStyle,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onMouseDown={handleMouseDown}
    >
      {/* Title Bar */}
      <div
        data-window-titlebar
        className={`flex items-center justify-between px-4 py-2 bg-webos-700 text-white cursor-move select-none ${
          window.focused ? 'bg-blue-600' : 'bg-webos-600'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className="font-medium">{window.title}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Minimize Button */}
          <button
            onClick={handleMinimize}
            className="w-6 h-6 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center text-xs text-white"
            title="Minimize"
          >
            −
          </button>
          
          {/* Maximize Button */}
          <button
            onClick={handleMaximize}
            className="w-6 h-6 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-xs text-white"
            title={window.maximized ? 'Restore' : 'Maximize'}
          >
            {window.maximized ? '⧉' : '□'}
          </button>
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-xs text-white"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-webos-800">
        <div className="w-full h-full p-4">
          {React.createElement(window.component, {
            ...window.props,
            windowId: window.id,
          })}
        </div>
      </div>

      {/* Resize Handles (if resizable) */}
      {window.resizable && !window.maximized && (
        <>
          {/* Corner resize handles */}
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-webos-600 opacity-50 hover:opacity-75"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize bg-webos-600 opacity-50 hover:opacity-75"></div>
          <div className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize bg-webos-600 opacity-50 hover:opacity-75"></div>
          <div className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize bg-webos-600 opacity-50 hover:opacity-75"></div>
          
          {/* Edge resize handles */}
          <div className="absolute top-0 left-4 right-4 h-2 cursor-n-resize"></div>
          <div className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize"></div>
          <div className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize"></div>
          <div className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize"></div>
        </>
      )}
    </motion.div>
  );
};
