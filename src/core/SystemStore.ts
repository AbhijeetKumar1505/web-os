// Zustand-based System State Management

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { SystemState, WebOSConfig, WebOSWindow, WebOSApp } from '../types';

const defaultConfig: WebOSConfig = {
  handTracking: {
    model: 'lite',
    maxHands: 2,
    confidenceThreshold: 0.6,
    smoothing: 0.6,
    flipHorizontal: true,
  },
  gestures: {
    'pinch': { gesture: 'pinch', action: 'drag', requireFocus: true, holdMillis: 80 },
    'open_palm': { gesture: 'open_palm', action: 'open-launcher', global: true },
    'push_forward': { gesture: 'push_forward', action: 'click', requireFocus: true },
    'swipe_left': { gesture: 'swipe_left', action: 'prev-desktop', global: true },
    'swipe_right': { gesture: 'swipe_right', action: 'next-desktop', global: true },
    'two_finger_swipe_down': { gesture: 'two_finger_pinch', action: 'minimize', requireFocus: true },
  },
  privacy: {
    localInferenceOnly: true,
    telemetryEnabled: false,
  },
  ui: {
    showHandCursor: true,
    gestureHints: true,
    accessibility: {
      highContrast: false,
      largeTargets: false,
      voiceFeedback: false,
    },
  },
};

interface SystemStoreState extends SystemState {
  // Actions
  setHandTrackingActive: (active: boolean) => void;
  setCameraPermission: (granted: boolean) => void;
  updateConfig: (config: Partial<WebOSConfig>) => void;
  addWindow: (window: WebOSWindow) => void;
  removeWindow: (windowId: string) => void;
  updateWindow: (windowId: string, updates: Partial<WebOSWindow>) => void;
  setFocusedWindow: (windowId: string | null) => void;
  registerApp: (app: WebOSApp) => void;
  updateHandCursor: (position: { x: number; y: number; visible: boolean }) => void;

  // Getters
  getWindow: (windowId: string) => WebOSWindow | undefined;
  getFocusedWindow: () => WebOSWindow | undefined;
  getApp: (appId: string) => WebOSApp | undefined;
  getConfig: () => WebOSConfig;
}

export const useSystemStore = create<SystemStoreState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isHandTrackingActive: false,
    cameraPermissionGranted: false,
    windows: [],
    apps: [],
    focusedWindowId: null,
    config: defaultConfig,
    handCursor: { x: 0, y: 0, visible: false },

    // Actions
    setHandTrackingActive: (active) => set({ isHandTrackingActive: active }),

    setCameraPermission: (granted) => set({ cameraPermissionGranted: granted }),

    updateConfig: (configUpdate) => set((state) => ({
      config: { ...state.config, ...configUpdate }
    })),

    addWindow: (window) => set((state) => ({
      windows: [...state.windows, window],
      focusedWindowId: window.id
    })),

    removeWindow: (windowId) => set((state) => ({
      windows: state.windows.filter(w => w.id !== windowId),
      focusedWindowId: state.focusedWindowId === windowId ? null : state.focusedWindowId
    })),

    updateWindow: (windowId, updates) => set((state) => ({
      windows: state.windows.map(w =>
        w.id === windowId ? { ...w, ...updates } : w
      )
    })),

    setFocusedWindow: (windowId) => set((state) => ({
      focusedWindowId: windowId,
      windows: state.windows.map(w => ({
        ...w,
        focused: w.id === windowId
      }))
    })),

    registerApp: (app) => set((state) => ({
      apps: [...state.apps.filter(a => a.id !== app.id), app]
    })),

    updateHandCursor: (position) => set({ handCursor: position }),

    // Getters
    getWindow: (windowId) => get().windows.find(w => w.id === windowId),

    getFocusedWindow: () => {
      const state = get();
      return state.windows.find(w => w.id === state.focusedWindowId);
    },

    getApp: (appId) => get().apps.find(a => a.id === appId),

    getConfig: () => get().config,
  }))
);

// Separate class for non-React usage
export class SystemStore {
  private config: WebOSConfig;

  constructor(initialConfig?: Partial<WebOSConfig>) {
    this.config = { ...defaultConfig, ...initialConfig };
  }

  getConfig(): WebOSConfig {
    return this.config;
  }

  updateConfig(updates: Partial<WebOSConfig>): void {
    this.config = { ...this.config, ...updates };
    useSystemStore.getState().updateConfig(updates);
  }

  setCameraPermission(granted: boolean): void {
    useSystemStore.getState().setCameraPermission(granted);
  }

  setHandTrackingActive(active: boolean): void {
    useSystemStore.getState().setHandTrackingActive(active);
  }

  updateHandCursor(position: { x: number; y: number; visible: boolean }): void {
    useSystemStore.getState().updateHandCursor(position);
  }
}
