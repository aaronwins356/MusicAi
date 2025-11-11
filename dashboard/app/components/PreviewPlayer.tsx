'use client';

import { useState } from 'react';
import { useStudioStore } from '../lib/store';
import { SongResult } from '../lib/types';

export default function PreviewPlayer() {
  const { objects, harmonyMode } = useStudioStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [songData, setSongData] = useState<SongResult | null>(null);

  const handleGenerateSong = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generateSong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objects: objects.filter((obj) => obj.enabled),
          harmonyMode,
        }),
      });
      const data = await response.json();
      if (data.ok && data.data) {
        setSongData(data.data);
      }
    } catch (error) {
      console.error('Failed to generate song:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      objects: objects.filter((obj) => obj.enabled),
      harmonyMode,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `singing-objects-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const enabledObjects = objects.filter((obj) => obj.enabled);

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
      <h2 className="text-3xl font-bold text-purple-900">Preview & Export</h2>

      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-purple-600">
              {enabledObjects.length}
            </div>
            <div className="text-sm text-gray-600">Active Objects</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-pink-600">
              {[...new Set(enabledObjects.map((obj) => obj.genre))].length}
            </div>
            <div className="text-sm text-gray-600">Genres</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">
              {harmonyMode ? '🎼' : '🎵'}
            </div>
            <div className="text-sm text-gray-600">
              {harmonyMode ? 'Harmony' : 'Solo'}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerateSong}
        disabled={isGenerating || enabledObjects.length === 0}
        className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all shadow-lg"
      >
        {isGenerating
          ? '⏳ Generating Song'
          : '🎵 Generate Full Song'}
      </button>

      {songData && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 bg-purple-100 rounded-xl">
            <h3 className="font-bold text-lg text-purple-900 mb-2">
              {songData.title}
            </h3>
            <div className="flex gap-4 text-sm text-purple-700">
              <span>BPM: {songData.bpm}</span>
              <span>Key: {songData.key}</span>
              <span>Mode: {songData.harmonyMode ? 'Harmony' : 'Solo'}</span>
            </div>
          </div>

          {/* Audio Player */}
          <div className="p-6 bg-gray-900 rounded-xl text-white space-y-4">
            <audio 
              controls 
              src={songData.mixedAudioUrl} 
              className="w-full"
            />

            {/* Per-Track Waveforms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {songData.tracks.map((track) => (
                <div key={track.objectId} className="p-3 rounded-xl border border-gray-700">
                  <div className="font-medium mb-2">{track.displayName}</div>
                  <div className="text-xs text-gray-400 mb-2">
                    {track.genre} · {track.vocalRange.toUpperCase()}
                  </div>
                  <svg viewBox="0 0 100 30" className="w-full h-16">
                    {track.waveform.map((p, i) => {
                      const x = p.t * 100;
                      const y = 15 - p.v * 14;
                      return (
                        <circle 
                          key={i} 
                          cx={x} 
                          cy={y} 
                          r="0.4" 
                          fill="currentColor"
                          className="text-purple-400"
                        />
                      );
                    })}
                  </svg>
                </div>
              ))}
            </div>
          </div>

          {/* Track Details */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">Track Details:</h4>
            {songData.tracks.map((track) => (
              <div
                key={track.objectId}
                className="p-3 bg-gray-50 rounded-lg flex justify-between items-center"
              >
                <span className="font-medium">{track.displayName}</span>
                <span className="text-sm text-gray-600">
                  Vol: {(track.volume * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 pt-4 border-t-2 border-gray-200">
        <h3 className="font-semibold text-gray-700">Export Options:</h3>
        <div className="flex gap-3">
          <button
            onClick={handleExportJSON}
            disabled={enabledObjects.length === 0}
            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            📄 Download JSON
          </button>
          <button
            onClick={() =>
              alert(
                '🎵 MP3 export will be available when integrated with a real backend'
              )
            }
            disabled={!songData}
            className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            🎧 Download MP3
          </button>
        </div>
      </div>
    </div>
  );
}
