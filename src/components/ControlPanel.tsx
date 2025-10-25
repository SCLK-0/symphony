interface ControlPanelProps {
  frequency: number;
  volume: number;
}

export function ControlPanel({ frequency, volume }: ControlPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500 mb-1">Frequency</p>
          <p className="text-2xl font-light text-gray-800">{Math.round(frequency)} Hz</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500 mb-1">Volume</p>
          <p className="text-2xl font-light text-gray-800">{Math.round(volume)}%</p>
        </div>
      </div>
    </div>
  );
}
