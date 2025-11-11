'use client';

import { useState } from 'react';
import { useStudioStore } from '../lib/store';
import { SingingObject } from '../lib/types';
import { GENRE_OPTIONS, VOCAL_RANGE_OPTIONS } from '../lib/presets';
import { saveObjects } from '../lib/persistence';

const OBJECT_TYPE_OPTIONS = [
  { type: 'Lamp', icon: '💡' },
  { type: 'Kettle', icon: '🫖' },
  { type: 'Blender', icon: '🌀' },
  { type: 'Toaster', icon: '🍞' },
  { type: 'Clock', icon: '🕰️' },
  { type: 'Refrigerator', icon: '🧊' },
  { type: 'Vacuum', icon: '🧹' },
  { type: 'Mirror', icon: '🪞' },
  { type: 'Chair', icon: '🪑' },
  { type: 'Spoon', icon: '🥄' },
  { type: 'Cup', icon: '☕' },
  { type: 'Book', icon: '📚' },
  { type: 'Fan', icon: '🌀' },
  { type: 'Microwave', icon: '📟' },
];

export default function CreateObjectModal() {
  const { isCreateModalOpen, toggleCreateModal, addObject, objects } = useStudioStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    type: 'Lamp',
    icon: '💡',
    name: '',
    personality: '',
    genre: 'pop' as string,
    vocalRange: 'alto' as 'bass' | 'tenor' | 'alto' | 'soprano',
    moodHappy: 50,
    moodCalm: 50,
    moodBright: 50,
    lyrics: '',
  });

  if (!isCreateModalOpen) return null;

  const handleTypeChange = (type: string) => {
    const selected = OBJECT_TYPE_OPTIONS.find((opt) => opt.type === type);
    setFormData({
      ...formData,
      type,
      icon: selected?.icon || '🎵',
    });
  };

  const handleGenerateLyrics = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generateLyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personality: formData.personality,
          genre: formData.genre,
          mood: {
            happy: formData.moodHappy / 100,
            calm: formData.moodCalm / 100,
            bright: formData.moodBright / 100,
          },
        }),
      });
      const data = await response.json();
      if (data.ok && data.data) {
        setFormData({ ...formData, lyrics: data.data.lyrics });
      }
    } catch (error) {
      console.error('Failed to generate lyrics:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    try {
      await fetch('/api/generateSong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objects: [
            {
              id: 'preview',
              name: formData.name,
              type: formData.type,
              personality: formData.personality,
              genre: formData.genre,
              vocalRange: formData.vocalRange,
              enabled: true,
              volume: 0.75,
              mood: {
                happy: formData.moodHappy / 100,
                calm: formData.moodCalm / 100,
                bright: formData.moodBright / 100,
              },
              icon: formData.icon,
              color: '#000000',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          harmonyMode: false,
        }),
      });
      alert(`🎵 Generating preview for ${formData.name}...`);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.personality) {
      alert('Please fill in at least the name and personality fields!');
      return;
    }

    const now = new Date().toISOString();
    const newObject: SingingObject = {
      id: `custom-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      personality: formData.personality,
      genre: formData.genre,
      vocalRange: formData.vocalRange,
      mood: {
        happy: formData.moodHappy / 100,
        calm: formData.moodCalm / 100,
        bright: formData.moodBright / 100,
      },
      lyrics: formData.lyrics,
      icon: formData.icon,
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      volume: 0.75,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    addObject(newObject);
    
    // Persist to localStorage
    saveObjects([...objects, newObject]);
    
    toggleCreateModal();

    // Reset form
    setFormData({
      type: 'Lamp',
      icon: '💡',
      name: '',
      personality: '',
      genre: 'pop',
      vocalRange: 'alto',
      moodHappy: 50,
      moodCalm: 50,
      moodBright: 50,
      lyrics: '',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">🪄 Create an Object</h2>
            <button
              onClick={toggleCreateModal}
              className="text-white hover:text-gray-200 text-3xl"
            >
              ✕
            </button>
          </div>
          <p className="text-purple-100 mt-2">
            Design a singing personality for an inanimate object
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Object Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Object Type
            </label>
            <div className="grid grid-cols-7 gap-2">
              {OBJECT_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleTypeChange(option.type)}
                  className={`p-3 rounded-xl text-3xl transition-all ${
                    formData.type === option.type
                      ? 'bg-purple-100 ring-2 ring-purple-500 scale-110'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  title={option.type}
                >
                  {option.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name / Nickname
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Melancholic Lamp, Jazz Kettle"
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Core Personality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Core Personality Prompt
            </label>
            <textarea
              value={formData.personality}
              onChange={(e) =>
                setFormData({ ...formData, personality: e.target.value })
              }
              rows={3}
              placeholder="What kind of attitude or soul does this object have? (e.g., 'a tired but loyal office chair who loves jazz')"
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          {/* Genre and Vocal Timbre */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Musical Genre
              </label>
              <select
                value={formData.genre}
                onChange={(e) =>
                  setFormData({ ...formData, genre: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none"
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
                Vocal Timbre
              </label>
              <select
                value={formData.vocalRange}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vocalRange: e.target.value as 'bass' | 'tenor' | 'alto' | 'soprano',
                  })
                }
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none uppercase"
              >
                {VOCAL_RANGE_OPTIONS.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Emotion Spectrum */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Emotion Spectrum
            </h3>

            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>😢 Sad</span>
                <span className="font-medium">{formData.moodHappy}%</span>
                <span>😊 Happy</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.moodHappy}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    moodHappy: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-gradient-to-r from-blue-400 to-yellow-400 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>😴 Calm</span>
                <span className="font-medium">{formData.moodCalm}%</span>
                <span>🤩 Excited</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.moodCalm}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    moodCalm: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-gradient-to-r from-green-400 to-red-400 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>🌑 Dark</span>
                <span className="font-medium">{formData.moodBright}%</span>
                <span>☀️ Bright</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.moodBright}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    moodBright: parseInt(e.target.value),
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
                Optional Custom Lyrics
              </label>
              <button
                onClick={handleGenerateLyrics}
                disabled={isGenerating}
                className="px-4 py-1 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? '⏳ Generating' : '✨ Generate Lyrics'}
              </button>
            </div>
            <textarea
              value={formData.lyrics}
              onChange={(e) =>
                setFormData({ ...formData, lyrics: e.target.value })
              }
              rows={4}
              placeholder="Enter custom lyrics or generate them..."
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none font-mono text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleGeneratePreview}
              disabled={isGenerating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all shadow-lg"
            >
              {isGenerating ? '⏳ Generating' : '🎵 Generate Song Preview'}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-lg"
            >
              💾 Save Object
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
