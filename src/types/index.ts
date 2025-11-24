// Core WebOS Types and Interfaces

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface HandTrackingResult {
  landmarks: HandLandmark[];
  handedness: 'Left' | 'Right';
  confidence: number;
  timestamp: number;
}

export interface GestureEvent {
  id?: string;
  type: GestureType;
  confidence: number;
  normalizedPosition: { x: number; y: number };
  handedness: 'Left' | 'Right';
  timestamp: number;
  data?: any;
}

export type GestureType = 
  | 'open_palm'
  | 'closed_fist'
  | 'thumbs_up'
  | 'thumbs_down'
  | 'swipe_left'
  | 'swipe_right'
  | 'push_forward'
  | 'pinch'
  | 'pinch_rotate'
  | 'two_finger_spread'
  | 'two_finger_pinch'
  | 'gesture_combo';

export interface GestureMapping {
  gesture: GestureType;
  action: string;
  requireFocus?: boolean;
  global?: boolean;
  holdMillis?: number;
  confidenceThreshold?: number;
  continuous?: boolean;
}

export interface WebOSWindow {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  props?: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  focused: boolean;
  resizable: boolean;
  draggable: boolean;
}

export interface AppCapability {
  name: string;
  description: string;
  required: boolean;
}

export interface WebOSApp {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType<any>;
  capabilities: AppCapability[];
  gestureHandlers?: Partial<Record<GestureType, (event: GestureEvent) => void>>;
}

export interface HandTrackingConfig {
  model: 'lite' | 'full';
  maxHands: number;
  confidenceThreshold: number;
  smoothing: number;
  flipHorizontal: boolean;
}

export interface WebOSConfig {
  handTracking: HandTrackingConfig;
  gestures: Record<string, GestureMapping>;
  privacy: {
    localInferenceOnly: boolean;
    telemetryEnabled: boolean;
  };
  ui: {
    showHandCursor: boolean;
    gestureHints: boolean;
    accessibility: {
      highContrast: boolean;
      largeTargets: boolean;
      voiceFeedback: boolean;
    };
  };
}

export interface SystemState {
  isHandTrackingActive: boolean;
  cameraPermissionGranted: boolean;
  windows: WebOSWindow[];
  apps: WebOSApp[];
  focusedWindowId: string | null;
  config: WebOSConfig;
  handCursor: { x: number; y: number; visible: boolean };
}
