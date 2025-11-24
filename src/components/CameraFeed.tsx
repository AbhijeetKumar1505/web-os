// Camera Feed Component for Visual Feedback

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSystemStore } from '../core/SystemStore';
import type { HandTrackingResult } from '../types';

interface CameraFeedProps {
  showFeed?: boolean;
  showLandmarks?: boolean;
  size?: 'small' | 'medium' | 'large';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  webosInstance?: any; // WebOS instance to access hand tracking
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  showFeed = true,
  showLandmarks = true,
  size = 'small',
  position = 'top-right',
  webosInstance
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handResults, setHandResults] = useState<HandTrackingResult[]>([]);
  const [currentConfidence, setCurrentConfidence] = useState(0);
  
  const { 
    isHandTrackingActive, 
    cameraPermissionGranted,
    config 
  } = useSystemStore();

  // Size configurations
  const sizeConfig = {
    small: { width: 160, height: 120 },
    medium: { width: 320, height: 240 },
    large: { width: 640, height: 480 }
  };

  // Position configurations
  const positionConfig = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-20 left-4',
    'bottom-right': 'bottom-20 right-4'
  };

  const dimensions = sizeConfig[size];

  useEffect(() => {
    if (cameraPermissionGranted && showFeed && webosInstance) {
      initializeWithWebOS();
    }

    return () => {
      // Cleanup subscriptions but don't stop the main camera stream
      // as it's managed by the WebOS HandTrackingEngine
    };
  }, [cameraPermissionGranted, showFeed, webosInstance]);

  const initializeWithWebOS = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the video element from the hand tracking engine
      const handTrackingEngine = webosInstance.getHandTrackingEngine();
      
      if (handTrackingEngine && handTrackingEngine.getVideoElement()) {
        const sourceVideo = handTrackingEngine.getVideoElement();
        
        if (videoRef.current && sourceVideo) {
          // Use the same stream as the hand tracking engine
          videoRef.current.srcObject = sourceVideo.srcObject;
          
          // Handle play promise properly to avoid interruption errors
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.warn('Video play interrupted:', error);
              // This is normal when switching streams, ignore the error
            });
          }
        }

        // Subscribe to hand tracking results
        const unsubscribe = webosInstance.subscribeToGestures((results: any) => {
          // This will be called for gesture events, but we need raw hand results
        });

        // Subscribe to raw hand tracking results if available
        if (handTrackingEngine.onHandTracking) {
          const unsubscribeHands = handTrackingEngine.onHandTracking((results: HandTrackingResult[]) => {
            console.log('Hand tracking results:', results); // Debug log
            setHandResults(results);
            if (results.length > 0) {
              const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
              setCurrentConfidence(avgConfidence);
            } else {
              setCurrentConfidence(0);
            }
          });
        }

        // Also check if hand tracking is actually running
        console.log('Hand tracking active:', handTrackingEngine.isActive());
        console.log('Hand tracking config:', handTrackingEngine.getConfig());

        setIsLoading(false);
      } else {
        setError('Hand tracking not initialized');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to initialize camera feed:', err);
      setError('Camera feed initialization failed');
      setIsLoading(false);
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const handleVideoLoad = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      
      // Start drawing loop
      drawVideoFrame();
    }
  };

  const drawVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.videoWidth === 0) {
      requestAnimationFrame(drawVideoFrame);
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame (flipped horizontally for mirror effect)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(
      video,
      -canvas.width, 0,
      canvas.width, canvas.height
    );
    ctx.restore();

    // Add overlay information
    drawOverlay(ctx);

    requestAnimationFrame(drawVideoFrame);
  };

  const drawOverlay = (ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    
    // Draw hand landmarks if available and enabled
    if (showLandmarks && handResults.length > 0) {
      handResults.forEach((hand, handIndex) => {
        // Draw hand landmarks
        ctx.fillStyle = hand.handedness === 'Left' ? '#3b82f6' : '#ef4444';
        
        hand.landmarks.forEach((landmark, index) => {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;
          
          // Draw landmark point
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw connections for key landmarks (simplified hand skeleton)
          if (index === 4 || index === 8 || index === 12 || index === 16 || index === 20) {
            // Fingertips - draw slightly larger
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });

        // Draw hand label
        if (hand.landmarks.length > 0) {
          const wrist = hand.landmarks[0];
          const x = wrist.x * canvas.width;
          const y = wrist.y * canvas.height;
          
          ctx.fillStyle = 'white';
          ctx.font = '10px Arial';
          ctx.fillText(
            `${hand.handedness} (${(hand.confidence * 100).toFixed(0)}%)`,
            x + 10, y - 10
          );
        }
      });
    }
    
    // Draw hand tracking status
    const hasHands = handResults.length > 0;
    ctx.fillStyle = hasHands ? '#10b981' : '#ef4444';
    ctx.fillRect(5, 5, 10, 10);
    
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.fillText(
      hasHands ? `${handResults.length} Hand${handResults.length > 1 ? 's' : ''}` : 'No Hands',
      20, 14
    );

    // Draw confidence indicator if tracking
    if (hasHands && currentConfidence > 0) {
      const barWidth = 50;
      const barHeight = 4;
      
      // Background bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(5, canvas.height - 15, barWidth, barHeight);
      
      // Confidence bar
      ctx.fillStyle = '#10b981';
      ctx.fillRect(5, canvas.height - 15, barWidth * currentConfidence, barHeight);
      
      ctx.fillStyle = 'white';
      ctx.font = '8px Arial';
      ctx.fillText(`${(currentConfidence * 100).toFixed(0)}%`, 60, canvas.height - 12);
    }

    // Draw center crosshair
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 10, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 + 10, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, canvas.height / 2 - 10);
    ctx.lineTo(canvas.width / 2, canvas.height / 2 + 10);
    ctx.stroke();
  };

  if (!cameraPermissionGranted || !showFeed) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed ${positionConfig[position]} z-40 bg-black rounded-lg overflow-hidden shadow-lg border border-gray-600`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          style={{
            width: dimensions.width,
            height: dimensions.height + 30 // Extra space for controls
          }}
        >
          {/* Header */}
          <div className="bg-gray-800 px-2 py-1 flex items-center justify-between text-xs text-white">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isHandTrackingActive ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span>Camera</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={toggleVisibility}
                className="text-gray-400 hover:text-white"
                title="Hide camera feed"
              >
                −
              </button>
            </div>
          </div>

          {/* Video Feed */}
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-white text-xs">Loading camera...</div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900">
                <div className="text-white text-xs text-center p-2">{error}</div>
              </div>
            )}

            {/* Hidden video element */}
            <video
              ref={videoRef}
              className="hidden"
              onLoadedData={handleVideoLoad}
              muted
              playsInline
            />

            {/* Canvas for drawing */}
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{
                width: dimensions.width,
                height: dimensions.height
              }}
            />

            {/* Status overlay */}
            <div className="absolute bottom-1 left-1 right-1">
              <div className="flex items-center justify-between text-xs text-white">
                <span className="bg-black bg-opacity-50 px-1 rounded">
                  {config.handTracking.model.toUpperCase()}
                </span>
                <span className="bg-black bg-opacity-50 px-1 rounded">
                  {config.handTracking.maxHands}H
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Minimized indicator */}
      {!isVisible && (
        <motion.button
          className={`fixed ${positionConfig[position]} z-40 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs border border-gray-600 hover:bg-gray-700`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={toggleVisibility}
          title="Show camera feed"
        >
          📷
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// Camera Feed Settings Component
export const CameraFeedSettings: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const { config, updateConfig } = useSystemStore();

  return (
    <div className="relative">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="p-2 text-gray-400 hover:text-white"
        title="Camera settings"
      >
        ⚙️
      </button>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="absolute top-full right-0 mt-2 bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-600 min-w-64"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h3 className="text-white font-semibold mb-3">Camera Settings</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Model Quality
                </label>
                <select
                  value={config.handTracking.model}
                  onChange={(e) => updateConfig({
                    handTracking: {
                      ...config.handTracking,
                      model: e.target.value as 'lite' | 'full'
                    }
                  })}
                  className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm"
                >
                  <option value="lite">Lite (Fast)</option>
                  <option value="full">Full (Accurate)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Max Hands: {config.handTracking.maxHands}
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={config.handTracking.maxHands}
                  onChange={(e) => updateConfig({
                    handTracking: {
                      ...config.handTracking,
                      maxHands: parseInt(e.target.value)
                    }
                  })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Confidence: {(config.handTracking.confidenceThreshold * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={config.handTracking.confidenceThreshold}
                  onChange={(e) => updateConfig({
                    handTracking: {
                      ...config.handTracking,
                      confidenceThreshold: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={config.handTracking.flipHorizontal}
                    onChange={(e) => updateConfig({
                      handTracking: {
                        ...config.handTracking,
                        flipHorizontal: e.target.checked
                      }
                    })}
                  />
                  <span>Mirror Camera</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
