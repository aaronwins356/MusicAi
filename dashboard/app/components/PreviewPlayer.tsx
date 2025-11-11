'use client';

import { useState, useRef, useEffect } from 'react';
import { useStudioStore } from '../lib/store';
import { SongResult } from '../lib/types';
import { synthesizeSong, createAudioUrl } from '../lib/synth';
import { AudioEngine } from '../lib/audio-engine';

export default function PreviewPlayer() {
  const { objects, harmonyMode } = useStudioStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [songData, setSongData] = useState<SongResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize audio engine
    audioEngineRef.current = new AudioEngine();
    
    return () => {
      // Cleanup on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioEngineRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    // Update time display during playback
    const updateTime = () => {
      if (audioEngineRef.current && isPlaying) {
        setCurrentTime(audioEngineRef.current.getCurrentTime());
        animationFrameRef.current = requestAnimationFrame(updateTime);
      }
    };
    
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const handleGenerateSong = async () => {
    setIsGenerating(true);
    setError(null);
    setGenerationProgress('Initializing...');
    
    try {
      const enabledObjects = objects.filter((obj) => obj.enabled);
      
      if (enabledObjects.length === 0) {
        throw new Error('At least one object must be enabled');
      }

      // Step 1: Synthesize audio
      setGenerationProgress('Synthesizing audio tracks...');
      const audioBlob = await synthesizeSong(enabledObjects, 8);
      const audioUrl = createAudioUrl(audioBlob);
      
      // Step 2: Load audio buffer
      setGenerationProgress('Loading audio buffer...');
      await audioEngineRef.current!.initialize();
      const buffer = await audioEngineRef.current!.loadAudio(audioUrl);
      audioBufferRef.current = buffer;
      setDuration(buffer.duration);
      
      // Step 3: Setup tracks
      setGenerationProgress('Setting up mixer tracks...');
      audioEngineRef.current!.setupTracks(buffer, enabledObjects);
      
      // Step 4: Generate metadata
      setGenerationProgress('Generating song metadata...');
      const response = await fetch('/api/generateSong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objects: enabledObjects,
          harmonyMode,
        }),
      });
      
      const data = await response.json();
      if (data.ok && data.data) {
        // Replace the mock audio URL with our real one
        const songResult = {
          ...data.data,
          mixedAudioUrl: audioUrl,
        };
        setSongData(songResult);
        
        // Save to localStorage
        try {
          localStorage.setItem('lastGeneratedSong', JSON.stringify(songResult));
        } catch (e) {
          console.warn('Failed to save song to localStorage:', e);
        }
      } else {
        throw new Error(data.error || 'Failed to generate song metadata');
      }
      
      setGenerationProgress('');
    } catch (error) {
      console.error('Failed to generate song:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate song');
      setGenerationProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = async () => {
    if (!audioEngineRef.current || !audioBufferRef.current) return;
    
    try {
      if (isPlaying) {
        audioEngineRef.current.pause();
        setIsPlaying(false);
      } else {
        if (currentTime >= duration) {
          // Restart from beginning
          await audioEngineRef.current.seek(audioBufferRef.current, 0);
          setCurrentTime(0);
        }
        await audioEngineRef.current.play(audioBufferRef.current);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      setError('Playback failed');
    }
  };

  const handleStop = () => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = async (time: number) => {
    if (!audioEngineRef.current || !audioBufferRef.current) return;
    await audioEngineRef.current.seek(audioBufferRef.current, time);
    setCurrentTime(time);
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

  const handleDownloadMP3 = () => {
    if (!songData?.mixedAudioUrl) return;
    
    const a = document.createElement('a');
    a.href = songData.mixedAudioUrl;
    a.download = `${songData.title.replace(/\s+/g, '-')}.wav`;
    a.click();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && songData) {
        e.preventDefault();
        handlePlayPause();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [songData, isPlaying, currentTime, duration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        aria-label="Generate song from enabled objects"
        className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all shadow-lg"
      >
        {isGenerating
          ? `⏳ ${generationProgress || 'Generating Song'}`
          : '🎵 Generate Full Song'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

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

          {/* Audio Player with Controls */}
          <div className="p-6 bg-gray-900 rounded-xl text-white space-y-4">
            {/* Playback Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all text-2xl"
              >
                {isPlaying ? '⏸' : '▶️'}
              </button>
              <button
                onClick={handleStop}
                aria-label="Stop"
                className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-all"
              >
                ⏹
              </button>
              <div className="flex-1 space-y-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 1}
                  step="0.01"
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  aria-label="Seek position"
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-400 text-center">
              Press <kbd className="px-2 py-1 bg-gray-800 rounded">Space</kbd> to play/pause
            </div>

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
            onClick={handleDownloadMP3}
            disabled={!songData}
            aria-label="Download audio file"
            className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            🎧 Download Audio
          </button>
        </div>
      </div>
    </div>
  );
}
