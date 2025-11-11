'use client';

import { useState } from 'react';
import { useStudioStore } from '../lib/store';

interface SongData {
  title: string;
  duration: number;
  tracks: Array<{
    objectId: string;
    objectName: string;
    volume: number;
  }>;
  waveform: number[];
}

export default function PreviewPlayer() {
  const { objects, harmonyMode } = useStudioStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [songData, setSongData] = useState<SongData | null>(null);

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
      if (data.success) {
        setSongData(data.song);
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

      {/* Song Info */}
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

      {/* Generate Button */}
      <button
        onClick={handleGenerateSong}
        disabled={isGenerating || enabledObjects.length === 0}
        className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all shadow-lg"
      >
        {isGenerating
          ? '⏳ Generating Song...'
          : '🎵 Generate Full Song'}
      </button>

      {/* Song Preview */}
      {songData && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 bg-purple-100 rounded-xl">
            <h3 className="font-bold text-lg text-purple-900 mb-2">
              {songData.title}
            </h3>
            <p className="text-sm text-purple-700">
              Duration: {Math.floor(songData.duration / 60)}:
              {String(Math.floor(songData.duration % 60)).padStart(2, '0')}
            </p>
          </div>

          {/* Mock Audio Player */}
          <div className="p-6 bg-gray-900 rounded-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <button className="w-12 h-12 bg-white text-gray-900 rounded-full flex items-center justify-center text-xl hover:scale-110 transition-transform">
                ▶️
              </button>
              <div className="flex-1 mx-4">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-1/3 animate-pulse" />
                </div>
              </div>
              <span className="text-sm">0:00 / {Math.floor(songData.duration / 60)}:{String(Math.floor(songData.duration % 60)).padStart(2, '0')}</span>
            </div>

            {/* Waveform Visualization */}
            <div className="flex items-end gap-0.5 h-16">
              {songData.waveform.slice(0, 100).map((value: number, i: number) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-purple-400 to-pink-400 rounded-t animate-pulse"
                  style={{
                    height: `${value}%`,
                    animationDelay: `${i * 10}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Tracks Info */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">Tracks:</h4>
            {songData.tracks.map((track) => (
              <div
                key={track.objectId}
                className="p-3 bg-gray-50 rounded-lg flex justify-between items-center"
              >
                <span className="font-medium">{track.objectName}</span>
                <span className="text-sm text-gray-600">
                  Vol: {(track.volume * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Options */}
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
