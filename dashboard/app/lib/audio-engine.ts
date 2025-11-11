/**
 * Live Audio Engine
 * Manages real-time audio playback with interactive controls
 */

import { SingingObject } from './types';

export interface TrackNode {
  source: AudioBufferSourceNode | null;
  gain: GainNode;
  pan: StereoPannerNode;
  filter: BiquadFilterNode;
  analyser: AnalyserNode;
  muted: boolean;
  solo: boolean;
}

export interface AudioEngineState {
  context: AudioContext | null;
  tracks: Map<string, TrackNode>;
  masterGain: GainNode | null;
  isPlaying: boolean;
  startTime: number;
  pauseTime: number;
  duration: number;
}

/**
 * Audio Engine class for managing playback
 */
export class AudioEngine {
  private state: AudioEngineState;
  
  constructor() {
    this.state = {
      context: null,
      tracks: new Map(),
      masterGain: null,
      isPlaying: false,
      startTime: 0,
      pauseTime: 0,
      duration: 0,
    };
  }
  
  /**
   * Initialize audio context and nodes
   */
  async initialize(): Promise<void> {
    if (this.state.context) {
      return; // Already initialized
    }
    
    this.state.context = new AudioContext();
    this.state.masterGain = this.state.context.createGain();
    this.state.masterGain.connect(this.state.context.destination);
  }
  
  /**
   * Load audio buffer from URL
   */
  async loadAudio(url: string): Promise<AudioBuffer> {
    if (!this.state.context) {
      await this.initialize();
    }
    
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await this.state.context!.decodeAudioData(arrayBuffer);
  }
  
  /**
   * Setup tracks from audio buffer and objects
   */
  setupTracks(buffer: AudioBuffer, objects: SingingObject[]): void {
    if (!this.state.context || !this.state.masterGain) {
      throw new Error('Audio context not initialized');
    }
    
    // Clear existing tracks
    this.clearTracks();
    
    this.state.duration = buffer.duration;
    
    objects.forEach((obj) => {
      if (!obj.enabled) return;
      
      const gain = this.state.context!.createGain();
      const pan = this.state.context!.createStereoPanner();
      const filter = this.state.context!.createBiquadFilter();
      const analyser = this.state.context!.createAnalyser();
      
      // Configure nodes
      gain.gain.value = obj.volume;
      pan.pan.value = 0; // Center
      
      // Configure filter based on vocal range
      filter.type = 'bandpass';
      const filterFreqs: Record<string, number> = {
        bass: 200,
        tenor: 400,
        alto: 800,
        soprano: 1600,
      };
      filter.frequency.value = filterFreqs[obj.vocalRange] || 800;
      filter.Q.value = 1.0;
      
      // Configure analyser
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      
      // Connect nodes: gain -> pan -> filter -> analyser -> master
      gain.connect(pan);
      pan.connect(filter);
      filter.connect(analyser);
      analyser.connect(this.state.masterGain!);
      
      this.state.tracks.set(obj.id, {
        source: null,
        gain,
        pan,
        filter,
        analyser,
        muted: false,
        solo: false,
      });
    });
  }
  
  /**
   * Play audio
   */
  async play(buffer: AudioBuffer): Promise<void> {
    if (!this.state.context || !this.state.masterGain) {
      throw new Error('Audio context not initialized');
    }
    
    // Resume context if suspended
    if (this.state.context.state === 'suspended') {
      await this.state.context.resume();
    }
    
    // Stop any currently playing sources
    this.stop();
    
    // Create new sources for each track
    this.state.tracks.forEach((track, objectId) => {
      const source = this.state.context!.createBufferSource();
      source.buffer = buffer;
      source.connect(track.gain);
      
      const offset = this.state.pauseTime || 0;
      source.start(0, offset);
      
      track.source = source;
    });
    
    this.state.isPlaying = true;
    this.state.startTime = this.state.context.currentTime - (this.state.pauseTime || 0);
  }
  
  /**
   * Pause playback
   */
  pause(): void {
    if (!this.state.context || !this.state.isPlaying) return;
    
    this.state.pauseTime = this.state.context.currentTime - this.state.startTime;
    this.stop();
  }
  
  /**
   * Resume playback
   */
  async resume(buffer: AudioBuffer): Promise<void> {
    if (this.state.pauseTime > 0) {
      await this.play(buffer);
    }
  }
  
  /**
   * Stop playback
   */
  stop(): void {
    this.state.tracks.forEach((track) => {
      if (track.source) {
        try {
          track.source.stop();
        } catch (e) {
          // Source might already be stopped
        }
        track.source = null;
      }
    });
    
    this.state.isPlaying = false;
  }
  
  /**
   * Seek to specific time
   */
  async seek(buffer: AudioBuffer, time: number): Promise<void> {
    const wasPlaying = this.state.isPlaying;
    this.stop();
    
    this.state.pauseTime = Math.max(0, Math.min(time, this.state.duration));
    
    if (wasPlaying) {
      await this.play(buffer);
    }
  }
  
  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    if (!this.state.context) return 0;
    
    if (this.state.isPlaying) {
      return Math.min(
        this.state.context.currentTime - this.state.startTime,
        this.state.duration
      );
    }
    
    return this.state.pauseTime;
  }
  
  /**
   * Set track volume
   */
  setTrackVolume(objectId: string, volume: number): void {
    const track = this.state.tracks.get(objectId);
    if (track) {
      track.gain.gain.value = volume;
    }
  }
  
  /**
   * Set track pan
   */
  setTrackPan(objectId: string, pan: number): void {
    const track = this.state.tracks.get(objectId);
    if (track) {
      track.pan.pan.value = Math.max(-1, Math.min(1, pan));
    }
  }
  
  /**
   * Toggle mute for track
   */
  toggleMute(objectId: string): void {
    const track = this.state.tracks.get(objectId);
    if (track) {
      track.muted = !track.muted;
      track.gain.gain.value = track.muted ? 0 : 1;
    }
  }
  
  /**
   * Toggle solo for track
   */
  toggleSolo(objectId: string): void {
    const track = this.state.tracks.get(objectId);
    if (!track) return;
    
    track.solo = !track.solo;
    
    // Check if any tracks are soloed
    const hasSolo = Array.from(this.state.tracks.values()).some(t => t.solo);
    
    // Mute all non-soloed tracks if any track is soloed
    this.state.tracks.forEach((t, id) => {
      if (hasSolo) {
        t.gain.gain.value = t.solo ? 1 : 0;
      } else {
        t.gain.gain.value = t.muted ? 0 : 1;
      }
    });
  }
  
  /**
   * Get analyser data for visualization
   */
  getAnalyserData(objectId: string): Uint8Array | null {
    const track = this.state.tracks.get(objectId);
    if (!track) return null;
    
    const dataArray = new Uint8Array(track.analyser.frequencyBinCount);
    track.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
  
  /**
   * Get time domain data for waveform
   */
  getTimeDomainData(objectId: string): Uint8Array | null {
    const track = this.state.tracks.get(objectId);
    if (!track) return null;
    
    const dataArray = new Uint8Array(track.analyser.fftSize);
    track.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }
  
  /**
   * Clear all tracks
   */
  private clearTracks(): void {
    this.stop();
    this.state.tracks.clear();
  }
  
  /**
   * Cleanup and release resources
   */
  async dispose(): Promise<void> {
    this.stop();
    this.clearTracks();
    
    if (this.state.context) {
      await this.state.context.close();
      this.state.context = null;
    }
    
    this.state.masterGain = null;
  }
  
  /**
   * Get playback state
   */
  getState(): Readonly<AudioEngineState> {
    return this.state;
  }
}
