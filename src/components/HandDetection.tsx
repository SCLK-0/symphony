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
        // Detect if mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Get camera stream with mobile-optimized settings
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: isMobile ? 640 : 1280 },
            height: { ideal: isMobile ? 480 : 720 },
            facingMode: 'user',
            frameRate: { ideal: isMobile ? 15 : 30 } // Lower frame rate on mobile
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

        // Detect if mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: isMobile ? 0 : 1, // Use lighter model on mobile
          minDetectionConfidence: isMobile ? 0.6 : 0.7,
          minTrackingConfidence: isMobile ? 0.6 : 0.7,
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
