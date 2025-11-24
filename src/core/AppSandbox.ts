// App Sandbox and Runtime Environment

import React from 'react';
import type { WebOSApp, GestureEvent, AppCapability } from '../types';
import { useSystemStore } from './SystemStore';

interface AppInstance {
  app: WebOSApp;
  windowId: string;
  capabilities: Set<string>;
  gestureSubscriptions: Map<string, (event: GestureEvent) => void>;
}

export class AppSandbox {
  private appInstances = new Map<string, AppInstance>();
  private registeredApps = new Map<string, WebOSApp>();

  async initialize(): Promise<void> {
    // Register built-in apps
    this.registerBuiltInApps();
  }

  private registerBuiltInApps(): void {
    // Import components dynamically to avoid circular dependencies
    const AppLauncher = React.lazy(() => import('../apps/AppLauncher').then(m => ({ default: m.AppLauncher })));
    const DrawingApp = React.lazy(() => import('../apps/DrawingApp').then(m => ({ default: m.DrawingApp })));
    const SettingsApp = React.lazy(() => import('../apps/SettingsApp').then(m => ({ default: m.SettingsApp })));
    const FileManagerApp = React.lazy(() => import('../apps/FileManagerApp').then(m => ({ default: m.FileManagerApp })));
    const WebBrowserApp = React.lazy(() => import('../apps/WebBrowserApp').then(m => ({ default: m.WebBrowserApp })));
    const TerminalApp = React.lazy(() => import('../apps/TerminalApp').then(m => ({ default: m.TerminalApp })));
    const CalculatorApp = React.lazy(() => import('../apps/CalculatorApp').then(m => ({ default: m.CalculatorApp })));
    const TextEditorApp = React.lazy(() => import('../apps/TextEditorApp').then(m => ({ default: m.TextEditorApp })));
    
    // App Launcher
    this.registerApp({
      id: 'launcher',
      name: 'App Launcher',
      icon: '🚀',
      component: AppLauncher,
      capabilities: [],
    });

    // Settings App
    this.registerApp({
      id: 'settings',
      name: 'Settings',
      icon: '⚙️',
      component: SettingsApp,
      capabilities: [
        { name: 'system-config', description: 'Modify system configuration', required: true }
      ],
    });

    // File Manager
    this.registerApp({
      id: 'filemanager',
      name: 'File Manager',
      icon: '📁',
      component: FileManagerApp,
      capabilities: [],
    });

    // Drawing App (example)
    this.registerApp({
      id: 'drawing',
      name: 'Drawing App',
      icon: '🎨',
      component: DrawingApp,
      capabilities: [
        { name: 'gesture-read', description: 'Receive gesture events', required: true }
      ],
      gestureHandlers: {
        pinch: (event) => {
          console.log('Drawing app received pinch gesture:', event);
        },
        push_forward: (event) => {
          console.log('Drawing app received push gesture:', event);
        }
      }
    });

    // Web Browser
    this.registerApp({
      id: 'browser',
      name: 'Web Browser',
      icon: '🌐',
      component: WebBrowserApp,
      capabilities: [
        { name: 'network-access', description: 'Access external websites', required: true }
      ],
    });

    // Terminal
    this.registerApp({
      id: 'terminal',
      name: 'Terminal',
      icon: '💻',
      component: TerminalApp,
      capabilities: [
        { name: 'system-commands', description: 'Execute system commands', required: false }
      ],
    });

    // Calculator
    this.registerApp({
      id: 'calculator',
      name: 'Calculator',
      icon: '🔢',
      component: CalculatorApp,
      capabilities: [],
    });

    // Text Editor
    this.registerApp({
      id: 'texteditor',
      name: 'Text Editor',
      icon: '📝',
      component: TextEditorApp,
      capabilities: [
        { name: 'file-access', description: 'Read and write text files', required: false }
      ],
    });
  }

  registerApp(app: WebOSApp): void {
    this.registeredApps.set(app.id, app);
    
    // Update system store
    const store = useSystemStore.getState();
    store.registerApp(app);
  }

  getRegisteredApps(): WebOSApp[] {
    return Array.from(this.registeredApps.values());
  }

  getApp(appId: string): WebOSApp | undefined {
    return this.registeredApps.get(appId);
  }

