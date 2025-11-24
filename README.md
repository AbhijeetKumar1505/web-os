# WebOS with Hand-Tracking Control

A modern, web-based operating system that uses real-time hand-tracking for intuitive gesture control. Built with React, TypeScript, and MediaPipe for a privacy-first, browser-native experience.

![WebOS Demo](https://via.placeholder.com/800x400/1f2937/ffffff?text=WebOS+Hand+Tracking+Interface)

## 🌟 Features

### Core Functionality
- **Real-time Hand Tracking**: Uses MediaPipe for accurate hand landmark detection
- **Gesture Recognition**: Supports pinch, swipe, point, and palm gestures
- **Window Management**: Drag, resize, minimize, and maximize windows with gestures
- **App Launcher**: Voice and gesture-activated application launcher
- **Privacy-First**: All processing happens locally in your browser

### User Experience
- **Intuitive Gestures**: Natural hand movements for system control
- **Visual Feedback**: Hand cursor and gesture hints for discoverability
- **Accessibility**: Full keyboard/mouse fallback and accessibility features
- **Progressive Enhancement**: Works on devices without camera support

### Technical Features
- **Modular Architecture**: Clean separation of concerns with plugin system
- **PWA Ready**: Installable as a Progressive Web App
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **TypeScript**: Fully typed for better development experience

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Modern browser with camera support
- HTTPS connection (required for camera access)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd webos-hand-tracking
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Open in browser:**
Navigate to `https://localhost:5173` (note: HTTPS required for camera access)

4. **Grant camera permission:**
When prompted, allow camera access for hand tracking functionality

### Building for Production

```bash
npm run build
npm run preview
```

## 🎮 Gesture Controls

### Basic Gestures
- **👋 Open Palm**: Open app launcher or activate menu
- **👌 Pinch**: Drag windows and objects
- **👆 Point Forward**: Click/tap interaction
- **✋ Swipe Left/Right**: Navigate between desktops
- **✌️ Two Fingers**: Zoom in/out or resize

### Window Management
- **Pinch + Move**: Drag windows around the desktop
- **Two-finger spread**: Maximize/restore window
- **Two-finger pinch**: Minimize window
- **Closed fist**: Grab and hold objects

### App-Specific Gestures
Each app can define custom gesture handlers for specialized interactions.

## 🏗️ Architecture

### Core Components

```
src/
├── core/                 # Core system modules
│   ├── WebOS.ts         # Main WebOS class
│   ├── HandTrackingEngine.ts  # MediaPipe integration
│   ├── InputAbstractionLayer.ts  # Gesture processing
│   ├── GestureMapper.ts # Gesture-to-action mapping
│   ├── WindowManager.ts # Window management
│   ├── AppSandbox.ts    # App runtime environment
│   ├── PrivacyManager.ts # Privacy and permissions
│   └── SystemStore.ts   # State management
├── components/          # React UI components
│   ├── WebOSShell.tsx   # Main shell component
│   ├── WindowManager.tsx # Window rendering
│   ├── Desktop.tsx      # Desktop background
│   ├── SystemTray.tsx   # System tray and taskbar
│   └── ...
├── apps/               # Built-in applications
│   ├── AppLauncher.tsx # Application launcher
│   ├── DrawingApp.tsx  # Gesture-controlled drawing
│   └── ...
└── types/              # TypeScript definitions
```

### Data Flow

1. **Camera Input** → Hand Tracking Engine (MediaPipe)
2. **Hand Landmarks** → Input Abstraction Layer
3. **Gesture Events** → Gesture Mapper
4. **System Actions** → Window Manager / App Sandbox
5. **UI Updates** → React Components

## 🔧 Configuration

### Hand Tracking Settings

```typescript
const config = {
  handTracking: {
    model: 'lite' | 'full',        // Model complexity
    maxHands: 2,                   // Maximum hands to track
    confidenceThreshold: 0.8,      // Detection confidence
    smoothing: 0.6,                // Temporal smoothing
    flipHorizontal: true,          // Mirror camera input
  }
};
```

### Gesture Mappings

```typescript
const gestures = {
  'pinch': { 
    action: 'drag', 
    requireFocus: true, 
    holdMillis: 80 
  },
  'open_palm': { 
    action: 'open-launcher', 
    global: true 
  },
  // ... more mappings
};
```

## 🔒 Privacy & Security

### Privacy-First Design
- **Local Processing**: All hand tracking runs in your browser
- **No Data Transmission**: Camera data never leaves your device
- **Explicit Permissions**: Clear consent for camera and capabilities
- **Data Minimization**: Only essential gesture data is processed

### Security Features
- **App Sandboxing**: Isolated execution environment for apps
- **Capability System**: Fine-grained permission model
- **Secure Context**: Requires HTTPS for camera access
- **CSP Headers**: Content Security Policy protection

## 🛠️ Development

### Adding New Apps

1. **Create app component:**
```typescript
// src/apps/MyApp.tsx
export const MyApp: React.FC<{windowId: string}> = ({ windowId }) => {
  return <div>My Custom App</div>;
};
```

2. **Register in AppSandbox:**
```typescript
this.registerApp({
  id: 'myapp',
  name: 'My App',
  icon: '🎯',
  component: MyApp,
  capabilities: [
    { name: 'gesture-read', description: 'Receive gestures', required: true }
  ],
  gestureHandlers: {
    pinch: (event) => console.log('Pinch detected', event)
  }
});
```

### Custom Gesture Recognition

```typescript
// Add custom gesture detection
const detectCustomGesture = (landmarks: HandLandmark[]) => {
  // Your gesture detection logic
  return { type: 'custom_gesture', confidence: 0.9 };
};
```

### Testing

```bash
npm run test          # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run lint          # Code linting
npm run type-check    # TypeScript checking
```

## 📱 PWA Features

- **Offline Support**: Core functionality works without internet
- **Install Prompt**: Add to home screen on mobile devices
- **Background Sync**: Optional cloud sync for settings
- **Push Notifications**: System notifications support

## 🎯 Roadmap

### MVP (Current)
- ✅ Basic hand tracking and gesture recognition
- ✅ Window management with gestures
- ✅ App launcher and built-in apps
- ✅ Privacy-focused camera permissions

### v1.1 (Next)
- [ ] Advanced gesture calibration
- [ ] Multi-hand gesture combinations
- [ ] Voice command integration
- [ ] Improved accessibility features

### v2.0 (Future)
- [ ] WebXR integration for AR/VR
- [ ] Cloud sync for user profiles
- [ ] Third-party app marketplace
- [ ] Advanced AI gesture prediction

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm run test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MediaPipe**: Google's ML framework for hand tracking
- **React**: UI framework
- **Framer Motion**: Animation library
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: State management

## 📞 Support

- **Documentation**: [Full API Documentation](docs/)
- **Issues**: [GitHub Issues](issues/)
- **Discussions**: [GitHub Discussions](discussions/)
- **Email**: support@webos-project.com

---

**Made with ❤️ for the future of human-computer interaction**
