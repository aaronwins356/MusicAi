'use client';

import { useEffect } from 'react';
import PresetLibrary from './components/PresetLibrary';
import ComposerPanel from './components/ComposerPanel';
import CreateObjectModal from './components/CreateObjectModal';
import SongMixer from './components/SongMixer';
import PreviewPlayer from './components/PreviewPlayer';
import { useStudioStore } from './lib/store';

export default function Home() {
  const { hydrateFromStorage } = useStudioStore();

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white py-6 shadow-lg">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">🎵 Singing Object Studio</h1>
          <p className="text-purple-100">
            Design, customize, and perform with AI-generated singing personalities for inanimate objects
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Preset Library */}
        <section>
          <PresetLibrary />
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Composer Panel */}
          <section>
            <ComposerPanel />
          </section>

          {/* Right Column: Song Mixer */}
          <section>
            <SongMixer />
          </section>
        </div>

        {/* Preview Player */}
        <section>
          <PreviewPlayer />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-6 text-center text-gray-600">
          <p className="text-sm">
            🎼 Singing Object Studio - A living sound lab for object personalities
          </p>
        </div>
      </footer>

      {/* Create Object Modal */}
      <CreateObjectModal />
    </div>
  );
}
