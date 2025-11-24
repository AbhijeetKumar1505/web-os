// Inter-App Communication System - Message passing between WebOS applications

export interface AppMessage {
  id: string;
  from: string;
  to: string;
  type: string;
  data: any;
  timestamp: Date;
  replyTo?: string;
}

export interface AppCapability {
  name: string;
  description: string;
  handler: (message: AppMessage) => Promise<any> | any;
}

export interface RegisteredApp {
  id: string;
  name: string;
  capabilities: Map<string, AppCapability>;
  messageQueue: AppMessage[];
  isActive: boolean;
}

export class InterAppCommunication {
  private apps: Map<string, RegisteredApp> = new Map();
  private messageHistory: AppMessage[] = [];
  private listeners: ((message: AppMessage) => void)[] = [];
  private nextMessageId = 1;

  // App Registration
  
  registerApp(appId: string, appName: string): void {
    if (this.apps.has(appId)) {
      console.warn(`App ${appId} is already registered`);
      return;
    }

    const app: RegisteredApp = {
      id: appId,
      name: appName,
      capabilities: new Map(),
      messageQueue: [],
      isActive: true
    };

    this.apps.set(appId, app);
    console.log(`Registered app: ${appName} (${appId})`);
  }

  unregisterApp(appId: string): void {
    this.apps.delete(appId);
    console.log(`Unregistered app: ${appId}`);
  }

  setAppActive(appId: string, active: boolean): void {
    const app = this.apps.get(appId);
    if (app) {
      app.isActive = active;
    }
  }

  // Capability Management
  
  registerCapability(appId: string, capability: AppCapability): void {
    const app = this.apps.get(appId);
    if (!app) {
      console.error(`Cannot register capability: App ${appId} not found`);
      return;
    }

    app.capabilities.set(capability.name, capability);
    console.log(`Registered capability: ${capability.name} for app ${appId}`);
  }

  unregisterCapability(appId: string, capabilityName: string): void {
    const app = this.apps.get(appId);
    if (app) {
      app.capabilities.delete(capabilityName);
    }
  }

  getAppCapabilities(appId: string): string[] {
    const app = this.apps.get(appId);
    return app ? Array.from(app.capabilities.keys()) : [];
  }

  findAppsWithCapability(capabilityName: string): string[] {
    const appsWithCapability: string[] = [];
    
    for (const [appId, app] of this.apps.entries()) {
      if (app.capabilities.has(capabilityName)) {
        appsWithCapability.push(appId);
      }
    }
    
    return appsWithCapability;
  }

  // Message Passing
  
