// Drawing App with Gesture Control

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface DrawingAppProps {
  windowId: string;
}

interface DrawingState {
  isDrawing: boolean;
  currentPath: { x: number; y: number }[];
  paths: { x: number; y: number }[][];
  brushSize: number;
  brushColor: string;
}

export const DrawingApp: React.FC<DrawingAppProps> = ({ windowId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    currentPath: [],
    paths: [],
    brushSize: 5,
    brushColor: '#3b82f6',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all paths
    drawingState.paths.forEach(path => {
      if (path.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = drawingState.brushColor;
        ctx.lineWidth = drawingState.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
      }
    });

    // Draw current path
    if (drawingState.currentPath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = drawingState.brushColor;
      ctx.lineWidth = drawingState.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.moveTo(drawingState.currentPath[0].x, drawingState.currentPath[0].y);
      for (let i = 1; i < drawingState.currentPath.length; i++) {
        ctx.lineTo(drawingState.currentPath[i].x, drawingState.currentPath[i].y);
      }
      ctx.stroke();
    }
  }, [drawingState]);

  const startDrawing = (x: number, y: number) => {
    setDrawingState(prev => ({
      ...prev,
      isDrawing: true,
      currentPath: [{ x, y }],
    }));
  };

  const continueDrawing = (x: number, y: number) => {
    if (!drawingState.isDrawing) return;

    setDrawingState(prev => ({
      ...prev,
      currentPath: [...prev.currentPath, { x, y }],
    }));
  };

  const stopDrawing = () => {
    if (!drawingState.isDrawing) return;

    setDrawingState(prev => ({
      ...prev,
      isDrawing: false,
      paths: [...prev.paths, prev.currentPath],
      currentPath: [],
    }));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    startDrawing(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    continueDrawing(x, y);
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  const clearCanvas = () => {
    setDrawingState(prev => ({
      ...prev,
      paths: [],
      currentPath: [],
      isDrawing: false,
    }));
  };

  const undo = () => {
    setDrawingState(prev => ({
      ...prev,
      paths: prev.paths.slice(0, -1),
    }));
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="font-semibold text-gray-900">Drawing Canvas</h2>
          
          {/* Brush Size */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Size:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={drawingState.brushSize}
              onChange={(e) => setDrawingState(prev => ({
                ...prev,
                brushSize: parseInt(e.target.value)
              }))}
              className="w-20"
            />
            <span className="text-sm text-gray-600 w-6">{drawingState.brushSize}</span>
          </div>

          {/* Color Picker */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Color:</label>
            <input
              type="color"
              value={drawingState.brushColor}
              onChange={(e) => setDrawingState(prev => ({
                ...prev,
                brushColor: e.target.value
              }))}
              className="w-8 h-8 rounded border"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={undo}
            disabled={drawingState.paths.length === 0}
          >
            Undo
          </motion.button>
          <motion.button
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearCanvas}
          >
            Clear
          </motion.button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Gesture Instructions */}
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 text-sm text-gray-600 max-w-xs">
          <h3 className="font-semibold mb-2">Gesture Controls:</h3>
          <ul className="space-y-1 text-xs">
            <li className="flex items-center space-x-2">
              <span>👌</span>
              <span>Pinch to start drawing</span>
            </li>
            <li className="flex items-center space-x-2">
              <span>👆</span>
              <span>Move finger to draw</span>
            </li>
            <li className="flex items-center space-x-2">
              <span>✋</span>
              <span>Open palm to stop</span>
            </li>
            <li className="flex items-center space-x-2">
              <span>✌️</span>
              <span>Two fingers to zoom</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-3 py-2 bg-gray-100 border-t border-gray-200 text-xs text-gray-600">
        Paths: {drawingState.paths.length} | 
        {drawingState.isDrawing ? ' Drawing...' : ' Ready'} |
        Brush: {drawingState.brushSize}px
      </div>
    </div>
  );
};
