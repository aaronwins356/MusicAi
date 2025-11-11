'use client';

import { useState } from 'react';
import { useStudioStore } from '../lib/store';
import { GENRE_OPTIONS, VOCAL_RANGE_OPTIONS } from '../lib/presets';

export default function ComposerPanel() {
  const { selectedObject, updateObject, selectObject } = useStudioStore();
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);

  if (!selectedObject) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
        <div className="text-6xl mb-4">🎵</div>
        <p className="text-gray-500 text-lg">
          Select an object from the library to edit its attributes
        </p>
      </div>
    );
  }

  const handleGenerateLyrics = async () => {
    setIsGeneratingLyrics(true);
    try {
      const response = await fetch('/api/generateLyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personality: selectedObject.personality,
          genre: selectedObject.genre,
          mood: selectedObject.mood,
        }),
      });
      const data = await response.json();
      if (data.success) {
        updateObject(selectedObject.id, { lyrics: data.lyrics });
      }
    } catch (error) {
      console.error('Failed to generate lyrics:', error);
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const handleSingPreview = () => {
    alert(`🎤 ${selectedObject.object_name} is singing:\n\n${selectedObject.lyrics || 'No lyrics yet...'}`);
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-purple-900">Object Composer</h2>
        <button
          onClick={() => selectObject(null)}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Object Icon and Name */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
        <div className="text-5xl">{selectedObject.icon}</div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Object Name
          </label>
          <input
            type="text"
            value={selectedObject.object_name}
            onChange={(e) =>
              updateObject(selectedObject.id, { object_name: e.target.value })
            }
            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Personality Summary */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Personality Summary
        </label>
        <textarea
          value={selectedObject.personality}
          onChange={(e) =>
            updateObject(selectedObject.id, { personality: e.target.value })
          }
          rows={3}
          className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
        />
      </div>

      {/* Genre and Vocal Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Genre / Musical Style
          </label>
          <select
            value={selectedObject.genre}
            onChange={(e) =>
              updateObject(selectedObject.id, { genre: e.target.value })
            }
            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none"
          >
            {GENRE_OPTIONS.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vocal Range
          </label>
          <select
            value={selectedObject.vocal_range}
            onChange={(e) =>
              updateObject(selectedObject.id, {
                vocal_range: e.target.value as 'bass' | 'tenor' | 'alto' | 'soprano',
              })
            }
            className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none uppercase"
          >
            {VOCAL_RANGE_OPTIONS.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mood Sliders */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Mood Spectrum</h3>

        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>😢 Sad</span>
            <span className="font-medium">
              {(selectedObject.mood.happy * 100).toFixed(0)}%
            </span>
            <span>😊 Happy</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={selectedObject.mood.happy * 100}
            onChange={(e) =>
              updateObject(selectedObject.id, {
                mood: {
                  ...selectedObject.mood,
                  happy: parseInt(e.target.value) / 100,
                },
              })
            }
            className="w-full h-2 bg-gradient-to-r from-blue-400 to-yellow-400 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>😴 Calm</span>
            <span className="font-medium">
              {(selectedObject.mood.calm * 100).toFixed(0)}%
            </span>
            <span>🤩 Excited</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={selectedObject.mood.calm * 100}
            onChange={(e) =>
              updateObject(selectedObject.id, {
                mood: {
                  ...selectedObject.mood,
                  calm: parseInt(e.target.value) / 100,
                },
              })
            }
            className="w-full h-2 bg-gradient-to-r from-green-400 to-red-400 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>🌑 Dark</span>
            <span className="font-medium">
              {(selectedObject.mood.bright * 100).toFixed(0)}%
            </span>
            <span>☀️ Bright</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={selectedObject.mood.bright * 100}
            onChange={(e) =>
              updateObject(selectedObject.id, {
                mood: {
                  ...selectedObject.mood,
                  bright: parseInt(e.target.value) / 100,
                },
              })
            }
            className="w-full h-2 bg-gradient-to-r from-purple-700 to-yellow-300 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Custom Lyrics */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Custom Lyrics
          </label>
          <button
            onClick={handleGenerateLyrics}
            disabled={isGeneratingLyrics}
            className="px-4 py-1 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGeneratingLyrics ? '⏳ Generating...' : '✨ Generate Lyrics'}
          </button>
        </div>
        <textarea
          value={selectedObject.lyrics || ''}
          onChange={(e) =>
            updateObject(selectedObject.id, { lyrics: e.target.value })
          }
          rows={4}
          placeholder="Enter custom lyrics or generate them..."
          className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none font-mono text-sm"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={handleSingPreview}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transform hover:scale-105 transition-all shadow-lg"
        >
          🎤 Sing Preview
        </button>
      </div>
    </div>
  );
}
