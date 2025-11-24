// Privacy Manager for camera permissions and data handling

export class PrivacyManager {
  private cameraPermissionGranted = false;
  private capabilities = new Map<string, boolean>();
  private privacySettings = {
    localInferenceOnly: true,
    telemetryEnabled: false,
    dataRetention: 0, // 0 = no retention
    shareUsageData: false,
  };

  async initialize(): Promise<void> {
    // Load privacy settings from storage
    this.loadPrivacySettings();
  }

  async requestCameraPermission(): Promise<boolean> {
    if (this.cameraPermissionGranted) {
      return true;
    }

    try {
      // Show privacy-aware permission dialog
      const userConsent = await this.showCameraPermissionDialog();
      if (!userConsent) {
        return false;
      }

      // Test camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });

      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      this.cameraPermissionGranted = true;
      this.savePrivacySettings();
      return true;

    } catch (error) {
      console.error('Camera permission denied or unavailable:', error);
      return false;
    }
  }

  private async showCameraPermissionDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      // Create privacy-focused permission dialog
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      dialog.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md mx-4">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Camera Access Required</h3>
          </div>
          
          <div class="mb-6">
            <p class="text-gray-700 dark:text-gray-300 mb-4">
              WebOS needs camera access to enable hand-tracking control. Your privacy is protected:
            </p>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li class="flex items-start">
                <span class="text-green-500 mr-2">✓</span>
                All processing happens locally on your device
              </li>
              <li class="flex items-start">
                <span class="text-green-500 mr-2">✓</span>
                No video data is sent to servers
              </li>
              <li class="flex items-start">
                <span class="text-green-500 mr-2">✓</span>
                You can disable this at any time
              </li>
              <li class="flex items-start">
                <span class="text-green-500 mr-2">✓</span>
                Camera indicator will show when active
              </li>
            </ul>
          </div>
          
          <div class="flex space-x-3">
            <button id="deny-camera" class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              Not Now
            </button>
            <button id="allow-camera" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Allow Camera
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      const allowButton = dialog.querySelector('#allow-camera');
      const denyButton = dialog.querySelector('#deny-camera');

      const cleanup = () => {
        document.body.removeChild(dialog);
      };

      allowButton?.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      denyButton?.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      // Close on escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup();
          resolve(false);
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
    });
  }

  async requestCapability(capability: string): Promise<boolean> {
    // Check if already granted
    if (this.capabilities.has(capability)) {
      return this.capabilities.get(capability)!;
    }

    // Auto-grant safe capabilities
    const safeCapabilities = ['gesture-read', 'storage-access', 'notifications'];
    if (safeCapabilities.includes(capability)) {
      this.capabilities.set(capability, true);
      return true;
    }

    // For sensitive capabilities, show permission dialog
    const granted = await this.showCapabilityDialog(capability);
    this.capabilities.set(capability, granted);
    this.savePrivacySettings();
    
    return granted;
  }

  private async showCapabilityDialog(capability: string): Promise<boolean> {
    const descriptions: Record<string, string> = {
      'system-config': 'Modify system settings and configuration',
      'network-access': 'Access external websites and services',
      'system-commands': 'Execute system-level commands',
      'file-system': 'Access local files and directories',
      'microphone': 'Access microphone for voice input',
      'location': 'Access your location information',
    };

    const description = descriptions[capability] || `Access ${capability} functionality`;

    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      dialog.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md mx-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Permission Request
          </h3>
          <p class="text-gray-700 dark:text-gray-300 mb-6">
            An application is requesting permission to: <strong>${description}</strong>
          </p>
          <div class="flex space-x-3">
            <button id="deny-capability" class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              Deny
            </button>
            <button id="allow-capability" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Allow
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      const allowButton = dialog.querySelector('#allow-capability');
      const denyButton = dialog.querySelector('#deny-capability');

      const cleanup = () => {
        document.body.removeChild(dialog);
      };

      allowButton?.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      denyButton?.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });
    });
  }

  hasCameraPermission(): boolean {
    return this.cameraPermissionGranted;
  }

  hasCapability(capability: string): boolean {
    return this.capabilities.get(capability) || false;
  }

  revokeCapability(capability: string): void {
    this.capabilities.set(capability, false);
    this.savePrivacySettings();
  }

  revokeCameraPermission(): void {
    this.cameraPermissionGranted = false;
    this.savePrivacySettings();
  }

  getPrivacySettings() {
    return { ...this.privacySettings };
  }

  updatePrivacySettings(settings: Partial<typeof this.privacySettings>): void {
    this.privacySettings = { ...this.privacySettings, ...settings };
    this.savePrivacySettings();
  }

  private loadPrivacySettings(): void {
    try {
      const stored = localStorage.getItem('webos-privacy-settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.privacySettings = { ...this.privacySettings, ...parsed.settings };
        this.cameraPermissionGranted = parsed.cameraPermission || false;
        
        // Restore capabilities
        if (parsed.capabilities) {
          this.capabilities = new Map(Object.entries(parsed.capabilities));
        }
      }
    } catch (error) {
      console.warn('Failed to load privacy settings:', error);
    }
  }

  private savePrivacySettings(): void {
    try {
      const data = {
        settings: this.privacySettings,
        cameraPermission: this.cameraPermissionGranted,
        capabilities: Object.fromEntries(this.capabilities),
        timestamp: Date.now(),
      };
      localStorage.setItem('webos-privacy-settings', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save privacy settings:', error);
    }
  }

  // Data minimization helpers
  anonymizeGestureData(gestureData: any): any {
    // Remove or hash any potentially identifying information
    const { timestamp, ...anonymized } = gestureData;
    return {
      ...anonymized,
      // Round timestamp to nearest minute for privacy
      timestamp: Math.floor(timestamp / 60000) * 60000,
    };
  }

  shouldCollectTelemetry(): boolean {
    return this.privacySettings.telemetryEnabled;
  }

  isLocalInferenceOnly(): boolean {
    return this.privacySettings.localInferenceOnly;
  }

  destroy(): void {
    // Clean up any resources
    this.capabilities.clear();
  }
}
