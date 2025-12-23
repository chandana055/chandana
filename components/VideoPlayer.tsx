
import React, { useRef, useState, useEffect } from 'react';
import { detectProducts } from '../services/geminiService';
import { DetectedProduct } from '../types';

interface VideoPlayerProps {
  src: string;
  onDetections: (detections: DetectedProduct[]) => void;
  onProcessing: (isProcessing: boolean) => void;
  onError: (message: string | null) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, onDetections, onProcessing, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPaused, setIsPaused] = useState(true);

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Reset dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (canvas.width === 0 || canvas.height === 0) {
      onError("Video dimensions are invalid. Ensure the video is loaded properly.");
      return;
    }

    try {
      onError(null); // Clear previous errors
      onProcessing(true);
      onDetections([]); 

      // Draw the current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to Base64
      let dataUrl: string;
      try {
        dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      } catch (e) {
        throw new Error("Cannot capture frame due to security restrictions (CORS). Please try a local file or a CORS-enabled URL.");
      }

      const base64 = dataUrl.split(',')[1];
      const results = await detectProducts(base64);
      onDetections(results.products);
    } catch (error: any) {
      console.error("VideoPlayer Error:", error);
      onError(error.message || "Failed to analyze the video frame.");
    } finally {
      onProcessing(false);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    captureFrame();
  };

  const handlePlay = () => {
    setIsPaused(false);
    onError(null); // Clear errors on play
    onDetections([]); // Clear markers
  };

  return (
    <div className="relative group rounded-xl overflow-hidden shadow-2xl bg-black aspect-video max-w-4xl mx-auto border border-slate-800">
      <video
        ref={videoRef}
        src={src}
        crossOrigin="anonymous"
        className="w-full h-full object-contain"
        onPause={handlePause}
        onPlay={handlePlay}
        onError={() => onError("Error loading video source. Please check the file format or URL.")}
        controls
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {isPaused && !videoRef.current?.ended && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/10 transition-opacity">
          <div className="bg-blue-600/80 p-3 rounded-full animate-pulse backdrop-blur-sm">
             <i className="fas fa-search text-white text-xl"></i>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
