'use client';

import { useStudioStore } from '../lib/store';
import { SingingObject } from '../lib/types';

export default function PresetLibrary() {
  const { objects, selectObject, toggleCreateModal } = useStudioStore();

  const handleEdit = (object: SingingObject) => {
    selectObject(object);
  };

  const handlePreview = (object: SingingObject) => {
    alert(`🎵 Playing preview for ${object.name}...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-purple-900">Preset Library</h2>
        <button
          onClick={toggleCreateModal}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-lg"
        >
          + Create an Object
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {objects.map((object) => (
          <div
            key={object.id}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-purple-300"
            style={{
              background: `linear-gradient(135deg, ${object.color}22 0%, white 100%)`,
            }}
          >
            <div className="flex flex-col items-center space-y-4">
              <div
                className="text-6xl animate-pulse"
                style={{ animationDuration: '2s' }}
              >
                {object.icon}
              </div>

              <h3 className="text-xl font-bold text-gray-800 text-center">
                {object.name}
              </h3>

              <div className="flex gap-2 flex-wrap justify-center">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {object.genre}
                </span>
                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium uppercase">
                  {object.vocalRange}
                </span>
              </div>

              <p className="text-sm text-gray-600 text-center line-clamp-3">
                {object.personality}
              </p>

              <div className="w-full space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Mood</span>
                </div>
                <div className="flex gap-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-yellow-400"
                    style={{ width: `${object.mood.happy * 100}%` }}
                    title={`Happy: ${(object.mood.happy * 100).toFixed(0)}%`}
                  />
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-green-400 to-red-400"
                    style={{ width: `${object.mood.calm * 100}%` }}
                    title={`Calm: ${(object.mood.calm * 100).toFixed(0)}%`}
                  />
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-yellow-300 to-purple-700"
                    style={{ width: `${object.mood.bright * 100}%` }}
                    title={`Bright: ${(object.mood.bright * 100).toFixed(0)}%`}
                  />
                </div>
              </div>

              <div className="flex gap-2 w-full mt-4">
                <button
                  onClick={() => handlePreview(object)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  🎵 Preview
                </button>
                <button
                  onClick={() => handleEdit(object)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all"
                >
                  ✏️ Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
