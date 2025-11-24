// Gesture Mapper and Policy Manager

import type { GestureEvent, GestureMapping, GestureType } from '../types';

export class GestureMapper {
  private mappings = new Map<GestureType, GestureMapping>();
  private callbacks: ((action: string, event: GestureEvent) => void)[] = [];
  private policies = new Map<string, (event: GestureEvent) => boolean>();

  private defaultConfidenceThreshold = 0.8;

  constructor(config?: { confidenceThreshold?: number }) {
    if (config?.confidenceThreshold !== undefined) {
      this.defaultConfidenceThreshold = config.confidenceThreshold;
    }
    this.setupDefaultMappings();
    this.setupDefaultPolicies();
  }

  private setupDefaultMappings(): void {
    const defaultMappings: GestureMapping[] = [
      { gesture: 'open_palm', action: 'open-launcher', global: true },
      { gesture: 'pinch', action: 'drag', requireFocus: true, holdMillis: 80 },
      { gesture: 'push_forward', action: 'click', requireFocus: true },
      { gesture: 'swipe_left', action: 'prev-desktop', global: true },
      { gesture: 'swipe_right', action: 'next-desktop', global: true },
      { gesture: 'two_finger_pinch', action: 'minimize', requireFocus: true },
      { gesture: 'two_finger_spread', action: 'maximize', requireFocus: true },
      { gesture: 'closed_fist', action: 'grab', requireFocus: true },
    ];

    defaultMappings.forEach(mapping => {
      this.mappings.set(mapping.gesture, mapping);
    });
  }

  private setupDefaultPolicies(): void {
    // Confidence threshold policy
    this.policies.set('confidence', (event: GestureEvent) => {
      const mapping = this.mappings.get(event.type);
      const threshold = mapping?.confidenceThreshold || this.defaultConfidenceThreshold;
      return event.confidence >= threshold;
    });

    // Rate limiting policy
    const lastActionTimes = new Map<string, number>();
    this.policies.set('rateLimit', (event: GestureEvent) => {
      const now = Date.now();
      const lastTime = lastActionTimes.get(event.type) || 0;
      const minInterval = 200; // 200ms minimum between same gestures

      if (now - lastTime >= minInterval) {
        lastActionTimes.set(event.type, now);
        return true;
      }
      return false;
    });

    // Context policy - check if gesture is appropriate for current context
    this.policies.set('context', (event: GestureEvent) => {
      const mapping = this.mappings.get(event.type);
      if (!mapping) return false;

      // Global gestures are always allowed
      if (mapping.global) return true;

      // Focus-required gestures need a focused window
      if (mapping.requireFocus) {
        // This would check if there's a focused window
        // For now, we'll assume it's always valid
        return true;
      }

      return true;
    });
  }

  processGesture(event: GestureEvent): void {
    const mapping = this.mappings.get(event.type);
    if (!mapping) return;

    // Apply all policies
    const policyResults = Array.from(this.policies.values()).map(policy => policy(event));
    const allPoliciesPassed = policyResults.every(result => result);

    if (!allPoliciesPassed) {
      return; // Gesture blocked by policy
    }

    // Check hold time requirement
    if (mapping.holdMillis) {
      // This would typically be handled by the input layer
      // For now, we'll assume the hold time has been met
    }

    // Emit action
    this.emitAction(mapping.action, event);
  }

  private emitAction(action: string, event: GestureEvent): void {
    this.callbacks.forEach(callback => callback(action, event));
  }

  onAction(callback: (action: string, event: GestureEvent) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  addMapping(gestureType: GestureType, mapping: Omit<GestureMapping, 'gesture'>): void {
    this.mappings.set(gestureType, { gesture: gestureType, ...mapping });
  }

  removeMapping(gestureType: GestureType): void {
    this.mappings.delete(gestureType);
  }

  updateMapping(gestureType: GestureType, updates: Partial<GestureMapping>): void {
    const existing = this.mappings.get(gestureType);
    if (existing) {
      this.mappings.set(gestureType, { ...existing, ...updates });
    }
  }

  getMappings(): Map<GestureType, GestureMapping> {
    return new Map(this.mappings);
  }

  addPolicy(name: string, policy: (event: GestureEvent) => boolean): void {
    this.policies.set(name, policy);
  }

  removePolicy(name: string): void {
    this.policies.delete(name);
  }

  // Bulk mapping update for configuration
  addMappings(mappings: Record<string, any>): void {
    Object.entries(mappings).forEach(([gestureType, config]) => {
      this.mappings.set(gestureType as GestureType, {
        gesture: gestureType as GestureType,
        ...config
      });
    });
  }

  destroy(): void {
    this.callbacks = [];
    this.mappings.clear();
    this.policies.clear();
  }
}
