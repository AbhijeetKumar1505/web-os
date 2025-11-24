// Window Manager for WebOS

import type { WebOSWindow, GestureEvent } from '../types';
import { useSystemStore } from './SystemStore';

export class WindowManager {
  private dragState: {
    isDragging: boolean;
    windowId: string | null;
    startPosition: { x: number; y: number };
    offset: { x: number; y: number };
    gestureSequenceId?: string;
  } = {
      isDragging: false,
      windowId: null,
      startPosition: { x: 0, y: 0 },
      offset: { x: 0, y: 0 }
    };

  private dragTimeout: ReturnType<typeof setTimeout> | null = null;
  private nextZIndex = 1000;

  async initialize(): Promise<void> {
    // Setup window management event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for window focus changes
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  private handleMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const windowElement = target.closest('[data-window-id]') as HTMLElement;

    if (windowElement) {
      const windowId = windowElement.dataset.windowId!;
      this.focusWindow(windowId);

      // Check if clicking on title bar for dragging
      const titleBar = target.closest('[data-window-titlebar]');
      if (titleBar) {
        this.startDrag(windowId, { x: event.clientX, y: event.clientY });
      }
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.dragState.isDragging && this.dragState.windowId) {
      const newX = event.clientX - this.dragState.offset.x;
      const newY = event.clientY - this.dragState.offset.y;

      this.updateWindowPosition(this.dragState.windowId, { x: newX, y: newY });
    }
  }

  private handleMouseUp(): void {
    if (this.dragState.isDragging) {
      this.endDrag();
    }
  }

  openApp(appId: string, props?: any): string {
    const store = useSystemStore.getState();
    const app = store.getApp(appId);

    if (!app) {
      throw new Error(`App not found: ${appId}`);
    }

    const windowId = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const window: WebOSWindow = {
      id: windowId,
      title: app.name,
      component: app.component,
      props: props || {},
      position: this.getDefaultWindowPosition(),
      size: { width: 800, height: 600 },
      zIndex: this.nextZIndex++,
      minimized: false,
      maximized: false,
      focused: true,
      resizable: true,
      draggable: true,
    };

    store.addWindow(window);
    return windowId;
  }

  openLauncher(): void {
    // Check if launcher is already open
    const store = useSystemStore.getState();
    const existingLauncher = store.windows.find(w => w.title === 'App Launcher');

    if (existingLauncher) {
      this.focusWindow(existingLauncher.id);
      return;
    }

    // Open new launcher window
    this.openApp('launcher');
  }

  closeWindow(windowId: string): void {
    const store = useSystemStore.getState();
    store.removeWindow(windowId);
  }

  focusWindow(windowId: string): void {
    const store = useSystemStore.getState();
    const window = store.getWindow(windowId);

    if (window) {
      // Update z-index to bring to front
      store.updateWindow(windowId, {
        zIndex: this.nextZIndex++,
        focused: true
      });
      store.setFocusedWindow(windowId);
    }
  }

  minimizeWindow(windowId: string): void {
    const store = useSystemStore.getState();
    store.updateWindow(windowId, { minimized: true, focused: false });

    // Focus next available window
    const windows = store.windows.filter(w => !w.minimized && w.id !== windowId);
    if (windows.length > 0) {
      const nextWindow = windows.sort((a, b) => b.zIndex - a.zIndex)[0];
      this.focusWindow(nextWindow.id);
    } else {
      store.setFocusedWindow(null);
    }
  }

  maximizeWindow(windowId: string): void {
    const store = useSystemStore.getState();
    const window = store.getWindow(windowId);

    if (window) {
      if (window.maximized) {
        // Restore to previous size
        store.updateWindow(windowId, {
          maximized: false,
          // In a real implementation, we'd restore previous position/size
        });
      } else {
        // Maximize to full screen
        store.updateWindow(windowId, {
          maximized: true,
          position: { x: 0, y: 0 },
          size: { width: globalThis.innerWidth || 1920, height: globalThis.innerHeight || 1080 }
        });
      }
    }
  }

  minimizeFocusedWindow(): void {
    const store = useSystemStore.getState();
    if (store.focusedWindowId) {
      this.minimizeWindow(store.focusedWindowId);
    }
  }

  maximizeFocusedWindow(): void {
    const store = useSystemStore.getState();
    if (store.focusedWindowId) {
      this.maximizeWindow(store.focusedWindowId);
    }
  }

  getFocusedWindow(): WebOSWindow | undefined {
    const store = useSystemStore.getState();
    return store.getFocusedWindow();
  }

