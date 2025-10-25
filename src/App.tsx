import { useRef, useState, useCallback, useEffect } from 'react';
import { Results } from '@mediapipe/hands';
import { HandDetection } from './components/HandDetection';
import { HandCanvas } from './components/HandCanvas';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { ControlPanel } from './components/ControlPanel';
import { HandIndicators } from './components/HandIndicators';
import { HandWaveVisualizer } from './components/HandWaveVisualizer';
import { SymphonyAudioEngine } from './utils/audioEngine';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioEngineRef = useRef<SymphonyAudioEngine | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [frequency, setFrequency] = useState(440);
  const [volume, setVolume] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [hasLeftHand, setHasLeftHand] = useState(false);
  const [hasRightHand, setHasRightHand] = useState(false);
  const [leftHandFreq, setLeftHandFreq] = useState(330);
  const [leftHandVol, setLeftHandVol] = useState(0);
  const [rightHandFreq, setRightHandFreq] = useState(440);
  const [rightHandVol, setRightHandVol] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [showFaaah, setShowFaaah] = useState(false);
  const faaahAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastFaaahTimeRef = useRef<number>(0);

  const handleStart = async () => {
    const engine = new SymphonyAudioEngine();
    audioEngineRef.current = engine;
    setAnalyser(engine.getAnalyser());
    engine.startSymphony();
    setIsStarted(true);

    const audio = new Audio('/faaah.mp3');
    audio.preload = 'auto';
    faaahAudioRef.current = audio;
  };

  useEffect(() => {
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
      }
    };
  }, []);

  const triggerFaaah = useCallback(() => {
    const now = Date.now();
    if (now - lastFaaahTimeRef.current < 2000) return;

    lastFaaahTimeRef.current = now;
    setShowFaaah(true);

    if (faaahAudioRef.current) {
      faaahAudioRef.current.currentTime = 0;
      faaahAudioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    setTimeout(() => setShowFaaah(false), 1500);
  }, []);

  const calculateHandOpenness = (landmarks: any[]): number => {
    const thumb = landmarks[4];
    const index = landmarks[8];
    const middle = landmarks[12];
    const ring = landmarks[16];
    const pinky = landmarks[20];
    const palm = landmarks[0];

    const distances = [
      Math.hypot(thumb.x - palm.x, thumb.y - palm.y),
      Math.hypot(index.x - palm.x, index.y - palm.y),
      Math.hypot(middle.x - palm.x, middle.y - palm.y),
      Math.hypot(ring.x - palm.x, ring.y - palm.y),
      Math.hypot(pinky.x - palm.x, pinky.y - palm.y),
    ];

    return distances.reduce((a, b) => a + b, 0) / distances.length;
  };

  const onHandsDetected = useCallback((handResults: Results) => {
    setResults(handResults);

    if (!audioEngineRef.current) return;

    if (handResults.multiHandLandmarks && handResults.multiHandLandmarks.length > 0) {
      const leftHandIndex = handResults.multiHandedness?.findIndex(
        (hand) => hand.label === 'Left'
      );
      const rightHandIndex = handResults.multiHandedness?.findIndex(
        (hand) => hand.label === 'Right'
      );

      let leftHand = null;
      let rightHand = null;
      let avgFreq = 440;
      let avgVolume = 0;
      let handCount = 0;

      const hasLeft = leftHandIndex !== -1 && leftHandIndex !== undefined;
      const hasRight = rightHandIndex !== -1 && rightHandIndex !== undefined;

      setHasLeftHand(hasLeft);
      setHasRightHand(hasRight);

      let leftOpenness = 1;
      let rightOpenness = 1;

      if (hasLeft) {
        const landmarks = handResults.multiHandLandmarks[leftHandIndex];
        const palmY = landmarks[9].y;
        const palmX = landmarks[9].x;
        const openness = calculateHandOpenness(landmarks);
        leftOpenness = openness;

        leftHand = { x: palmX, y: palmY, openness };
        const freq = 330 + (1 - palmY) * 440;
        const vol = openness * 100;
        setLeftHandFreq(freq);
        setLeftHandVol(vol);
        avgFreq += freq;
        avgVolume += vol;
        handCount++;
      } else {
        setLeftHandVol(0);
      }

      if (hasRight) {
        const landmarks = handResults.multiHandLandmarks[rightHandIndex];
        const palmY = landmarks[9].y;
        const palmX = landmarks[9].x;
        const openness = calculateHandOpenness(landmarks);
        rightOpenness = openness;

        rightHand = { x: palmX, y: palmY, openness };
        const freq = 440 + (1 - palmY) * 550;
        const vol = openness * 100;
        setRightHandFreq(freq);
        setRightHandVol(vol);
        avgFreq += freq;
        avgVolume += vol;
        handCount++;
      } else {
        setRightHandVol(0);
      }

      if (hasLeft && hasRight && leftOpenness < 0.15 && rightOpenness < 0.15) {
        triggerFaaah();
      }

      if (handCount > 0) {
        setFrequency(avgFreq / handCount);
        setVolume(avgVolume / handCount);
      }

      audioEngineRef.current.updateFromHands(leftHand, rightHand);
    } else {
      setHasLeftHand(false);
      setHasRightHand(false);
      audioEngineRef.current.updateFromHands(null, null);
    }
  }, [triggerFaaah]);


  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 pt-4 md:pt-12 pb-4 max-w-7xl">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Main video area */}
          <div className="xl:col-span-8 space-y-4">
            <div className="relative bg-black rounded-xl overflow-hidden shadow-xl aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <HandCanvas results={results} videoRef={videoRef} />
              <HandIndicators hasLeftHand={hasLeftHand} hasRightHand={hasRightHand} />
              {showFaaah && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-20 animate-pulse">
                  <img
                    src="/artworks-rnByyu0lyPqKzt3b-WhSvtw-t500x500.jpg"
                    alt="FAAAH"
                    className="w-48 h-48 object-contain animate-bounce"
                  />
                </div>
              )}
              {isStarted && <HandDetection onHandsDetected={onHandsDetected} videoRef={videoRef} />}
              {!isStarted && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <button
                    onClick={handleStart}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-full shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Start
                  </button>
                </div>
              )}
            </div>

            {/* Symphony waveform */}
            <div className="bg-white rounded-xl shadow-lg p-4 h-24">
              <WaveformVisualizer analyser={analyser} />
            </div>
          </div>

          {/* Right sidebar with controls and hand visualizers */}
          <div className="xl:col-span-4 space-y-4">
            {/* Overall frequency and volume */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <ControlPanel
                frequency={frequency}
                volume={volume}
              />
            </div>

            {/* Hand visualizers */}
            <div className="space-y-4">
              <HandWaveVisualizer
                frequency={leftHandFreq}
                volume={leftHandVol}
                isActive={hasLeftHand}
                color="#3b82f6"
                label="Left Hand"
              />
              <HandWaveVisualizer
                frequency={rightHandFreq}
                volume={rightHandVol}
                isActive={hasRightHand}
                color="#ef4444"
                label="Right Hand"
              />
            </div>

            {/* Title Section */}
            <div className="bg-white rounded-xl shadow-lg p-4 h-32 flex items-center justify-center">
              <h1 className="text-3xl font-light text-gray-800 tracking-wide">
                A Symphony to You
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
