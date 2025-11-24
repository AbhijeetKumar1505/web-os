// Main WebOS Shell Class

import { HandTrackingEngine } from './HandTrackingEngine';
import { InputAbstractionLayer } from './InputAbstractionLayer';
import { GestureMapper } from './GestureMapper';
import { WindowManager } from './WindowManager';
import { AppSandbox } from './AppSandbox';
import { PrivacyManager } from './PrivacyManager';
import { SystemStore } from './SystemStore';
import { vfs } from './VirtualFileSystem';
import { iac } from './InterAppCommunication';
import type { WebOSConfig, GestureEvent, WebOSApp, AppCapability } from '../types';

export interface WebOSInitOptions {
  container: HTMLElement;
  enableHandTracking?: boolean;
  handTrackingOptions?: Partial<WebOSConfig['handTracking']>;
  config?: Partial<WebOSConfig>;
}

export class WebOS {
  private handTrackingEngine: HandTrackingEngine;
  private inputLayer: InputAbstractionLayer;
  private gestureMapper: GestureMapper;
  private windowManager: WindowManager;
  private appSandbox: AppSandbox;
  private privacyManager: PrivacyManager;
  private systemStore: SystemStore;
  private container: HTMLElement;
  private initialized = false;

  constructor(options: WebOSInitOptions) {
    this.container = options.container;

    // Initialize core systems
    this.systemStore = new SystemStore(options.config);
    this.privacyManager = new PrivacyManager();
    this.handTrackingEngine = new HandTrackingEngine(options.handTrackingOptions);
    this.inputLayer = new InputAbstractionLayer(options.handTrackingOptions);
    this.gestureMapper = new GestureMapper(options.handTrackingOptions);
    this.windowManager = new WindowManager();
    this.appSandbox = new AppSandbox();

    this.setupEventPipeline();
  }

  static async init(options: WebOSInitOptions): Promise<WebOS> {
    const webos = new WebOS(options);
    await webos.initialize();
    return webos;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize privacy manager first
      await this.privacyManager.initialize();

      // Request camera permission if hand tracking is enabled
      const config = this.systemStore.getConfig();
      if (config.handTracking) {
        const granted = await this.privacyManager.requestCameraPermission();
        this.systemStore.setCameraPermission(granted);

        if (granted) {
          await this.handTrackingEngine.initialize();
          await this.handTrackingEngine.start();
          this.systemStore.setHandTrackingActive(true);
        }
      }

      // Initialize other systems
      await this.windowManager.initialize();
      await this.appSandbox.initialize();

      // Initialize shared systems
      this.initializeSharedSystems();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize WebOS:', error);
      throw error;
    }
  }

  private initializeSharedSystems(): void {
    // Register system apps with IAC
    iac.registerApp('system', 'WebOS System');
    iac.registerApp('windowmanager', 'Window Manager');
    iac.registerApp('filemanager', 'File Manager');

    // Set up system capabilities
    iac.registerCapability('system', {
      name: 'file-read',
      description: 'Read files from virtual file system',
      handler: async (message) => {
        const { path } = message.data;
        return vfs.readFile(path);
      }
    });

    iac.registerCapability('system', {
      name: 'file-write',
      description: 'Write files to virtual file system',
      handler: async (message) => {
        const { path, content } = message.data;
        return vfs.writeFile(path, content);
      }
    });

    iac.registerCapability('system', {
      name: 'file-list',
      description: 'List directory contents',
      handler: async (message) => {
        const { path } = message.data;
        return vfs.listDirectory(path);
      }
    });

    iac.registerCapability('windowmanager', {
      name: 'app-launch',
      description: 'Launch applications',
      handler: async (message) => {
        const { appId } = message.data;
        return this.openApp(appId);
      }
    });

    iac.registerCapability('windowmanager', {
      name: 'app-focus',
      description: 'Focus application windows',
      handler: async (message) => {
        const { windowId } = message.data;
        this.windowManager.focusWindow(windowId);
        return true;
      }
    });

    // Set up file system event forwarding
    vfs.onFileSystemChange((event) => {
      iac.broadcast('system', 'file-system-change', event);
    });

    console.log('Shared systems initialized');
  }

  private setupEventPipeline(): void {
    // Hand tracking -> Input layer -> Gesture mapper -> Actions
    this.handTrackingEngine.onHandTracking((results) => {
      this.inputLayer.processHandTracking(results);

      // Update cursor position
      if (results.length > 0) {
        const hand = results[0]; // Use primary hand
        const indexTip = hand.landmarks[8]; // Index finger tip

        if (indexTip) {
          // Simple smoothing could be added here if needed, 
          // but for now direct mapping for responsiveness
          // Invert X for mirror effect (natural movement)
          this.systemStore.updateHandCursor({
            x: 1 - indexTip.x,
            y: indexTip.y,
            visible: true
          });
        }
      } else {
        // Hide cursor if no hands detected
        this.systemStore.updateHandCursor({
          x: 0,
          y: 0,
          visible: false
        });
      }
    });

    this.inputLayer.onGestureEvent((event) => {
      this.gestureMapper.processGesture(event);
    });

    this.gestureMapper.onAction((action, event) => {
      this.handleSystemAction(action, event);
    });
  }

  private handleSystemAction(action: string, event: GestureEvent): void {
    switch (action) {
      case 'open-launcher':
        this.windowManager.openLauncher();
        break;
      case 'drag':
        this.windowManager.startDrag(event);
        break;
      case 'click':
        this.windowManager.handleClick(event);
        break;
      case 'minimize':
        this.windowManager.minimizeFocusedWindow();
        break;
      case 'maximize':
        this.windowManager.maximizeFocusedWindow();
        break;
      default:
        // Forward to focused app
        const focusedWindow = this.windowManager.getFocusedWindow();
        if (focusedWindow) {
          this.appSandbox.forwardGestureToApp(focusedWindow.id, event);
        }
    }
  }

  // Public API for apps
  public async requestCapability(capability: string): Promise<boolean> {
    return this.privacyManager.requestCapability(capability);
  }

  public subscribeToGestures(callback: (event: GestureEvent) => void): () => void {
    return this.inputLayer.subscribe(callback);
  }

  public mapGesture(mapping: Record<string, any>): void {
    this.gestureMapper.addMappings(mapping);
  }

  public registerApp(app: WebOSApp): void {
    this.appSandbox.registerApp(app);
  }

  public openApp(appId: string, props?: any): string {
    return this.windowManager.openApp(appId, props);
  }

  public closeWindow(windowId: string): void {
    this.windowManager.closeWindow(windowId);
  }

  public getSystemStore(): SystemStore {
    return this.systemStore;
  }

  public getHandTrackingEngine() {
    return this.handTrackingEngine;
  }

  public getVirtualFileSystem() {
    return vfs;
  }

  public getInterAppCommunication() {
    return iac;
  }

  public createAppBridge(appId: string) {
    return iac.createAppBridge(appId);
  }

  public destroy(): void {
    this.handTrackingEngine.destroy();
    this.inputLayer.destroy();
    this.gestureMapper.destroy();
    this.windowManager.destroy();
    this.appSandbox.destroy();
    this.initialized = false;
  }
}
