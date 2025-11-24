// Input Abstraction Layer - Converts hand landmarks to gesture events

import type { HandTrackingResult, GestureEvent, GestureType, HandLandmark } from '../types';

interface GestureState {
  lastGesture: GestureType | null;
  gestureStartTime: number;
  gestureId: string | null;
  confidence: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  previousPosition: { x: number; y: number };
}

export class InputAbstractionLayer {
  private callbacks: ((event: GestureEvent) => void)[] = [];
  private gestureStates = new Map<string, GestureState>();
  private smoothingFactor = 0.6;
  private confidenceThreshold = 0.8;
  private gestureHoldTime = 150; // ms

  constructor(config?: { confidenceThreshold?: number; smoothing?: number }) {
    if (config) {
      if (config.confidenceThreshold !== undefined) this.confidenceThreshold = config.confidenceThreshold;
      if (config.smoothing !== undefined) this.smoothingFactor = config.smoothing;
    }
  }

  processHandTracking(results: HandTrackingResult[]): void {
    for (const result of results) {
      const handKey = result.handedness;
      this.processHandGestures(result, handKey);
    }
  }

  private processHandGestures(result: HandTrackingResult, handKey: string): void {
    const landmarks = result.landmarks;
    if (landmarks.length < 21) return; // MediaPipe hands has 21 landmarks

    // Get or create gesture state for this hand
    let state = this.gestureStates.get(handKey);
    if (!state) {
      state = {
        lastGesture: null,
        gestureStartTime: 0,
        gestureId: null,
        confidence: 0,
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        previousPosition: { x: 0, y: 0 }
      };
      this.gestureStates.set(handKey, state);
    }

    // Calculate palm center (average of wrist and middle finger MCP)
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    const palmCenter = {
      x: (wrist.x + middleMcp.x) / 2,
      y: (wrist.y + middleMcp.y) / 2
    };

    // Update position and velocity
    state.velocity.x = palmCenter.x - state.previousPosition.x;
    state.velocity.y = palmCenter.y - state.previousPosition.y;
    state.previousPosition = { ...state.position };

    // Smooth position
    state.position.x = state.position.x * this.smoothingFactor + palmCenter.x * (1 - this.smoothingFactor);
    state.position.y = state.position.y * this.smoothingFactor + palmCenter.y * (1 - this.smoothingFactor);

    // Detect gestures
    const detectedGesture = this.detectGesture(landmarks, state);

    if (detectedGesture) {
      const now = Date.now();

      // Check if this is a new gesture or continuation
      if (state.lastGesture !== detectedGesture.type) {
        state.lastGesture = detectedGesture.type;
        state.gestureStartTime = now;
        state.gestureId = Math.random().toString(36).slice(2, 11);
        state.confidence = detectedGesture.confidence;
      } else {
        // Update confidence with moving average
        state.confidence = state.confidence * 0.8 + detectedGesture.confidence * 0.2;
      }

      // Emit gesture event if confidence and hold time thresholds are met
      if (state.confidence >= this.confidenceThreshold &&
        (now - state.gestureStartTime) >= this.gestureHoldTime) {

        const gestureEvent: GestureEvent = {
          id: state.gestureId || undefined,
          type: detectedGesture.type,
          confidence: state.confidence,
          normalizedPosition: { ...state.position },
          handedness: result.handedness,
          timestamp: result.timestamp,
          data: detectedGesture.data
        };

        this.emitGestureEvent(gestureEvent);
      }
    } else {
      // Reset gesture state if no gesture detected
      state.lastGesture = null;
      state.gestureId = null;
      state.confidence = 0;
    }
  }

  private detectGesture(landmarks: HandLandmark[], state: GestureState): { type: GestureType; confidence: number; data?: any } | null {
    // Finger tip and pip landmarks
    const fingerTips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky tips
    const fingerPips = [3, 6, 10, 14, 18]; // Finger PIP joints

    // Calculate finger extensions
    const fingerExtensions = fingerTips.map((tipIdx, i) => {
      const tip = landmarks[tipIdx];
      const pip = landmarks[fingerPips[i]];
      const mcp = landmarks[tipIdx - 1]; // MCP joint

      // For thumb, use different calculation
      if (i === 0) {
        return tip.x > pip.x ? 1 : 0; // Thumb extension based on x-axis
      }

      // For other fingers, check if tip is above PIP
      return tip.y < pip.y ? 1 : 0;
    });

    const extendedFingers = fingerExtensions.reduce((sum: number, ext) => sum + ext, 0);

    // Detect specific gestures

    // Open palm - all fingers extended
    if (extendedFingers >= 4) {
      return { type: 'open_palm', confidence: 0.9 };
    }

    // Closed fist - no fingers extended
    if (extendedFingers === 0) {
      return { type: 'closed_fist', confidence: 0.9 };
    }

    // Thumbs up - only thumb extended
    if (extendedFingers === 1 && fingerExtensions[0] === 1) {
      return { type: 'thumbs_up', confidence: 0.85 };
    }

    // Pinch gesture - thumb and index finger close
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const pinchDistance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2)
    );

    if (pinchDistance < 0.05 && fingerExtensions[0] === 1 && fingerExtensions[1] === 1) {
      return { type: 'pinch', confidence: 0.9, data: { distance: pinchDistance } };
    }

    // Push forward gesture - detect z-axis movement
    const indexMcp = landmarks[5];
    if (indexMcp.z < -0.1 && fingerExtensions[1] === 1) {
      return { type: 'push_forward', confidence: 0.8 };
    }

    // Swipe gestures - detect rapid horizontal movement
    const velocityThreshold = 0.02;
    if (Math.abs(state.velocity.x) > velocityThreshold) {
      if (state.velocity.x > 0) {
        return { type: 'swipe_right', confidence: 0.8 };
      } else {
        return { type: 'swipe_left', confidence: 0.8 };
      }
    }

    // Two finger gestures
    if (extendedFingers === 2 && fingerExtensions[1] === 1 && fingerExtensions[2] === 1) {
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const fingerDistance = Math.sqrt(
        Math.pow(indexTip.x - middleTip.x, 2) +
        Math.pow(indexTip.y - middleTip.y, 2)
      );

      if (fingerDistance > 0.08) {
        return { type: 'two_finger_spread', confidence: 0.8 };
      } else {
        return { type: 'two_finger_pinch', confidence: 0.8 };
      }
    }

    return null;
  }

  private emitGestureEvent(event: GestureEvent): void {
    this.callbacks.forEach(callback => callback(event));
  }

  onGestureEvent(callback: (event: GestureEvent) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  subscribe(callback: (event: GestureEvent) => void): () => void {
    return this.onGestureEvent(callback);
  }

  updateConfig(config: { smoothing?: number; confidenceThreshold?: number; gestureHoldTime?: number }): void {
    if (config.smoothing !== undefined) {
      this.smoothingFactor = config.smoothing;
    }
    if (config.confidenceThreshold !== undefined) {
      this.confidenceThreshold = config.confidenceThreshold;
    }
    if (config.gestureHoldTime !== undefined) {
      this.gestureHoldTime = config.gestureHoldTime;
    }
  }

  destroy(): void {
    this.callbacks = [];
    this.gestureStates.clear();
  }
}