  // Gesture-based interactions
  handleDragGesture(event: GestureEvent): void {
    // Reset drag timeout whenever we receive a gesture event
    if (this.dragTimeout) {
      clearTimeout(this.dragTimeout);
    }

    // Set a timeout to end drag if no events are received for a while (e.g., gesture ended)
    this.dragTimeout = setTimeout(() => {
      this.endDrag();
    }, 200);

    const screenX = event.normalizedPosition.x * window.innerWidth;
    const screenY = event.normalizedPosition.y * window.innerHeight;

    // Check if we are already dragging this specific gesture sequence
    if (this.dragState.isDragging &&
        this.dragState.windowId &&
        this.dragState.gestureSequenceId === event.id) {

      // We are in the middle of a drag, so update position
      const newX = screenX - this.dragState.offset.x;
      const newY = screenY - this.dragState.offset.y;

      this.updateWindowPosition(this.dragState.windowId, { x: newX, y: newY });
      return;
    }

    // If we're here, it's either a new drag or the sequence ID changed
    // If we were dragging something else (different sequence), end it implicitly
    if (this.dragState.isDragging && this.dragState.gestureSequenceId !== event.id) {
        // Just overwrite the state, effectively ending the previous drag
    }

    const store = useSystemStore.getState();
    const windowId = store.focusedWindowId;

    if (windowId) {
      const windowObj = store.getWindow(windowId);
      if (windowObj) {
        this.dragState = {
          isDragging: true,
          windowId,
          startPosition: { x: screenX, y: screenY },
          offset: {
            x: screenX - windowObj.position.x,
            y: screenY - windowObj.position.y
          },
          gestureSequenceId: event.id
        };
      }
    }
  }

  startDrag(event: GestureEvent): void;
  startDrag(windowId: string, position: { x: number; y: number }): void;
  startDrag(eventOrWindowId: GestureEvent | string, position?: { x: number; y: number }): void {
    if (typeof eventOrWindowId === 'string') {
      // Mouse-based drag
      const windowId = eventOrWindowId;
      const pos = position!;
      const store = useSystemStore.getState();
      const window = store.getWindow(windowId);

      if (window) {
        this.dragState = {
          isDragging: true,
          windowId,
          startPosition: pos,
          offset: {
            x: pos.x - window.position.x,
            y: pos.y - window.position.y
          }
        };
      }
    } else {
      // Legacy Gesture-based drag (forward to new handler)
      const event = eventOrWindowId;
      this.handleDragGesture(event);
    }
  }

  private endDrag(): void {
    if (this.dragTimeout) {
      clearTimeout(this.dragTimeout);
      this.dragTimeout = null;
    }

    this.dragState = {
      isDragging: false,
      windowId: null,
      startPosition: { x: 0, y: 0 },
      offset: { x: 0, y: 0 }
    };
  }

  handleClick(event: GestureEvent): void {
    console.log('WindowManager: Handling click gesture', event);
    const screenX = event.normalizedPosition.x * window.innerWidth;
    const screenY = event.normalizedPosition.y * window.innerHeight;

    // Find element at gesture position
    const element = document.elementFromPoint(screenX, screenY) as HTMLElement;
    if (element) {
      console.log('WindowManager: Hit element:', element.tagName, element.className);

      // Try to find a clickable ancestor if the current element isn't interactive
      const clickable = element.closest('button, a, [role="button"], .cursor-pointer') as HTMLElement;

      const target = clickable || element;
      console.log('WindowManager: Dispatching click to:', target.tagName, target.className);

      // Use .click() for native elements, dispatch event for others
      target.click();

      // Also dispatch a synthetic click event for React/Framework handling if .click() doesn't work as expected
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: screenX,
        clientY: screenY
      });
      target.dispatchEvent(clickEvent);
    } else {
      console.log('WindowManager: No element found at click position');
    }
  }

  private updateWindowPosition(windowId: string, position: { x: number; y: number }): void {
    const store = useSystemStore.getState();

    // Constrain to screen bounds
    const constrainedPosition = {
      x: Math.max(0, Math.min(position.x, window.innerWidth - 200)), // Keep at least 200px visible
      y: Math.max(0, Math.min(position.y, window.innerHeight - 50))  // Keep title bar visible
    };

    store.updateWindow(windowId, { position: constrainedPosition });
  }

  private getDefaultWindowPosition(): { x: number; y: number } {
    const store = useSystemStore.getState();
    const windowCount = store.windows.length;

    // Cascade windows
    const offset = (windowCount % 10) * 30;
    return {
      x: 100 + offset,
      y: 100 + offset
    };
  }

  destroy(): void {
    document.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }
}
