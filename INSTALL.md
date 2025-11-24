# WebOS Installation Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open in Browser
Navigate to `https://localhost:5173` (HTTPS required for camera access)

### 4. Grant Permissions
- Allow camera access when prompted
- The system will show a privacy-focused permission dialog
- All processing happens locally in your browser

## Production Build

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy
Upload the `dist/` folder to any static hosting service (Vercel, Netlify, GitHub Pages, etc.)

## System Requirements

### Browser Support
- Chrome 88+ (recommended)
- Firefox 85+
- Safari 14+
- Edge 88+

### Hardware Requirements
- Camera (webcam or built-in)
- Modern CPU for real-time hand tracking
- 4GB+ RAM recommended
- HTTPS connection (required for camera access)

### Optimal Setup
- Good lighting conditions
- Stable camera position
- Minimal background movement
- Hand positioned 1-2 feet from camera

## Troubleshooting

### Camera Issues
- **Permission Denied**: Check browser camera permissions
- **Camera Not Found**: Ensure camera is connected and not in use
- **Poor Tracking**: Improve lighting and reduce background movement

### Performance Issues
- **Low FPS**: Reduce hand tracking model complexity in settings
- **High CPU Usage**: Lower camera resolution or frame rate
- **Memory Issues**: Close other browser tabs and applications

### Installation Issues
- **Build Errors**: Ensure Node.js 18+ is installed
- **HTTPS Errors**: Use `npm run dev` which provides HTTPS automatically
- **Module Errors**: Delete `node_modules` and run `npm install` again

## Development Setup

### Prerequisites
```bash
node --version  # Should be 18+
npm --version   # Should be 8+
```

### Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd webos-hand-tracking

# Install dependencies
npm install

# Generate icons
npm run generate-icons

# Start development
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server with HTTPS
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run type-check` - TypeScript type checking

## Configuration

### Hand Tracking Settings
Edit `src/core/SystemStore.ts` to modify default settings:

```typescript
const defaultConfig = {
  handTracking: {
    model: 'lite',              // 'lite' or 'full'
    maxHands: 2,                // 1-4 hands
    confidenceThreshold: 0.8,   // 0.0-1.0
    smoothing: 0.6,             // 0.0-1.0
    flipHorizontal: true,       // Mirror camera
  }
};
```

### Gesture Mappings
Customize gesture actions in the same file:

```typescript
gestures: {
  'pinch': { gesture: 'pinch', action: 'drag', requireFocus: true },
  'open_palm': { gesture: 'open_palm', action: 'open-launcher', global: true },
  // Add more mappings...
}
```

## Security Notes

- Camera data never leaves your device
- All hand tracking runs locally in browser
- No server-side processing of video data
- Explicit permission required for camera access
- Apps run in sandboxed environment

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify camera permissions are granted
3. Test with different lighting conditions
4. Try a different browser
5. Check system requirements

For additional help, see the main README.md file.
