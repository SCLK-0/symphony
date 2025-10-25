interface HandIndicatorsProps {
  hasLeftHand: boolean;
  hasRightHand: boolean;
}

export function HandIndicators({ hasLeftHand, hasRightHand }: HandIndicatorsProps) {
  return (
    <div className="absolute top-4 left-0 right-0 flex justify-center gap-8 z-10">
      <div
        className={`px-6 py-2 rounded-full font-medium text-sm transition-all ${
          hasLeftHand
            ? 'bg-purple-600 text-white shadow-lg'
            : 'bg-white/80 text-gray-400 backdrop-blur-sm'
        }`}
      >
        Left Hand
      </div>
      <div
        className={`px-6 py-2 rounded-full font-medium text-sm transition-all ${
          hasRightHand
            ? 'bg-purple-600 text-white shadow-lg'
            : 'bg-white/80 text-gray-400 backdrop-blur-sm'
        }`}
      >
        Right Hand
      </div>
    </div>
  );
}
