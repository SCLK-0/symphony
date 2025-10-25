import { useEffect, useRef } from 'react';

interface HandWaveVisualizerProps {
    frequency: number;
    volume: number;
    isActive: boolean;
    color: string;
    label: string;
}

export function HandWaveVisualizer({ frequency, volume, isActive, color, label }: HandWaveVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const timeRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const animate = () => {
            timeRef.current += 0.05;

            const width = canvas.width;
            const height = canvas.height;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            if (!isActive) {
                // Draw flat line when inactive
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, height / 2);
                ctx.lineTo(width, height / 2);
                ctx.stroke();
                animationRef.current = requestAnimationFrame(animate);
                return;
            }

            // Draw wave based on frequency and volume
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();

            const amplitude = (volume / 100) * (height / 3);
            const waveFreq = frequency / 200; // Scale frequency for visual effect

            for (let x = 0; x < width; x++) {
                const y = height / 2 + Math.sin((x * waveFreq * 0.02) + timeRef.current) * amplitude;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();

            // Add glow effect
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [frequency, volume, isActive, color]);

    return (
        <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <div className="flex gap-4 text-xs text-gray-500">
                    <span>{Math.round(frequency)} Hz</span>
                    <span>{Math.round(volume)}%</span>
                </div>
            </div>
            <canvas
                ref={canvasRef}
                width={300}
                height={80}
                className="w-full h-20 rounded"
            />
        </div>
    );
}