  createAppInstance(appId: string, windowId: string): AppInstance | null {
    const app = this.registeredApps.get(appId);
    if (!app) return null;

    const instance: AppInstance = {
      app,
      windowId,
      capabilities: new Set(),
      gestureSubscriptions: new Map(),
    };

    this.appInstances.set(windowId, instance);
    return instance;
  }

  removeAppInstance(windowId: string): void {
    const instance = this.appInstances.get(windowId);
    if (instance) {
      // Clean up gesture subscriptions
      instance.gestureSubscriptions.clear();
      this.appInstances.delete(windowId);
    }
  }

  async requestCapability(windowId: string, capability: string): Promise<boolean> {
    const instance = this.appInstances.get(windowId);
    if (!instance) return false;

    // Check if app declares this capability
    const appCapability = instance.app.capabilities.find(c => c.name === capability);
    if (!appCapability) {
      console.warn(`App ${instance.app.name} requesting undeclared capability: ${capability}`);
      return false;
    }

    // For now, auto-grant all capabilities
    // In a real implementation, this would show a permission dialog
    instance.capabilities.add(capability);
    return true;
  }

  hasCapability(windowId: string, capability: string): boolean {
    const instance = this.appInstances.get(windowId);
    return instance ? instance.capabilities.has(capability) : false;
  }

  forwardGestureToApp(windowId: string, event: GestureEvent): void {
    const instance = this.appInstances.get(windowId);
    if (!instance) return;

    // Check if app has gesture-read capability
    if (!instance.capabilities.has('gesture-read')) {
      return;
    }

    // Forward to app's gesture handler if it exists
    const handler = instance.app.gestureHandlers?.[event.type];
    if (handler) {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in app gesture handler for ${instance.app.name}:`, error);
      }
    }

    // Also forward to any subscribed handlers
    const subscription = instance.gestureSubscriptions.get(event.type);
    if (subscription) {
      try {
        subscription(event);
      } catch (error) {
        console.error(`Error in app gesture subscription for ${instance.app.name}:`, error);
      }
    }
  }

  subscribeToGesture(
    windowId: string, 
    gestureType: string, 
    handler: (event: GestureEvent) => void
  ): () => void {
    const instance = this.appInstances.get(windowId);
    if (!instance) {
      return () => {};
    }

    // Check capability
    if (!instance.capabilities.has('gesture-read')) {
      throw new Error('App does not have gesture-read capability');
    }

    instance.gestureSubscriptions.set(gestureType, handler);

    // Return unsubscribe function
    return () => {
      instance.gestureSubscriptions.delete(gestureType);
    };
  }

  // Sandbox security methods
  validateAppCode(appCode: string): boolean {
    // In a real implementation, this would validate that the app code
    // doesn't contain dangerous operations
    
    // Basic checks for dangerous APIs
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /document\.write/,
      /innerHTML\s*=/,
      /outerHTML\s*=/,
    ];

    return !dangerousPatterns.some(pattern => pattern.test(appCode));
  }

  createSecureContext(windowId: string): any {
    const instance = this.appInstances.get(windowId);
    if (!instance) return null;

    // Create a limited API surface for the app
    return {
      // Gesture API
      gestures: {
        subscribe: (callback: (event: GestureEvent) => void) => {
          if (!instance.capabilities.has('gesture-read')) {
            throw new Error('Gesture read capability required');
          }
          return this.subscribeToGesture(windowId, 'all', callback);
        }
      },

      // Storage API (scoped to app)
      storage: {
        get: (key: string) => {
          return localStorage.getItem(`app-${instance.app.id}-${key}`);
        },
        set: (key: string, value: string) => {
          localStorage.setItem(`app-${instance.app.id}-${key}`, value);
        },
        remove: (key: string) => {
          localStorage.removeItem(`app-${instance.app.id}-${key}`);
        }
      },

      // System API (limited)
      system: {
        getAppInfo: () => ({
          id: instance.app.id,
          name: instance.app.name,
          capabilities: Array.from(instance.capabilities)
        }),
        
        requestCapability: async (capability: string) => {
          return this.requestCapability(windowId, capability);
        },

        showNotification: (message: string) => {
          // In a real implementation, this would show a system notification
          console.log(`Notification from ${instance.app.name}: ${message}`);
        }
      }
    };
  }

  destroy(): void {
    // Clean up all app instances
    for (const [windowId] of this.appInstances) {
      this.removeAppInstance(windowId);
    }
    this.registeredApps.clear();
  }
}
