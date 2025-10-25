import { useEffect, useRef } from 'react';
import { Results } from '@mediapipe/hands';

interface HandCanvasProps {
  results: Results | null;
  videoRef: React.RefObject<HTMLVideoElement>;
}

// Hand connections for drawing lines between landmarks
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
  [0, 9], [9, 10], [10, 11], [11, 12], // Middle finger
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring finger
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17] // Palm connections
];

export function HandCanvas({ results, videoRef }: HandCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (!canvasRef.current || !videoRef.current) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    };

    updateCanvasSize();

    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadeddata', updateCanvasSize);
      video.addEventListener('resize', updateCanvasSize);
    }

    const interval = setInterval(updateCanvasSize, 500);

    return () => {
      clearInterval(interval);
      if (video) {
        video.removeEventListener('loadeddata', updateCanvasSize);
        video.removeEventListener('resize', updateCanvasSize);
      }
    };
  }, [videoRef]);

  useEffect(() => {
    if (!canvasRef.current || !results) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        // Draw connections (purple lines)
        ctx.strokeStyle = '#9333ea';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        for (const connection of HAND_CONNECTIONS) {
          const start = landmarks[connection[0]];
          const end = landmarks[connection[1]];
          
          ctx.beginPath();
          ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
          ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
          ctx.stroke();
        }
        
        // Draw landmarks (purple dots)
        ctx.fillStyle = '#a855f7';
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 2;
        
        for (const landmark of landmarks) {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;
          
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }, [results]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
