import { useEffect, useRef } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

interface HandDetectionProps {
  onHandsDetected: (results: Results) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function HandDetection({ onHandsDetected, videoRef }: HandDetectionProps) {
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onHandsDetected);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await hands.send({ image: videoRef.current });
        }
      },
      width: 1280,
      height: 720,
    });

    camera.start();

    handsRef.current = hands;
    cameraRef.current = camera;

    return () => {
      camera.stop();
      hands.close();
    };
  }, [onHandsDetected, videoRef]);

  return null;
}
