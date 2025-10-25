import { useEffect, useRef } from 'react';
import { Results } from '@mediapipe/hands';

interface HandDetectionProps {
  onHandsDetected: (results: Results) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

export function HandDetection({ onHandsDetected, videoRef }: HandDetectionProps) {
  const handsRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!videoRef.current) return;

    const initializeCamera = async () => {
      try {
        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }

        // Wait for MediaPipe to load
        const waitForMediaPipe = () => {
          return new Promise<void>((resolve) => {
            const checkMediaPipe = () => {
              if (window.Hands) {
                resolve();
              } else {
                setTimeout(checkMediaPipe, 100);
              }
            };
            checkMediaPipe();
          });
        };

        await waitForMediaPipe();

        // Initialize MediaPipe Hands
        const hands = new window.Hands({
          locateFile: (file: string) => {
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
        handsRef.current = hands;

        // Process video frames
        const processFrame = async () => {
          if (videoRef.current && handsRef.current && videoRef.current.readyState >= 2) {
            await handsRef.current.send({ image: videoRef.current });
          }
          animationRef.current = requestAnimationFrame(processFrame);
        };

        // Start processing when video is ready
        videoRef.current.addEventListener('loadeddata', () => {
          processFrame();
        });

      } catch (error) {
        console.error('Failed to initialize camera or MediaPipe:', error);
      }
    };

    initializeCamera();

    return () => {
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, [onHandsDetected, videoRef]);

  return null;
}
