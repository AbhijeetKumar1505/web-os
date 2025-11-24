// Hand Tracking Engine using TensorFlow.js HandPose model

import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import type { HandTrackingResult, HandTrackingConfig } from '../types';

// Define MediaPipe-like Results interface for compatibility
interface Results {
  multiHandLandmarks?: any[][];
  multiHandedness?: { label: string; score: number }[];
}

export class HandTrackingEngine {
  private model: handpose.HandPose | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private isInitialized = false;
  private isRunning = false;
  private config: HandTrackingConfig;
  private callbacks: ((results: HandTrackingResult[]) => void)[] = [];
  private visualCallbacks: ((results: Results) => void)[] = [];
  private animationFrameId: number | null = null;

  constructor(config?: Partial<HandTrackingConfig>) {
    this.config = {
      model: 'lite',
      maxHands: 2,
      confidenceThreshold: 0.6,
      smoothing: 0.6,
      flipHorizontal: true,
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing hand tracking engine...');

      // Create video element for camera input
      this.videoElement = document.createElement('video');
      this.videoElement.style.display = 'none';
      this.videoElement.width = 640;
      this.videoElement.height = 480;
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;
      document.body.appendChild(this.videoElement);

      // Create canvas for processing
      this.canvasElement = document.createElement('canvas');
      this.canvasElement.style.display = 'none';
      this.canvasElement.width = 640;
      this.canvasElement.height = 480;
      document.body.appendChild(this.canvasElement);

      // Initialize TensorFlow.js backend
      await tf.ready();
      console.log('TensorFlow.js backend:', tf.getBackend());

      // Load the HandPose model
      console.log('Loading HandPose model...');
      this.model = await handpose.load({
        detectionConfidence: this.config.confidenceThreshold,
        iouThreshold: 0.3,
        scoreThreshold: this.config.confidenceThreshold
      });
      console.log('HandPose model loaded successfully');

      this.isInitialized = true;
      console.log('Hand tracking engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize hand tracking:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Hand tracking engine not initialized');
    }

    if (this.isRunning) return;

    try {
      console.log('Starting camera stream...');

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (this.videoElement) {
        this.videoElement.srcObject = stream;

        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          this.videoElement!.onloadedmetadata = () => {
            this.videoElement!.play()
              .then(() => {
                console.log('Video stream started successfully');
                resolve();
              })
              .catch(reject);
          };
          this.videoElement!.onerror = reject;
        });
      }

      this.isRunning = true;
      this.startDetectionLoop();

    } catch (error) {
      console.error('Failed to start hand tracking:', error);
      throw error;
    }
  }

  private determineHandedness(landmarks: any[], index: number): 'Left' | 'Right' {
    // Simple heuristic: use the thumb position relative to other fingers
    // In a mirrored camera view, left hand appears on the right side
    if (landmarks.length >= 21) {
      const thumb = landmarks[4]; // Thumb tip
      const pinky = landmarks[20]; // Pinky tip

      // If thumb is to the right of pinky in camera view, it's likely the left hand
      // (because camera is mirrored)
      if (this.config.flipHorizontal) {
        return thumb.x > pinky.x ? 'Left' : 'Right';
      } else {
        return thumb.x < pinky.x ? 'Left' : 'Right';
      }
    }

    // Fallback: alternate between hands
    return index % 2 === 0 ? 'Right' : 'Left';
  }

  private startDetectionLoop(): void {
    if (!this.isRunning || !this.videoElement) return;

    const detect = async () => {
      if (!this.isRunning || !this.videoElement || !this.model) return;

      try {
        // Run real hand detection using HandPose model
        const predictions = await this.model.estimateHands(this.videoElement);

        // Convert HandPose predictions to our HandTrackingResult format
        const results: HandTrackingResult[] = predictions
          .filter(prediction => prediction.handInViewConfidence >= this.config.confidenceThreshold)
          .slice(0, this.config.maxHands) // Limit to max hands
          .map((prediction, index) => {
            // Convert 3D landmarks to our format
            const landmarks = prediction.landmarks.map(landmark => ({
              x: landmark[0] / this.videoElement!.videoWidth,  // Normalize to 0-1
              y: landmark[1] / this.videoElement!.videoHeight, // Normalize to 0-1
              z: landmark[2] || 0, // Z coordinate (depth)
              visibility: 1.0 // HandPose doesn't provide visibility, assume visible
            }));

            return {
              landmarks,
              handedness: this.determineHandedness(landmarks, index),
              confidence: prediction.handInViewConfidence,
              timestamp: Date.now()
            };
          });

        // Emit results to callbacks
        this.callbacks.forEach(callback => callback(results));

        // Emit visual results for compatibility
        const visualResults: Results = {
          multiHandLandmarks: results.map(r => r.landmarks),
          multiHandedness: results.map(r => ({ label: r.handedness, score: r.confidence }))
        };
        this.visualCallbacks.forEach(callback => callback(visualResults));

        // Debug log when hands are detected
        if (results.length > 0) {
          console.log(`Detected ${results.length} hand(s) with confidence:`,
            results.map(r => `${r.handedness}: ${(r.confidence * 100).toFixed(1)}%`));
        }

      } catch (error) {
        console.warn('Hand detection error:', error);
      }

      // Continue loop
      if (this.isRunning) {
        this.animationFrameId = requestAnimationFrame(detect);
      }
    };

    detect();
  }

  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
  }


  onHandTracking(callback: (results: HandTrackingResult[]) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  onVisualResults(callback: (results: Results) => void): () => void {
    this.visualCallbacks.push(callback);
    return () => {
      const index = this.visualCallbacks.indexOf(callback);
      if (index > -1) {
        this.visualCallbacks.splice(index, 1);
      }
    };
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  updateConfig(config: Partial<HandTrackingConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Hand tracking config updated:', this.config);

    // Note: HandPose model doesn't support runtime config updates
    // Would need to reload model for some changes, but we'll keep it simple
  }

  getConfig(): HandTrackingConfig {
    return { ...this.config };
  }

  isActive(): boolean {
    return this.isRunning;
  }

  destroy(): void {
    this.stop();

    if (this.videoElement) {
      document.body.removeChild(this.videoElement);
      this.videoElement = null;
    }

    if (this.canvasElement) {
      document.body.removeChild(this.canvasElement);
      this.canvasElement = null;
    }

    this.model = null;
    this.callbacks = [];
    this.visualCallbacks = [];
    this.isInitialized = false;
  }
}
