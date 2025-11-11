'use client';

import { useStudioStore } from '../lib/store';

export default function SongMixer() {
  const {
    objects,
    toggleObjectEnabled,
    setObjectVolume,
    harmonyMode,
    toggleHarmonyMode,
  } = useStudioStore();

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-purple-900">Song Mixer</h2>
        <button
          onClick={toggleHarmonyMode}
          className={`px-6 py-3 rounded-full font-semibold transition-all shadow-lg transform hover:scale-105 ${
            harmonyMode
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {harmonyMode ? '🎼 Harmony Mode ON' : '🎵 Harmony Mode OFF'}
        </button>
      </div>

      <p className="text-gray-600">
        Toggle tracks, adjust volumes, and create harmonies between objects
      </p>

      {/* Tracks */}
      <div className="space-y-4">
        {objects.map((object) => (
          <div
            key={object.id}
            className={`p-4 rounded-xl border-2 transition-all ${
              object.enabled
                ? 'border-purple-300 bg-purple-50'
                : 'border-gray-200 bg-gray-50 opacity-60'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Toggle Button */}
              <button
                onClick={() => toggleObjectEnabled(object.id)}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                  object.enabled
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse'
                    : 'bg-gray-300'
                }`}
                style={{
                  animationDuration: object.enabled ? '2s' : '0s',
                }}
              >
                {object.icon}
              </button>

              {/* Object Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-800">
                    {object.object_name}
                  </h3>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                    {object.genre}
                  </span>
                  <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs font-medium uppercase">
                    {object.vocal_range}
                  </span>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16">Volume:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(object.volume || 0.7) * 100}
                    onChange={(e) =>
                      setObjectVolume(object.id, parseInt(e.target.value) / 100)
                    }
                    disabled={!object.enabled}
                    className="flex-1 h-2 bg-gradient-to-r from-purple-300 to-pink-300 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700 w-12">
                    {((object.volume || 0.7) * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Visual Waveform */}
                {object.enabled && (
                  <div className="flex items-end gap-0.5 h-8 mt-2">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-purple-400 to-pink-400 rounded-t animate-pulse"
                        style={{
                          height: `${Math.random() * 100}%`,
                          animationDelay: `${i * 50}ms`,
                          animationDuration: '1s',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="pt-4 border-t-2 border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            Active Tracks:{' '}
            <span className="font-bold text-purple-600">
              {objects.filter((obj) => obj.enabled).length} / {objects.length}
            </span>
          </span>
          <span className="text-gray-600">
            Mode:{' '}
            <span className="font-bold text-purple-600">
              {harmonyMode ? 'Harmony' : 'Solo'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
