import { useEffect, useRef } from 'react';
import { Results, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

interface HandCanvasProps {
  results: Results | null;
  videoRef: React.RefObject<HTMLVideoElement>;
}

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
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
          color: '#9333ea',
          lineWidth: 4,
        });
        drawLandmarks(ctx, landmarks, {
          color: '#a855f7',
          fillColor: '#e9d5ff',
          lineWidth: 2,
          radius: 5,
        });
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