  async sendMessage(from: string, to: string, type: string, data: any, replyTo?: string): Promise<string> {
    const message: AppMessage = {
      id: `msg_${this.nextMessageId++}`,
      from,
      to,
      type,
      data,
      timestamp: new Date(),
      replyTo
    };

    // Add to history
    this.messageHistory.push(message);
    
    // Keep only last 1000 messages
    if (this.messageHistory.length > 1000) {
      this.messageHistory.shift();
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('IAC message listener error:', error);
      }
    });

    // Deliver to target app
    const targetApp = this.apps.get(to);
    if (!targetApp) {
      console.error(`Cannot deliver message: Target app ${to} not found`);
      return message.id;
    }

    if (!targetApp.isActive) {
      // Queue message for inactive app
      targetApp.messageQueue.push(message);
      console.log(`Queued message for inactive app: ${to}`);
      return message.id;
    }

    // Try to handle with capability
    const capability = targetApp.capabilities.get(type);
    if (capability) {
      try {
        const result = await capability.handler(message);
        
        // Send reply if this was a request
        if (message.replyTo) {
          await this.sendMessage(to, from, 'reply', result, message.id);
        }
      } catch (error: any) {
        console.error(`Error handling message in ${to}:`, error);
        
        // Send error reply
        if (message.replyTo) {
          await this.sendMessage(to, from, 'error', { error: error.message || 'Unknown error' }, message.id);
        }
      }
    } else {
      console.warn(`App ${to} has no capability to handle message type: ${type}`);
    }

    return message.id;
  }

  async sendRequest(from: string, to: string, type: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = `req_${Date.now()}`;
      
      // Set up reply listener
      const unsubscribe = this.onMessage((message) => {
        if (message.replyTo === requestId && message.from === to && message.to === from) {
          unsubscribe();
          
          if (message.type === 'error') {
            reject(new Error(message.data.error));
          } else {
            resolve(message.data);
          }
        }
      });

      // Send request
      this.sendMessage(from, to, type, data, requestId);

      // Timeout after 30 seconds
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Request timeout'));
      }, 30000);
    });
  }

  broadcast(from: string, type: string, data: any): void {
    for (const appId of this.apps.keys()) {
      if (appId !== from) {
        this.sendMessage(from, appId, type, data);
      }
    }
  }

  // Message Queue Management
  
  getQueuedMessages(appId: string): AppMessage[] {
    const app = this.apps.get(appId);
    if (!app) return [];
    
    const messages = [...app.messageQueue];
    app.messageQueue = []; // Clear queue
    return messages;
  }

  processQueuedMessages(appId: string): void {
    const messages = this.getQueuedMessages(appId);
    
    for (const message of messages) {
      // Re-deliver queued messages
      this.sendMessage(message.from, message.to, message.type, message.data, message.replyTo);
    }
  }

  // Event System
  
  onMessage(listener: (message: AppMessage) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Utility Methods
  
  getRegisteredApps(): { id: string; name: string; capabilities: string[]; isActive: boolean }[] {
    return Array.from(this.apps.values()).map(app => ({
      id: app.id,
      name: app.name,
      capabilities: Array.from(app.capabilities.keys()),
      isActive: app.isActive
    }));
  }

  getMessageHistory(appId?: string): AppMessage[] {
    if (!appId) return [...this.messageHistory];
    
    return this.messageHistory.filter(msg => msg.from === appId || msg.to === appId);
  }

  clearMessageHistory(): void {
    this.messageHistory = [];
  }

  // Standard Capabilities
  
  setupStandardCapabilities(): void {
    // File operations capability
    this.registerStandardCapability('file-read', 'Read files from virtual file system');
    this.registerStandardCapability('file-write', 'Write files to virtual file system');
    this.registerStandardCapability('file-list', 'List directory contents');
    
    // System capabilities
    this.registerStandardCapability('system-notification', 'Show system notifications');
    this.registerStandardCapability('system-dialog', 'Show system dialogs');
    
    // App management
    this.registerStandardCapability('app-launch', 'Launch other applications');
    this.registerStandardCapability('app-focus', 'Focus other applications');
    this.registerStandardCapability('app-close', 'Close other applications');
    
    // Data sharing
    this.registerStandardCapability('data-share', 'Share data between applications');
    this.registerStandardCapability('clipboard-access', 'Access system clipboard');
  }

  private registerStandardCapability(name: string, description: string): void {
    // These are capability definitions that apps can implement
    console.log(`Standard capability available: ${name} - ${description}`);
  }

  // Integration helpers
  
  createAppBridge(appId: string) {
    return {
      send: (to: string, type: string, data: any) => 
        this.sendMessage(appId, to, type, data),
      
      request: (to: string, type: string, data: any) => 
        this.sendRequest(appId, to, type, data),
      
      broadcast: (type: string, data: any) => 
        this.broadcast(appId, type, data),
      
      registerCapability: (capability: AppCapability) => 
        this.registerCapability(appId, capability),
      
      onMessage: (listener: (message: AppMessage) => void) => 
        this.onMessage(listener),
      
      getCapabilities: () => 
        this.getAppCapabilities(appId),
      
      findApps: (capability: string) => 
        this.findAppsWithCapability(capability)
    };
  }
}

// Singleton instance
export const iac = new InterAppCommunication();

// Initialize standard capabilities
iac.setupStandardCapabilities();
